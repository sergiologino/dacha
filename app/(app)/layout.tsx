import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { AppPageTransition } from "./app-transition";

export const metadata: Metadata = {
  title: {
    default: "ДачаAI",
    template: "%s | ДачаAI",
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 dark:from-emerald-950 dark:via-slate-950 dark:to-amber-950 pb-20">
      <AppHeader />
      <main className="max-w-5xl mx-auto px-4 pt-6">
        <AppPageTransition>{children}</AppPageTransition>
      </main>
      <BottomNav />
    </div>
  );
}
