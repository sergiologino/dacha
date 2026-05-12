import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { isFamilyOwner } from "@/lib/family-access";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isFamilyOwner(user)) {
      return NextResponse.json(
        { error: "Удалять членов семьи может только владелец аккаунта." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const member = await prisma.user.findFirst({
      where: { id, familyOwnerId: user.id },
      select: { id: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Участник семьи не найден." }, { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: { familyOwnerId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Family member delete error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
