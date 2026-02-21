import { describe, it, expect } from "vitest";
import { funFacts, factCategories } from "@/lib/data/fun-facts";

describe("funFacts data", () => {
  it("has at least 20 facts", () => {
    expect(funFacts.length).toBeGreaterThanOrEqual(20);
  });

  it("every fact has required fields", () => {
    for (const fact of funFacts) {
      expect(fact.id).toBeDefined();
      expect(fact.emoji).toBeTruthy();
      expect(fact.title).toBeTruthy();
      expect(fact.text.length).toBeGreaterThan(20);
      expect(fact.category).toBeTruthy();
    }
  });

  it("has unique ids", () => {
    const ids = funFacts.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all categories are valid", () => {
    const validCategories = factCategories.filter((c) => c !== "все");
    for (const fact of funFacts) {
      expect(validCategories).toContain(fact.category);
    }
  });

  it("has facts in every category", () => {
    const usedCategories = new Set(funFacts.map((f) => f.category));
    const expected = factCategories.filter((c) => c !== "все");
    for (const cat of expected) {
      expect(usedCategories.has(cat)).toBe(true);
    }
  });

  it("factCategories includes 'все' as first item", () => {
    expect(factCategories[0]).toBe("все");
    expect(factCategories.length).toBeGreaterThanOrEqual(5);
  });
});
