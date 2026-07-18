# PlanetLS Beta

Plateforme Next.js pour la mise en relation et la gestion operationnelle entre proprietaires, concierges et prestataires (artisans/providers).

## Stack technique

- Next.js App Router (`src/app`)
- React 19 + TypeScript
- Supabase (auth + base de donnees)
- NextAuth (session JWT)
- Sass modules
- Node test runner (`src/tests/*.test.mts`)

## Prerequis

- Node.js 20+
- npm 10+
- Projet Supabase configure

## Installation

```bash
npm install
```

## Variables d'environnement

Configurer `.env.local` (ne pas versionner les secrets) :

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
AUTH_SECRET=... # optionnel, fallback

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

GOOGLE_CLIENT_ID=... # optionnel
GOOGLE_CLIENT_SECRET=... # optionnel

STRIPE_SECRET_KEY=... # si billing actif
STRIPE_WEBHOOK_SECRET=... # si webhook actif
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=... # cle publique Stripe
```

Copier `.env.example` vers `.env.local`, puis renseigner uniquement des clés Stripe de test
(`sk_test_`, `pk_test_`, `whsec_`) pour valider Checkout. Ne jamais utiliser une clé
`sk_live_` dans les tests locaux ou E2E.

## Commandes

```bash
npm run dev      # developpement
npm run lint     # lint ESLint
npm test         # tests unitaires/helpers
npm run build    # build production
npm run start    # lancer build en local
```

## Architecture (resume)

- `src/app` : pages, layouts, routes API.
- `src/app/api` : endpoints metier (billing, profils, housing, provider, messages, etc.).
- `src/app/dashboard` : interfaces par role (owner, concierge, provider, admin).
- `src/app/components` : composants UI et blocs metier.
- `src/app/lib` : auth, acces DB, utilitaires serveur.
- `src/tests` : tests unitaires des helpers metier.
- `database/migrations` et `supabase/migrations` : SQL et migrations.

## Authentification et roles

- Auth via NextAuth (`/api/auth/[...nextauth]`) + Supabase.
- Protection dashboard via `src/proxy.ts`.
- Roles supportes : `owner`, `owner_pro`, `concierge`, `concierge_pro`, `provider`, `provider_pro`, `artisan`, `artisan_pro`, `admin`, `super_admin`.

## Donnees et migrations

- `supabase/migrations` est la source canonique de toute nouvelle migration ; `database/migrations` est une archive historique gelee.
- Executer `npm run check:migrations` pour verifier cette gouvernance avant integration.
- Les endpoints provider/concierge supposent les tables SQL en place.
- Si une table provider est absente, les APIs renvoient une erreur explicite indiquant d'appliquer les migrations.
- Generer/mettre a jour les types Supabase avant gros changements de schema.

## Deploiement

### Option 1: Vercel

1. Importer le repo.
2. Ajouter les variables d'environnement de production.
3. Lancer le deploy (`next build` est execute par Vercel).

### Option 2: Node server

```bash
npm ci
npm run build
npm run start
```

## Qualite recommandee avant merge

```bash
npm run lint && npm test && npm run build
```

## Notes importantes

- Ne pas stocker de secrets dans des fichiers du repo.
- Eviter les donnees de demonstration en production.
- Conserver les pages `/tests/*` reservees aux validations internes.
