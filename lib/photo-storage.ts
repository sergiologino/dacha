import { unlink } from "fs/promises";
import path from "path";

export function uploadsDirOnDisk(): string {
  const fromEnv = process.env.PHOTOS_UPLOAD_DIR?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.resolve(path.join(process.cwd(), "public", "uploads"));
}

/** Файл под `/uploads/…`, иначе ничего не удаляем (data URL и внешние URL). */
export async function tryRemoveStoredFile(dbUrl: string): Promise<void> {
  if (!dbUrl.startsWith("/uploads/")) return;
  const base = path.basename(dbUrl);
  if (!base || base.includes("..")) return;
  const resolvedDir = uploadsDirOnDisk();
  const full = path.resolve(resolvedDir, base);
  if (!full.startsWith(resolvedDir + path.sep)) return;
  try {
    await unlink(full);
  } catch {
    /* файл уже убран или только data-url в БД */
  }
}
