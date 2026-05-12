import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";
import { isFamilyOwner } from "@/lib/family-access";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isFamilyOwner(user)) {
      return NextResponse.json(
        { error: "Приглашать членов семьи может только владелец аккаунта." },
        { status: 403 }
      );
    }

    const token = `fam_${randomBytes(24).toString("base64url")}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        familyInviteToken: token,
        familyInviteExpiresAt: expiresAt,
      },
    });

    const qrDataUrl = await QRCode.toDataURL(token, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
    });

    return NextResponse.json({
      token,
      qrDataUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Family invite error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
