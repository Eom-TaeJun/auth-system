import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/register/page";

const pushMock = jest.fn();
const loginMock = jest.fn();
const registerMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    login: loginMock,
    register: registerMock,
  }),
}));

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("Auth pages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("LoginPage", () => {
    it("renders login page with title and description", () => {
      render(<LoginPage />);

      expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
      expect(
        screen.getByText("Enter your credentials to access your account.")
      ).toBeInTheDocument();
    });

    it("renders login form", () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it("renders link to register page", () => {
      render(<LoginPage />);

      const registerLink = screen.getByText("Create one");
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute("href", "/register");
    });

    it("renders forgot password link", () => {
      render(<LoginPage />);

      const forgotPasswordLink = screen.getByText("Forgot password?");
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute("href", "/forgot-password");
    });
  });

  describe("RegisterPage", () => {
    it("renders register page with title and description", () => {
      render(<RegisterPage />);

      expect(screen.getByRole("heading", { name: "Create account" })).toBeInTheDocument();
      expect(
        screen.getByText("Register with a strong password and verify your email.")
      ).toBeInTheDocument();
    });

    it("renders register form", () => {
      render(<RegisterPage />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create account/i })
      ).toBeInTheDocument();
    });

    it("renders link to login page", () => {
      render(<RegisterPage />);

      const loginLink = screen.getByText("Sign in");
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute("href", "/login");
    });
  });
});
