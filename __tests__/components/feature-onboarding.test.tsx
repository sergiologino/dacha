import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeatureOnboarding } from "@/components/feature-onboarding";

vi.mock("next/image", () => ({
  default: ({
    alt = "",
    src,
    fill,
    priority,
    ...props
  }: {
    alt?: string;
    src: string;
    fill?: boolean;
    priority?: boolean;
  }) => {
    void fill;
    void priority;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt={alt} src={src} {...props} />
    );
  },
}));

describe("FeatureOnboarding", () => {
  it("uses one photo-style visual per slide and plain wording for the care plan", async () => {
    const user = userEvent.setup();
    render(<FeatureOnboarding open onClose={() => {}} />);

    expect(screen.getByRole("img", { name: "Теплица и участок под контролем" })).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /далее/i }));
    await user.click(screen.getByRole("button", { name: /далее/i }));

    expect(screen.getAllByRole("heading", { name: "План ухода" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "Ближайшие дела по растению" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /таймлайн/i })).not.toBeInTheDocument();
  });
});
