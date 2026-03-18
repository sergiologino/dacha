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

  let updated:
    | {
        latitude: number | null;
        longitude: number | null;
        locationName: string | null;
      }
    | null = null;

  try {
    updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        latitude,
        longitude,
        locationName,
        weatherLastCheckedAt: null,
        weatherAlertKeys: [],
        weatherLastPressureMb: null,
      },
      select: {
        latitude: true,
        longitude: true,
        locationName: true,
      },
    });
  } catch (error) {
    if ((error as { code?: string } | null)?.code !== "P2022") {
      throw error;
    }

    updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        latitude,
        longitude,
        locationName,
      },
      select: {
        latitude: true,
        longitude: true,
        locationName: true,
      },
    });
  }

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
