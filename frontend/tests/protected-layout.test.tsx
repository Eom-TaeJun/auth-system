import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import ProtectedLayout from "@/app/(protected)/layout";

const pushMock = jest.fn();
const replaceMock = jest.fn();
const useAuthMock = jest.fn();
const usePathnameMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
  usePathname: () => usePathnameMock(),
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a className={className} href={href}>
      {children}
    </a>
  ),
}));

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

describe("ProtectedLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePathnameMock.mockReturnValue("/dashboard");
  });

  it("shows loading state while auth check is running", () => {
    useAuthMock.mockReturnValue({
      loading: true,
      isAuthenticated: false,
      logout: jest.fn(),
      user: null,
    });

    render(
      <ProtectedLayout>
        <div>protected content</div>
      </ProtectedLayout>
    );

    expect(screen.getByText("Checking session...")).toBeInTheDocument();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("redirects to login when unauthenticated", async () => {
    useAuthMock.mockReturnValue({
      loading: false,
      isAuthenticated: false,
      logout: jest.fn(),
      user: null,
    });

    render(
      <ProtectedLayout>
        <div>protected content</div>
      </ProtectedLayout>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });

  it("renders content and supports logout when authenticated", async () => {
    const logoutMock = jest.fn().mockResolvedValue(undefined);
    useAuthMock.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      logout: logoutMock,
      user: { email: "user@example.com", email_verified: true, id: "user-1" },
    });
    const user = userEvent.setup();

    render(
      <ProtectedLayout>
        <div>protected content</div>
      </ProtectedLayout>
    );

    expect(screen.getByText("protected content")).toBeInTheDocument();
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard"
    );

    await act(async () => {
      await user.click(screen.getByRole("button", { name: "Logout" }));
    });

    expect(logoutMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/login");
  });
});
