import { NextResponse } from "next/server";
import { auth } from "@/auth";

const AI_URL = process.env.AI_INTEGRATION_URL;
const AI_KEY = process.env.AI_INTEGRATION_API_KEY;

export async function GET() {
  if (!AI_URL || !AI_KEY) {
    return NextResponse.json(
      { error: "AI integration not configured" },
      { status: 500 }
    );
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(`${AI_URL}/api/ai/networks/available`, {
      headers: { "X-API-Key": AI_KEY },
      next: { revalidate: 3600 },
    });

    const networks = await response.json();

    const chatNetworks = networks
      .filter((n: { networkType: string }) => n.networkType === "chat")
      .map((n: { name: string; displayName: string; provider: string; isFree: boolean }) => ({
        id: n.name,
        name: n.displayName,
        provider: n.provider,
        isFree: n.isFree,
      }));

    return NextResponse.json(chatNetworks);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch networks" },
      { status: 502 }
    );
  }
}
