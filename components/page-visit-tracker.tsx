"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function PageVisitTracker() {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === prevPath.current) return;
    prevPath.current = pathname;

    fetch("/api/analytics/page-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
