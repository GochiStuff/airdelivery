import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/context/socketContext";
import Header from "@/components/header";
import { Oswald } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import FooterStrip from "@/components/footer";
import Providers from "./providers";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const oswald = Oswald({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Air Delivery",
    template: "%s | Secure & Instant P2P File Sharing",
  },
  description:
    "Air Delivery lets you send large files instantly and securely with peer-to-peer WebRTC. No uploads, no sign-up, no file size limits. Just fast, private browser-to-browser sharing.",
  applicationName: "Air Delivery",
  authors: [{ name: "Yash Jangid", url: "https://x.com/GochiStuff" }],
  keywords: [
    "send large files",
    "free file sharing",
    "peer to peer file sharing",
    "p2p file transfer",
    "web based file sharing",
    "no signup file transfer",
    "encrypted file sharing",
    "direct browser file sharing",
    "large file transfer online",
    "webrtc file transfer",
    "instant file sharing",
    "secure p2p file transfer",
    "file sharing without upload",
    "open source",
    "airdrop alternative",
    "sharedrop alternative",
    "file transfer without cloud",
    "anonymous file sharing",
    "fast browser file transfer",
    "p2p file transfer no limits",
    "send files peer to peer",
  ],

  metadataBase: new URL("https://airdelivery.site"),
  openGraph: {
    title: "Air Delivery – Secure & Instant P2P File Sharing",
    description:
      "Air Delivery lets you send large files instantly and securely with peer-to-peer WebRTC. No uploads, no sign-up, no file size limits. Just fast, private browser-to-browser sharing.",
    url: "https://airdelivery.site",
    siteName: "Air Delivery",
    images: [
      {
        url: "/og-banner.png",
        width: 1200,
        height: 630,
        alt: "Air Delivery – Secure & Instant P2P File Sharing",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Air Delivery – Secure & Instant P2P File Sharing",
    description:
      "Instantly send large files via peer-to-peer WebRTC—no cloud, no sign-up, no limits. Secure, encrypted, browser-to-browser transfer.",
    images: ["/og-banner.png"],
    creator: "@GochiStuff",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icons/apple.png",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://airdelivery.site",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // JSON-LD structured data kept identical to original
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://airdelivery.site/#website",
        url: "https://airdelivery.site/",
        name: "Air Delivery",
        description:
          "p2p file sharing with no size limits, no cloud, end‑to‑end encryption.",
        publisher: {
          "@id": "https://airdelivery.site/#organization",
        },
        logo: {
          "@type": "ImageObject",
          url: "https://airdelivery.site/icons/192.png",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://airdelivery.site/#organization",
        name: "Air Delivery",
        url: "https://airdelivery.site/",
        logo: {
          "@type": "ImageObject",
          url: "https://airdelivery.site/favicon.ico",
        },
        sameAs: ["https://twitter.com/GochiStuff"],
      },
      {
        "@type": "SoftwareApplication",
        name: "Air Delivery",
        operatingSystem: "All",
        applicationCategory: "WebApplication",
        browserRequirements: "Requires JavaScript",
        url: "https://airdelivery.site/",
        description:
          "Free peer-to-peer file sharing tool using secure direct browser connections. No upload, no sign-up, just send.",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          itemProp="image"
          content="https://airdelivery.site/icons/512.png"
        />

        {/* PWA & Performance Hints */}
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="author" content="Yash Jangid" />
        <link rel="canonical" href="https://airdelivery.site" />
        <link rel="icon" href="/favicon.ico" />

        <meta name="google-adsense-account" content="ca-pub-6215596158227491" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />

  
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>

      {/* Google Analytics - loaded after interactive to avoid blocking render */}
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}');
      `}
          </Script>
        </>
      )}

      <body className={`${oswald.variable} ${geistMono.variable} antialiased`}>
        {/* @ts-ignore */}
        <amp-auto-ads type="adsense" data-ad-client="ca-pub-6215596158227491" />

        <SocketProvider>
          <Providers>
            <Header />
            {children}
            <FooterStrip />
          </Providers>
        </SocketProvider>

        <Analytics />
      </body>
    </html>
  );
}
