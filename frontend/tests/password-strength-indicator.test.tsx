import { render, screen } from "@testing-library/react";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

describe("PasswordStrengthIndicator", () => {
  it("shows low strength for weak password", () => {
    render(<PasswordStrengthIndicator password="weak" />);

    expect(screen.getByText("Password strength")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("• At least 8 characters")).toBeInTheDocument();
  });

  it("shows full strength for strong password", () => {
    render(<PasswordStrengthIndicator password="Strong123!@#" />);

    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("✓ At least 8 characters")).toBeInTheDocument();
    expect(
      screen.getByText("✓ Contains special character")
    ).toBeInTheDocument();
  });
});
