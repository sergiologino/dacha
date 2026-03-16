import { NextResponse } from "next/server";
import { PhoneAuthError, sendPhoneVerificationCode } from "@/lib/phone-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string };
    const result = await sendPhoneVerificationCode(body.phone ?? "");

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    if (error instanceof PhoneAuthError) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          retryAfterSec: error.retryAfterSec,
        },
        { status: error.status },
      );
    }

    console.error("[auth][phone][send-code]", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Не удалось отправить SMS-код. Попробуйте ещё раз чуть позже.",
      },
      { status: 500 },
    );
  }
}
