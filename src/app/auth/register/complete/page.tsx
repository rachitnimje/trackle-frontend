"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
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
import { register as registerUser } from "@/api/auth";

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
});

type UsernameFormValues = z.infer<typeof usernameSchema>;

export default function CompleteRegistration() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: "",
    },
  });

  useEffect(() => {
    // If user is not authenticated or already has a complete profile, redirect
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  // Generate suggested username from email or name
  useEffect(() => {
    if (session?.user) {
      let suggested = "";
      if (session.user.name) {
        suggested = session.user.name.toLowerCase().replace(/\s+/g, "");
      } else if (session.user.email) {
        suggested = session.user.email.split("@")[0];
      }
      // Remove special characters and limit length
      suggested = suggested.replace(/[^a-zA-Z0-9_]/g, "").substring(0, 15);
      if (suggested) {
        form.setValue("username", suggested);
      }
    }
  }, [session, form]);

  async function onSubmit(values: UsernameFormValues) {
    if (!session?.user?.email) {
      toast.error("Session error. Please try again.");
      return;
    }

    try {
      setIsLoading(true);

      // Call backend Google OAuth endpoint with username
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google-oauth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: session.user.email,
            username: values.username,
            googleId: session.user.googleId,
            name: session.user.name,
            picture: session.user.image,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Store the backend token
        document.cookie = `token=${data.data.token}; path=/; max-age=${
          30 * 24 * 60 * 60
        }`; // 30 days

        toast.success("Registration completed successfully!");
        router.push("/"); // Redirect to home
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration completion error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Complete Your Registration</h1>
          <p className="text-muted-foreground mt-2">
            Choose a unique username to finish setting up your account
          </p>
          {session.user.image && (
            <img
              src={session.user.image}
              alt="Profile"
              className="w-16 h-16 rounded-full mx-auto mt-4"
            />
          )}
          <p className="text-sm text-muted-foreground mt-2">
            {session.user.name} ({session.user.email})
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a unique username" {...field} />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Username can only contain letters, numbers, and underscores
                  </p>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Complete Registration"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
