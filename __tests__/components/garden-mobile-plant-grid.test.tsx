import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GardenMobilePlantGrid } from "@/components/garden-mobile-plant-grid";
import type { Bed } from "@/lib/hooks/use-beds";

describe("GardenMobilePlantGrid", () => {
  it("places the crop thumbnail as a floated image so text wraps to the right and below", () => {
    const beds: Bed[] = [
      {
        id: "bed-1",
        name: "Теплица",
        number: null,
        type: "greenhouse",
        createdAt: "2026-05-01T00:00:00.000Z",
        photos: [],
        plants: [
          {
            id: "plant-1",
            name: "Томат Бычье сердце",
            status: "growing",
            plantedDate: "2026-05-01T12:00:00.000Z",
            cropSlug: "tomat",
            timelineEvents: [
              {
                id: "event-1",
                type: "water",
                title: "Полить и проверить влажность почвы",
                description: null,
                scheduledDate: "2026-05-12T12:00:00.000Z",
                dateTo: null,
                isAction: true,
                sortOrder: 0,
                doneAt: null,
              },
            ],
          },
        ],
      },
    ];

    render(<GardenMobilePlantGrid beds={beds} unassignedPlants={[]} />);

    const card = screen.getByText("Томат Бычье сердце").closest("[data-slot='card']");
    expect(card).toHaveClass("flow-root");
    expect(card?.querySelector(".float-left.h-24.w-24")).toBeTruthy();
    expect(screen.getByText("Томат Бычье сердце")).toBeInTheDocument();
    expect(screen.getByText("Теплица")).toBeInTheDocument();
  });
});
