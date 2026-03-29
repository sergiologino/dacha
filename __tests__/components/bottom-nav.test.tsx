import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BottomNav } from "@/components/bottom-nav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/garden",
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className, ...props }: Record<string, unknown>) => {
      const { layoutId, transition, ...rest } = props as Record<string, unknown>;
      return <div className={className as string} data-testid="motion-div" {...rest}>{children as React.ReactNode}</div>;
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("BottomNav", () => {
  it("renders all navigation items (incl. gallery, Факты moved to guide page)", () => {
    render(<BottomNav />);
    expect(screen.getByText("Главная")).toBeInTheDocument();
    expect(screen.getByText("Календарь")).toBeInTheDocument();
    expect(screen.getByText("Галерея")).toBeInTheDocument();
    expect(screen.getByText("Нейроэксперт")).toBeInTheDocument();
    expect(screen.getByText("Справочник")).toBeInTheDocument();
    expect(screen.getByText("Анализ")).toBeInTheDocument();
    expect(screen.queryByText("Факты")).not.toBeInTheDocument();
  });

  it("highlights active route", () => {
    render(<BottomNav />);
    const gardenLink = screen.getByText("Главная").closest("a");
    expect(gardenLink).toHaveClass("text-white");
  });

  it("renders correct links", () => {
    render(<BottomNav />);
    expect(screen.getByText("Главная").closest("a")).toHaveAttribute("href", "/garden");
    expect(screen.getByText("Календарь").closest("a")).toHaveAttribute("href", "/calendar");
    expect(screen.getByText("Нейроэксперт").closest("a")).toHaveAttribute("href", "/chat");
    expect(screen.getByText("Справочник").closest("a")).toHaveAttribute("href", "/guide");
    expect(screen.getByText("Галерея").closest("a")).toHaveAttribute("href", "/gallery");
    expect(screen.getByText("Анализ").closest("a")).toHaveAttribute("href", "/camera");
  });

  it("shows active indicator on current route", () => {
    render(<BottomNav />);
    const motionDivs = screen.getAllByTestId("motion-div");
    expect(motionDivs.length).toBeGreaterThanOrEqual(1);
  });
});
