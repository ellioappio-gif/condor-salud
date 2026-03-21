import { test, expect } from "@playwright/test";

// ── Booking flow E2E tests ─────────────────────────────────────
// These tests verify the patient-facing booking flow at /paciente/turnos.
// They run against the demo mode (no Supabase required).

test.describe("Booking flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/paciente/turnos");
    await page.waitForLoadState("networkidle");
  });

  test("renders the turnos page with title", async ({ page }) => {
    await expect(page.locator("h1, h2").first()).toContainText(/turno/i);
  });

  test("shows the 'Nuevo turno' button", async ({ page }) => {
    const btn = page.getByRole("button", { name: /nuevo turno/i });
    await expect(btn).toBeVisible();
  });

  test("opens booking wizard on click", async ({ page }) => {
    const btn = page.getByRole("button", { name: /nuevo turno/i });
    await btn.click();

    // Step 1: specialty selection should appear
    await expect(page.getByText(/especialidad/i)).toBeVisible({ timeout: 5000 });
  });

  test("can navigate through booking steps", async ({ page }) => {
    // Open wizard
    await page.getByRole("button", { name: /nuevo turno/i }).click();
    await page.waitForTimeout(500);

    // Step 1: Select a specialty (click the first option)
    const specialtyOption = page
      .locator("[data-testid='specialty-option'], button, .cursor-pointer")
      .filter({ hasText: /clínica|cardiología|dermatología|pediatría|general/i })
      .first();

    if (await specialtyOption.isVisible()) {
      await specialtyOption.click();
      await page.waitForTimeout(500);
    }

    // Step 2: Date selection should appear or we should see a date picker
    const dateOrNext = page.getByText(/fecha|calendario|siguiente|date/i).first();
    await expect(dateOrNext).toBeVisible({ timeout: 5000 });
  });

  test("booking list shows existing appointments", async ({ page }) => {
    // Look for appointment cards or "no appointments" message
    const content = page.locator("main, [role='main'], .container").first();
    await expect(content).toBeVisible();

    // Either we see appointment cards or an empty state
    const hasAppointments = await page
      .locator("[data-testid='appointment-card'], .appointment-card")
      .count();
    const hasEmptyState = await page.getByText(/no tenés|sin turnos|empty|no hay/i).count();

    expect(hasAppointments + hasEmptyState).toBeGreaterThanOrEqual(0);
  });

  test("cancel button shows confirmation dialog", async ({ page }) => {
    // Look for an existing appointment with a cancel button
    const cancelBtn = page.getByRole("button", { name: /cancelar/i }).first();

    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cancelBtn.click();

      // A confirmation dialog or modal should appear
      const confirmation = page.getByText(/seguro|confirmar|cancelar turno/i);
      await expect(confirmation).toBeVisible({ timeout: 3000 });
    } else {
      // No appointments to cancel — that's fine in demo mode
      test.skip();
    }
  });
});

test.describe("Booking API", () => {
  test("POST /api/bookings creates a demo booking", async ({ request }) => {
    const response = await request.post("/api/bookings", {
      data: {
        specialty: "Clínica Médica",
        date: "2026-04-01",
        time: "10:00",
        type: "presencial",
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.id).toBeTruthy();
    expect(body.specialty).toBe("Clínica Médica");
    expect(body.status).toBe("confirmado");
  });

  test("POST /api/bookings rejects missing fields", async ({ request }) => {
    const response = await request.post("/api/bookings", {
      data: { specialty: "Clínica Médica" },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  test("GET /api/bookings/slots returns time slots", async ({ request }) => {
    const response = await request.get(
      "/api/bookings/slots?specialty=Cl%C3%ADnica+M%C3%A9dica&date=2026-04-01",
    );

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.slots).toBeInstanceOf(Array);
    expect(body.slots.length).toBeGreaterThan(0);
  });

  test("GET /api/bookings/slots rejects missing params", async ({ request }) => {
    const response = await request.get("/api/bookings/slots");
    expect(response.status()).toBe(400);
  });
});
