import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Import components
import ClientLayout from "./client-layout";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import NextAuthProvider from "@/components/AuthProvider";

import MobileGuard from "@/components/MobileGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trackle - Workout Tracker",
  description: "Track your workouts and fitness progress with ease",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Trackle",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#e11d48",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <ThemeProvider>
          <NextAuthProvider>
            <AuthProvider>
              <MobileGuard>
                <ClientLayout>
                  <main className="flex-1 container mx-auto px-4 py-2 pb-16">
                    {children}
                  </main>
                  <PWAInstallPrompt />
                </ClientLayout>
              </MobileGuard>
              <Toaster position="top-center" />
            </AuthProvider>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
