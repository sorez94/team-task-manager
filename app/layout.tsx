import type { Metadata } from "next";
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/app/providers/ToastProvider";
import { TaskModalProvider } from "@/app/providers/TaskModalProvider";
import { AppShell } from "@/components/layout/AppShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Persian/Farsi glyph support. No UI translation — this only kicks in as a
// fallback so Persian text typed into task titles/descriptions renders with
// a proper Persian font instead of tofu boxes or a mismatched system font.
const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
});

export const metadata: Metadata = {
  title: "Task Manager",
  description: "A clean, local-first task manager built with Next.js, Prisma, and SQLite.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <TaskModalProvider>
            <AppShell>{children}</AppShell>
          </TaskModalProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
