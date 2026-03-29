"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sprout, Calendar as CalendarIcon, BookOpen, Camera, MessageCircle, Images } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/garden", icon: Sprout, label: "Главная" },
  { href: "/calendar", icon: CalendarIcon, label: "Календарь" },
  { href: "/gallery", icon: Images, label: "Галерея" },
  { href: "/chat", icon: MessageCircle, label: "Нейроэксперт" },
  { href: "/guide", icon: BookOpen, label: "Справочник" },
  { href: "/camera", icon: Camera, label: "Анализ" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-emerald-200 dark:border-emerald-800 safe-area-pb">
      <div className="max-w-5xl mx-auto flex justify-around items-stretch py-1.5 px-1 min-w-0">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 min-w-0 py-2 px-1 sm:px-2 text-[10px] sm:text-xs rounded-lg transition-colors",
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
              <span className="relative z-10 flex-shrink-0">
                <item.icon className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5" />
              </span>
              <span className="relative z-10 truncate max-w-full">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
