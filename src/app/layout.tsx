import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/session-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DownToTalk — When AI sleeps, humans connect",
  description:
    "The app that only works when AI doesn't. Get matched with real humans for spontaneous calls when Claude, ChatGPT, or Gemini go down.",
  openGraph: {
    title: "DownToTalk — When AI sleeps, humans connect",
    description:
      "The app that only works when AI doesn't. Get matched with real humans for spontaneous calls when AI services go down.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DownToTalk — When AI sleeps, humans connect",
    description:
      "The app that only works when AI doesn't.",
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
