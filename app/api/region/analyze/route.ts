import { NextRequest, NextResponse } from "next/server";
import { findClimateZone, getDefaultReport } from "@/lib/data/climate-zones";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/get-user";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { latitude, longitude } = await request.json();

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const zone = findClimateZone(latitude, longitude) ?? getDefaultReport(latitude, longitude);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      latitude,
      longitude,
      regionReport: zone.report,
      onboardingDone: true,
      region: zone.name,
    },
  });

  return NextResponse.json({
    name: zone.name,
    climate: zone.climate,
    soil: zone.soil,
    frostFreeMonths: zone.frostFreeMonths,
    bestCrops: zone.bestCrops,
    report: zone.report,
  });
}
