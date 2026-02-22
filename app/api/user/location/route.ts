import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { latitude, longitude, locationName } = await request.json();

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { latitude, longitude, locationName },
  });

  return NextResponse.json({
    latitude: updated.latitude,
    longitude: updated.longitude,
    locationName: updated.locationName,
  });
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    latitude: user.latitude,
    longitude: user.longitude,
    locationName: user.locationName,
    onboardingDone: user.onboardingDone,
  });
}
