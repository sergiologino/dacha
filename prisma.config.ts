/**
 * Prisma 6 с prisma.config.ts не подгружает .env сам (см. «skipping environment variable loading»).
 * Подставляем ключи из .env.local / .env без пакета dotenv — тогда CLI работает и локально, и в Docker.
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { defineConfig, env } from "prisma/config";

function applyEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const full = resolve(process.cwd(), name);
    if (!existsSync(full)) continue;
    const text = readFileSync(full, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (process.env[key] !== undefined) continue;
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

applyEnvFiles();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
