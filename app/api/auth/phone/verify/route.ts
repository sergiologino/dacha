import { NextResponse } from "next/server";
import { authorizePhoneLogin } from "@/lib/phone-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string; code?: string };
    const user = await authorizePhoneLogin(body.phone ?? "", body.code ?? "");

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid code",
        },
        { status: 401 },
      );
    }

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (error) {
    console.error("[auth][phone][verify]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to verify code",
      },
      { status: 500 },
    );
  }
}
