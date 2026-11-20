import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowPilot — AI-Powered Workflow Automation Platform",
  description:
    "Build powerful automations visually. Connect triggers, Gemini AI, emails, and webhooks to turn repetitive tasks into reliable workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased bg-[#F8FAF8] text-[#17252F] min-h-screen">
        {children}
      </body>
    </html>
  );
}
