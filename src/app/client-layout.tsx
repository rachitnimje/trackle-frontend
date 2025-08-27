"use client";

import Header from "@/components/Header";
import BottomNavBar from "@/components/BottomNavBar";
import { useAuth } from "@/contexts/AuthContext";

interface ClientLayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

export default function ClientLayout({ children, hideNav = false }: ClientLayoutProps) {
  const { isAuthenticated } = useAuth();

  if (hideNav) {
    // Don't show header or navigation on auth pages or when explicitly hidden
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      {children}
      {isAuthenticated && <BottomNavBar />}
    </>
  );
}
