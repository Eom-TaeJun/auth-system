import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import AuthLayout from "@/app/(auth)/layout";

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

describe("AuthLayout", () => {
  it("renders children inside the layout", () => {
    render(
      <AuthLayout>
        <div data-testid="child-content">Login form here</div>
      </AuthLayout>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });

  it("renders the back to home link", () => {
    render(
      <AuthLayout>
        <div>child</div>
      </AuthLayout>
    );

    const backLink = screen.getByText(/back to home/i);
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/");
  });
});
