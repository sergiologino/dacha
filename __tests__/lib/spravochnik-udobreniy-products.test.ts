import { describe, it, expect } from "vitest";
import {
  SPRAVOCHNIK_PRODUCTS,
  SPRAVOCHNIK_SECTIONS,
  getSpravochnikProductBySlug,
} from "@/lib/data/spravochnik-udobreniy-products";

describe("spravochnik-udobreniy-products", () => {
  it("has unique slugs", () => {
    const slugs = SPRAVOCHNIK_PRODUCTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every product maps to an existing section", () => {
    const ids = new Set(SPRAVOCHNIK_SECTIONS.map((s) => s.id));
    for (const p of SPRAVOCHNIK_PRODUCTS) {
      expect(ids.has(p.sectionId)).toBe(true);
    }
  });

  it("getSpravochnikProductBySlug returns data for nitroammofoska", () => {
    const p = getSpravochnikProductBySlug("nitroammofoska");
    expect(p?.name).toContain("Нитроаммофоска");
    expect(p?.paragraphs.length).toBeGreaterThan(0);
  });
});
