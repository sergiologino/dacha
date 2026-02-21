"use client";

import { useQuery } from "@tanstack/react-query";

export interface AiNetwork {
  id: string;
  name: string;
  provider: string;
  isFree: boolean;
}

async function fetchNetworks(): Promise<AiNetwork[]> {
  const res = await fetch("/api/ai/networks");
  if (!res.ok) return [];
  return res.json();
}

export function useAiNetworks() {
  return useQuery({
    queryKey: ["ai-networks"],
    queryFn: fetchNetworks,
    staleTime: 60 * 60 * 1000,
  });
}
