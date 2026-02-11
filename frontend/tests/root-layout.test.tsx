import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

// Mock the AuthProvider to avoid real API calls during init
jest.mock("@/hooks/useAuth", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
  useAuth: () => ({
    user: null,
    loading: false,
    isAuthenticated: false,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
  }),
}));

jest.mock("sonner", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

// Mock next/font/google to avoid font loading
jest.mock("next/font/google", () => ({
  Inter: () => ({ className: "mock-inter" }),
}));

// Import after mocks
import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders children within the layout structure", () => {
    // RootLayout renders <html> and <body>, so we need to handle that
    // We'll just test the component renders without errors
    const { container } = render(
      <RootLayout>
        <div data-testid="page-content">Page content</div>
      </RootLayout>
    );

    expect(screen.getByTestId("page-content")).toBeInTheDocument();
  });

  it("wraps children in AuthProvider", () => {
    render(
      <RootLayout>
        <div>child</div>
      </RootLayout>
    );

    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
  });

  it("includes the Toaster component", () => {
    render(
      <RootLayout>
        <div>child</div>
      </RootLayout>
    );

    expect(screen.getByTestId("toaster")).toBeInTheDocument();
  });

  it("renders the header with Auth System title", () => {
    render(
      <RootLayout>
        <div>child</div>
      </RootLayout>
    );

    expect(screen.getByText("Auth System")).toBeInTheDocument();
  });

  it("renders the footer", () => {
    render(
      <RootLayout>
        <div>child</div>
      </RootLayout>
    );

    expect(
      screen.getByText(/built with next\.js 14 & fastify/i)
    ).toBeInTheDocument();
  });
});
