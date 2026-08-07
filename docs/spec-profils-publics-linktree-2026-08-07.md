# Spec produit — Mini-page publique type Linktree pour profils PlanetLS

Date : 2026-08-07
Statut : `🟡 En cours`
Priorité proposée : `P2 Important`
Périmètre V1 : profils publics de concierges

## 1. Problème

PlanetLS expose déjà des profils publics, mais la page actuelle aide surtout à lire un profil. Elle aide moins à agir vite après une découverte via réseau social, bouche-à-oreille, QR code ou message direct.

Le besoin n'est pas de cloner Linktree comme produit autonome. Le besoin est de rendre chaque profil public plus actionnable avec une mini-page claire qui regroupe les liens utiles.

## 2. Objectif

Transformer la page publique concierge en point d'entrée simple vers :

- la prise de contact,
- le site vitrine de la conciergerie,
- ses réseaux sociaux,
- et, plus tard, ses preuves de confiance ou ses CTA métier.

## 3. Décision produit

La bonne approche est une extension des profils publics existants, pas un nouveau module séparé.

Raisons :

- les données de liens existent déjà dans `profiles`,
- l'URL publique concierge existe déjà,
- la V1 peut être livrée sans migration Supabase,
- la cohérence produit reste meilleure qu'avec un outil parallèle.

## 4. V1 livrée dans ce lot

V1 branchée le 2026-08-07 :

- exposition publique de `website`, `linkedin`, `instagram`, `facebook` via `/api/profiles/public/[id]`,
- ajout d'un bloc `Liens utiles` sur `/concierges/[id]`,
- bouton hero `Visiter le site` quand le site web est renseigné,
- ajout d'une section `Actions recommandées` avec CTA structurés,
- instrumentation légère des clics CTA via un endpoint public dédié,
- normalisation des URLs via un helper partagé,
- test pur dédié sur l'extraction et l'ordre des liens.

## 5. Ce que la V1 ne fait pas encore

- pas de slug public personnalisé supplémentaire,
- pas de tri manuel des liens,
- pas d'analytics de clics,
- pas de CTA métier dédiés `WhatsApp`, `Calendly`, `demander un devis`,
- pas de modération spécifique des URLs au-delà des contrôles actuels,
- pas d'ouverture aux profils provider ou owner.

## 6. Recommandation de priorité

Priorité proposée : `P2 Important`.

Pourquoi pas `P0` ou `P1` :

- cela améliore l'acquisition et la conversion, mais ne débloque pas un parcours transactionnel critique,
- le produit a encore des urgences plus structurantes côté E2E, persistance et gouvernance Supabase.

Pourquoi pas `P3` :

- l'effort est faible,
- le gain de lisibilité publique est immédiat,
- la brique soutient la stratégie réseau professionnel et les futures pages d'acquisition locales.

## 7. Étapes V2/V3 recommandées

### V2

- ajouter des CTA métier structurés par rôle,
- afficher un lien public partageable plus explicitement dans le dashboard profil,
- agréger et exploiter les clics sortants dans un cockpit acquisition,
- préparer l'ouverture aux artisans/prestataires.

### V3

- personnalisation de l'ordre des liens,
- CTA conditionnels par objectif `prise de rendez-vous`, `devis`, `appel`,
- preuves publiques plus fortes `badges, documents validés, avis vérifiés`,
- déclinaisons SEO par zone et besoin.

## 8. Risques et garde-fous

- Ne pas faire croire qu'un lien externe vaut vérification métier.
- Garder la page publique centrée sur la décision professionnelle, pas sur un réseau social générique.
- Éviter d'ouvrir trop vite des champs libres supplémentaires sans modération ni mesure d'usage.

## 9. Décision provider

Décision du vendredi 7 août 2026 : ne pas ouvrir tout de suite cette mini-page publique aux profils provider.

Motifs :

- le profil public concierge est aujourd'hui plus mûr côté acquisition,
- les CTA provider pertinents diffèrent `appel, devis, disponibilité, intervention, urgence`,
- le profil provider reste encore partiel sur plusieurs signaux publics de confiance `documents validés, réputation, spécialités, portfolio`.

Condition d'ouverture recommandée :

- finir d'abord la consolidation du profil provider public,
- clarifier les CTA métier utiles,
- puis étendre la mécanique de tracking avec une lecture séparée concierge/provider.
