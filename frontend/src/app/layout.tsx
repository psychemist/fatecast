import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Fatecast';
const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Decentralized prediction markets powered by PYUSD and Pyth Oracle';

// Farcaster Frame metadata
const frameMetadata = {
  version: "1",
  imageUrl: `${appUrl}/og-image.png`,
  button: {
    title: "Open Fatecast",
    action: {
      type: "launch_frame",
      name: appName,
      url: appUrl,
      splashImageUrl: `${appUrl}/icon.png`,
      splashBackgroundColor: "#3B82F6"
    }
  }
};

export const metadata: Metadata = {
  title: appName,
  description: appDescription,
  openGraph: {
    title: appName,
    description: appDescription,
    images: [`${appUrl}/og-image.png`],
  },
  other: {
    "fc:miniapp": JSON.stringify(frameMetadata),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
