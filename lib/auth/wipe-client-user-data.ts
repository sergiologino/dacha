"use client";

import { clearFeatureOnboardingSeen } from "@/components/feature-onboarding";
import { deleteLocalDatabaseEntirely } from "@/lib/offline/local-db";

/**
 * Полная очистка пользовательских данных на устройстве (IndexedDB приложения, localStorage, sessionStorage).
 * Не трогает серверную PostgreSQL. Вызывать перед signOut при осознанном выходе.
 */
export async function wipeClientUserDataCompletely(): Promise<void> {
  await deleteLocalDatabaseEntirely();
  try {
    localStorage.clear();
  } catch {
    /* private mode / disabled */
  }
  try {
    sessionStorage.clear();
  } catch {
    /* */
  }
  clearFeatureOnboardingSeen();
}
