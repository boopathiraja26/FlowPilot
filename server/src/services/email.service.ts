import nodemailer from "nodemailer";
import dns from "dns";
import { env } from "../config/env";

// Prefer IPv4 DNS lookup to prevent ENETUNREACH errors on platforms without IPv6 routing (e.g. Render)
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

let cachedTransporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  let host = env.email.host;

  // Resolve to IPv4 to prevent ENETUNREACH errors on platforms without IPv6 routing (e.g. Render)
  try {
    const lookup = await dns.promises.lookup(env.email.host, { family: 4 });
    if (lookup?.address) {
      host = lookup.address;
    }
  } catch {
    // Fall back to hostname if DNS lookup fails
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: {
      user: env.email.user,
      pass: env.email.pass,
    },
    tls: {
      servername: env.email.host,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  return cachedTransporter;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
) {
  const transporter = await getTransporter();
  return transporter.sendMail({
    from: env.email.from,
    to,
    subject,
    html,
  });
}