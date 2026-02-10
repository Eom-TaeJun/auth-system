import { expect, test } from "@playwright/test";

test("unauthenticated access to protected page redirects to login", async ({
  page,
}) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Sign in" })
  ).toBeVisible();
});

test("register submits and routes to verify-email page", async ({ page }) => {
  await page.route("**/api/auth/register", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        userId: "user-1",
        message: "Registration successful. Please verify your email.",
      }),
    });
  });

  await page.goto("/register");
  await page.getByLabel("Email").fill("new@example.com");
  await page.getByLabel(/^Password$/).fill("Strong123!@#");
  await page.getByLabel("Confirm Password").fill("Strong123!@#");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/verify-email\?email=new%40example\.com/);
  await expect(
    page.getByText("A verification link was sent to new@example.com.")
  ).toBeVisible();
});

test("verify-email page consumes token and shows success state", async ({
  page,
}) => {
  await page.route("**/api/auth/verify-email**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Email verified successfully",
      }),
    });
  });

  await page.goto("/verify-email?token=verify-token");

  await expect(page.getByText("Email verified successfully")).toBeVisible();
  await expect(page.getByRole("link", { name: "Go to sign in" })).toHaveAttribute(
    "href",
    "/login"
  );
});

test("login reaches dashboard and profile update persists via mocked APIs", async ({
  page,
}) => {
  let currentEmail = "user@example.com";
  let lastPatchedEmail: string | null = null;

  await page.route("**/api/auth/login", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "access-token",
        user: {
          id: "user-1",
          email: currentEmail,
          email_verified: true,
        },
      }),
    });
  });

  await page.route("**/api/users/me", async (route) => {
    const method = route.request().method();

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "user-1",
          email: currentEmail,
          email_verified: true,
        }),
      });
      return;
    }

    if (method === "PATCH") {
      const payload = route.request().postDataJSON() as { email?: string };
      currentEmail = payload.email || currentEmail;
      lastPatchedEmail = payload.email || null;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "user-1",
          email: currentEmail,
          email_verified: true,
        }),
      });
      return;
    }

    await route.fallback();
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("user@example.com");
  await page.getByLabel("Password").fill("Strong123!@#");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByText("user@example.com", { exact: true })
  ).toBeVisible();

  await page.getByRole("link", { name: "Profile" }).click();
  await expect(page).toHaveURL(/\/profile$/);

  await page.getByLabel("Email").fill("updated@example.com");
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByLabel("Email")).toHaveValue("updated@example.com");
  await expect(page.getByText("Profile updated")).toBeVisible();
  expect(lastPatchedEmail).toBe("updated@example.com");
});
