import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

const pushMock = jest.fn();
const loginMock = jest.fn();
const registerMock = jest.fn();
const toastSuccessMock = jest.fn();
const toastErrorMock = jest.fn();

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
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

describe("Auth forms", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits login form and redirects to dashboard", async () => {
    loginMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<LoginForm />);

    await act(async () => {
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "Strong123!");
      await user.click(screen.getByRole("button", { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Strong123!",
      });
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
      expect(toastSuccessMock).toHaveBeenCalled();
    });
  });

  it("shows login error toast when login fails", async () => {
    loginMock.mockRejectedValue(new Error("Invalid credentials"));
    const user = userEvent.setup();

    render(<LoginForm />);

    await act(async () => {
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.type(screen.getByLabelText(/password/i), "Strong123!");
      await user.click(screen.getByRole("button", { name: /sign in/i }));
    });

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("Invalid credentials");
    });
  });

  it("submits register form and routes to verify-email page", async () => {
    registerMock.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<RegisterForm />);

    await act(async () => {
      await user.type(screen.getByLabelText(/email/i), "new@example.com");
      await user.type(screen.getByLabelText(/^password$/i), "Strong123!");
      await user.type(
        screen.getByLabelText(/confirm password/i),
        "Strong123!"
      );
      await user.click(screen.getByRole("button", { name: /create account/i }));
    });

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "Strong123!",
      });
      expect(pushMock).toHaveBeenCalledWith(
        "/verify-email?email=new%40example.com"
      );
      expect(toastSuccessMock).toHaveBeenCalled();
    });
  });
});
