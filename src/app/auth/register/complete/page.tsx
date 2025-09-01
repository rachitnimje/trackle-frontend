"use client";

import { useState, useEffect } from "react";
import { checkUsernameAvailability } from "@/api/auth";
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
import Image from "next/image";

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
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [usernameCheckMsg, setUsernameCheckMsg] = useState<string>("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [suggestedUsername, setSuggestedUsername] = useState<string>("");

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

  // Real-time username check
  useEffect(() => {
    const sub = form.watch(async (values, { name }) => {
      if (
        name === "username" &&
        values.username &&
        values.username.length >= 3
      ) {
        setCheckingUsername(true);
        const res = await checkUsernameAvailability(values.username);
        setUsernameAvailable(res.available);
        setUsernameCheckMsg(res.message);
        setCheckingUsername(false);
      } else if (name === "username") {
        setUsernameAvailable(null);
        setUsernameCheckMsg("");
      }
    });
    return () => sub.unsubscribe();
  }, [form]);

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
        setSuggestedUsername(suggested);
      }
    }
  }, [session, form]);

  async function onSubmit(values: UsernameFormValues) {
    // Prevent submit if username is not available
    if (usernameAvailable === false) {
      toast.error(
        "This username is already taken. Try a suggestion below or choose another."
      );
      return;
    }
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
          credentials: "include", // Include cookies for CORS
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

      console.log("Backend response:", { status: response.status, data });

      if (data.success) {
        // Store the backend token (30 days) as cookie for API client
        document.cookie = `token=${data.data.token}; path=/; max-age=${
          30 * 24 * 60 * 60
        }`;

        // Also attach backend token into NextAuth session via server helper so session contains backendToken immediately
        try {
          await fetch("/api/auth/attach-backend", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              backendToken: data.data.token,
              backendUserId: data.data.user?.id || null,
            }),
          });
        } catch (e) {
          console.warn(
            "Failed to attach backend token to NextAuth session:",
            e
          );
        }

        // Give clear success feedback then reload so AuthContext picks up the new token
        toast.success("Registration completed — signing you in...");
        // Small delay for toast UX then reload
        setTimeout(() => {
          // Reload the page so the AuthProvider/AuthContext can detect the backend token and fetch the profile
          window.location.href = "/";
        }, 800);
        return;
      }

      // Handle specific backend error messages
      const msg = data.message || data.error || "Registration failed";
      if (response.status === 409 || /username/i.test(msg)) {
        // Username conflict — show clear message and suggest alternatives
        toast.error(msg || "This username is already taken.");
        setUsernameAvailable(false);
        // Create a suggestion with numeric suffix to help user
        const base = (values.username || suggestedUsername || "user")
          .replace(/[^a-zA-Z0-9_]/g, "")
          .substring(0, 12);
        const alt = `${base}${Math.floor(Math.random() * 90) + 10}`;
        setSuggestedUsername(alt);
      } else {
        toast.error(msg);
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
            <div className="w-16 h-16 rounded-full mx-auto mt-4 overflow-hidden">
              <Image
                src={session.user.image}
                alt="Profile"
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded-full"
                priority
              />
            </div>
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
                    <Input
                      placeholder="Enter a unique username"
                      {...field}
                      autoComplete="off"
                      onBlur={async () => {
                        if (field.value && field.value.length >= 3) {
                          setCheckingUsername(true);
                          const res = await checkUsernameAvailability(
                            field.value
                          );
                          setUsernameAvailable(res.available);
                          setUsernameCheckMsg(res.message);
                          setCheckingUsername(false);
                          // if username is taken, generate a suggestion
                          if (!res.available) {
                            const base = field.value
                              .replace(/[^a-zA-Z0-9_]/g, "")
                              .substring(0, 12);
                            setSuggestedUsername(
                              `${base}${Math.floor(Math.random() * 90) + 10}`
                            );
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs mt-1">
                    {checkingUsername && (
                      <span className="text-muted-foreground">
                        Checking username...
                      </span>
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <span className="text-destructive">
                        {usernameCheckMsg || "Username is already taken"}
                      </span>
                    )}
                    {!checkingUsername && usernameAvailable === true && (
                      <span className="text-green-600">
                        {usernameCheckMsg || "Username is available"}
                      </span>
                    )}
                    {/* Suggested username helper */}
                    {!checkingUsername && suggestedUsername && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Suggested:
                        </span>
                        <span className="text-sm font-medium">
                          {suggestedUsername}
                        </span>
                        <button
                          type="button"
                          className="text-primary underline text-xs"
                          onClick={() =>
                            form.setValue("username", suggestedUsername)
                          }
                        >
                          Use
                        </button>
                      </div>
                    )}
                  </div>
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
