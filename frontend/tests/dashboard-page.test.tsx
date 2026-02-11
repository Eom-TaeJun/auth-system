import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/(protected)/dashboard/page";
import type { User } from "@/lib/types";

const mockUser: User = {
  id: "user-123",
  email: "test@example.com",
  email_verified: true,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

const useAuthMock = jest.fn();

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => useAuthMock(),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders dashboard with user email", () => {
    useAuthMock.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
    expect(screen.getByText("This is your protected dashboard.")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("shows verified status as Yes when user is verified", () => {
    useAuthMock.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("shows verified status as No when user is not verified", () => {
    useAuthMock.mockReturnValue({
      user: { ...mockUser, email_verified: false },
      loading: false,
      isAuthenticated: true,
    });

    render(<DashboardPage />);

    expect(screen.getByText("No")).toBeInTheDocument();
  });

  it("renders next actions card", () => {
    useAuthMock.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Next actions")).toBeInTheDocument();
    expect(screen.getByText(/Complete profile editing flow/i)).toBeInTheDocument();
    expect(screen.getByText(/Add token refresh UX handling/i)).toBeInTheDocument();
    expect(screen.getByText(/Add integration and E2E tests/i)).toBeInTheDocument();
  });

  it("handles null user gracefully", () => {
    useAuthMock.mockReturnValue({
      user: null,
      loading: false,
      isAuthenticated: false,
    });

    render(<DashboardPage />);

    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("renders two cards in grid layout", () => {
    useAuthMock.mockReturnValue({
      user: mockUser,
      loading: false,
      isAuthenticated: true,
    });

    const { container } = render(<DashboardPage />);

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
    expect(gridContainer?.classList.contains('md:grid-cols-2')).toBe(true);
  });
});
