import { NextResponse } from "next/server";
import { decode, encode } from "next-auth/jwt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const backendToken = body.backendToken;
    const backendUserId = body.backendUserId ?? null;

    if (!backendToken) {
      return NextResponse.json(
        { success: false, message: "Missing backendToken" },
        { status: 400 }
      );
    }

    // Read existing NextAuth session token from cookies
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/(?:^|; )next-auth.session-token=([^;]+)/);
    const existing = match ? decodeURIComponent(match[1]) : null;

    // Ensure NEXTAUTH_SECRET is present
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        {
          success: false,
          message: "Server misconfiguration: NEXTAUTH_SECRET missing",
        },
        { status: 500 }
      );
    }

    // Decode existing NextAuth JWT if present
    let decoded: Record<string, unknown> = {};
    if (existing) {
      try {
        const d = (await decode({
          token: existing,
          secret: secret as string,
        })) as Record<string, unknown> | null;
        if (d) decoded = d;
      } catch {
        // ignore decode errors
        decoded = {};
      }
    }

    // Merge backend fields
    decoded.backendToken = backendToken;
    decoded.backendUserId = backendUserId;

    // Re-encode JWT
    const encoded = await encode({ token: decoded, secret: secret as string });
    if (!encoded) {
      return NextResponse.json(
        { success: false, message: "Failed to encode token" },
        { status: 500 }
      );
    }

    const res = NextResponse.json({ success: true });

    // Set cookie for NextAuth session token to match NextAuth cookie options
    const secure = process.env.NODE_ENV === "production";
    res.cookies.set("next-auth.session-token", encoded, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure,
      maxAge: 30 * 24 * 60 * 60,
    });

    return res;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: String(error) },
      { status: 500 }
    );
  }
}
