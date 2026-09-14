import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

async function fixtures(page:Page,context:BrowserContext,role="owner") {
  const user={id:"11111111-1111-4111-8111-111111111111",role,firstName:"Camille",email:"owner@example.test"};
  const token=await encode({secret:"traveler-stays-fixture-secret",salt:"authjs.session-token",token:{...user,sub:user.id},maxAge:3600});
  await context.addCookies([{name:"authjs.session-token",value:token,domain:"127.0.0.1",path:"/",httpOnly:true}]);
  const state={mode:"ready",calls:[] as string[],errors:[] as string[]};
  page.on("pageerror",error=>state.errors.push(error.message));
  await context.route("**/api/**",async route=>{
    const path=new URL(route.request().url()).pathname;let json:unknown={items:[]};
    if(route.request().method()!=="GET")state.calls.push(path);
    if(path==="/api/auth/session")json={user,expires:"2099-01-01T00:00:00Z"};
    else if(path==="/api/profiles/current")json=user;
    else if(path==="/api/housing"){
      if(state.mode==="error")return route.fulfill({status:500,json:{error:"Indisponible"}});
      if(state.mode==="loading")await new Promise(resolve=>setTimeout(resolve,1800));
      json=state.mode==="empty"?[]:[{id:1,nom_logement:"Villa Horizon",ville:"Le Barcarès",statut:"pret",photo_principale:"/images/generated/dashboard/dashboard-header-bandeau.png",infos:{capacite:4,equipements:["Wifi"],description:"Maison lumineuse près de la mer."}},{id:2,nom_logement:"Mas des Oliviers",ville:"Perpignan",statut:"draft",infos:{capacite:2}}];
    }else if(path==="/api/service-requests")json={items:[{property_housing_id:1,selected_concierge_name:"Conciergerie Horizon",selected_concierge_profile_id:"concierge-1"}]};
    else if(path==="/api/owner/reservations")json={reservations:[]};
    else if(path.startsWith("/api/profiles/public/"))json={profile:{display_name:"Conciergerie Horizon"}};
    else if(["/api/invoices","/api/quotes","/api/missions","/api/reviews"].includes(path))json=[];
    await route.fulfill({json});
  });return state;
}

test("logements : recherche, corrections, liens et quatre formats",async({page,context})=>{
  const state=await fixtures(page,context);await page.goto("/dashboard/owner/logements");
  await expect(page.getByRole("heading",{name:"Villa Horizon",exact:true})).toBeVisible();
  await expect(page.getByRole("region",{name:"Tous les logements"})).toBeVisible();
  for(const width of [1600,1366,768,390]){
    await page.setViewportSize({width,height:1000});await page.evaluate(()=>window.scrollTo(0,0));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await page.screenshot({path:`test-results/owner-housing-${width}.png`,fullPage:true});
  }
  await page.getByLabel("Rechercher un logement",{exact:true}).fill("Perpignan");
  await expect(page.getByRole("heading",{name:"Villa Horizon",exact:true})).toHaveCount(0);
  await expect(page.getByRole("heading",{name:"Mas des Oliviers",exact:true})).toBeVisible();
  await page.getByLabel("Rechercher un logement",{exact:true}).fill("");
  await page.getByRole("link",{name:"À revoir (1)",exact:true}).click();
  await expect(page).toHaveURL(/filter=review/);
  await expect(page.getByRole("heading",{name:"Villa Horizon",exact:true})).toHaveCount(0);
  await expect(page.getByRole("link",{name:"Corriger",exact:true})).toHaveAttribute("href","/dashboard/owner/logements/2?tab=synthese#photos");
  await expect(page.getByRole("main").getByRole("link",{name:"Ajouter un logement",exact:true})).toHaveAttribute("href","/dashboard/owner/logements/create");
  expect(state.calls).toEqual([]);expect(state.errors).toEqual([]);
});

test("logements : chargement, erreur, reprise et vide",async({page,context})=>{
  const state=await fixtures(page,context);state.mode="loading";
  await page.goto("/dashboard/owner/logements");
  await expect(page.getByText("Chargement des logements...",{exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Villa Horizon",exact:true})).toBeVisible();
  state.mode="error";await page.reload();
  await expect(page.getByRole("alert").filter({hasText:"Impossible de charger les logements"})).toBeVisible();
  state.mode="empty";await page.getByRole("button",{name:"Réessayer",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Commencez votre parc",exact:true})).toBeVisible();
  await expect(page.getByRole("region",{name:"Commencez votre parc"}).getByRole("link",{name:"Ajouter mon premier logement",exact:true})).toHaveAttribute("href","/dashboard/owner/logements/create");
  expect(state.calls).toEqual([]);expect(state.errors).toEqual([]);
});

test("logements : présentation conciergerie conservée",async({page,context})=>{
  const state=await fixtures(page,context,"concierge");
  await page.goto("/dashboard/concierge/logements");
  await expect(page.getByRole("heading",{name:"Villa Horizon",exact:true})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Des logements prêts pour chaque séjour",exact:true})).toHaveCount(0);
  expect(state.calls).toEqual([]);expect(state.errors).toEqual([]);
});
