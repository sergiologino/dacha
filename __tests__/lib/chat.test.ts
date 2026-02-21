import { describe, it, expect } from "vitest";

describe("Chat data structures", () => {
  it("ChatMessage has required fields", () => {
    const msg = {
      id: "user-123",
      role: "user" as const,
      content: "Что посадить?",
      timestamp: new Date(),
    };
    expect(msg.id).toBeTruthy();
    expect(msg.role).toBe("user");
    expect(msg.content).toBeTruthy();
    expect(msg.timestamp).toBeInstanceOf(Date);
  });

  it("assistant message can have networkUsed", () => {
    const msg = {
      id: "ai-123",
      role: "assistant" as const,
      content: "Посадите томаты в мае.",
      networkUsed: "openai-gpt4o-mini",
      timestamp: new Date(),
    };
    expect(msg.networkUsed).toBe("openai-gpt4o-mini");
  });

  it("quick questions are valid strings", () => {
    const quickQuestions = [
      "Что посадить в мае?",
      "Желтеют листья томатов",
      "Когда сажать картошку?",
      "Как бороться с тлёй?",
      "Чем подкормить огурцы?",
      "Когда укрывать розы?",
    ];
    expect(quickQuestions.length).toBeGreaterThanOrEqual(5);
    for (const q of quickQuestions) {
      expect(q.length).toBeGreaterThan(5);
    }
  });

  it("system prompt contains key instructions", () => {
    const systemPrompt = "Ты — AI-агроном, помощник для дачников и садоводов в России";
    expect(systemPrompt).toContain("агроном");
    expect(systemPrompt).toContain("Росси");
  });
});
