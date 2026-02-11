import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import ForgotPasswordPage from "@/app/(auth)/forgot-password/page";
import ResetPasswordPage from "@/app/(auth)/reset-password/page";

const pushMock = jest.fn();
const forgotPasswordMock = jest.fn();
const resetPasswordMock = jest.fn();
const handleApiResponseMock = jest.fn();
const toastSuccessMock = jest.fn();
const toastErrorMock = jest.fn();

let tokenFromQuery = "reset-token";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "token" ? tokenFromQuery : null),
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

jest.mock("@/lib/api", () => ({
  authApi: {
    forgotPassword: (...args: unknown[]) => forgotPasswordMock(...args),
    resetPassword: (...args: unknown[]) => resetPasswordMock(...args),
  },
  handleApiResponse: (...args: unknown[]) => handleApiResponseMock(...args),
}));

jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

describe("Password recovery pages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenFromQuery = "reset-token";
    forgotPasswordMock.mockResolvedValue({});
    resetPasswordMock.mockResolvedValue({});
  });

  it("submits forgot-password form and renders submitted state", async () => {
    handleApiResponseMock.mockResolvedValue({
      success: true,
      data: {
        message: "If the account exists, a reset link has been sent.",
      },
    });
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);

    await act(async () => {
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.click(screen.getByRole("button", { name: /send reset link/i }));
    });

    await waitFor(() => {
      expect(forgotPasswordMock).toHaveBeenCalledWith({
        email: "user@example.com",
      });
      expect(toastSuccessMock).toHaveBeenCalledWith(
        "If the account exists, a reset link has been sent"
      );
    });

    expect(
      screen.getByText(/Check your inbox for the reset link/i)
    ).toBeInTheDocument();
  });

  it("shows forgot-password error toast on API failure", async () => {
    handleApiResponseMock.mockResolvedValue({
      success: false,
      error: { message: "Failed to request reset email" },
    });
    const user = userEvent.setup();

    render(<ForgotPasswordPage />);

    await act(async () => {
      await user.type(screen.getByLabelText(/email/i), "user@example.com");
      await user.click(screen.getByRole("button", { name: /send reset link/i }));
    });

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("Failed to request reset email");
    });
  });

  it("submits reset-password form and redirects to login on success", async () => {
    handleApiResponseMock.mockResolvedValue({
      success: true,
      data: { message: "Password reset successfully" },
    });
    const user = userEvent.setup();

    render(<ResetPasswordPage />);

    await act(async () => {
      await user.type(screen.getByLabelText(/^new password$/i), "Strong123!");
      await user.type(
        screen.getByLabelText(/confirm new password/i),
        "Strong123!"
      );
      await user.click(screen.getByRole("button", { name: /update password/i }));
    });

    await waitFor(() => {
      expect(resetPasswordMock).toHaveBeenCalledWith({
        token: "reset-token",
        password: "Strong123!",
      });
      expect(toastSuccessMock).toHaveBeenCalledWith("Password updated successfully");
      expect(pushMock).toHaveBeenCalledWith("/login");
    });
  });

  it("keeps reset-password submit disabled when token is missing", () => {
    tokenFromQuery = "";

    render(<ResetPasswordPage />);

    expect(
      screen.getByText(/Missing reset token\. Open this page from the reset link/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update password/i })
    ).toBeDisabled();
  });
});
