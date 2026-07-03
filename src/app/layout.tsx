import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const display = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Second Brain",
  description: "A personal knowledge base you can talk to.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="relative overflow-x-hidden antialiased">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute top-24 right-[-8rem] h-72 w-72 rounded-full bg-white/4 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]" />
        </div>
        <div className="relative min-h-screen flex flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-black/55 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-4">
              <Link href="/" className="group flex items-center gap-3">
                <span className="font-display text-xl font-semibold tracking-tight text-paper transition-colors group-hover:text-[var(--platinum)]">
                  SecondBrain.Ai
                </span>
              </Link>
              <nav className="mt-4 flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] p-1.5 font-mono-label text-[11px] uppercase tracking-[0.24em] text-paper-dim shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                <Link href="/" className="rounded-full px-5 py-3 transition-colors hover:bg-white/10 hover:text-paper">
                  notes
                </Link>
                <Link href="/chat" className="rounded-full px-5 py-3 transition-colors hover:bg-white/10 hover:text-paper">
                  ask
                </Link>
              </nav>
            </div>
          </header>
          <main className="relative flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
