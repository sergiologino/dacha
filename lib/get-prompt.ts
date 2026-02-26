import { prisma } from "@/lib/prisma";

const PREVIEW_LEN = 500;

/**
 * Читает текст промпта из БД по ключу.
 * Динамические подстановки (локация, культура, погода и т.д.) делаются в коде после получения базового текста.
 * @param key — уникальный ключ (chat_system, vision_system, timeline_system, ...)
 * @returns текст промпта или null, если записи нет (использовать fallback из кода)
 */
export async function getPromptByKey(key: string): Promise<string | null> {
  try {
    const row = await prisma.prompt.findUnique({
      where: { key },
      select: { prompt: true },
    });
    return row?.prompt ?? null;
  } catch {
    return null;
  }
}

/**
 * Формирует сводку сообщений для лога (роль + длина/превью, без больших тел).
 */
export function messagesSummary(
  messages: { role?: string; content?: string | unknown }[]
): { role: string; length?: number; preview?: string }[] {
  return messages.map((m) => {
    const role = typeof m.role === "string" ? m.role : "unknown";
    const content = m.content;
    if (typeof content === "string") {
      return {
        role,
        length: content.length,
        preview: content.slice(0, PREVIEW_LEN),
      };
    }
    if (Array.isArray(content)) {
      const totalLen = content.reduce(
        (acc, part) => acc + (typeof part === "object" && part && "text" in part ? String((part as { text: string }).text).length : 0),
        0
      );
      return { role, length: totalLen };
    }
    return { role, length: 0 };
  });
}
