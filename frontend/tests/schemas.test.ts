import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/schemas";

describe("Auth schemas", () => {
  it("accepts valid login payload", () => {
    const parsed = loginSchema.safeParse({
      email: "test@example.com",
      password: "pass123",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects weak register password", () => {
    const parsed = registerSchema.safeParse({
      email: "test@example.com",
      password: "weak",
      confirmPassword: "weak",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects mismatched reset passwords", () => {
    const parsed = resetPasswordSchema.safeParse({
      token: "reset-token",
      password: "Strong123!",
      confirmPassword: "Strong123!different",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts valid forgot password payload", () => {
    const parsed = forgotPasswordSchema.safeParse({
      email: "reset@example.com",
    });

    expect(parsed.success).toBe(true);
  });
});
