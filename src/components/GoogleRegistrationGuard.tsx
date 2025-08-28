"use client";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function GoogleRegistrationGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "authenticated") {
      // If user is missing backendUserId and is not already on the username entry page, force username entry
      if (!session?.backendUserId && pathname !== "/auth/register/complete") {
        router.replace("/auth/register/complete");
      }
    }
  }, [session, status, router, pathname]);

  return <>{children}</>;
}
