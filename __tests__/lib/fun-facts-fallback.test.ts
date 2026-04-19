import { describe, it, expect } from "vitest";
import { getStaticFunFactsFallback } from "@/lib/data/fun-facts-fallback";

describe("getStaticFunFactsFallback", () => {
  it("returns many facts with DTO shape", () => {
    const facts = getStaticFunFactsFallback();
    expect(facts.length).toBeGreaterThanOrEqual(20);
    for (const f of facts) {
      expect(f.id.startsWith("static:")).toBe(true);
      expect(f.slug.length).toBeGreaterThan(3);
      expect(f.title.length).toBeGreaterThan(2);
      expect(f.categoryTitle.length).toBeGreaterThan(2);
    }
  });
});
