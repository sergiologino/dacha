"use client";

import { useQuery } from "@tanstack/react-query";

interface UserLocation {
  latitude: number | null;
  longitude: number | null;
  locationName: string | null;
  onboardingDone: boolean;
}

async function fetchUserLocation(): Promise<UserLocation> {
  const res = await fetch("/api/user/location");
  if (!res.ok) throw new Error("Failed to fetch user location");
  return res.json();
}

export function useUserLocation() {
  return useQuery({
    queryKey: ["user-location"],
    queryFn: fetchUserLocation,
    staleTime: 5 * 60 * 1000,
  });
}
