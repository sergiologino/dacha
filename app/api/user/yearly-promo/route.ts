import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-user";
import {
  buildYearlyPromoOffer,
  getInactiveYearlyPromoOffer,
} from "@/lib/yearly-promo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getAuthUser().catch(() => null);
    if (!user) {
      return NextResponse.json(getInactiveYearlyPromoOffer());
    }

    return NextResponse.json(buildYearlyPromoOffer(user));
  } catch (error) {
    console.error("Yearly promo GET error:", error);
    return NextResponse.json(getInactiveYearlyPromoOffer(), { status: 200 });
  }
}
