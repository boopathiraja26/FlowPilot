import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "./landing.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

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
    <html
      lang="en"
      className={`scroll-smooth ${inter.variable}`}
    >
      <head>
        <style id="sidebar-preference-styles" />
        <Script id="sidebar-preference-bootstrap" strategy="beforeInteractive">
          {`let sidebarCollapsed = false;
          try {
            sidebarCollapsed = localStorage.getItem("flowpilot_sidebar_collapsed") === "1";
          } catch {}
          if (sidebarCollapsed) {
            const sidebarStylesheet =
              document.getElementById("sidebar-preference-styles")?.sheet;
            if (sidebarStylesheet) {
              sidebarStylesheet.insertRule(":root { --sidebar-width: 72px; }");
            } else {
              console.error("Could not initialize the sidebar preference stylesheet.");
            }
          }`}
        </Script>
      </head>
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
