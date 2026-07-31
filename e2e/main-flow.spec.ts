import { expect, test, type Page } from "@playwright/test";

// The core business flow, end to end, with two real users:
//   1. Owner signs up and publishes a dog for adoption.
//   2. Adopter signs up, finds the dog in the swipe deck and likes it.
//   3. Owner sees the request and approves it.
//   4. Both sides chat through the realtime chat.
//
// Requires a running Supabase (e.g. `npx supabase start`) with the
// migration applied and email confirmation disabled.

const runId = Date.now();
const owner = {
  email: `owner-${runId}@e2e.tindog.app`,
  password: "E2ePassword1!",
  name: "E2E Owner",
};
const adopter = {
  email: `adopter-${runId}@e2e.tindog.app`,
  password: "E2ePassword1!",
  name: "E2E Adopter",
};
const dogName = `Bolt-${runId}`;
const city = `E2ECity${runId}`;

async function signup(
  page: Page,
  user: { email: string; password: string; name: string }
) {
  await page.goto("/signup");
  await page.getByLabel("Your name").fill(user.name);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign up" }).click();
  await page.waitForURL("**/swipe");
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL("**/login");
}

async function login(
  page: Page,
  user: { email: string; password: string }
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/swipe");
}

test.describe.serial("main business flow", () => {
  test("owner signs up and publishes a dog", async ({ page }) => {
    await signup(page, owner);

    await page.goto("/dogs/new");
    await page.getByLabel("Name").fill(dogName);
    await page.getByLabel("Breed").fill("Border Collie");
    await page.getByLabel("Age (years)").fill("2");
    await page.getByLabel("Looking for").selectOption("adoption");
    await page.getByLabel("City").fill(city);
    await page
      .getByLabel("Story")
      .fill("E2E test dog looking for a loving home.");
    await page.getByRole("button", { name: "Create dog profile" }).click();

    await page.waitForURL("**/dogs");
    await expect(page.getByText(dogName)).toBeVisible();

    await logout(page);
  });

  test("adopter finds the dog and swipes right", async ({ page }) => {
    await signup(page, adopter);

    // Filter by the unique test city so the deck shows our dog on top.
    await page.getByLabel("City").fill(city);
    await page.getByRole("button", { name: "Search" }).click();

    await expect(page.getByText(dogName)).toBeVisible();
    await page.getByRole("button", { name: "Like" }).click();

    // Deck should now be empty for this filter.
    await expect(page.getByText("No more dogs 🐾")).toBeVisible();

    await logout(page);
  });

  test("rejects invalid dog input", async ({ page }) => {
    await login(page, owner);

    await page.goto("/dogs/new");
    // Whitespace-only name passes the browser's native `required`
    // check but must be rejected by the server-side Zod validation.
    await page.getByLabel("Name").fill("   ");
    await page.getByLabel("Age (years)").fill("2");
    await page.getByLabel("City").fill(city);
    await page.getByRole("button", { name: "Create dog profile" }).click();

    await expect(page.getByText("Dog name is required")).toBeVisible();
    await logout(page);
  });

  test("owner approves the request", async ({ page }) => {
    await login(page, owner);

    await page.goto("/requests");
    await expect(page.getByText(adopter.name)).toBeVisible();
    await page.getByRole("button", { name: /Approve/ }).click();

    // Request disappears from the pending list...
    await expect(page.getByText("No pending requests")).toBeVisible();

    // ...and shows up as a match.
    await page.goto("/matches");
    await expect(page.getByText(adopter.name)).toBeVisible();

    await logout(page);
  });

  test("both sides can chat", async ({ page }) => {
    await login(page, adopter);

    await page.goto("/matches");
    await page.getByText(owner.name).click();

    const greeting = `Hi! I would love to adopt ${dogName}`;
    await page.getByLabel("Message").fill(greeting);
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText(greeting)).toBeVisible();

    await logout(page);

    // The owner sees the message and replies.
    await login(page, owner);
    await page.goto("/matches");
    await page.getByText(adopter.name).click();

    await expect(page.getByText(greeting)).toBeVisible();

    const reply = "Amazing! When can you meet?";
    await page.getByLabel("Message").fill(reply);
    await page.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText(reply)).toBeVisible();
  });

  test("unauthenticated users are redirected to login", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/swipe");
    await page.waitForURL("**/login?next=%2Fswipe");
    await context.close();
  });
});
