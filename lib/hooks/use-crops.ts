"use client";

import { useQuery } from "@tanstack/react-query";
import type { CropWithSource } from "@/lib/crops-merge";

async function fetchCrops(): Promise<CropWithSource[]> {
  const res = await fetch("/api/crops");
  if (!res.ok) throw new Error("Failed to fetch crops");
  return res.json();
}

export function useCrops() {
  return useQuery({
    queryKey: ["crops"],
    queryFn: fetchCrops,
  });
}
