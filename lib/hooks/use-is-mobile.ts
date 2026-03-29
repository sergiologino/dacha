"use client";

import { useEffect, useState } from "react";

/** Ширина как в Tailwind `md` (768px): ниже — «мобильный» режим навигации по грядкам. */
export function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [breakpointPx]);

  return isMobile;
}
