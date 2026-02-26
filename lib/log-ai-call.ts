import { prisma } from "@/lib/prisma";
import { messagesSummary } from "@/lib/get-prompt";

const RESPONSE_PREVIEW_MAX = 1000;

type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

function parseUsage(responseData: Record<string, unknown> | null): {
  tokensInput: number | null;
  tokensOutput: number | null;
  tokensTotal: number | null;
} {
  if (!responseData) return { tokensInput: null, tokensOutput: null, tokensTotal: null };
  const usage =
    (responseData.usage as Usage) ??
    (responseData.response as Record<string, unknown> | undefined)?.usage;
  if (!usage || typeof usage !== "object") return { tokensInput: null, tokensOutput: null, tokensTotal: null };
  const u = usage as Usage;
  return {
    tokensInput: typeof u.prompt_tokens === "number" ? u.prompt_tokens : null,
    tokensOutput: typeof u.completion_tokens === "number" ? u.completion_tokens : null,
    tokensTotal: typeof u.total_tokens === "number" ? u.total_tokens : null,
  };
}

export type LogAiCallParams = {
  userId?: string | null;
  endpoint: string;
  requestType: "chat" | "vision" | "image_gen";
  messages: { role?: string; content?: string | unknown }[];
  response?: string | null;
  responseData?: Record<string, unknown> | null;
  status: "success" | "failed";
  errorMessage?: string | null;
};

/**
 * Пишет запись в ai_call_logs: пользователь, эндпоинт, тип запроса, сводка сообщений,
 * превью ответа, токены (если интегратор отдаёт usage), статус.
 */
export async function logAiCall(params: LogAiCallParams): Promise<void> {
  const {
    userId,
    endpoint,
    requestType,
    messages,
    response,
    responseData,
    status,
    errorMessage,
  } = params;

  const { tokensInput, tokensOutput, tokensTotal } = parseUsage(responseData ?? null);
  const responsePreview =
    typeof response === "string" ? response.slice(0, RESPONSE_PREVIEW_MAX) : null;
  const messagesJson = messagesSummary(messages);

  try {
    await prisma.aiCallLog.create({
      data: {
        userId: userId ?? null,
        endpoint,
        requestType,
        messages: messagesJson as object,
        responsePreview,
        tokensInput,
        tokensOutput,
        tokensTotal,
        status,
        errorMessage: errorMessage ?? null,
      },
    });
  } catch (err) {
    console.error("logAiCall failed:", err);
  }
}
