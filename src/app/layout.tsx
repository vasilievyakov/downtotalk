import type { Metadata } from "next";
import { JetBrains_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DownToTalk — When AI sleeps, humans connect",
  description:
    "The app that only works when AI doesn't. Get matched with real humans for spontaneous calls when Claude, ChatGPT, or Gemini go down.",
  openGraph: {
    title: "DownToTalk — When AI sleeps, humans connect",
    description:
      "The app that only works when AI doesn't.",
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
      <body className={`${jetbrainsMono.variable} ${instrumentSerif.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
