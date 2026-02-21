import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MotionDiv, StaggerContainer, StaggerItem, PageTransition } from "@/components/motion";

describe("MotionDiv", () => {
  it("renders children", () => {
    render(<MotionDiv>Анимированный текст</MotionDiv>);
    expect(screen.getByText("Анимированный текст")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<MotionDiv className="test-class">Контент</MotionDiv>);
    const motionEl = container.querySelector(".test-class");
    expect(motionEl).toBeInTheDocument();
    expect(motionEl).toHaveTextContent("Контент");
  });

  it("renders with different variants", () => {
    const { container } = render(
      <>
        <MotionDiv variant="fadeIn">A</MotionDiv>
        <MotionDiv variant="scaleIn">B</MotionDiv>
        <MotionDiv variant="slideLeft">C</MotionDiv>
        <MotionDiv variant="slideRight">D</MotionDiv>
      </>
    );
    expect(container.querySelectorAll("div").length).toBeGreaterThanOrEqual(4);
  });
});

describe("StaggerContainer + StaggerItem", () => {
  it("renders container with staggered items", () => {
    render(
      <StaggerContainer>
        <StaggerItem>Элемент 1</StaggerItem>
        <StaggerItem>Элемент 2</StaggerItem>
        <StaggerItem>Элемент 3</StaggerItem>
      </StaggerContainer>
    );
    expect(screen.getByText("Элемент 1")).toBeInTheDocument();
    expect(screen.getByText("Элемент 2")).toBeInTheDocument();
    expect(screen.getByText("Элемент 3")).toBeInTheDocument();
  });
});

describe("PageTransition", () => {
  it("renders children with transition wrapper", () => {
    render(<PageTransition>Содержимое страницы</PageTransition>);
    expect(screen.getByText("Содержимое страницы")).toBeInTheDocument();
  });
});
