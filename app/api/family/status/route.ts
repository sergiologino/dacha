import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { familyOwnerIdFor, getFamilyMembers, isFamilyOwner } from "@/lib/family-access";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ownerId = familyOwnerIdFor(user);
    const owner =
      ownerId === user.id
        ? user
        : await prisma.user.findUnique({
            where: { id: ownerId },
            select: { id: true, name: true, email: true, phone: true },
          });

    const members = isFamilyOwner(user) ? await getFamilyMembers(user.id) : [];

    return NextResponse.json({
      role: isFamilyOwner(user) ? "owner" : "member",
      owner: owner
        ? {
            id: owner.id,
            name: owner.name,
            email: owner.email,
            phone: owner.phone,
          }
        : null,
      members,
    });
  } catch (error) {
    console.error("Family status error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
