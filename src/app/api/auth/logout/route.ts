import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Clear all authentication-related cookies
    const cookiesToClear = [
      "next-auth.session-token",
      "next-auth.callback-url",
      "next-auth.csrf-token",
      "next-auth.pkce.code_verifier",
      "token", // Our custom token
    ];

    // Only try to clear secure cookies if we're on HTTPS
    const isSecure = request.url.startsWith("https:");
    if (isSecure) {
      cookiesToClear.push(
        "__Secure-next-auth.session-token",
        "__Secure-next-auth.callback-url",
        "__Host-next-auth.csrf-token",
        "__Secure-next-auth.pkce.code_verifier"
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear each cookie with different configurations
    cookiesToClear.forEach((cookieName) => {
      response.cookies.delete(cookieName);
      response.cookies.set(cookieName, "", {
        expires: new Date(0),
        path: "/",
        httpOnly: false,
        secure: isSecure,
      });
    });

    return response;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json(
      { success: false, message: "Logout failed" },
      { status: 500 }
    );
  }
}
