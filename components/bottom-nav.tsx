"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sprout, Calendar as CalendarIcon, BookOpen, Camera, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/garden", icon: Sprout, label: "Главная" },
  { href: "/calendar", icon: CalendarIcon, label: "Календарь" },
  { href: "/chat", icon: MessageCircle, label: "Нейроэксперт" },
  { href: "/guide", icon: BookOpen, label: "Справочник" },
  { href: "/facts", icon: Sparkles, label: "Факты" },
  { href: "/camera", icon: Camera, label: "Камера" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-emerald-200 dark:border-emerald-800">
      <div className="max-w-5xl mx-auto flex justify-around py-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center py-3 px-5 text-xs rounded-lg transition-colors",
                isActive
                  ? "text-white"
                  : "text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-emerald-600 dark:bg-emerald-700 rounded-lg"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                <item.icon className="w-6 h-6 mb-1" />
              </span>
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
