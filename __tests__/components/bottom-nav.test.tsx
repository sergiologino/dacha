import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "@/components/bottom-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/garden",
}));

describe("BottomNav", () => {
  it("renders all navigation items", () => {
    render(<BottomNav />);
    expect(screen.getByText("Участок")).toBeInTheDocument();
    expect(screen.getByText("Календарь")).toBeInTheDocument();
    expect(screen.getByText("Справочник")).toBeInTheDocument();
    expect(screen.getByText("Камера")).toBeInTheDocument();
  });

  it("highlights active route", () => {
    render(<BottomNav />);
    const gardenLink = screen.getByText("Участок").closest("a");
    expect(gardenLink).toHaveClass("text-white");
  });

  it("renders correct links", () => {
    render(<BottomNav />);
    expect(screen.getByText("Участок").closest("a")).toHaveAttribute("href", "/garden");
    expect(screen.getByText("Календарь").closest("a")).toHaveAttribute("href", "/calendar");
    expect(screen.getByText("Справочник").closest("a")).toHaveAttribute("href", "/guide");
    expect(screen.getByText("Камера").closest("a")).toHaveAttribute("href", "/camera");
  });
});
