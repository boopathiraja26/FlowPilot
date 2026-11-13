import nodemailer from "nodemailer";
import dns from "dns";
import { createHash } from "crypto";

import { env } from "../config/env";
import { getSmtpCredentials } from "./integration.service";

// Prefer IPv4 DNS lookup to prevent ENETUNREACH errors on platforms without IPv6 routing (e.g. Render)
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

interface CachedTransporter {
  signature: string;
  transporter: nodemailer.Transporter;
}

const cachedTransporters = new Map<string, CachedTransporter>();

export function invalidateUserSmtpTransporter(userId: string): void {
  const cacheKey = `user:${userId}`;
  cachedTransporters.get(cacheKey)?.transporter.close();
  cachedTransporters.delete(cacheKey);
}

async function getTransporter(
  cacheKey: string,
  config: SmtpConfig
): Promise<nodemailer.Transporter> {
  const signature = createHash("sha256")
    .update(JSON.stringify(config))
    .digest("hex");
  const cached = cachedTransporters.get(cacheKey);
  if (cached?.signature === signature) {
    return cached.transporter;
  }
  cached?.transporter.close();

  let host = config.host;

  // Resolve to IPv4 to prevent ENETUNREACH errors on platforms without IPv6 routing (e.g. Render)
  try {
    const lookup = await dns.promises.lookup(config.host, { family: 4 });
    if (lookup?.address) {
      host = lookup.address;
    }
  } catch {
    // Fall back to hostname if DNS lookup fails
  }

  const transporter = nodemailer.createTransport({
    host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      servername: config.host,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  cachedTransporters.set(cacheKey, { signature, transporter });
  return transporter;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  userId?: string
) {
  const savedCredentials = userId ? await getSmtpCredentials(userId) : null;
  const config: SmtpConfig = savedCredentials ?? env.email;
  if (!config.host || !config.user || !config.pass || !config.from) {
    throw new Error("SMTP is not configured for this account or server.");
  }

  const cacheKey = userId ? `user:${userId}` : "environment";
  const transporter = await getTransporter(cacheKey, config);
  try {
    return await transporter.sendMail({
      from: config.from,
      to,
      subject,
      html,
    });
  } catch {
    cachedTransporters.delete(cacheKey);
    transporter.close();
    throw new Error("SMTP delivery failed.");
  }
}