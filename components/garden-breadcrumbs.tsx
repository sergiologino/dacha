"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type GardenCrumb = { label: string; href?: string };

export function GardenBreadcrumbs({ items }: { items: GardenCrumb[] }) {
  return (
    <nav aria-label="Навигация" className="text-base md:text-lg mb-4">
      <ol className="flex flex-wrap items-center gap-1.5 text-slate-600 dark:text-slate-300">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5 min-w-0">
            {i > 0 ? (
              <ChevronRight className="w-5 h-5 shrink-0 text-slate-400" aria-hidden />
            ) : null}
            {item.href ? (
              <Link
                href={item.href}
                className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline truncate max-w-[min(100%,220px)] sm:max-w-[min(100%,320px)]"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[min(100%,280px)] sm:max-w-[min(100%,400px)]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
