"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Plant {
  id: string;
  name: string;
  notes: string | null;
  plantedDate: string;
  status: string;
}

async function fetchPlants(): Promise<Plant[]> {
  const res = await fetch("/api/plants");
  if (!res.ok) throw new Error("Failed to fetch plants");
  return res.json();
}

async function createPlant(data: { name: string; bed: string; plantedDate?: string }): Promise<Plant> {
  const res = await fetch("/api/plants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create plant");
  return res.json();
}

async function deletePlant(id: string): Promise<void> {
  const res = await fetch("/api/plants", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete plant");
}

export function usePlants() {
  return useQuery({ queryKey: ["plants"], queryFn: fetchPlants });
}

export function useCreatePlant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPlant,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plants"] }),
  });
}

export function useDeletePlant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlant,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["plants"] }),
  });
}
