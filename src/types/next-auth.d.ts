import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    backendToken?: string;
    backendUserId?: string;
    user: {
      googleId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    backendToken?: string;
    backendUserId?: string;
  }

  interface JWT {
    accessToken?: string;
    backendToken?: string;
    backendUserId?: string;
    googleId?: string;
    picture?: string;
  }
}
