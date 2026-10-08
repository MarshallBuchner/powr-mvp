import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "./components/AuthProvider";
import AccountBar from "./components/AccountBar";
import ClientRuntimeHygiene from "./components/ClientRuntimeHygiene";
import CreatorReferralCapture from "./components/CreatorReferralCapture";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://trainwithpowr.com"),

  title: "POWR | AI-Assisted Hockey Development",
  description:
    "Upload a skating clip and get AI-assisted development feedback, priorities, and drills. Beta estimates — not medical or scouting grades.",

  openGraph: {
    title: "POWR | AI-Assisted Hockey Development",
    description:
      "Upload a skating clip and get AI-assisted development feedback, priorities, and drills.",
    type: "website",
    siteName: "POWR",
    url: "https://trainwithpowr.com",
  },

  twitter: {
    card: "summary_large_image",
    title: "POWR | AI-Assisted Hockey Development",
    description:
      "Upload a skating clip and get AI-assisted development feedback, priorities, and drills.",
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
        <AuthProvider>
          <ClientRuntimeHygiene />
          <AccountBar />
          <Suspense fallback={null}>
            <CreatorReferralCapture />
          </Suspense>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
