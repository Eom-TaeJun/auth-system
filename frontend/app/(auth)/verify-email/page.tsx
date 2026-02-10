"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authApi, handleApiResponse } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type VerifyStatus = "idle" | "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [message, setMessage] = useState("");

  const shouldVerify = useMemo(() => Boolean(token), [token]);

  useEffect(() => {
    if (!shouldVerify || !token) {
      return;
    }

    const verify = async () => {
      setStatus("loading");
      const result = await handleApiResponse(authApi.verifyEmail(token));

      if (!result.success || !result.data) {
        setStatus("error");
        setMessage(result.error?.message || "Verification failed");
        return;
      }

      setStatus("success");
      setMessage(result.data.message || "Email verified successfully");
      toast.success("Email verified");
    };

    void verify();
  }, [shouldVerify, token]);

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          {email
            ? `A verification link was sent to ${email}.`
            : "Check your inbox and click the verification link."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!shouldVerify && (
          <p className="text-sm text-muted-foreground">
            Open this page using the verification link from your email to
            complete verification.
          </p>
        )}

        {status === "loading" && (
          <p className="text-sm text-muted-foreground">
            Verifying your email...
          </p>
        )}

        {status === "success" && (
          <p className="text-sm text-emerald-600">{message}</p>
        )}

        {status === "error" && (
          <p className="text-sm text-destructive">{message}</p>
        )}

        <div className="flex gap-2">
          <Link
            className={cn(buttonVariants({ variant: "default" }), "flex-1")}
            href="/login"
          >
            Go to sign in
          </Link>
          <Link
            className={cn(buttonVariants({ variant: "outline" }), "flex-1")}
            href="/register"
          >
            Back to register
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
