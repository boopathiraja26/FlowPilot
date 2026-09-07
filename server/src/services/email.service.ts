import nodemailer from "nodemailer";
import dns from "dns";
import { env } from "../config/env";

// Prefer IPv4 DNS lookup to prevent ENETUNREACH errors on platforms without IPv6 routing (e.g. Render)
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.port === 465,
  auth: {
    user: env.email.user,
    pass: env.email.pass,
  },
  family: 4,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
} as nodemailer.TransportOptions);

export async function sendEmail(
  to: string,
  subject: string,
  html: string
) {
  return transporter.sendMail({
    from: env.email.from,
    to,
    subject,
    html,
  });
}