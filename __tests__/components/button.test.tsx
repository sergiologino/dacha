import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button component", () => {
  it("renders with text", () => {
    render(<Button>Добавить</Button>);
    expect(screen.getByRole("button", { name: "Добавить" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    let clicked = false;
    render(<Button onClick={() => (clicked = true)}>Нажми</Button>);

    await user.click(screen.getByRole("button"));
    expect(clicked).toBe(true);
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>Выключена</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders different variants", () => {
    const { rerender } = render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toBeInTheDocument();

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
