import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, data } = await request.json();

  if (!type || !data) {
    return NextResponse.json({ error: "Missing type or data" }, { status: 400 });
  }

  const shared = await prisma.sharedContent.create({
    data: { type, data },
  });

  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://dacha-ai.ru";
  const shareUrl = `${baseUrl}/share/${shared.id}`;

  return NextResponse.json({ id: shared.id, url: shareUrl });
}
