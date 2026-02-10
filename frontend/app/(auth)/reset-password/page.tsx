"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { authApi, handleApiResponse } from "@/lib/api";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromQuery = searchParams.get("token") || "";
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: tokenFromQuery,
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");
  const token = watch("token");

  useEffect(() => {
    setValue("token", tokenFromQuery);
  }, [setValue, tokenFromQuery]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    const result = await handleApiResponse(
      authApi.resetPassword({
        token: values.token,
        password: values.password,
      })
    );

    if (!result.success || !result.data) {
      toast.error(result.error?.message || "Failed to reset password");
      return;
    }

    toast.success("Password updated successfully");
    router.push("/login");
  };

  return (
    <Card className="border-border/60 shadow-lg">
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          Set a new password for your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register("token")} />

          {!token && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Missing reset token. Open this page from the reset link in your
              email.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <PasswordStrengthIndicator password={password || ""} />

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button className="w-full" disabled={isSubmitting || !token} type="submit">
            {isSubmitting ? "Updating..." : "Update password"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Back to{" "}
          <Link className="text-primary hover:underline" href="/login">
            sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
