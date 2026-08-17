import Script from 'next/script';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HookLens — AI-Powered Webhook Triage & Monitoring",
  description: "Intercept failed webhooks across Stripe, Shopify, GitHub and APIs. Diagnose root causes with AI and alert in Slack & Discord in real time.",
  metadataBase: new URL("https://usehooklens.com"),
  keywords: ["webhook monitoring", "webhook triage", "stripe webhooks", "ai webhook debugging", "slack alerts", "developer tools"],
  verification: {
    google: "y1UeKiUFo5AvyQZw77PI_Rm29gVIkpryaknQ1HBINrU",
  },
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
      <body className={inter.className}>{children}        
              {/* Google Analytics (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QSBN37MFQ7"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QSBN37MFQ7');
          `}
        </Script>
      </body>
    </html>
  );
}
