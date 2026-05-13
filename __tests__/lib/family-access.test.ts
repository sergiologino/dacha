import { describe, expect, it } from "vitest";
import {
  assertOwnerCanDeletePlants,
  familyOwnerIdFor,
  isFamilyOwner,
} from "@/lib/family-access";

describe("family-access", () => {
  it("uses the current user as owner when there is no family owner", () => {
    const user = { id: "owner-1", familyOwnerId: null };
    expect(familyOwnerIdFor(user)).toBe("owner-1");
    expect(isFamilyOwner(user)).toBe(true);
    expect(assertOwnerCanDeletePlants(user)).toBe(true);
  });

  it("uses familyOwnerId for members and blocks plant deletion", () => {
    const user = { id: "member-1", familyOwnerId: "owner-1" };
    expect(familyOwnerIdFor(user)).toBe("owner-1");
    expect(isFamilyOwner(user)).toBe(false);
    expect(assertOwnerCanDeletePlants(user)).toBe(false);
  });
});
