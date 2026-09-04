import { expect, test } from "@playwright/test";

test("propriétaire : finalise son inscription locale et accède à son cockpit", async ({ page }) => {
  const suffix = Date.now();
  const email = `e2e-owner-${suffix}@example.test`;
  const username = `e2e-owner-${suffix}`;
  const query = new URLSearchParams({
    category: "proprietaire",
    searchTarget: "concierge",
    option: "Gestion locative",
    location: "Paris",
    firstName: "Emma",
    lastName: "Martin",
    email,
    phone: "0600000000",
    onboardingGoal: "deleguer",
    propertyType: "Appartement",
    needVolume: "1_logement",
  });

  await page.goto(`/complete-registration?${query.toString()}`);
  await expect(page.getByRole("heading", { name: "Dernière étape avant de commencer" })).toBeVisible();

  await page.getByPlaceholder("Nom d'utilisateur").fill(username);
  await page.getByPlaceholder("Mot de passe").fill("LocalE2E!2026");
  await page.getByPlaceholder("Confirmation").fill("LocalE2E!2026");
  await page.getByRole("button", { name: "Finaliser mon inscription" }).click();

  await page.waitForURL("**/dashboard/owner", { timeout: 60_000, waitUntil: "commit" });
  await expect(page.getByRole("main")).toBeVisible();

  const profileResponse = await page.request.get("/api/profiles/current");
  expect(profileResponse.status()).toBe(200);
  await expect(profileResponse).toBeOK();

  const profile = (await profileResponse.json()) as {
    email?: string;
    role?: string;
    onboarding_complete?: boolean;
  };
  expect(profile.email).toBe(email);
  expect(profile.role).toBe("owner");
  expect(profile.onboarding_complete).toBe(true);
});
