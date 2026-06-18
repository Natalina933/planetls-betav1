# Audit complet code, composants, routes et permissions

Date: `2026-06-18`

## Perimetre

- suppression du code mort
- suppression des composants inutilises
- verification des routes
- verification des permissions

## Methode

- lecture de la structure du repo et des zones `src/app`, `src/server`, `src/components`, `src/features`
- cartographie App Router
- revue des helpers d'authentification et des garde-fous API
- execution de `npm.cmd run lint`
- execution de `npm.cmd test`
- remediations progressives puis revalidation

## Chiffres cles

- `102` pages App Router detectees lors de l'audit initial
- `2` layouts App Router detectes
- `100` routes API detectees lors de l'audit initial
- `2` route handlers detectes en `route.tsx` au debut de l'audit
- `118/118` tests passent apres remediation
- `0` erreur et `0` warning `lint` apres remediation

## Synthese executive

L'audit a confirme une base applicative globalement solide, avec surtout de la dette de maintenance: conventions de routes non homogenes, endpoints de dev trop permissifs, artefacts de travail dans le repo, et quelques ecarts de permissions route par route. Les points critiques identifies ont ete corriges dans la meme sequence de travail.

## Etat final

### Corrige

1. Handlers auth renommes en `route.ts`
   - `src/app/api/auth/login/route.ts`
   - `src/app/api/auth/register/route.ts`
   - Statut: corrige

2. Endpoint de dev durci
   - `src/app/api/auth/dev-workspace-login/route.ts`
   - Protection ajoutee:
   - blocage en production
   - acces limite a `localhost` et `127.0.0.1`
   - Statut: corrige

3. Uploads alignes sur l'auth standard
   - `src/app/api/housing/photos/route.ts`
   - `src/app/api/profiles/avatar/route.ts`
   - Remplacement de `getToken` direct par `getApiAuthContext`
   - sanitation des segments de chemin de stockage
   - Statut: corrige

4. Incoherence permission corrigee sur `pricing/[id]`
   - `src/app/api/pricing/[id]/route.ts`
   - Avant: l'admin pouvait modifier/supprimer un tarif tiers mais pas le lire
   - Apres: lecture coherente avec les droits admin
   - Statut: corrige

5. Code mort confirme par lint supprime
   - `src/app/api/admin/control-tower/route.ts`
   - `src/app/dashboard/admin/AdminPeopleWorkspace.tsx`
   - Statut: corrige

6. Artefacts et routes mortes supprimes
   - ` img.currentSrc`
   - ` b.getAttribute('aria-label')).slice(-3)})`
   - `src/app/dashboard/Attached Element Context from Integrated.txt`
   - `src/app/dashboard/provider/planning/Attached Element Context from Integrated.txt`
   - `src/app/api/places/route.js`
   - `src/app/tests/test-status/page.tsx`
   - `src/app/tests/test-certification/page.tsx`
   - `src/app/dashboard/concierge/services-packages/seed/page.tsx`
   - `src/app/tests/test-status/StatusTestPage.module.scss`
   - Statut: corrige

7. Stabilisation outillage
   - warnings React corriges dans `src/app/dashboard/provider/page.tsx`
   - bandeau dashboard migre vers `next/image` dans `src/app/dashboard/layout.tsx`
   - snapshot UI regenere dans `src/tests/ui-files.snapshot.json`
   - Statut: corrige

## Dette restante

### A confirmer fonctionnellement

1. Modules SCSS probablement orphelins
   - `src/app/components/blog/BlogPreviewList.module.scss`
   - `src/app/components/layout/Home/BlogNewsSection/BlogNewsSection.module.scss`
   - `src/app/components/layout/MapPopup/MapPopup.module.scss`
   - `src/app/components/ui/Confetti/Confetti.module.scss`
   - `src/app/dashboard/concierge/fiche/FicheConciergerie.module.scss`
   - `src/app/dashboard/concierge/_components/ConciergeWorkspace.module.scss`
   - `src/app/dashboard/owner/logements/OwnerLogementsPage.module.scss`
   - `src/app/dashboard/owner/_components/OwnerWorkspace.module.scss`
   - Note: ils ne sont pas tous supprimes automatiquement car certains composants associes sont encore utilises.

2. Fallbacks service role placeholder
   - `src/server/db/dbServer.ts`
   - `src/server/auth/authOptions.ts`
   - `src/app/api/provider/shared.ts`
   - Recommandation: remplacer a terme par un echec explicite de configuration sur les surfaces critiques.

3. Heterogeneite structurelle encore presente entre certaines familles d'API
   - `pricing/*` utilise son `_shared`
   - `services/*` utilise son `_shared`
   - `quotes/[id]/document` et `invoices/[id]/document` gardent une auth locale via token/session
   - Recommandation: converger progressivement vers une convention unique documentee.

## Verification finale

### Lint

Commande:

```powershell
npm.cmd run lint
```

Resultat final:

- `0` erreur
- `0` warning

### Tests

Commande:

```powershell
npm.cmd test
```

Resultat final:

- `118` tests passent
- `0` test echoue

## Conclusion

L'audit ne s'est pas limite a un constat: les points critiques et la plus grande partie de la dette immediate ont ete traites dans la foulee. Le projet est maintenant dans un etat nettement plus sain: routes auth normalisees, endpoint de dev mieux verrouille, nettoyage du bruit technique, permissions plus coherentes, et outillage completement vert.
