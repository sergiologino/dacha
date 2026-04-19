import { describe, it, expect } from "vitest";
import { FACT_FILTER_ALL } from "@/lib/data/fun-facts";
import { FACT_CATEGORY_DEFS } from "../../prisma/seed-data/fact-categories";
import { LEGACY_FUN_FACTS } from "../../prisma/seed-data/facts-legacy";
import { EXTRA_FUN_FACTS } from "../../prisma/seed-data/facts-extra";

const FACTS = [...LEGACY_FUN_FACTS, ...EXTRA_FUN_FACTS];
const VALID_CATEGORY_SLUGS = new Set(FACT_CATEGORY_DEFS.map((c) => c.slug));

describe("fun facts seed data", () => {
  it("has at least 20 facts", () => {
    expect(FACTS.length).toBeGreaterThanOrEqual(20);
  });

  it("every fact has required fields", () => {
    for (const fact of FACTS) {
      expect(fact.slug).toBeTruthy();
      expect(fact.emoji).toBeTruthy();
      expect(fact.title).toBeTruthy();
      expect(fact.text.length).toBeGreaterThan(20);
      expect(fact.categorySlug).toBeTruthy();
    }
  });

  it("has unique slugs", () => {
    const slugs = FACTS.map((f) => f.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("all category slugs are valid", () => {
    for (const fact of FACTS) {
      expect(VALID_CATEGORY_SLUGS.has(fact.categorySlug)).toBe(true);
    }
  });

  it("has facts in every category", () => {
    const used = new Set(FACTS.map((f) => f.categorySlug));
    for (const c of FACT_CATEGORY_DEFS) {
      expect(used.has(c.slug)).toBe(true);
    }
  });

  it("filter sentinel for UI", () => {
    expect(FACT_FILTER_ALL).toBe("все");
  });

  it("defines at least 5 categories", () => {
    expect(FACT_CATEGORY_DEFS.length).toBeGreaterThanOrEqual(5);
  });
});
