import type { Metadata } from "next";
import { Rajdhani, Zen_Dots } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "./Web3Provider";

const zenDots = Zen_Dots({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-zen-dots",
  display: "swap",
});

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vivi",
  description: "Voice based community notes Dapp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${zenDots.variable} ${rajdhani.variable} `}>
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
