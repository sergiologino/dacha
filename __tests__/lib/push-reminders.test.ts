import { describe, expect, it } from "vitest";
import {
  buildReminderDedupeKey,
  formatCombinedReminderPayload,
  formatReminderPayload,
  type ReminderEvent,
} from "@/lib/push-reminders";

const makeEvent = (overrides: Partial<ReminderEvent> = {}): ReminderEvent => ({
  id: "event-1",
  title: "Полив",
  bedName: "Теплица",
  bedType: "greenhouse",
  plantName: "Томат Черри",
  cropLabel: "томаты",
  description: "Проверить влажность почвы и полить под корень.",
  isUserCreated: false,
  ...overrides,
});

describe("push reminders", () => {
  it("formats single manual task with source label", () => {
    const payload = formatReminderPayload(
      [makeEvent({ isUserCreated: true, title: "Проверить листья" })],
      true
    );

    expect(payload.title).toBe("Сегодня: Проверить листья");
    expect(payload.body).toContain("добавлено вручную");
    expect(payload.body).toContain("Томаты");
  });

  it("formats mixed task list with manual and generated counts", () => {
    const payload = formatReminderPayload(
      [
        makeEvent(),
        makeEvent({ id: "event-2", title: "Рыхление", isUserCreated: true }),
        makeEvent({ id: "event-3", title: "Подкормка" }),
      ],
      false
    );

    expect(payload.title).toBe("Завтра: 3 работы");
    expect(payload.body).toContain("Фокус: Томаты");
    expect(payload.body).toContain("Вручную: 1, по календарю: 2.");
  });

  it("formats combined today and tomorrow reminder", () => {
    const payload = formatCombinedReminderPayload(
      [makeEvent({ isUserCreated: true })],
      [makeEvent({ id: "event-2", title: "Подкормка" })]
    );

    expect(payload.title).toBe("Работы на сегодня и завтра");
    expect(payload.body).toContain("Сегодня 1 работа");
    expect(payload.body).toContain("Томаты");
    expect(payload.body).toContain("Вручную: 1, по календарю: 1.");
  });

  it("adds bed-specific wording for raised beds", () => {
    const payload = formatReminderPayload(
      [
        makeEvent({
          bedName: "Клубника у дорожки",
          bedType: "raised",
          plantName: "Клубника",
          cropLabel: "клубника",
        }),
      ],
      false
    );

    expect(payload.body).toContain("на высокой грядке");
    expect(payload.body).toContain("Клубника");
  });

  it("builds stable dedupe key regardless of event order", () => {
    const first = buildReminderDedupeKey({
      userId: "user-1",
      todayKey: "2026-03-17",
      tomorrowKey: "2026-03-18",
      todayEvents: [makeEvent({ id: "b" }), makeEvent({ id: "a" })],
      tomorrowEvents: [makeEvent({ id: "c" })],
    });

    const second = buildReminderDedupeKey({
      userId: "user-1",
      todayKey: "2026-03-17",
      tomorrowKey: "2026-03-18",
      todayEvents: [makeEvent({ id: "a" }), makeEvent({ id: "b" })],
      tomorrowEvents: [makeEvent({ id: "c" })],
    });

    expect(first).toBe(second);
  });
});
