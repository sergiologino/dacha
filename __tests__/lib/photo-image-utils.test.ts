import { describe, it, expect } from "vitest";
import { normalizeStoredPhotoUrl } from "@/lib/photo-image-utils";

describe("normalizeStoredPhotoUrl", () => {
  it("leaves data URLs intact", () => {
    const u = "data:image/jpeg;base64,QUJD";
    expect(normalizeStoredPhotoUrl(u)).toBe(u);
  });

  it("leaves absolute http(s) intact", () => {
    expect(normalizeStoredPhotoUrl("https://ex.example/img.jpg")).toBe(
      "https://ex.example/img.jpg"
    );
  });

  it("normalizes uploads/ without leading slash", () => {
    expect(normalizeStoredPhotoUrl("uploads/a-b.jpg")).toBe("/uploads/a-b.jpg");
  });

  it("normalizes //uploads/ path", () => {
    expect(normalizeStoredPhotoUrl("//uploads/x.png")).toBe("/uploads/x.png");
  });

  it("trims whitespace", () => {
    expect(normalizeStoredPhotoUrl("  /uploads/y.jpg  ")).toBe("/uploads/y.jpg");
  });
});
