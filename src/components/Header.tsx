"use client";

import Link from "next/link";
import { DumbbellIcon } from "@/components/Icons";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

const Header = () => {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  return (
    <header className="border-b bg-background sticky top-0 z-10 rounded-bl-lg rounded-br-lg">
      <div className="container mx-auto py-3 px-4 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2 text-primary">
          <DumbbellIcon className="w-6 h-6" />
          <span className="font-bold text-xl">Trackle</span>
        </Link>

        {!loading && (
          <div>
            {!isAuthenticated && !isAuthPage && (
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="gap-1">
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
