import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("Force logout endpoint called");

  const response = NextResponse.json({
    success: true,
    message: "Logout successful",
  });

  // Get the protocol for secure cookie handling
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const isSecure = protocol === "https";

  // List of all possible NextAuth cookies to clear
  const cookiesToClear = [
    "next-auth.session-token",
    "next-auth.callback-url",
    "next-auth.csrf-token",
    "next-auth.pkce.code_verifier",
    "token", // Our custom token
  ];

  // Add secure versions if we're on HTTPS
  if (isSecure) {
    cookiesToClear.push(
      "__Secure-next-auth.session-token",
      "__Secure-next-auth.callback-url",
      "__Host-next-auth.csrf-token",
      "__Secure-next-auth.pkce.code_verifier"
    );
  }

  // Clear each cookie with multiple configurations to ensure complete removal
  cookiesToClear.forEach((cookieName) => {
    // Standard clearing
    response.cookies.set(cookieName, "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
    });

    // Clear with domain variations
    const hostname = request.headers.get("host")?.split(":")[0] || "localhost";

    response.cookies.set(cookieName, "", {
      expires: new Date(0),
      path: "/",
      domain: hostname,
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
    });

    response.cookies.set(cookieName, "", {
      expires: new Date(0),
      path: "/",
      domain: `.${hostname}`,
      httpOnly: true,
      secure: isSecure,
      sameSite: "lax",
    });
  });

  console.log("Force logout: All cookies cleared");

  return response;
}
