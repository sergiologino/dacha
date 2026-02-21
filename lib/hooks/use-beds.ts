"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface BedPhoto {
  id: string;
  url: string;
  caption: string | null;
  takenAt: string;
}

export interface BedPlant {
  id: string;
  name: string;
  status: string;
  plantedDate: string;
}

export interface Bed {
  id: string;
  name: string;
  number: string | null;
  type: string;
  createdAt: string;
  plants: BedPlant[];
  photos: BedPhoto[];
}

async function fetchBeds(): Promise<Bed[]> {
  const res = await fetch("/api/beds");
  if (!res.ok) throw new Error("Failed to fetch beds");
  return res.json();
}

async function createBed(data: { name: string; number?: string; type?: string }): Promise<Bed> {
  const res = await fetch("/api/beds", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create bed");
  return res.json();
}

async function deleteBed(id: string): Promise<void> {
  const res = await fetch("/api/beds", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Failed to delete bed");
}

export function useBeds() {
  return useQuery({ queryKey: ["beds"], queryFn: fetchBeds });
}

export function useCreateBed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBed,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["beds"] }),
  });
}

export function useDeleteBed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBed,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["beds"] }),
  });
}
