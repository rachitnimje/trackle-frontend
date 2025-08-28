import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Skip middleware for NextAuth API routes and static files
  if (
    request.nextUrl.pathname.startsWith("/api/auth") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon.ico") ||
    request.nextUrl.pathname.startsWith("/manifest.json") ||
    request.nextUrl.pathname.startsWith("/icons") ||
    request.nextUrl.pathname.startsWith("/sw.js")
  ) {
    return NextResponse.next();
  }

  // Generate a cryptographically secure nonce for each request
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
  const response = NextResponse.next();
  response.headers.set('x-nonce', nonce);
  const connectSrc = process.env.NEXT_PUBLIC_CSP_CONNECT_SRC;
  const imgSrc = process.env.NEXT_PUBLIC_CSP_IMG_SRC;
  const scriptSrc = process.env.NEXT_PUBLIC_CSP_SCRIPT_SRC?.replace("'nonce-<RUNTIME_NONCE>'", `'nonce-${nonce}'`);
  const styleSrc = process.env.NEXT_PUBLIC_CSP_STYLE_SRC;
  const fontSrc = process.env.NEXT_PUBLIC_CSP_FONT_SRC;
  const frameSrc = process.env.NEXT_PUBLIC_CSP_FRAME_SRC;
  if (!connectSrc || !imgSrc || !scriptSrc || !styleSrc || !fontSrc || !frameSrc) {
    throw new Error("Missing one or more required CSP environment variables. Please set all NEXT_PUBLIC_CSP_* variables in your .env file.");
  }
  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src ${styleSrc};
    img-src ${imgSrc};
    font-src ${fontSrc};
    connect-src ${connectSrc};
    frame-src ${frameSrc};
  `
    .replace(/\s{2,}/g, " ")
    .trim();
  response.headers.set("Content-Security-Policy", cspHeader);

  // Get the token from cookies (both custom token and NextAuth)
  const customToken = request.cookies.get("token")?.value;
  const nextAuthToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  // Define public paths that don't require authentication
  const publicPaths = ["/auth/login", "/auth/register", "/auth", "/"];
  const isPublicPath = publicPaths.some((path) =>
    path === "/"
      ? request.nextUrl.pathname === path
      : request.nextUrl.pathname.startsWith(path)
  );

  // Check if user is authenticated (has either custom token or NextAuth token)
  const isAuthenticated = !!(customToken || nextAuthToken);

  // If user is authenticated and trying to access auth pages, redirect to home
  if (isAuthenticated && request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If accessing protected routes without token, redirect to login
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return response;
}

// See: https://nextjs.org/docs/app/building-your-application/routing/middleware
export const config = {
  matcher: [
    // Match all paths except static files and API routes
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js).*)",
  ],
};
