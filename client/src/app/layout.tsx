import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlowPilot",
  description: "FlowPilot - project management, streamlined.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
