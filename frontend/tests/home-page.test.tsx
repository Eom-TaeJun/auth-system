import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import Home from "@/app/page";

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

jest.mock("lucide-react", () => ({
  ShieldCheck: () => <svg data-testid="shield-check-icon" />,
  Lock: () => <svg data-testid="lock-icon" />,
  UserCheck: () => <svg data-testid="user-check-icon" />,
}));

describe("Home page", () => {
  it("renders the hero section with heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /secure authentication system/i })
    ).toBeInTheDocument();
  });

  it("renders sign in and create account links", () => {
    render(<Home />);

    const signInLink = screen.getByRole("link", { name: /sign in/i });
    expect(signInLink).toHaveAttribute("href", "/login");

    const createAccountLink = screen.getByRole("link", {
      name: /create account/i,
    });
    expect(createAccountLink).toHaveAttribute("href", "/register");
  });

  it("renders feature cards", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /secure by design/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /modern stack/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /type-safe/i })
    ).toBeInTheDocument();
  });

  it("renders technology stack section", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /technology stack/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Next.js 14")).toBeInTheDocument();
    expect(screen.getByText("Fastify")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
  });
});
