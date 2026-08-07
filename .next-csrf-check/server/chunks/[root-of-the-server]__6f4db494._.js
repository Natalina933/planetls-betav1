module.exports=[254603,e=>{"use strict";e.i(236296),e.s([])},254799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},270406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},482554,301572,e=>{"use strict";var t=e.i(387464);let r=process.env.SUPABASE_SERVICE_ROLE_KEY,a=(0,t.createClient)("https://dyqlixssykeecvtqmcxh.supabase.co",r??"build-time-placeholder-service-role-key",{auth:{autoRefreshToken:!1,persistSession:!1}});e.s(["db",0,a],301572),e.s([],482554)},39015,e=>{"use strict";var t=e.i(747909),r=e.i(174017),a=e.i(996250),n=e.i(759756),i=e.i(561916),s=e.i(174677),o=e.i(869741),l=e.i(316795),d=e.i(487718),c=e.i(995169),u=e.i(47587),p=e.i(666012),m=e.i(570101),h=e.i(626937),g=e.i(10372),x=e.i(193695);e.i(52474);var f=e.i(600220);e.i(254603);var b=e.i(236296);e.i(482554);var v=e.i(301572);let _=e=>e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"),y=(e,t)=>new Intl.NumberFormat("fr-FR",{style:"currency",currency:t||"EUR",minimumFractionDigits:2}).format(e??0),R=e=>{if(!e)return"-";let t=new Date(e);return Number.isNaN(t.getTime())?"-":new Intl.DateTimeFormat("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"}).format(t)},w=async e=>{let t=await (0,b.getToken)({req:e,secret:process.env.NEXTAUTH_SECRET??process.env.AUTH_SECRET});return"string"==typeof t?.sub?t.sub:null};async function E(e,{params:t}){try{let r=await w(e);if(!r)return new Response("Non authentifie",{status:401});let{id:a}=await t,n=new URL(e.url),i="1"===n.searchParams.get("print"),{data:s,error:o}=await v.db.from("quotes").select("id, quote_number, concierge_profile_id, owner_profile_id, mission_id, package_id, status, currency, subtotal, discount_amount, tax_rate, tax_amount, total_amount, valid_until, notes, created_at, package:services_packages(id, name, description, category), quote_items(id, label, description, quantity, unit_price, line_total, sort_order)").eq("id",a).single();if(o||!s)return new Response("Devis introuvable",{status:404});if(s.concierge_profile_id!==r&&s.owner_profile_id!==r)return new Response("Acces refuse",{status:403});let[{data:l},{data:d}]=await Promise.all([v.db.from("profiles").select("company_name, legal_form, first_name, last_name, email, phone, avatar_url, street_address, postal_code, city, country, siret, vat_number").eq("id",s.concierge_profile_id).maybeSingle(),s.owner_profile_id?v.db.from("profiles").select("company_name, first_name, last_name, email, phone, street_address, postal_code, city, country").eq("id",s.owner_profile_id).maybeSingle():Promise.resolve({data:null})]),c=l?.company_name||`${l?.first_name??""} ${l?.last_name??""}`.trim()||"Concierge",u=d?.company_name||`${d?.first_name??""} ${d?.last_name??""}`.trim()||"Client",p=[l?.street_address,[l?.postal_code,l?.city].filter(Boolean).join(" "),l?.country].filter(Boolean).join("<br/>"),m=[d?.street_address,[d?.postal_code,d?.city].filter(Boolean).join(" "),d?.country].filter(Boolean).join("<br/>"),h=(s.quote_items??[]).slice().sort((e,t)=>e.sort_order-t.sort_order),g=l?.vat_number?`TVA intracommunautaire: ${_(l.vat_number)}`:"TVA non applicable, art. 293 B du CGI",x=s.package?`<section class="box" style="margin-top: 12px;"><h3>Pack rattach\xe9</h3><div>${_((s.package.name??"").replace(/\(\s*seed\s*\)/gi,"(Initial)").trim()||"Pack")}</div><div class="muted">${s.package.category?_(s.package.category):""}${s.package.description?`<br/>${_(s.package.description)}`:""}</div></section>`:"",f=h.map(e=>`
        <tr>
          <td>${_(e.label)}</td>
          <td>${e.description?_(e.description):""}</td>
          <td class="num">${e.quantity}</td>
          <td class="num">${y(Number(e.unit_price??0),s.currency)}</td>
          <td class="num">${y(Number(e.line_total??0),s.currency)}</td>
        </tr>
      `).join(""),b=`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Devis ${_(s.quote_number)}</title>
  <style>
    :root { color-scheme: light; }
    body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
    .doc { max-width: 900px; margin: 0 auto; }
    .top { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 20px; }
    .brand { display: grid; gap: 6px; }
    .brand h1 { margin: 0; font-size: 22px; }
    .muted { color: #475569; font-size: 12px; line-height: 1.4; }
    .logo { width: 88px; height: 88px; border-radius: 12px; object-fit: cover; border: 1px solid #cbd5e1; }
    .meta { text-align: right; font-size: 13px; }
    .addresses { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 18px; margin: 10px 0 18px; }
    .box { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; background: #f8fafc; }
    .box h3 { margin: 0 0 6px; font-size: 13px; text-transform: uppercase; letter-spacing: .04em; color: #334155; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; vertical-align: top; }
    th { background: #f1f5f9; text-align: left; }
    .num { text-align: right; white-space: nowrap; }
    .totals { margin-left: auto; width: 320px; margin-top: 14px; }
    .totals td { font-size: 12px; }
    .totals .label { text-align: right; }
    .totals .grand td { font-size: 14px; font-weight: 700; background: #eff6ff; }
    .footer { margin-top: 18px; font-size: 11px; color: #475569; line-height: 1.5; border-top: 1px solid #cbd5e1; padding-top: 10px; }
  </style>
</head>
<body>
  <main class="doc">
    <section class="top">
      <div class="brand">
        ${l?.avatar_url?`<img class="logo" src="${_(l.avatar_url)}" alt="Logo"/>`:""}
        <h1>${_(c)}</h1>
        <div class="muted">
          ${l?.legal_form?`${_(l.legal_form)}<br/>`:""}
          ${p}
          ${l?.siret?`<br/>SIRET: ${_(l.siret)}`:""}
          <br/>${g}
          ${l?.email?`<br/>${_(l.email)}`:""}
          ${l?.phone?`<br/>${_(l.phone)}`:""}
        </div>
      </div>
      <div class="meta">
        <h2 style="margin: 0 0 8px;">DEVIS</h2>
        <div><strong>N\xb0:</strong> ${_(s.quote_number)}</div>
        <div><strong>Date:</strong> ${R(s.created_at)}</div>
        <div><strong>Valide jusqu'au:</strong> ${R(s.valid_until)}</div>
        <div><strong>Statut:</strong> ${_(s.status)}</div>
      </div>
    </section>

    <section class="addresses">
      <div class="box">
        <h3>Emetteur</h3>
        <div>${_(c)}</div>
      </div>
      <div class="box">
        <h3>Destinataire</h3>
        <div>${_(u)}</div>
        <div class="muted">
          ${m}
          ${d?.email?`<br/>${_(d.email)}`:""}
          ${d?.phone?`<br/>${_(d.phone)}`:""}
        </div>
      </div>
    </section>

    <table>
      <thead>
        <tr>
          <th>Prestation</th>
          <th>Description</th>
          <th class="num">Quantite</th>
          <th class="num">Prix unitaire</th>
          <th class="num">Montant</th>
        </tr>
      </thead>
      <tbody>
        ${f}
      </tbody>
    </table>

    <table class="totals">
      <tr><td class="label">Sous-total</td><td class="num">${y(Number(s.subtotal??0),s.currency)}</td></tr>
      <tr><td class="label">Remise</td><td class="num">-${y(Number(s.discount_amount??0),s.currency)}</td></tr>
      <tr><td class="label">TVA (${Number(s.tax_rate??0).toFixed(2)}%)</td><td class="num">${y(Number(s.tax_amount??0),s.currency)}</td></tr>
      <tr class="grand"><td class="label">Total TTC</td><td class="num">${y(Number(s.total_amount??0),s.currency)}</td></tr>
    </table>

    ${s.notes?`<section class="box" style="margin-top: 12px;"><h3>Notes</h3><div class="muted">${_(s.notes).replaceAll("\n","<br/>")}</div></section>`:""}
    ${x}

    <footer class="footer">
      Document numerote automatiquement. Ce devis est emis par ${_(c)}.
      <br/>${g}
    </footer>
  </main>
  ${i?"<script>window.addEventListener('load', () => window.print());</script>":""}
</body>
</html>`;return new Response(b,{status:200,headers:{"Content-Type":"text/html; charset=utf-8"}})}catch(e){return console.error("[GET /api/quotes/:id/document] ERROR:",e),new Response("Erreur serveur",{status:500})}}e.s(["GET",()=>E],161697);var $=e.i(161697);let C=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/quotes/[id]/document/route",pathname:"/api/quotes/[id]/document",filename:"route",bundlePath:""},distDir:".next-csrf-check",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/quotes/[id]/document/route.ts",nextConfigOutput:"",userland:$}),{workAsyncStorage:A,workUnitAsyncStorage:T,serverHooks:q}=C;function k(){return(0,a.patchFetch)({workAsyncStorage:A,workUnitAsyncStorage:T})}async function N(e,t,a){C.isDev&&(0,n.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let b="/api/quotes/[id]/document/route";b=b.replace(/\/index$/,"")||"/";let v=await C.prepare(e,t,{srcPage:b,multiZoneDraftMode:!1});if(!v)return t.statusCode=400,t.end("Bad Request"),null==a.waitUntil||a.waitUntil.call(a,Promise.resolve()),null;let{buildId:_,params:y,nextConfig:R,parsedUrl:w,isDraftMode:E,prerenderManifest:$,routerServerContext:A,isOnDemandRevalidate:T,revalidateOnlyGenerated:q,resolvedPathname:k,clientReferenceManifest:N,serverActionsManifest:P}=v,S=(0,o.normalizeAppPath)(b),j=!!($.dynamicRoutes[S]||$.routes[k]),D=async()=>((null==A?void 0:A.render404)?await A.render404(e,t,w,!1):t.end("This page could not be found"),null);if(j&&!E){let e=!!$.routes[k],t=$.dynamicRoutes[S];if(t&&!1===t.fallback&&!e){if(R.experimental.adapterPath)return await D();throw new x.NoFallbackError}}let O=null;!j||C.isDev||E||(O="/index"===(O=k)?"/":O);let I=!0===C.isDev||!j,U=j&&!I;P&&N&&(0,s.setManifestsSingleton)({page:b,clientReferenceManifest:N,serverActionsManifest:P});let H=e.method||"GET",F=(0,i.getTracer)(),M=F.getActiveScopeSpan(),B={params:y,prerenderManifest:$,renderOpts:{experimental:{authInterrupts:!!R.experimental.authInterrupts},cacheComponents:!!R.cacheComponents,supportsDynamicResponse:I,incrementalCache:(0,n.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:R.cacheLife,waitUntil:a.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,a,n)=>C.onRequestError(e,t,a,n,A)},sharedContext:{buildId:_}},z=new l.NodeNextRequest(e),K=new l.NodeNextResponse(t),L=d.NextRequestAdapter.fromNodeNextRequest(z,(0,d.signalFromNodeResponse)(t));try{let s=async e=>C.handle(L,B).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=F.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=r.get("next.route");if(a){let t=`${H} ${a}`;e.setAttributes({"next.route":a,"http.route":a,"next.span_name":t}),e.updateName(t)}else e.updateName(`${H} ${b}`)}),o=!!(0,n.getRequestMeta)(e,"minimalMode"),l=async n=>{var i,l;let d=async({previousCacheEntry:r})=>{try{if(!o&&T&&q&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let i=await s(n);e.fetchMetrics=B.renderOpts.fetchMetrics;let l=B.renderOpts.pendingWaitUntil;l&&a.waitUntil&&(a.waitUntil(l),l=void 0);let d=B.renderOpts.collectedTags;if(!j)return await (0,p.sendResponse)(z,K,i,B.renderOpts.pendingWaitUntil),null;{let e=await i.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(i.headers);d&&(t[g.NEXT_CACHE_TAGS_HEADER]=d),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==B.renderOpts.collectedRevalidate&&!(B.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&B.renderOpts.collectedRevalidate,a=void 0===B.renderOpts.collectedExpire||B.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:B.renderOpts.collectedExpire;return{value:{kind:f.CachedRouteKind.APP_ROUTE,status:i.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:a}}}}catch(t){throw(null==r?void 0:r.isStale)&&await C.onRequestError(e,t,{routerKind:"App Router",routePath:b,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:T})},!1,A),t}},c=await C.handleResponse({req:e,nextConfig:R,cacheKey:O,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:$,isRoutePPREnabled:!1,isOnDemandRevalidate:T,revalidateOnlyGenerated:q,responseGenerator:d,waitUntil:a.waitUntil,isMinimalMode:o});if(!j)return null;if((null==c||null==(i=c.value)?void 0:i.kind)!==f.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==c||null==(l=c.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",T?"REVALIDATED":c.isMiss?"MISS":c.isStale?"STALE":"HIT"),E&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let x=(0,m.fromNodeOutgoingHttpHeaders)(c.value.headers);return o&&j||x.delete(g.NEXT_CACHE_TAGS_HEADER),!c.cacheControl||t.getHeader("Cache-Control")||x.get("Cache-Control")||x.set("Cache-Control",(0,h.getCacheControlHeader)(c.cacheControl)),await (0,p.sendResponse)(z,K,new Response(c.value.body,{headers:x,status:c.value.status||200})),null};M?await l(M):await F.withPropagatedContext(e.headers,()=>F.trace(c.BaseServerSpan.handleRequest,{spanName:`${H} ${b}`,kind:i.SpanKind.SERVER,attributes:{"http.method":H,"http.target":e.url}},l))}catch(t){if(t instanceof x.NoFallbackError||await C.onRequestError(e,t,{routerKind:"App Router",routePath:S,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:U,isOnDemandRevalidate:T})},!1,A),j)throw t;return await (0,p.sendResponse)(z,K,new Response(null,{status:500})),null}}e.s(["handler",()=>N,"patchFetch",()=>k,"routeModule",()=>C,"serverHooks",()=>q,"workAsyncStorage",()=>A,"workUnitAsyncStorage",()=>T],39015)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__6f4db494._.js.map