import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import "./globals.css";

const tanker = localFont({
  src: [
    {
      path: "../../public/Tanker/Fonts/WEB/fonts/Tanker-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-tanker",
});

const bevellier = localFont({
  src: [
    {
      path: "../../public/Bevellier/Fonts/WEB/fonts/Bevellier-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
  ],
  variable: "--font-bevellier",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeAtlas",
  description: "AI codebase intelligence platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${tanker.variable} ${bevellier.variable} ${geistMono.variable} dark antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background font-sans text-foreground overflow-x-hidden">
        <Providers>
          {children}
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
