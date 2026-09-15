import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

async function fixtures(page: Page, context: BrowserContext) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const user = { id:"11111111-1111-4111-8111-111111111111",role:"owner",firstName:"Camille",email:"owner@example.test" };
  const token=await encode({secret:"traveler-stays-fixture-secret",salt:"authjs.session-token",token:{...user,sub:user.id},maxAge:3600});
  await context.addCookies([{name:"authjs.session-token",value:token,domain:"127.0.0.1",path:"/",httpOnly:true}]);
  const state={mode:"ready",posts:[] as string[],errors:[] as string[]};
  page.on("pageerror",error=>state.errors.push(error.message));
  await context.route("**/api/**",async route=>{
    const path=new URL(route.request().url()).pathname;
    if(route.request().method()!=="GET") state.posts.push(path);
    let json:unknown={items:[]};
    if(path==="/api/auth/session") json={user,expires:"2099-01-01T00:00:00Z"};
    else if(path==="/api/profiles/current") json=user;
    else if(path.endsWith("/document")) return route.fulfill({contentType:"text/html; charset=utf-8",body:"<h1>Document de test</h1>"});
    else if(path==="/api/quotes" || path==="/api/invoices") {
      if(state.mode==="error") return route.fulfill({status:500,json:{error:"Documents indisponibles"}});
      if(state.mode==="loading") await new Promise(resolve=>setTimeout(resolve,1800));
      json=state.mode==="empty" ? [] : Array.from({length:10},(_,i)=>path==="/api/quotes" ? {id:`quote-${i}`,quote_number:`DEV-${i}`,status:i%2 ? "accepted":"sent",valid_until:"2026-10-01"} : {id:`invoice-${i}`,invoice_number:`FAC-${i}`,status:i%2 ? "paid":"issued",due_date:"2026-09-30"});
    } else if(["/api/housing","/api/missions","/api/reviews"].includes(path)) json=[];
    await route.fulfill({json});
  });
  return state;
}

test("documents : filtres, documents et quatre formats",async({page,context})=>{
  const state=await fixtures(page,context);
  await page.goto("/dashboard/owner/documents");
  const table=page.getByRole("table");
  await expect(table.locator("tbody tr")).toHaveCount(20);
  await expect(page.getByRole("heading",{level:1})).toHaveText("Vos documents, au même endroit");
  for(const width of [1600,1366,768,390]) {
    await page.setViewportSize({width,height:1000});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.screenshot({path:`test-results/owner-documents-${width}.png`,fullPage:true});
    await page.screenshot({path:`test-results/owner-documents-top-${width}.png`});
    const firstShortcut = page.getByRole("link", { name: /Consulter mes devis/ });
    const secondShortcut = page.getByRole("link", { name: /Suivre mes factures/ });
    await firstShortcut.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(firstShortcut).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Tab");
    await expect(secondShortcut).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(firstShortcut).toBeFocused();
    await firstShortcut.blur();
    const search = page.getByRole("textbox", { name: "Rechercher un document", exact: true });
    await search.focus();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("combobox", { name: "Type de document", exact: true })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(search).toBeFocused();
    await expect(search).toHaveCSS("outline-style", "solid");
    await search.blur();
    await page.getByRole("heading", { name: "Mes documents", exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/owner-documents-body-${width}.png` });


    await page.evaluate(() => window.scrollTo(0, 0));
  }
  await expect(page.getByLabel("Indicateurs documentaires").getByRole("article")).toHaveCount(4);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await page.getByLabel("Type de document",{exact:true}).selectOption("invoice");
  await expect(table.locator("tbody tr")).toHaveCount(10);
  await page.getByLabel("Suivi des documents",{exact:true}).selectOption("pending");
  await expect(table.locator("tbody tr")).toHaveCount(5);
  await page.getByLabel("Rechercher un document",{exact:true}).fill("FAC-2");
  await expect(table.locator("tbody tr")).toHaveCount(1);
  await expect(table.getByRole("link",{name:"Imprimer / PDF"})).toHaveAttribute("href","/api/invoices/invoice-2/document?print=1");
  const popupPromise=page.waitForEvent("popup");
  await table.getByRole("link",{name:"Consulter",exact:true}).click();
  const popup=await popupPromise;
  await expect(popup.getByRole("heading")).toHaveText("Document de test");
  await popup.close();
  await page.getByLabel("Rechercher un document",{exact:true}).fill("absent");
  await expect(page.getByRole("heading",{name:"Aucun résultat pour ces filtres"})).toBeVisible();
  await page.getByRole("button",{name:"Réinitialiser",exact:true}).click();
  await expect(table.locator("tbody tr")).toHaveCount(20);
  expect(state.posts).toEqual([]); expect(state.errors).toEqual([]);
});

test("documents : chargement, erreur, reprise et vide",async({page,context})=>{
  const state=await fixtures(page,context);
  state.mode="loading";
  await page.goto("/dashboard/owner/documents");
  await expect(page.getByText("Chargement des documents…",{exact:true})).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  state.mode="error";
  await page.reload();
  await expect(page.getByRole("alert").filter({hasText:"Documents indisponibles"})).toBeVisible();
  state.mode="empty";
  await page.getByRole("button",{name:"Réessayer",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Vos documents apparaîtront ici"})).toBeVisible();
  expect(state.posts).toEqual([]); expect(state.errors).toEqual([]);
});
