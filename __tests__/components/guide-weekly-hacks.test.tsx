import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GuideWeeklyHacksSection } from "@/components/guide-weekly-hacks";
import type { GuideHackDTO } from "@/lib/data/guide-hacks";

vi.mock("@/components/guide-hack-image", () => ({
  GuideHackImage: ({ alt }: { alt: string }) => <div role="img" aria-label={alt} />,
}));

const hacks: GuideHackDTO[] = [
  {
    slug: "mulch",
    title: "Мульча от пересыхания",
    text: "Слой травы удерживает влагу и защищает почву.",
    imageUrl: "/images/hack.jpg",
    imageAlt: "Мульча на грядке",
    categorySlug: "soil-compost-mulch",
    categoryTitle: "Почва",
  },
];

describe("GuideWeeklyHacksSection", () => {
  it("renders as a compact link to the lifehacks page", () => {
    render(<GuideWeeklyHacksSection hacks={hacks} />);

    const link = screen.getByRole("link", { name: /лайфхаки и народные приёмы/i });
    expect(link).toHaveAttribute("href", "/guide/lifehacks");
    expect(screen.getByText("Открыть лайфхаки")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /показать ещё/i })).not.toBeInTheDocument();
  });
});
