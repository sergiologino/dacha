"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Plant {
  id: string;
  name: string;
  bedId: string | null;
  notes: string | null;
  plantedDate: string;
  status: string;
}

async function fetchPlants(): Promise<Plant[]> {
  const res = await fetch("/api/plants");
  if (!res.ok) throw new Error("Failed to fetch plants");
  return res.json();
}

async function createPlant(data: { name: string; bedId?: string; plantedDate?: string; cropSlug?: string }): Promise<Plant> {
  const res = await fetch("/api/plants", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create plant");
  return res.json();
}

async function updatePlant(data: {
  id: string;
  plantedDate?: string;
  name?: string;
  notes?: string;
  status?: string;
}): Promise<Plant> {
  const res = await fetch("/api/plants", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update plant");
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plants"] });
      qc.invalidateQueries({ queryKey: ["beds"] });
    },
  });
}

export function useUpdatePlant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePlant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plants"] });
      qc.invalidateQueries({ queryKey: ["beds"] });
    },
  });
}

export function useDeletePlant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePlant,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plants"] });
      qc.invalidateQueries({ queryKey: ["beds"] });
    },
  });
}
