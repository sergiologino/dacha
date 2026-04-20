"use client";

import { signOut } from "next-auth/react";
import { wipeClientUserDataCompletely } from "@/lib/auth/wipe-client-user-data";

/**
 * Выход: очистка локальных хранилищ и полная перезагрузка, чтобы сбросить кэш React Query в памяти.
 */
export async function signOutAndWipeLocalDevice(): Promise<void> {
  await wipeClientUserDataCompletely();
  await signOut({ redirect: false });
  if (typeof window !== "undefined") {
    window.location.assign("/");
  }
}
