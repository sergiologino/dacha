import { describe, it, expect } from "vitest";
import { proxifyGuideMediaUrl } from "@/lib/guide-image-url";

describe("proxifyGuideMediaUrl", () => {
  it("proxies upload.wikimedia.org HTTPS URLs", () => {
    const raw = "https://upload.wikimedia.org/wikipedia/commons/thumb/x/x/Tomato.jpg/600px-Tomato.jpg";
    expect(proxifyGuideMediaUrl(raw)).toBe(
      `/api/guide-image?url=${encodeURIComponent(raw)}`
    );
  });

  it("leaves local uploads and paths unchanged", () => {
    expect(proxifyGuideMediaUrl("/uploads/foo.jpg")).toBe("/uploads/foo.jpg");
  });

  it("does not double-wrap proxy URLs", () => {
    const p = `/api/guide-image?url=${encodeURIComponent("https://upload.wikimedia.org/x")}`;
    expect(proxifyGuideMediaUrl(p)).toBe(p);
  });

  it("leaves other HTTPS hosts unchanged", () => {
    expect(proxifyGuideMediaUrl("https://cdn.pixabay.com/a.jpg")).toBe("https://cdn.pixabay.com/a.jpg");
  });
});
