"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, isAuthenticated, logout, user } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-129px)] items-center justify-center">
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <header className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Signed in
            </p>
            <p className="font-medium">{user?.email}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              className={cn(
                buttonVariants({ variant: "outline" }),
                pathname === "/dashboard" && "border-primary text-primary"
              )}
              href="/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className={cn(
                buttonVariants({ variant: "outline" }),
                pathname === "/profile" && "border-primary text-primary"
              )}
              href="/profile"
            >
              Profile
            </Link>
            <Button
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
              variant="destructive"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
