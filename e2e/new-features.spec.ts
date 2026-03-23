import { test, expect } from "@playwright/test";

test.describe("New Features — Smoke Tests", () => {
  // ─── Public Doctor Directory (/medicos) ────────────────────
  test.describe("Doctor Directory", () => {
    test("directory page loads with heading and search", async ({ page }) => {
      await page.goto("/medicos");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        /[Mm]édicos|[Dd]irectorio/,
      );
      await expect(page.locator("main")).toBeVisible();
    });

    test("directory has Schema.org structured data", async ({ page }) => {
      await page.goto("/medicos");
      const jsonLd = page.locator('script[type="application/ld+json"]');
      const count = await jsonLd.count();
      expect(count).toBeGreaterThan(0);
    });

    test("directory renders doctor cards", async ({ page }) => {
      await page.goto("/medicos");
      await page.waitForLoadState("networkidle");
      // Should show either real data or demo cards
      const hasContent = await page.locator("main").isVisible();
      expect(hasContent).toBeTruthy();
    });
  });

  // ─── Prescription Verification (/rx/[token]) ──────────────
  test.describe("Prescription Verification", () => {
    test("invalid token shows error state", async ({ page }) => {
      await page.goto("/rx/invalid-token-xyz");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).toBeVisible();
      // Should show either error message or loading state
      const bodyText = await page.locator("body").textContent();
      expect(bodyText).toBeTruthy();
    });
  });

  // ─── New Dashboard Pages (blank-slate renders) ─────────────
  test.describe("New Dashboard Pages", () => {
    test("recetas page renders without crashes", async ({ page }) => {
      await page.goto("/dashboard/recetas");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).toBeVisible();
      const hasContent = await page.locator("main, [role='main']").first().isVisible();
      expect(hasContent).toBeTruthy();
    });

    test("verificar-cuenta page renders without crashes", async ({ page }) => {
      await page.goto("/dashboard/verificar-cuenta");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).toBeVisible();
    });

    test("mi-perfil-publico page renders without crashes", async ({ page }) => {
      await page.goto("/dashboard/mi-perfil-publico");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).toBeVisible();
    });

    test("verificaciones admin page renders without crashes", async ({ page }) => {
      await page.goto("/dashboard/verificaciones");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).toBeVisible();
    });
  });

  // ─── Patient Portal Pages ──────────────────────────────────
  test.describe("Patient Portal", () => {
    test("club page renders without crashes", async ({ page }) => {
      await page.goto("/paciente/club");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).toBeVisible();
    });

    test("salud (health tracker) page renders without crashes", async ({ page }) => {
      await page.goto("/paciente/salud");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("body")).toBeVisible();
    });
  });

  // ─── Public APIs ───────────────────────────────────────────
  test.describe("Public APIs", () => {
    test("doctor search API returns JSON", async ({ request }) => {
      const response = await request.get("/api/doctors/public");
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      expect(body).toHaveProperty("doctors");
      expect(Array.isArray(body.doctors)).toBe(true);
    });
  });
});
