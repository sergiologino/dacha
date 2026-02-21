import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { latitude, longitude, locationName } = await request.json();

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { latitude, longitude, locationName },
  });

  return NextResponse.json({
    latitude: user.latitude,
    longitude: user.longitude,
    locationName: user.locationName,
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { latitude: true, longitude: true, locationName: true, onboardingDone: true },
  });

  return NextResponse.json(user);
}
