import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import VerifyEmailPage from "@/app/(auth)/verify-email/page";

const verifyEmailMock = jest.fn();
const handleApiResponseMock = jest.fn();
const toastSuccessMock = jest.fn();

let tokenFromQuery = "";
let emailFromQuery = "";

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === "token") return tokenFromQuery;
      if (key === "email") return emailFromQuery;
      return null;
    },
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
    verifyEmail: (...args: unknown[]) => verifyEmailMock(...args),
  },
  handleApiResponse: (...args: unknown[]) => handleApiResponseMock(...args),
}));

jest.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tokenFromQuery = "";
    emailFromQuery = "";
  });

  it("renders page with generic description when no email provided", () => {
    render(<VerifyEmailPage />);

    expect(screen.getByText("Verify your email")).toBeInTheDocument();
    expect(
      screen.getByText("Check your inbox and click the verification link.")
    ).toBeInTheDocument();
  });

  it("renders page with email in description when email provided", () => {
    emailFromQuery = "test@example.com";

    render(<VerifyEmailPage />);

    expect(
      screen.getByText(/A verification link was sent to test@example\.com/i)
    ).toBeInTheDocument();
  });

  it("shows instruction message when no token provided", () => {
    render(<VerifyEmailPage />);

    expect(
      screen.getByText(
        /Open this page using the verification link from your email/i
      )
    ).toBeInTheDocument();
  });

  it("verifies email automatically when token is provided", async () => {
    tokenFromQuery = "verify-token-123";
    verifyEmailMock.mockResolvedValue({});
    handleApiResponseMock.mockResolvedValue({
      success: true,
      data: { message: "Email verified successfully" },
    });

    render(<VerifyEmailPage />);

    expect(screen.getByText(/Verifying your email/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(verifyEmailMock).toHaveBeenCalledWith("verify-token-123");
      expect(toastSuccessMock).toHaveBeenCalledWith("Email verified");
    });

    expect(
      screen.getByText("Email verified successfully")
    ).toBeInTheDocument();
  });

  it("shows error message when verification fails", async () => {
    tokenFromQuery = "invalid-token";
    verifyEmailMock.mockResolvedValue({});
    handleApiResponseMock.mockResolvedValue({
      success: false,
      error: { message: "Invalid or expired token" },
    });

    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(verifyEmailMock).toHaveBeenCalledWith("invalid-token");
    });

    expect(screen.getByText("Invalid or expired token")).toBeInTheDocument();
  });

  it("renders links to login and register", () => {
    render(<VerifyEmailPage />);

    const loginLink = screen.getByText("Go to sign in");
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");

    const registerLink = screen.getByText("Back to register");
    expect(registerLink).toBeInTheDocument();
    expect(registerLink).toHaveAttribute("href", "/register");
  });

  it("does not verify when token changes to empty", async () => {
    tokenFromQuery = "token-123";
    verifyEmailMock.mockResolvedValue({});
    handleApiResponseMock.mockResolvedValue({
      success: true,
      data: { message: "Verified" },
    });

    const { rerender } = render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(verifyEmailMock).toHaveBeenCalledTimes(1);
    });

    tokenFromQuery = "";
    rerender(<VerifyEmailPage />);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(verifyEmailMock).toHaveBeenCalledTimes(1);
  });
});
