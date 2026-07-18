import { expect, type APIRequestContext, type Page } from "@playwright/test";

export type Workspace = "owner" | "concierge" | "provider";

type WorkspaceCredentials = {
  email: string;
  password: string;
  href: string;
};

export async function prepareWorkspace(
  request: APIRequestContext,
  workspace: Workspace,
): Promise<WorkspaceCredentials> {
  const response = await request.post("/api/auth/dev-workspace-login", {
    data: { workspace },
  });

  expect(
    response.ok(),
    `Impossible de préparer l'espace ${workspace}. Vérifier les secrets Supabase et WORKSPACE_QUICK_LOGIN_ENABLED.`,
  ).toBeTruthy();

  const payload = (await response.json()) as Partial<WorkspaceCredentials>;
  expect(payload.email).toBeTruthy();
  expect(payload.password).toBeTruthy();
  expect(payload.href).toBe(`/dashboard/${workspace}`);

  return payload as WorkspaceCredentials;
}

export async function loginWorkspace(
  page: Page,
  request: APIRequestContext,
  workspace: Workspace,
) {
  const credentials = await prepareWorkspace(request, workspace);

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) await page.context().clearCookies();
    await page.goto("/login");
    await page.getByLabel("Email").fill(credentials.email);
    await page.locator("#password").fill(credentials.password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    try {
      await page.waitForURL(`**${credentials.href}`, { timeout: 60_000, waitUntil: "commit" });
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError;

  await expect(page).toHaveURL(new RegExp(`${credentials.href.replaceAll("/", "\\/")}/?$`));
  return credentials;
}

export async function expectApiAvailable(page: Page, url: string) {
  const response = await page.request.get(url, {
    headers: { "Cache-Control": "no-store" },
  });
  const body = await response.text();

  expect(response.status(), `${url} a répondu ${response.status()}: ${body.slice(0, 300)}`).toBeLessThan(500);
  expect(response.status(), `${url} refuse la session E2E`).not.toBe(401);
  expect(response.status(), `${url} refuse le rôle E2E`).not.toBe(403);
}