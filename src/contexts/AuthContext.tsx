"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "@/api/types";
import { getProfile, logout as apiLogout } from "@/api/auth";
import Cookies from "js-cookie";
import { reportError } from "@/utils/logger";
import { useSession, signOut, getSession } from "next-auth/react";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isGoogleUser: boolean; // Add this to track Google OAuth users
  loading: boolean;
  isLoggingOut: boolean; // Add this to track logout state
  error: string | null;
  refreshUserData: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuthState: () => void; // Force clear authentication state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const { data: session, status } = useSession();

  const fetchUser = async () => {
    try {
      // Check for custom token first (existing users)
      const token = Cookies.get("token");

      if (token) {
        // Existing token-based authentication
        setIsGoogleUser(false);
        const response = await getProfile();
        if (response.success) {
          setUser(response.data);
        } else {
          // Token is invalid, clear it
          Cookies.remove("token");
          setError(response.message || "Failed to fetch user profile");
        }
      } else if (session?.user) {
        // NextAuth Google OAuth user
        // Check if we have a backend token from the session
        if (session.backendToken) {
          // Google user with backend integration - still a Google user!
          setIsGoogleUser(true); // This is still a Google OAuth user

          // Set the backend token as a cookie for API calls
          Cookies.set("token", session.backendToken);

          // Always try to fetch user profile from backend (should include correct role)
          const response = await getProfile();
          if (response.success) {
            setUser(response.data);
          } else {
            // Fallback to session data if backend call fails
            const googleUser: User = {
              id: parseInt(session.user.googleId || String(Date.now())),
              username:
                session.user.name ||
                session.user.email?.split("@")[0] ||
                "Google User",
              email: session.user.email || "",
              role: "user",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setUser(googleUser);
          }
        } else {
          // Google user without backend integration (limited access)
          setIsGoogleUser(true);

          const googleUser: User = {
            id: parseInt(session.user.googleId || String(Date.now())),
            username:
              session.user.name ||
              session.user.email?.split("@")[0] ||
              "Google User",
            email: session.user.email || "",
            role: "user",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          setUser(googleUser);
        }
      } else {
        // No authentication found
        setIsGoogleUser(false);
        setUser(null);
        setError(null);
        setLoading(false);
        return;
      }
    } catch (err) {
      setError("An error occurred while fetching the user profile");
      reportError(
        err instanceof Error ? err : new Error(String(err)),
        "AuthContext user fetch"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [session, status, fetchUser]); // Re-run when session changes, include fetchUser in deps

  const refreshUserData = async () => {
    setLoading(true);
    await fetchUser();
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      // Get current session to properly detect Google OAuth users
      const currentSession = await getSession();
      const isCurrentlyGoogleUser =
        isGoogleUser || (currentSession?.user && !!currentSession.accessToken);

      if (isCurrentlyGoogleUser) {
        const hasBackendToken = Cookies.get("token");
        if (hasBackendToken) {
          try {
            await apiLogout(); // Call backend logout first
          } catch {
            // Continue with NextAuth logout even if backend logout fails
          }
        }
        try {
          // NextAuth signOut
          await signOut({ callbackUrl: "/", redirect: false });
        } catch {
          // Ignore
        }
      } else {
        await apiLogout();
      }
    } catch (error) {
      // Ignore
    } finally {
      setUser(null);
      setIsGoogleUser(false);
      setError(null);
      // Clear cookies and storage as before
      const cookiesToClear = [
        "token",
        "next-auth.session-token",
        "next-auth.callback-url",
        "next-auth.csrf-token",
        "next-auth.pkce.code_verifier",
      ];
      const isSecure = window.location.protocol === "https:";
      if (isSecure) {
        cookiesToClear.push(
          "__Secure-next-auth.session-token",
          "__Secure-next-auth.callback-url",
          "__Host-next-auth.csrf-token",
          "__Secure-next-auth.pkce.code_verifier"
        );
      }
      cookiesToClear.forEach((cookieName) => {
        Cookies.remove(cookieName);
        Cookies.remove(cookieName, { path: "/" });
        Cookies.remove(cookieName, {
          path: "/",
          domain: window.location.hostname,
        });
        if (isSecure) {
          Cookies.remove(cookieName, {
            path: "/",
            domain: `.${window.location.hostname}`,
            secure: true,
          });
        } else {
          Cookies.remove(cookieName, {
            path: "/",
            domain: `.${window.location.hostname}`,
          });
        }
      });
      // Clear any other NextAuth cookies we might have missed
      const allCookies = document.cookie.split(";");
      allCookies.forEach((cookie) => {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes("next-auth") || name === "token") {
          Cookies.remove(name);
          Cookies.remove(name, { path: "/" });
          Cookies.remove(name, { path: "/", domain: window.location.hostname });
          if (isSecure) {
            Cookies.remove(name, {
              path: "/",
              domain: `.${window.location.hostname}`,
              secure: true,
            });
          } else {
            Cookies.remove(name, {
              path: "/",
              domain: `.${window.location.hostname}`,
            });
          }
        }
      });
      // Clear localStorage/sessionStorage
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.includes("next-auth") || key.includes("nextauth")) {
            localStorage.removeItem(key);
          }
        });
        Object.keys(sessionStorage).forEach((key) => {
          if (key.includes("next-auth") || key.includes("nextauth")) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (error) {}
      // Always redirect to home
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
      setIsLoggingOut(false);
    }
  };

  const clearAuthState = () => {
    setUser(null);
    setIsGoogleUser(false);
    setError(null);

    // Clear all authentication cookies more thoroughly
    const cookiesToClear = [
      "token",
      "next-auth.session-token",
      "next-auth.callback-url",
      "next-auth.csrf-token",
      "next-auth.pkce.code_verifier",
    ];

    // Only try to clear secure cookies if we're on HTTPS
    const isSecure = window.location.protocol === "https:";
    if (isSecure) {
      cookiesToClear.push(
        "__Secure-next-auth.session-token",
        "__Secure-next-auth.callback-url",
        "__Host-next-auth.csrf-token",
        "__Secure-next-auth.pkce.code_verifier"
      );
    }

    cookiesToClear.forEach((cookieName) => {
      Cookies.remove(cookieName);
      Cookies.remove(cookieName, { path: "/" });
      Cookies.remove(cookieName, {
        path: "/",
        domain: window.location.hostname,
      });
      if (isSecure) {
        Cookies.remove(cookieName, {
          path: "/",
          domain: `.${window.location.hostname}`,
          secure: true,
        });
      } else {
        Cookies.remove(cookieName, {
          path: "/",
          domain: `.${window.location.hostname}`,
        });
      }
    });

    // Clear any other NextAuth cookies we might have missed
    const allCookies = document.cookie.split(";");
    allCookies.forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name.includes("next-auth") || name === "token") {
        Cookies.remove(name);
        Cookies.remove(name, { path: "/" });
        Cookies.remove(name, { path: "/", domain: window.location.hostname });
        if (isSecure) {
          Cookies.remove(name, {
            path: "/",
            domain: `.${window.location.hostname}`,
            secure: true,
          });
        } else {
          Cookies.remove(name, {
            path: "/",
            domain: `.${window.location.hostname}`,
          });
        }
      }
    });

    // Also clear any NextAuth data from localStorage and sessionStorage
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.includes("next-auth") || key.includes("nextauth")) {
          localStorage.removeItem(key);
        }
      });

      Object.keys(sessionStorage).forEach((key) => {
        if (key.includes("next-auth") || key.includes("nextauth")) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  };

  const isAdmin = user?.role === "admin";
  const isAuthenticated = !!user;

  const value = {
    user,
    setUser,
    isAdmin,
    isAuthenticated,
    isGoogleUser,
    loading,
    isLoggingOut,
    error,
    refreshUserData,
    logout,
    clearAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
