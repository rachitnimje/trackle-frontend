import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account && profile) {
        token.accessToken = account.access_token;
        token.googleId = profile.sub;
        token.email = profile.email;
        token.name = profile.name;
        token.picture =
          typeof profile === "object" && profile && "picture" in profile
            ? (profile as { picture?: string }).picture
            : undefined;

        // Set token expiry to 24 hours
        token.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

        // Add backend token if available
        if (user.backendToken) {
          token.backendToken = user.backendToken;
          token.backendUserId = user.backendUserId;
        }
      }

      // Check if token has expired
      if (
        token.exp &&
        typeof token.exp === "number" &&
        Date.now() / 1000 > token.exp
      ) {
        console.log("JWT token has expired, clearing token");
        return {};
      }

      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user && token && Object.keys(token).length > 0) {
        session.accessToken = token.accessToken as string;
        session.user.googleId = token.googleId as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        session.backendToken = token.backendToken as string;
        session.backendUserId = token.backendUserId as string;
      } else {
        // If token is empty or invalid, clear the session
        console.log("Session callback: No valid token, clearing session");
        session.user = {} as Record<string, unknown>;
        session.expires = new Date(0).toISOString(); // Expire immediately
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        // Always require username entry for new Google users
        // Store Google info in the session token for use on the username screen
        user.googleId = profile.sub;
        user.email = profile.email;
        user.name = profile.name;
        user.image =
          typeof profile === "object" && profile && "picture" in profile
            ? (profile as { picture?: string }).picture
            : undefined;
        // Do not register with backend yet
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Handles where to redirect after sign in
      console.log("NextAuth Redirect:", { url, baseUrl });

      // Always redirect to home page after sign in
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // Default redirect to home
      return baseUrl;
    },
  },
  events: {
    async signOut({ token }) {
      // This runs whenever signOut is called
      console.log("NextAuth signOut event triggered, clearing token:", token);

      // Clear any additional server-side data if needed
      // The JWT token will be automatically invalidated by NextAuth
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
