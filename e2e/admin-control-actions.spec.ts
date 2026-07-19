import { expect, test, type Page } from "@playwright/test";

async function loginAdmin(page: Page) {
  const response = await page.request.post("/api/auth/dev-workspace-login", { data: { workspace: "admin" } });
  expect(response.ok(), await response.text()).toBeTruthy();
  const credentials = (await response.json()) as { email: string; password: string };
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.locator("#password").fill(credentials.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/dashboard/admin", { timeout: 60_000, waitUntil: "commit" });
}

type ControlItem = {
  id: string;
  tone: "positive" | "warning" | "danger";
  controlAction: { status: string; note: string | null } | null;
};

test("admin : une anomalie peut être prise en charge avec une trace persistée", async ({ page }) => {
  await loginAdmin(page);
  const initialResponse = await page.request.get("/api/admin/control-tower");
  expect(initialResponse.ok(), await initialResponse.text()).toBeTruthy();
  const payload = (await initialResponse.json()) as {
    health: { totalSourceCount: number };
    onboarding: ControlItem[];
    missions: ControlItem[];
    messages: ControlItem[];
  };
  expect(payload.health.totalSourceCount).toBe(12);

  const collections = [
    ["onboarding", payload.onboarding],
    ["mission", payload.missions],
    ["message", payload.messages],
  ] as const;
  const target = collections
    .flatMap(([targetType, items]) => items.map((item) => ({ targetType, item })))
    .find(({ item }) => item.tone !== "positive");
  expect(target, "Une anomalie connectée est nécessaire pour valider sa prise en charge.").toBeTruthy();
  if (!target) return;

  const note = "Validation E2E automatique du centre de santé";
  const actionResponse = await page.request.post("/api/admin/control-tower", {
    data: { targetType: target.targetType, targetId: target.item.id, status: "acknowledged", note },
  });
  expect(actionResponse.status(), await actionResponse.text()).toBe(201);

  const refreshed = await page.request.get("/api/admin/control-tower");
  expect(refreshed.ok(), await refreshed.text()).toBeTruthy();
  const refreshedPayload = (await refreshed.json()) as typeof payload;
  const refreshedItem = refreshedPayload[
    target.targetType === "onboarding" ? "onboarding" : target.targetType === "mission" ? "missions" : "messages"
  ].find((item) => item.id === target.item.id);
  expect(refreshedItem?.controlAction).toMatchObject({ status: "acknowledged", note });

  const tab = target.targetType === "onboarding" ? "inscriptions" : target.targetType === "mission" ? "missions" : "messages";
  await page.goto("/dashboard/admin/controle?tab=" + tab);
  await expect(page.getByRole("button", { name: "Prendre en charge" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Transmettre au responsable" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Clôturer le suivi" }).first()).toBeVisible();
});
