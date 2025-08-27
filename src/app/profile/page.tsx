"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  LogOut,
  User as UserIcon,
  Palette,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { logger } from "@/utils/logger";

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    loading,
    isLoggingOut: contextIsLoggingOut,
    logout: contextLogout,
  } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await contextLogout();
      // The context logout will handle the redirect
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
      logger.error("Error during logout", { error });
      // Fallback navigation if context logout fails
      router.push("/");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Unknown";
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center bg-background mb-4">
        <Link
          href="/"
          className="inline-flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Profile</h1>
      </div>

      {loading || contextIsLoggingOut || isLoggingOut ? (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <Skeleton className="h-8 w-[200px] mb-2" />
            <Skeleton className="h-4 w-[150px]" />
          </CardHeader>
          <CardContent className="space-y-4 pb-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ) : user ? (
        <>
          <Card className="mb-4 py-4">
            <CardHeader>
              <div className="flex items-center mb-1">
                <div className="h-14 w-14 flex items-center justify-center rounded-full bg-primary/10 mr-3">
                  <UserIcon className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {user.name || user.username}
                  </CardTitle>
                  {user.name && (
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <Separator />

              {user.name && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Full Name
                    </span>
                    <span className="text-sm font-medium">{user.name}</span>
                  </div>
                  <Separator />
                </>
              )}

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Username</span>
                <span className="text-sm font-medium">{user.username}</span>
              </div>
              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Member Since
                </span>
                <span className="text-sm font-medium">
                  {formatDate(user.created_at)}
                </span>
              </div>
              <Separator />
            </CardContent>
          </Card>

          {/* Settings Card */}
          <Card className="mb-4 py-4">
            <CardHeader className="">
              <div className="flex items-center space-x-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Settings</CardTitle>
              </div>
              <CardDescription>Customize your app preferences</CardDescription>
            </CardHeader>

            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <span className="text-sm font-medium">Theme</span>
                </div>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Logout Card */}
          <Card className="border-0 shadow-xs py-0">
            <CardContent className="px-0">
              <Dialog
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-2 text-destructive border-destructive/20"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px] p-4">
                  <DialogHeader>
                    <DialogTitle>Logout Confirmation</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to logout from your account?
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowLogoutDialog(false)}
                      disabled={isLoggingOut}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1">
          <p className="text-muted-foreground mb-4">You are not logged in</p>
          <Button onClick={() => router.push("/auth/login")}>Login</Button>
        </div>
      )}
    </div>
  );
}
