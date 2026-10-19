import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";
import React from "react";
import ts from "typescript";
import { getPublicProfileLinks } from "../features/public-concierges/publicProfileLinks.ts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("public profile analytics route records structured CTA clicks", () => {
  const route = read("../app/api/profiles/public/[id]/track/route.ts");
  assert.match(route, /export async function POST/);
  assert.match(route, /public_profile_cta_clicked/);
  assert.match(route, /cta_key/);
  assert.match(route, /recordWorkflowEvent/);
});

type Values = Record<string, unknown>;
const nodeRequire = createRequire(import.meta.url);
function loadSource(path: string, dependencies: Values): Values {
  const entry = { exports: {} as Values };
  const code = ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function("require", "exports", "module", "fetch", code)(
    (name: string) => name in dependencies ? dependencies[name] : nodeRequire(name),
    entry.exports, entry, dependencies.fetch,
  );
  return entry.exports;
}

test("public concierge page posts CTA interactions back to the tracking endpoint", async () => {
  const page = read("../app/concierges/[id]/page.tsx");
  assert.match(page, /import PublicConciergeProfilePage from/);
  const events: Values[] = [];
  const profileId = "concierge/échantillon";
  const db = { from(table: string) {
    assert.equal(table, "profiles");
    return { select: () => ({ eq: (_key: string, id: string) => {
      assert.equal(id, profileId);
      return { maybeSingle: async () => ({ data: { id, role: "concierge", first_name: "Test", last_name: "Local" }, error: null }) };
    } }) };
  } };
  const route = loadSource("../app/api/profiles/public/[id]/track/route.ts", {
    "next/server": { NextResponse: { json: Response.json } },
    "@/app/lib/dbServer": { db },
    "@/app/api/_shared/workflowEvents": { recordWorkflowEvent: async (_db: unknown, event: Values) => { assert.equal(_db, db); events.push(event); } },
  });
  const post = route.POST as (req: Request, context: { params: Promise<{ id: string }> }) => Promise<Response>;
  const requests: Array<{ url: string; init: RequestInit }> = [];
  const pending: Promise<Response>[] = [];
  const transport = (url: string, init: RequestInit) => {
    requests.push({ url, init });
    const response = post(new Request(`https://planetls.test${url}`, init), { params: Promise.resolve({ id: profileId }) });
    pending.push(response);
    return response;
  };
  const profile = { id: profileId, display_name: "Test Local", role: "concierge", services: [], website: "https://example.test", linkedin: "https://linkedin.test", instagram: "https://instagram.test", facebook: "https://facebook.test" };
  const data = { profile, reviews: [], stats: { average_rating: null, reviews_count: 0 } };
  const styles = { default: new Proxy({}, { get: (_, key) => String(key) }) };
  const viewModule = loadSource("../features/concierge-profile/components/OwnerConciergeProfileView.tsx", {
    "next/link": { default: "a" }, "next/image": { default: "img" },
    "lucide-react": new Proxy({}, { get: () => "span" }),
    "@/components/ui": { Badge: "span", Button: "button", ButtonLink: "a" },
    "@/app/dashboard/owner/concierges/ConciergeAvatar": { ConciergeAvatar: "img" },
    "@/features/owner-concierges/components/ConciergeServices": { ConciergeServices: "div" },
    "./ConciergeInterventionMap": { ConciergeInterventionMap: "div" },
    "@/features/public-concierges/publicProfileLinks": { getPublicProfileLinks },
    "./OwnerConciergeProfileView.module.scss": styles,
  });
  const View = viewModule.OwnerConciergeProfileView as (props: Values) => React.ReactElement;
  const states: unknown[] = [data, false, null, 0];
  let stateIndex = 0;
  const profileModule = loadSource("../features/concierge-profile/components/PublicConciergeProfilePage.tsx", {
    react: { useState: () => [states[stateIndex++], () => {}], useEffect: () => {} },
    "next-auth/react": { useSession: () => ({ data: null }) },
    "@/features/owner-concierges/lib/geography": { publicConciergeReturnPath: () => "/concierges" },
    "./OwnerConciergeProfileView": { OwnerConciergeProfileView: View },
    "./OwnerConciergeProfileView.module.scss": styles,
    fetch: transport,
  });
  const Component = profileModule.default as (props: Values) => React.ReactElement<Values>;
  const pageModule = loadSource("../app/concierges/[id]/page.tsx", {
    "@/features/concierge-profile/components/PublicConciergeProfilePage": { default: Component },
    "@/features/owner-concierges/lib/geography": { publicConciergeReturnPath: (path: string) => path },
  });
  const params = Promise.resolve({ id: profileId });
  const Page = pageModule.default as (props: Values) => Promise<React.ReactElement<Values>>;
  const pageElement = await Page({ params, searchParams: Promise.resolve({}) });
  assert.equal(pageElement.type, Component);
  assert.equal(pageElement.props.params, params);
  const element = Component(pageElement.props).props.children as React.ReactElement<Values>;
  assert.equal(element.type, View);
  const links: Values[] = [];
  function visit(node: unknown) {
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (!React.isValidElement<Values>(node)) return;
    if (typeof node.props.onClick === "function" && typeof node.props.href === "string") links.push(node.props);
    visit(node.props.children);
  }
  visit(View(element.props));
  assert.equal(links.length, 5);
  for (const link of links) (link.onClick as () => void)();
  const responses = await Promise.all(pending);
  assert.ok(responses.every((response) => response.status === 200));
  assert.equal(requests.length, 5);
  assert.deepEqual(events.map((event) => (event.metadata as Values).cta_key), ["contact_platform", "visit_website", "view_linkedin", "view_instagram", "view_facebook"]);
  for (let i = 0; i < requests.length; i++) {
    const { url, init } = requests[i];
    assert.equal(url, `/api/profiles/public/${encodeURIComponent(profileId)}/track`);
    assert.equal(init.method, "POST");
    assert.equal(init.keepalive, true);
    assert.equal(new Headers(init.headers).get("Content-Type"), "application/json");
    const body = JSON.parse(String(init.body)) as Values;
    assert.equal(body.href, links[i].href);
    assert.equal(body.source, i === 0 ? "cta_section" : "links_section");
    assert.equal(events[i].eventType, "public_profile_cta_clicked");
    assert.equal(events[i].conciergeProfileId, profileId);
    assert.deepEqual(events[i].metadata, { scope: "public_profile", cta_key: body.ctaKey, source: body.source, href: body.href, pathname: `/concierges/${profileId}`, referrer: null, user_agent: null });
  }
  stateIndex = 0; states[0] = null;
  const unloaded = Component(pageElement.props).props.children as React.ReactElement<Values>;
  (unloaded.props.onTrack as (key: string, href: string, source: string) => void)("contact_platform", "/login", "cta_section");
  assert.equal(requests.length, 5, "no tracking without a loaded profile");
});
