import { expect, test } from "@playwright/test";
import { loginWorkspace } from "./helpers/workspace";

type TeamMember = {
  id: string;
  name: string;
  role: string;
  availability: string;
};

type TeamPayload = {
  items?: TeamMember[];
  schema_ready?: boolean;
};

test("concierge : création, disponibilité et désactivation d'un membre persistent", async ({ browser, request }) => {
  const conciergeContext = await browser.newContext();
  const conciergePage = await conciergeContext.newPage();
  await loginWorkspace(conciergePage, request, "concierge");
  const origin = new URL(conciergePage.url()).origin;

  const initialResponse = await conciergePage.request.get("/api/concierge/team");
  expect(initialResponse.ok(), await initialResponse.text()).toBeTruthy();
  const initial = (await initialResponse.json()) as TeamPayload;
  expect(initial.schema_ready, "La migration concierge_team_members doit être appliquée.").toBe(true);

  const marker = "[E2E] Équipe " + Date.now();
  const createResponse = await conciergePage.request.post("/api/concierge/team", {
    headers: { Origin: origin },
    data: {
      name: marker,
      role: "employee",
      availability: "available",
      dailyCapacityMinutes: 420,
      skills: ["Ménage", "Contrôle"],
    },
  });
  expect(createResponse.status(), await createResponse.text()).toBe(201);
  const created = (await createResponse.json()) as TeamMember;
  expect(created).toMatchObject({ name: marker, role: "employee", availability: "available" });

  const updateResponse = await conciergePage.request.patch("/api/concierge/team/" + created.id, {
    headers: { Origin: origin },
    data: { availability: "busy", title: "Référente terrain", dailyCapacityMinutes: 360 },
  });
  expect(updateResponse.ok(), await updateResponse.text()).toBeTruthy();

  const updatedResponse = await conciergePage.request.get("/api/concierge/team");
  expect(updatedResponse.ok(), await updatedResponse.text()).toBeTruthy();
  const updated = (await updatedResponse.json()) as TeamPayload;
  expect(updated.items?.find((member) => member.id === created.id)).toMatchObject({
    name: marker,
    availability: "busy",
  });

  await conciergePage.goto("/dashboard/concierge/equipe");
  await expect(conciergePage.getByText("Mode demonstration")).toHaveCount(0);
  await expect(conciergePage.getByRole("heading", { name: marker })).toBeVisible();
  await expect(conciergePage.getByLabel("Disponibilite de " + marker)).toHaveValue("busy");

  const deleteResponse = await conciergePage.request.delete("/api/concierge/team/" + created.id, {
    headers: { Origin: origin },
  });
  expect(deleteResponse.ok(), await deleteResponse.text()).toBeTruthy();
  const finalResponse = await conciergePage.request.get("/api/concierge/team");
  const finalPayload = (await finalResponse.json()) as TeamPayload;
  expect(finalPayload.items?.some((member) => member.id === created.id)).toBe(false);

  const ownerContext = await browser.newContext();
  const ownerPage = await ownerContext.newPage();
  await loginWorkspace(ownerPage, request, "owner");
  const forbidden = await ownerPage.request.get("/api/concierge/team");
  expect(forbidden.status()).toBe(403);

  await ownerContext.close();
  await conciergeContext.close();
});
