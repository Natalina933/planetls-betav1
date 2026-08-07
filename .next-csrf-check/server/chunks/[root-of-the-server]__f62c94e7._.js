module.exports=[918622,(e,t,r)=>{t.exports=e.x("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js",()=>require("next/dist/compiled/next-server/app-page-turbo.runtime.prod.js"))},556704,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-async-storage.external.js",()=>require("next/dist/server/app-render/work-async-storage.external.js"))},832319,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/work-unit-async-storage.external.js",()=>require("next/dist/server/app-render/work-unit-async-storage.external.js"))},120635,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/action-async-storage.external.js",()=>require("next/dist/server/app-render/action-async-storage.external.js"))},324725,(e,t,r)=>{t.exports=e.x("next/dist/server/app-render/after-task-async-storage.external.js",()=>require("next/dist/server/app-render/after-task-async-storage.external.js"))},681158,e=>{"use strict";let t=["owner","owner_pro","concierge","concierge_pro","provider","provider_pro","artisan","artisan_pro","admin","super_admin"],r=e=>!!e&&t.includes(e.trim().toLowerCase()),i=e=>{let t=(e||"").trim().toLowerCase();return"proprietaire_pro"===t?"owner_pro":t.startsWith("proprietaire")?"owner":"concierge_pro"===t?"concierge_pro":t.startsWith("concierge")?"concierge":"provider_pro"===t?"provider_pro":"provider"===t?"provider":"artisan_pro"===t||"service_pro"===t?"provider_pro":t.startsWith("artisan")||t.startsWith("service")?"provider":"admin"===t?"admin":"super_admin"===t?"super_admin":null};e.s(["categoryToRole",0,i,"isUserRole",0,r,"resolveUserRole",0,(e,t)=>r(e)?e.trim().toLowerCase():i(e)??i(t)])},254603,e=>{"use strict";e.i(236296),e.s([])},254799,(e,t,r)=>{t.exports=e.x("crypto",()=>require("crypto"))},270406,(e,t,r)=>{t.exports=e.x("next/dist/compiled/@opentelemetry/api",()=>require("next/dist/compiled/@opentelemetry/api"))},193695,(e,t,r)=>{t.exports=e.x("next/dist/shared/lib/no-fallback-error.external.js",()=>require("next/dist/shared/lib/no-fallback-error.external.js"))},482554,301572,e=>{"use strict";var t=e.i(387464);let r=process.env.SUPABASE_SERVICE_ROLE_KEY,i=(0,t.createClient)("https://dyqlixssykeecvtqmcxh.supabase.co",r??"build-time-placeholder-service-role-key",{auth:{autoRefreshToken:!1,persistSession:!1}});e.s(["db",0,i],301572),e.s([],482554)},489318,e=>{"use strict";e.i(254603);var t=e.i(236296),r=e.i(735277);e.i(482554);var i=e.i(301572),a=e.i(681158);let s="planetls_active_profile_id",n=["__Secure-authjs.session-token","authjs.session-token","__Secure-next-auth.session-token","next-auth.session-token"];async function o(e,t){var r;let n=e.cookies.get(s)?.value;if(!n||!t.email)return t;if(n===t.userId)return{...t,activeProfileId:n};let{data:o,error:d}=await i.db.from("profiles").select("id,email,role,category,additional_info").eq("id",n).maybeSingle();if(d||!o)return t;let l=o.email?.toLowerCase()===t.email.toLowerCase(),p="string"==typeof o.additional_info&&o.additional_info.toLowerCase().includes((r=t.email,`workspace_parent_email:${r.toLowerCase()}`));if(!l&&!p)return t;let u=(0,a.resolveUserRole)(o.role,o.category)??t.role;return{...t,userId:o.id,role:u,activeProfileId:o.id,sessionUserId:t.sessionUserId??t.userId}}async function d(e){let i=process.env.NEXTAUTH_SECRET??process.env.AUTH_SECRET,a=null;for(let r of n)if(a=await (0,t.getToken)({req:e,secret:i,cookieName:r,secureCookie:r.startsWith("__Secure-")}))break;if(a){let t="string"==typeof a.id?a.id:"string"==typeof a.sub?a.sub:void 0,r="string"==typeof a.email?a.email:void 0,i="string"==typeof a.role?a.role:"",s=await o(e,{userId:t,email:r,role:i,sessionUserId:t}),n="admin"===s.role||"super_admin"===s.role;return{...s,isAdmin:n}}let s=await (0,r.auth)(),d=s?.user;if(d?.id){let t="string"==typeof d.role?d.role:"",r=await o(e,{userId:d.id,email:"string"==typeof d.email?d.email:void 0,role:t,sessionUserId:d.id}),i="admin"===r.role||"super_admin"===r.role;return{...r,isAdmin:i}}return{userId:void 0,email:void 0,role:"",isAdmin:!1}}e.s(["ACTIVE_PROFILE_COOKIE",0,s,"getApiAuthContext",()=>d])},525370,e=>{"use strict";e.i(489318),e.s([])},507565,e=>{"use strict";function t(e){return e}e.s(["asLooseSupabaseClient",()=>t])},419956,e=>{"use strict";var t=e.i(507565);e.i(482554);var r=e.i(301572);let i=(0,t.asLooseSupabaseClient)(r.db),a=e=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(e);function s(e){if(!e||"object"!=typeof e)return!1;let t="message"in e?e.message:null;return"string"==typeof t&&(t.includes("relation")||t.includes("does not exist")||t.includes("schema cache"))}function n(e){if(!(e&&"object"==typeof e&&!Array.isArray(e)))return null;for(let t of[e.id,e.userId,e.profile_id,e.owner_id,e.proprietaire_id])if("string"==typeof t&&a(t))return t;return null}function o(e,t=20){let r=Number(e??t);return Number.isFinite(r)?Math.min(Math.max(Math.round(r),1),100):t}function d(e,t){return t.owner_profile_id===e||t.concierge_profile_id===e}e.s(["DISPUTE_TYPES",0,["damage","missing_item","cleaning","other"],"INSPECTION_STATUSES",0,["draft","submitted","reviewed","dispute_opened","closed"],"canAccessInspection",()=>d,"dbAny",0,i,"extractOwnerIdFromHousingProprietaire",()=>n,"isMissingRelationError",()=>s,"isUuidLike",0,a,"parseLimit",()=>o])},777423,e=>{"use strict";var t=e.i(747909),r=e.i(174017),i=e.i(996250),a=e.i(759756),s=e.i(561916),n=e.i(174677),o=e.i(869741),d=e.i(316795),l=e.i(487718),p=e.i(995169),u=e.i(47587),c=e.i(666012),m=e.i(570101),g=e.i(626937),h=e.i(10372),f=e.i(193695);e.i(52474);var v=e.i(600220);e.i(525370);var _=e.i(489318),x=e.i(507565);e.i(482554);var y=e.i(301572),w=e.i(419956);let b=e=>e.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"),R=e=>{if(!e)return"-";let t=new Date(e);return Number.isNaN(t.getTime())?"-":new Intl.DateTimeFormat("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(t)},E=(0,x.asLooseSupabaseClient)(y.db);async function C(e,{params:t}){try{let{userId:r,isAdmin:i}=await (0,_.getApiAuthContext)(e);if(!r||!(0,w.isUuidLike)(r))return new Response("Non authentifie",{status:401});let{id:a}=await t;if(!(0,w.isUuidLike)(a))return new Response("Identifiant litige invalide",{status:400});let s=new URL(e.url),n="1"===s.searchParams.get("print"),{data:o,error:d}=await E.from("damage_disputes").select("*").eq("id",a).maybeSingle();if(d||!o)return new Response("Litige introuvable",{status:404});if(!i&&r!==o.owner_profile_id&&r!==o.concierge_profile_id)return new Response("Acces refuse",{status:403});let[l,p,u,c]=await Promise.all([E.from("housing").select("id, nom_logement, adresse, ville").eq("id",o.housing_id).maybeSingle(),E.from("profiles").select("id, first_name, last_name, company_name, email, phone").eq("id",o.owner_profile_id).maybeSingle(),E.from("profiles").select("id, first_name, last_name, company_name, email, phone").eq("id",o.concierge_profile_id).maybeSingle(),E.from("dispute_evidence_links").select("id, media_id, checklist_item_id, comment, created_at").eq("dispute_id",a)]),m=Array.isArray(c.data)?c.data:[],g=Array.from(new Set(m.map(e=>e.media_id).filter(e=>"string"==typeof e&&e.length>0))),h=Array.from(new Set(m.map(e=>e.checklist_item_id).filter(e=>"string"==typeof e&&e.length>0))),[f,v]=await Promise.all([E.from("inspection_media").select("id, media_type, storage_bucket, storage_path, captured_at_server, sha256").in("id",g.length>0?g:["00000000-0000-0000-0000-000000000000"]),E.from("checkout_checklist_items").select("id, item_label, item_status, notes").in("id",h.length>0?h:["00000000-0000-0000-0000-000000000000"])]),x=new Map;(f.data??[]).forEach(e=>{x.set(e.id,e)});let C=new Map;(v.data??[]).forEach(e=>{C.set(e.id,e)});let A=new Map;await Promise.all(Array.from(x.values()).map(async e=>{if(!e.storage_bucket||!e.storage_path)return;let{data:t,error:r}=await y.db.storage.from(e.storage_bucket).createSignedUrl(e.storage_path,600,{download:`${e.id}.${"video"===e.media_type?"mp4":"jpg"}`});r||!t?.signedUrl?console.error("[GET /api/disputes/:id/export] signed url error:",r):A.set(e.id,t.signedUrl)}));let k=m.map(e=>{let t=e.media_id?x.get(e.media_id):null,r=e.checklist_item_id?C.get(e.checklist_item_id):null,i=e.media_id?A.get(e.media_id)??null:null;return`
          <tr>
            <td>${t?b(t.media_type.toUpperCase()):"-"}</td>
            <td>${r?b(r.item_label):"-"}</td>
            <td>${r?b(r.item_status):"-"}</td>
            <td>${t?.captured_at_server?b(R(t.captured_at_server)):"-"}</td>
            <td>${t?.sha256?b(t.sha256):"-"}</td>
            <td>${i?`<a href="${b(i)}" target="_blank" rel="noreferrer">Ouvrir</a>`:"-"}</td>
            <td>${e.comment?b(e.comment):""}</td>
          </tr>
        `}).join(""),S=p.data?.company_name||`${p.data?.first_name??""} ${p.data?.last_name??""}`.trim()||"Proprietaire",T=u.data?.company_name||`${u.data?.first_name??""} ${u.data?.last_name??""}`.trim()||"Concierge",$=`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Dossier litige ${b(o.id)}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
    .doc { max-width: 980px; margin: 0 auto; }
    .top { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 16px; }
    .box { border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; background: #f8fafc; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
    h1, h2, h3 { margin: 0 0 8px; }
    p { margin: 0 0 8px; }
    .meta { font-size: 13px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; vertical-align: top; }
    th { background: #f1f5f9; text-align: left; }
    .footer { margin-top: 18px; font-size: 11px; color: #475569; border-top: 1px solid #cbd5e1; padding-top: 10px; }
  </style>
</head>
<body>
  <main class="doc">
    <section class="top">
      <div>
        <h1>Dossier de litige</h1>
        <div class="meta">
          <div><strong>ID litige:</strong> ${b(o.id)}</div>
          <div><strong>Type:</strong> ${b(o.dispute_type)}</div>
          <div><strong>Statut:</strong> ${b(o.status)}</div>
          <div><strong>Ouvert le:</strong> ${b(R(o.opened_at))}</div>
          <div><strong>Montant estime:</strong> ${b(((e,t="EUR")=>"number"==typeof e&&Number.isFinite(e)?new Intl.NumberFormat("fr-FR",{style:"currency",currency:t,minimumFractionDigits:2}).format(e):"-")(o.estimated_amount,o.currency))}</div>
        </div>
      </div>
      <div class="box meta">
        <div><strong>Logement:</strong> ${b(l.data?.nom_logement||"-")}</div>
        <div><strong>Adresse:</strong> ${b([l.data?.adresse,l.data?.ville].filter(Boolean).join(", ")||"-")}</div>
      </div>
    </section>

    <section class="grid">
      <div class="box meta">
        <h3>Proprietaire</h3>
        <div>${b(S)}</div>
        <div>${b(p.data?.email||"")}</div>
        <div>${b(p.data?.phone||"")}</div>
      </div>
      <div class="box meta">
        <h3>Concierge</h3>
        <div>${b(T)}</div>
        <div>${b(u.data?.email||"")}</div>
        <div>${b(u.data?.phone||"")}</div>
      </div>
    </section>

    <section class="box" style="margin-top: 12px;">
      <h3>Objet</h3>
      <p><strong>${b(o.title||"Litige")}</strong></p>
      <p>${b(o.description||"Aucune description")}</p>
    </section>

    <section class="box" style="margin-top: 12px;">
      <h3>Preuves associees (${m.length})</h3>
      <table>
        <thead>
          <tr>
            <th>Media</th>
            <th>Checklist</th>
            <th>Statut item</th>
            <th>Date preuve</th>
            <th>Hash SHA-256</th>
            <th>Lien</th>
            <th>Commentaire</th>
          </tr>
        </thead>
        <tbody>
          ${k||'<tr><td colspan="7">Aucune preuve liee.</td></tr>'}
        </tbody>
      </table>
    </section>

    <footer class="footer">
      Dossier genere le ${b(R(new Date().toISOString()))}.
      Ce document peut etre imprime en PDF.
    </footer>
  </main>
  ${n?"<script>window.addEventListener('load', () => window.print());</script>":""}
</body>
</html>`;return new Response($,{status:200,headers:{"Content-Type":"text/html; charset=utf-8"}})}catch(e){return console.error("[GET /api/disputes/:id/export] ERROR:",e),new Response("Erreur serveur",{status:500})}}e.s(["GET",()=>C],373404);var A=e.i(373404);let k=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/disputes/[id]/export/route",pathname:"/api/disputes/[id]/export",filename:"route",bundlePath:""},distDir:".next-csrf-check",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/disputes/[id]/export/route.ts",nextConfigOutput:"",userland:A}),{workAsyncStorage:S,workUnitAsyncStorage:T,serverHooks:$}=k;function I(){return(0,i.patchFetch)({workAsyncStorage:S,workUnitAsyncStorage:T})}async function P(e,t,i){k.isDev&&(0,a.addRequestMeta)(e,"devRequestTimingInternalsEnd",process.hrtime.bigint());let _="/api/disputes/[id]/export/route";_=_.replace(/\/index$/,"")||"/";let x=await k.prepare(e,t,{srcPage:_,multiZoneDraftMode:!1});if(!x)return t.statusCode=400,t.end("Bad Request"),null==i.waitUntil||i.waitUntil.call(i,Promise.resolve()),null;let{buildId:y,params:w,nextConfig:b,parsedUrl:R,isDraftMode:E,prerenderManifest:C,routerServerContext:A,isOnDemandRevalidate:S,revalidateOnlyGenerated:T,resolvedPathname:$,clientReferenceManifest:I,serverActionsManifest:P}=x,U=(0,o.normalizeAppPath)(_),N=!!(C.dynamicRoutes[U]||C.routes[$]),O=async()=>((null==A?void 0:A.render404)?await A.render404(e,t,R,!1):t.end("This page could not be found"),null);if(N&&!E){let e=!!C.routes[$],t=C.dynamicRoutes[U];if(t&&!1===t.fallback&&!e){if(b.experimental.adapterPath)return await O();throw new f.NoFallbackError}}let q=null;!N||k.isDev||E||(q="/index"===(q=$)?"/":q);let j=!0===k.isDev||!N,L=N&&!j;P&&I&&(0,n.setManifestsSingleton)({page:_,clientReferenceManifest:I,serverActionsManifest:P});let D=e.method||"GET",H=(0,s.getTracer)(),M=H.getActiveScopeSpan(),F={params:w,prerenderManifest:C,renderOpts:{experimental:{authInterrupts:!!b.experimental.authInterrupts},cacheComponents:!!b.cacheComponents,supportsDynamicResponse:j,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:b.cacheLife,waitUntil:i.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,i,a)=>k.onRequestError(e,t,i,a,A)},sharedContext:{buildId:y}},K=new d.NodeNextRequest(e),B=new d.NodeNextResponse(t),W=l.NextRequestAdapter.fromNodeNextRequest(K,(0,l.signalFromNodeResponse)(t));try{let n=async e=>k.handle(W,F).finally(()=>{if(!e)return;e.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let r=H.getRootSpanAttributes();if(!r)return;if(r.get("next.span_type")!==p.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${r.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let i=r.get("next.route");if(i){let t=`${D} ${i}`;e.setAttributes({"next.route":i,"http.route":i,"next.span_name":t}),e.updateName(t)}else e.updateName(`${D} ${_}`)}),o=!!(0,a.getRequestMeta)(e,"minimalMode"),d=async a=>{var s,d;let l=async({previousCacheEntry:r})=>{try{if(!o&&S&&T&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let s=await n(a);e.fetchMetrics=F.renderOpts.fetchMetrics;let d=F.renderOpts.pendingWaitUntil;d&&i.waitUntil&&(i.waitUntil(d),d=void 0);let l=F.renderOpts.collectedTags;if(!N)return await (0,c.sendResponse)(K,B,s,F.renderOpts.pendingWaitUntil),null;{let e=await s.blob(),t=(0,m.toNodeOutgoingHttpHeaders)(s.headers);l&&(t[h.NEXT_CACHE_TAGS_HEADER]=l),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==F.renderOpts.collectedRevalidate&&!(F.renderOpts.collectedRevalidate>=h.INFINITE_CACHE)&&F.renderOpts.collectedRevalidate,i=void 0===F.renderOpts.collectedExpire||F.renderOpts.collectedExpire>=h.INFINITE_CACHE?void 0:F.renderOpts.collectedExpire;return{value:{kind:v.CachedRouteKind.APP_ROUTE,status:s.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:i}}}}catch(t){throw(null==r?void 0:r.isStale)&&await k.onRequestError(e,t,{routerKind:"App Router",routePath:_,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:S})},!1,A),t}},p=await k.handleResponse({req:e,nextConfig:b,cacheKey:q,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:C,isRoutePPREnabled:!1,isOnDemandRevalidate:S,revalidateOnlyGenerated:T,responseGenerator:l,waitUntil:i.waitUntil,isMinimalMode:o});if(!N)return null;if((null==p||null==(s=p.value)?void 0:s.kind)!==v.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==p||null==(d=p.value)?void 0:d.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});o||t.setHeader("x-nextjs-cache",S?"REVALIDATED":p.isMiss?"MISS":p.isStale?"STALE":"HIT"),E&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let f=(0,m.fromNodeOutgoingHttpHeaders)(p.value.headers);return o&&N||f.delete(h.NEXT_CACHE_TAGS_HEADER),!p.cacheControl||t.getHeader("Cache-Control")||f.get("Cache-Control")||f.set("Cache-Control",(0,g.getCacheControlHeader)(p.cacheControl)),await (0,c.sendResponse)(K,B,new Response(p.value.body,{headers:f,status:p.value.status||200})),null};M?await d(M):await H.withPropagatedContext(e.headers,()=>H.trace(p.BaseServerSpan.handleRequest,{spanName:`${D} ${_}`,kind:s.SpanKind.SERVER,attributes:{"http.method":D,"http.target":e.url}},d))}catch(t){if(t instanceof f.NoFallbackError||await k.onRequestError(e,t,{routerKind:"App Router",routePath:U,routeType:"route",revalidateReason:(0,u.getRevalidateReason)({isStaticGeneration:L,isOnDemandRevalidate:S})},!1,A),N)throw t;return await (0,c.sendResponse)(K,B,new Response(null,{status:500})),null}}e.s(["handler",()=>P,"patchFetch",()=>I,"routeModule",()=>k,"serverHooks",()=>$,"workAsyncStorage",()=>S,"workUnitAsyncStorage",()=>T],777423)}];

//# sourceMappingURL=%5Broot-of-the-server%5D__f62c94e7._.js.map