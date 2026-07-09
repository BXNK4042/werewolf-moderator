import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GameProvider } from "@/lib/hooks/use-game";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://werewolf-moderator.vercel.app"),
  title: {
    default: "Werewolf Moderator",
    template: "%s · Werewolf Moderator",
  },
  description:
    "A local moderator tool for Werewolf: Ultimate Deluxe Edition.",
  applicationName: "Werewolf Moderator",
  openGraph: {
    title: "Werewolf Moderator",
    description:
      "A local moderator tool for Werewolf: Ultimate Deluxe Edition.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Werewolf Moderator",
    description:
      "A local moderator tool for Werewolf: Ultimate Deluxe Edition.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
