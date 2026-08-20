import { expect, test, type Page } from "@playwright/test";

/**
 * TinDog's current core business flow.
 *
 * These E2E tests deliberately use the seeded demo accounts instead of creating
 * a new account on every run. Production signup requires email verification,
 * which would make the core flow depend on an external email delivery step.
 *
 * Required demo accounts:
 *   maya@demo.tindog.app / Demo1234!  -> shelter_admin
 *   alex@demo.tindog.app / Demo1234!  -> adopter
 *
 * The tests work with the current Hebrew-first UI by forcing English only for
 * the browser test session. Selectors rely mainly on ids, aria labels and
 * semantic roles rather than translated visible copy.
 */

const runId = Date.now();

const shelter = {
  email: "maya@demo.tindog.app",
  password: "Demo1234!",
};

const adopter = {
  email: "alex@demo.tindog.app",
  password: "Demo1234!",
};

const dogName = `E2E-Bolt-${runId}`;
const city = `E2ECity${runId}`;

async function useEnglish(page: Page) {
  // Set the locale on whichever origin Playwright is currently testing.
  await page.goto("/");
  await page.evaluate(() => {
    document.cookie =
      "tindog_locale=en; Path=/; Max-Age=3600; SameSite=Lax";
  });
}

async function login(
  page: Page,
  user: { email: string; password: string },
) {
  await page.goto("/login");
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page
    .locator('form:has(#email) button[type="submit"]')
    .click();

  await page.waitForURL(/\/(shelter|swipe|profile)(?:[/?]|$)/, {
    timeout: 15_000,
  });
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL(/\/login(?:[/?]|$)/);
}

async function completeAdopterProfile(page: Page) {
  await page.goto("/profile");

  await page.locator("#displayName").fill("Alex E2E Adopter");
  await page.locator("#city").fill(city);
  await page
    .locator("#bio")
    .fill("E2E adopter profile used to verify the complete adoption flow.");

  await page.locator("#accountMode").selectOption("adopter");
  await page.locator("#householdType").selectOption("apartment");
  await page.locator("#dogExperience").selectOption("some");
  await page.locator("#activityLevel").selectOption("medium");
  await page.locator("#preferredSize").selectOption("medium");
  await page.locator("#hasChildren").selectOption("no");
  await page.locator("#hasOtherPets").selectOption("no");

  await page
    .locator('form:has(#displayName) button[type="submit"]')
    .click();

  await expect(
    page.getByText("Profile complete. You can now open Discover."),
  ).toBeVisible({ timeout: 10_000 });

  await page.goto("/swipe");
  await expect(page).toHaveURL(/\/swipe(?:[/?]|$)/);
}

test.describe.serial("TinDog current business flow", () => {
  test.beforeEach(async ({ page }) => {
    await useEnglish(page);
  });

  test("protects private pages and routes a shelter to its dashboard", async ({
    page,
  }) => {
    await page.goto("/swipe");
    await page.waitForURL(/\/login(?:[/?]|$)/);

    await login(page, shelter);
    await expect(page).toHaveURL(/\/shelter(?:[/?]|$)/);

    // A shelter manager must not use the adopter discovery deck.
    await page.goto("/swipe");
    await expect(page).toHaveURL(/\/shelter(?:[/?]|$)/);
  });

  test("shelter publishes a dog", async ({ page }) => {
    await login(page, shelter);
    await page.goto("/dogs/new");

    await page.locator("#name").fill(dogName);
    await page.locator("#breed").fill("Border Collie");
    await page.locator("#ageYears").fill("2");
    await page.locator("#listingType").selectOption("adoption");
    await page.locator("#city").fill(city);
    await page
      .locator("#description")
      .fill("E2E test dog looking for a loving adoptive home.");

    await page
      .locator('form:has(#name) button[type="submit"]')
      .click();

    await page.waitForURL(/\/dogs(?:[/?]|$)/, { timeout: 15_000 });
    await expect(page.getByText(dogName, { exact: false })).toBeVisible();
  });

  test("adopter completes the required profile and sends interest", async ({
    page,
  }) => {
    await login(page, adopter);
    await completeAdopterProfile(page);

    const cityFilter = page.locator('input[aria-label="City"]');
    await cityFilter.fill(city);
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.getByText(dogName, { exact: false })).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: "Like" }).click();

    await expect(
      page.getByText(`Interest sent for ${dogName}`, { exact: false }),
    ).toBeVisible();

    // The next shelter-side test verifies that the request was actually persisted.
    // Do not assert that there are zero [role="alert"] elements here: the UI may
    // correctly render its success/status message as an accessible alert.
    await page.waitForTimeout(1200);
  });

  test("rejects invalid dog input on the server", async ({ page }) => {
    await login(page, shelter);
    await page.goto("/dogs/new");

    // Whitespace passes the browser's required check but must fail Zod.
    await page.locator("#name").fill("   ");
    await page.locator("#ageYears").fill("2");
    await page.locator("#city").fill(city);

    await page
      .locator('form:has(#name) button[type="submit"]')
      .click();

    await expect(page.getByText("Dog name is required")).toBeVisible();
  });

  test("shelter approves the adopter request and creates a match", async ({
    page,
  }) => {
    await login(page, shelter);
    await page.goto("/requests");

    const requestCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: dogName });

    await expect(requestCard).toBeVisible({ timeout: 10_000 });

    await requestCard
      .getByRole("button", { name: "Approve & open chat" })
      .click();

    // Verify the business result, not just the button click.
    await page.waitForTimeout(700);
    await page.goto("/matches");

    const matchCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: dogName });

    await expect(matchCard).toBeVisible({ timeout: 10_000 });
  });

  test("approved adopter and shelter can chat", async ({ page }) => {
    const greeting = `Hi! I would love to adopt ${dogName}`;
    const reply = `Great! Let's arrange a meeting for ${dogName}.`;

    await login(page, adopter);
    await page.goto("/matches");

    const adopterMatchCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: dogName });

    await expect(adopterMatchCard).toBeVisible({ timeout: 10_000 });
    await adopterMatchCard.click();
    await page.waitForURL(/\/matches\/[^/]+$/);

    await page.getByLabel("Message").fill(greeting);
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText(greeting)).toBeVisible();

    await logout(page);

    await login(page, shelter);
    await page.goto("/matches");

    const shelterMatchCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: dogName });

    await expect(shelterMatchCard).toBeVisible({ timeout: 10_000 });
    await shelterMatchCard.click();
    await page.waitForURL(/\/matches\/[^/]+$/);

    await expect(page.getByText(greeting)).toBeVisible({
      timeout: 10_000,
    });

    await page.getByLabel("Message").fill(reply);
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText(reply)).toBeVisible();
  });
});
