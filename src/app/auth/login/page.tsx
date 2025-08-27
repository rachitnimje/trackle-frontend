"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { login, getProfile } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { reportError } from "@/utils/logger";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import GoogleAuth from "@/components/GoogleAuth";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeftIcon } from "@/components/Icons";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, loading, setUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const loginFormSchema = z.object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
  });
  type LoginFormValues = z.infer<typeof loginFormSchema>;
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      const response = await login(values);
      if (response.success) {
        const userResponse = await getProfile();
        if (userResponse.success) {
          setUser(userResponse.data);
          toast.success("Login successful");
          router.replace("/");
        } else {
          setError(
            userResponse.message || "Logged in but failed to fetch profile"
          );
        }
      } else {
        // Show backend error message if available
        setError(response.message || response.error || "Login failed");
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "response" in error &&
        error.response &&
        typeof error.response === "object" &&
        "data" in error.response &&
        error.response.data &&
        typeof error.response.data === "object" &&
        "message" in error.response.data
      ) {
        setError(
          (error.response.data as { message?: string }).message ||
            "An error occurred"
        );
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An error occurred");
      }
      reportError(
        error instanceof Error ? error : new Error(String(error)),
        "Login"
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (loading || isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="mt-2 flex items-center gap-2 hover:underline text-sm"
        onClick={() => router.push("/")}
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Back to Home
      </button>

      <div className="flex flex-col min-h-[70vh] py-7 px-4">
        {error && (
          <div className="mb-4 text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-primary">Login</h1>
              <p className="text-sm text-muted-foreground mt-2">
                Welcome back to Trackle
              </p>
            </div>
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your email"
                            type="email"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Enter your password"
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              {...field}
                            />
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOffIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>

              <div className="relative mt-4 mb-4">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">
                    or login with
                  </span>
                </div>
              </div>

              <GoogleAuth isLogin={true} onSuccess={() => router.push("/")} />

              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/auth/register"
                    className="text-primary font-medium hover:underline"
                  >
                    Register
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
