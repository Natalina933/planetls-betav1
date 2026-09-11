import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

async function fixtures(page: Page, context: BrowserContext) {
  const user = { id: "11111111-1111-4111-8111-111111111111", role: "owner", firstName: "Camille", email: "owner@example.test" };
  const token = await encode({ secret: "traveler-stays-fixture-secret", salt: "authjs.session-token", token: { ...user, sub: user.id }, maxAge: 3600 });
  await context.addCookies([{ name: "authjs.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true }]);
  const state = { mode: "ready", posts: [] as {path: string; body: unknown}[], errors: [] as string[], sent: "" };
  page.on("pageerror", error => state.errors.push(error.message));
  await context.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let json: unknown = { items: [] };
    if (path === "/api/auth/session") json = { user, expires: "2099-01-01T00:00:00Z" };
    else if (path === "/api/profiles/current") json = user;
    else if (path === "/api/messages/conversations") {
      if (state.mode === "error") return route.fulfill({status:500,json:{error:"Indisponibilité de test"}});
      if (state.mode === "loading") await new Promise(resolve => setTimeout(resolve,1800));
      json = { items: state.mode === "empty" ? [] : Array.from({length:8},(_,index) => ({
        id:`conversation-${index}`,counterpart_name:`Conciergerie ${index}`,subject:`Organisation séjour ${index}`,
        last_message_preview: "Merci pour votre retour.", last_message_at:`2026-09-${String(11-index).padStart(2,"0")}T10:00:00Z`,
        unread_count: index % 2, status: index === 7 ? "closed" : "open",source:"service_request",source_reference:`demande-${index}`,
      })),summary:{total:8,unread:4},note:null };
    } else if (path.startsWith("/api/messages/conversations/")) {
      const id = path.split("/").at(-1)!;
      if (route.request().method() === "POST") {
        state.posts.push({path,body:route.request().postDataJSON()});
        if (state.mode === "send-error") return route.fulfill({status:500,json:{error:"Envoi indisponible"}});
        state.sent = route.request().postDataJSON().body;
        return route.fulfill({status:201,json:{id:"sent"}});
      }
      if (state.mode === "detail-error") return route.fulfill({status:500,json:{error:"Échange indisponible"}});
      const index = id.split("-").at(-1);
      json = { conversation:{id,subject:`Organisation séjour ${index}`,source:"service_request",status:index === "7" ? "closed":"open"},current_user_id:user.id,
        participants:[{id:user.id,first_name:"Camille",last_name:"Martin",username:null,company_name:null},{id:"concierge",first_name:null,last_name:null,username:null,company_name:`Conciergerie ${index}`}],
        messages:[{id:"first",sender_profile_id:"concierge",body:`Instructions pour le séjour ${index}.\nNous préparons votre arrivée.`,created_at:"2026-09-10T10:00:00Z"},...(state.sent ? [{id:"sent",sender_profile_id:user.id,body:state.sent,created_at:"2026-09-11T10:00:00Z"}] : [])] };
    } else if (["/api/housing","/api/quotes","/api/missions","/api/reviews","/api/invoices"].includes(path)) json = [];
    await route.fulfill({json});
  });
  return state;
}

test("messagerie : trois colonnes, formats, recherche, tri, non-lus et contexte",async ({page,context}) => {
  const state = await fixtures(page,context);
  await page.goto("/dashboard/owner/messages");
  await expect(page.getByRole("heading",{level:1})).toHaveText("Suivi des échanges");
  const list = page.getByRole("complementary",{name:"Liste des conversations"});
  const thread = page.getByRole("region",{name:"Échange actif"});
  const details = page.getByRole("complementary",{name:"Contexte de la conversation"});
  await expect(thread).toContainText("Instructions pour le séjour 0");
  for (const width of [1600,1366,768,390]) {
    await page.setViewportSize({width,height:1000});
    await page.evaluate(() => window.scrollTo(0,0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
    const firstRow = list.locator('button[aria-pressed]').filter({hasText:"Conciergerie"}).first();
    expect(await firstRow.evaluate(element => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
    if(width >=1366) {
      const boxes=await Promise.all([list.boundingBox(),thread.boundingBox(),details.boundingBox()]);
      expect(Math.abs(boxes[0]!.y-boxes[1]!.y)).toBeLessThan(2);
      expect(boxes[2]!.x).toBeGreaterThan(boxes[1]!.x);
    }
    await page.screenshot({path:`test-results/owner-messages-${width}.png`,fullPage:true});
  }
  await list.getByLabel("Trier les conversations").selectOption("oldest");
  await expect(list.locator('button[aria-pressed]').filter({hasText:"Conciergerie"}).first()).toContainText("Conciergerie 7");
  await page.getByRole("button",{name:/Traiter les nouveaux messages/}).click();
  await expect(list.locator('button[aria-pressed]').filter({hasText:"Conciergerie"})).toHaveCount(4);
  await list.getByLabel("Rechercher une conversation propriétaire").fill("Conciergerie 3");
  await list.getByRole("button",{name:/Conciergerie 3/}).click();
  await expect(thread).toBeFocused();
  await expect(thread).toContainText("Instructions pour le séjour 3");
  await expect(details).toContainText("demande-3");
  await expect(list.getByRole("link",{name:"Nouveau message"})).toHaveAttribute("href","/dashboard/owner/concierges");
  expect(state.posts).toEqual([]);
  expect(state.errors).toEqual([]);
});

test("messagerie : cible URL, envoi conservé et erreur sans perte du brouillon",async ({page,context}) => {
  const state = await fixtures(page,context);
  await page.goto("/dashboard/owner/messages?conversation=conversation-2");
  const thread=page.getByRole("region",{name:"Échange actif"});
  await expect(thread).toContainText("Instructions pour le séjour 2");
  await expect(thread.getByRole("button",{name:"Envoyer",exact:true})).toBeDisabled();
  await thread.getByRole("textbox").fill("  Bonjour, arrivée confirmée.  ");
  await thread.getByRole("button",{name:"Envoyer",exact:true}).click();
  await expect(thread).toContainText("Bonjour, arrivée confirmée.");
  expect(state.posts).toEqual([{path:"/api/messages/conversations/conversation-2",body:{body:"Bonjour, arrivée confirmée."}}]);
  await expect(thread.getByRole("textbox")).toHaveValue("");
  state.mode="send-error";
  await thread.getByRole("textbox").fill("Mon second message");
  await thread.getByRole("button",{name:"Envoyer",exact:true}).click();
  await expect(page.getByRole("alert").filter({hasText:"Envoi indisponible"})).toBeVisible();
  await expect(thread.getByRole("textbox")).toHaveValue("Mon second message");
  expect(state.errors).toEqual([]);
});

test("messagerie : chargement, erreur, reprise et vide",async ({page,context}) => {
  const state=await fixtures(page,context);
  state.mode="loading";
  await page.goto("/dashboard/owner/messages");
  await expect(page.getByText("Chargement des conversations...",{exact:true})).toBeVisible();
  await expect(page.getByRole("region",{name:"Échange actif"})).toContainText("Instructions pour le séjour 0");
  state.mode="error";
  await page.reload();
  await expect(page.getByRole("alert").filter({hasText:"Indisponibilité de test"})).toBeVisible();
  state.mode="empty";
  await page.getByRole("button",{name:"Réessayer",exact:true}).click();
  await expect(page.getByText("Aucune conversation ne correspond à cette vue.")).toBeVisible();
  await expect(page.getByRole("region",{name:"Échange actif"})).toContainText("Sélectionnez une conversation");
  expect(state.posts).toEqual([]);
  expect(state.errors).toEqual([]);
});
