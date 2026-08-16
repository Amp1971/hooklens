import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HookLens — AI-Powered Webhook Triage & Monitoring",
  description: "Intercept failed webhooks across Stripe, Shopify, GitHub and APIs. Diagnose root causes with AI and alert in Slack & Discord in real time.",
  metadataBase: new URL("https://usehooklens.com"),
  keywords: ["webhook monitoring", "webhook triage", "stripe webhooks", "ai webhook debugging", "slack alerts", "developer tools"],
  openGraph: {
    title: "HookLens — AI-Powered Webhook Triage & Monitoring",
    description: "Intercept failed webhooks and diagnose root causes instantly with AI.",
    url: "https://usehooklens.com",
    siteName: "HookLens",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HookLens — AI-Powered Webhook Triage & Monitoring",
    description: "Intercept failed webhooks and diagnose root causes instantly with AI.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
