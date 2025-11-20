import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import MainNav from "./components/MainNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DJ Event Console",
  description: "Create DJ events, upload MP3s, and keep metadata in sync.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased`}
      >
        <header className="sticky top-0 z-20 border-b border-rose-100/60 bg-[var(--panel)]/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 text-slate-100">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.4em] text-slate-400">MixMaster VR</span>
              <span className="text-lg font-semibold text-white">Event Console</span>
            </div>
            <MainNav />
          </div>
        </header>
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      </body>
    </html>
  );
}
