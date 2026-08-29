import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://powr-mvp.vercel.app"),
  
  title: "POWR | AI Hockey Development",
  description:
    "Upload your skating video and get personalized AI-powered feedback, development insights, and drills to help you improve.",

  openGraph: {
    title: "POWR | AI Hockey Development",
    description:
      "Upload your skating video and get personalized AI-powered feedback, development insights, and drills to help you improve.",
    type: "website",
    siteName: "POWR",
  },

  twitter: {
    card: "summary_large_image",
    title: "POWR | AI Hockey Development",
    description:
      "Upload your skating video and get personalized AI-powered feedback, development insights, and drills to help you improve.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      <Analytics />
      </body>
    </html>
  );
}
