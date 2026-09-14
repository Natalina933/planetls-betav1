import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";
import { readFile } from "node:fs/promises";

async function fixtures(page:Page,context:BrowserContext) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const user={id:"11111111-1111-4111-8111-111111111111",role:"owner",firstName:"Camille",email:"owner@example.test"};
  const token=await encode({secret:"traveler-stays-fixture-secret",salt:"authjs.session-token",token:{...user,sub:user.id},maxAge:3600});
  await context.addCookies([{name:"authjs.session-token",value:token,domain:"127.0.0.1",path:"/",httpOnly:true}]);
  const state={mode:"ready",calls:[] as {path:string;body:unknown}[],errors:[] as string[],statuses:{} as Record<string,string>};
  page.on("pageerror",error=>state.errors.push(error.message));
  await context.route("**/api/**",async route=>{
    const path=new URL(route.request().url()).pathname;
    let json:unknown={items:[]};
    if(path==="/api/auth/session") json={user,expires:"2099-01-01T00:00:00Z"};
    else if(path==="/api/profiles/current") json=user;
    else if(path==="/api/quotes") {
      if(state.mode==="error") return route.fulfill({status:500,json:{error:"Devis indisponibles"}});
      if(state.mode==="loading") await new Promise(resolve=>setTimeout(resolve,1800));
      json=state.mode==="empty" ? [] : Array.from({length:5},(_,i)=>({id:`quote-${i}`,quote_number:`DEV-${i}`,status:state.statuses[`quote-${i}`] || "sent",workflow_status:"QUOTE_SENT",service_request_id:i<4 ? "request-1":null,service_request_recipient_id:i<4 ? `recipient-${i}`:null,total_amount:100+i*50,created_at:`2026-09-0${i+1}T10:00:00Z`,valid_until:"2026-10-01",concierge:{id:`concierge-${i}`,company_name:`Conciergerie ${i}`},quote_items:[{id:`line-${i}`,label:"Accueil voyageurs",quantity:1,line_total:100+i*50}]}));
    } else if(path==="/api/service-requests") json={items:state.mode==="empty" ? [] : [{id:"request-1",title:"Accueil de septembre",property_id:"property-1",property_name:"Villa Horizon",city:"Le Barcarès",status:"open",workflow_status:"QUOTE_SENT",request_type:"ponctuel",requested_services:["Accueil"],recipients:[]} ]};
    else if(path.endsWith("/document")) return route.fulfill({contentType:"text/html; charset=utf-8",body:"<h1>Devis simulé</h1>"});
    else if(path.endsWith("/status") || path.endsWith("/select") || path.endsWith("/view")) {
      const body=route.request().postData() ? route.request().postDataJSON():null;
      state.calls.push({path,body});
      if(state.mode==="action-error") return route.fulfill({status:500,json:{error:"Action indisponible"}});
      if(path.endsWith("/status")) state.statuses[path.split("/")[3]]=body.status;
      if(path.endsWith("/select")) state.statuses[`quote-${body.recipient_id.split("-").at(-1)}`]="accepted";
      json={accepted_workflow:{mission_id:"mission-1",invoice_id:"invoice-1"}};
    } else if(["/api/housing","/api/invoices","/api/missions","/api/reviews"].includes(path)) json=[];
    await route.fulfill({json});
  });return state;
}

test("devis : comparaison, filtres, export et responsive",async({page,context})=>{
  const state=await fixtures(page,context);
  await page.goto("/dashboard/owner/devis");
  await expect(page.getByRole("heading",{level:1})).toHaveText("Choisissez votre partenaire sereinement");
  await expect(page.getByRole("button",{name:"Comparer",exact:true})).toHaveCount(5);
  await page.getByRole("button",{name:"Comparer",exact:true}).nth(1).click();
  await page.getByRole("button",{name:"Comparer",exact:true}).nth(1).click();
  await expect(page.getByText("Comparatif",{exact:true})).toBeVisible();
  for(const width of [1600,1366,768,390]) {
    await page.setViewportSize({width,height:1000});
    await page.evaluate(()=>window.scrollTo(0,0));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.screenshot({path:`test-results/owner-quotes-${width}.png`,fullPage:true});
    await page.screenshot({path:`test-results/owner-quotes-top-${width}.png`});
    const firstShortcut = page.getByRole("link", { name: /Vos besoins.*Suivre mes demandes/ });
    await firstShortcut.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(firstShortcut).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: /Votre réseau.*Trouver une conciergerie/ })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(firstShortcut).toBeFocused();
    await firstShortcut.blur();
  }
  await expect(page.getByLabel("Indicateurs des devis").getByRole("article")).toHaveCount(4);
  await page.getByRole("textbox",{name:"Rechercher une demande, un concierge ou un devis"}).fill("DEV-4");
  await page.getByRole("button",{name:"Filtrer",exact:true}).click();
  await expect(page.getByRole("button",{name:"Comparer",exact:true})).toHaveCount(1);
  const downloadPromise=page.waitForEvent("download");
  await page.getByRole("button",{name:"Export CSV"}).click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe("owner-devis.csv");
  expect((await readFile((await download.path())!,"utf8")).split("\n")).toHaveLength(2);
  expect(state.calls).toEqual([]); expect(state.errors).toEqual([]);
});

test("devis : consultation, acceptation, refus et sélection",async({page,context})=>{
  const state=await fixtures(page,context);
  await page.goto("/dashboard/owner/devis?quote=quote-4");
  const popupPromise=page.waitForEvent("popup");
  await page.getByRole("link",{name:"Ouvrir le devis",exact:true}).click();
  const popup=await popupPromise;
  await expect(popup.getByRole("heading")).toHaveText("Devis simulé");await popup.close();
  await page.getByRole("button",{name:"Accepter le devis",exact:true}).click();
  await expect(page.getByRole("link",{name:"Transmettre un séjour voyageur"})).toHaveAttribute("href","/dashboard/owner/missions/voyageurs?quote=quote-4");
  expect(state.calls).toContainEqual({path:"/api/quotes/quote-4/status",body:{status:"accepted"}});
  await page.goto("/dashboard/owner/devis?quote=quote-0");
  await page.getByRole("textbox",{name:"Motif de refus du devis"}).fill("Budget dépassé");
  await page.getByRole("button",{name:"Refuser le devis",exact:true}).click();
  await expect(page.getByText(/Refus enregistré/)).toBeVisible();
  expect(state.calls).toContainEqual({path:"/api/quotes/quote-0/status",body:{status:"rejected",reason:"Budget dépassé"}});
  await page.goto("/dashboard/owner/devis?quote=quote-1");
  await page.getByRole("button",{name:"Retenir ce concierge",exact:true}).click();
  await expect(page.getByRole("link",{name:"Transmettre un séjour voyageur"})).toBeVisible();
  expect(state.calls).toContainEqual({path:"/api/service-requests/request-1/select",body:{recipient_id:"recipient-1"}});
  expect(state.errors).toEqual([]);
});

test("devis : erreur et reprise vide",async({page,context})=>{
  const state=await fixtures(page,context);state.mode="error";
  await page.goto("/dashboard/owner/devis");
  await expect(page.getByRole("alert").filter({hasText:"Devis indisponibles"})).toBeVisible();
  state.mode="empty";await page.getByRole("button",{name:"Réessayer",exact:true}).click();
  await expect(page.getByText("Aucun devis disponible.",{exact:true})).toBeVisible();
  expect(state.calls).toEqual([]);expect(state.errors).toEqual([]);
});
