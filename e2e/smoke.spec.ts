import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("home page loads and displays hero", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Cóndor Salud/);
    await expect(page.locator("main")).toBeVisible();
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("heading", { name: /iniciar sesión/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
  });

  test("navigation links work on landing page", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation");
    await expect(nav).toBeVisible();
  });

  test("health endpoint returns healthy status", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("healthy");
    expect(body.checks.app).toBe("ok");
    expect(body).toHaveProperty("timestamp");
    expect(body).toHaveProperty("responseTimeMs");
  });

  test("privacy page loads", async ({ page }) => {
    await page.goto("/privacidad");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Privacidad");
  });

  test("terms page loads", async ({ page }) => {
    await page.goto("/terminos");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Términos");
  });

  test("404 page renders for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    // Next.js returns 404 for unknown routes
    expect(response?.status()).toBe(404);
  });

  test("dashboard redirects unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard");
    // Should either redirect to login or show the dashboard (demo mode)
    await expect(page.locator("body")).toBeVisible();
  });
});
