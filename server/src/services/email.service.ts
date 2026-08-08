import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: false,
  family: 4,
  auth: {
    user: env.email.user,
    pass: env.email.pass,
  },
});

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