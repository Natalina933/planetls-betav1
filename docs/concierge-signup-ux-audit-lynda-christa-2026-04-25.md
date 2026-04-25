# Audit du début d'expérience (inscription) — Lynda & Christa

_Date: 25 avril 2026_

## Objectif
Vérifier si le **début du parcours utilisateur** est bien orienté pour deux profils concierge très différents:
- **Lynda** (50 ans, peu à l'aise avec le digital, contraintes visuelles et mobilité locale),
- **Christa** (40 ans, expérimentée, orientée efficacité, gestion multi-biens).

---

## 1) Ce que tu as déjà bien construit sur l'inscription

### Points forts du parcours actuel
1. **Parcours progressif en étapes** (catégorie → expérience → services → coordonnées) au lieu d'un gros formulaire unique.
2. **Validation de localisation** avec suggestions de villes reconnues (réduit les erreurs d'adresse libre).
3. **Pré-remplissage et récapitulatif** avant finalisation du compte.
4. **Validation côté API** solide (schéma, contrôles, rôle calculé, vérification username).
5. **Connexion automatique après inscription** pour réduire la friction de reprise.

👉 Pour un MVP/mid-stage, la structure est déjà sérieuse.

---

## 2) Analyse persona par persona sur le début d'expérience

## A. Lynda — Est-ce que le démarrage est rassurant et simple ?

### Ce qui fonctionne pour elle
- Le découpage en popups limite l'effet "mur d'informations".
- Les textes de guidance existent (ex: ville reconnue).

### Ce qui peut bloquer Lynda dès le départ
1. **Trop de modales successives**: l'utilisateur peut se perdre (où j'en suis ? combien d'étapes restantes ?).
2. **Libellés encore trop techniques**: certains mots ne sont pas orientés "terrain".
3. **Accessibilité pas explicite dès l'entrée**: pas de mode contraste/texte agrandi dans l'onboarding.
4. **Périmètre local non matérialisé tôt**: elle a une contrainte de zone, mais elle n'est pas présentée comme un garde-fou rassurant.

### Optimisations recommandées (priorité haute)
- Ajouter une **barre d'étapes** visible: _Étape 2/5_.
- Activer un **mode lisibilité** dès la première étape (texte XL + contraste fort).
- Afficher une micro-promesse claire: _"On vous proposera des missions proches de chez vous."_
- Ajouter un réglage simple: **"Rayon max"** dès l'inscription concierge.

---

## B. Christa — Est-ce que le démarrage est utile et rapide ?

### Ce qui fonctionne pour elle
- Le parcours collecte des informations pertinentes (expérience, services, zone).
- Le récapitulatif est utile avant confirmation.

### Ce qui peut frustrer Christa
1. **Pas de mode “rapide”**: elle veut aller vite, or le tunnel impose toutes les étapes.
2. **Pas d'import initial**: aucune possibilité d'importer ses bases (Excel/CSV) dès l'onboarding.
3. **Manque de projection business immédiate**: on ne montre pas ce qu'elle gagnera après inscription (packs, multi-biens, pilotage).

### Optimisations recommandées (priorité haute)
- Ajouter un **onboarding express** (2-3 écrans max) pour profils expérimentés.
- Proposer "**Importer mes données plus tard**" + CTA post-inscription.
- Ajouter un écran final orienté action: _Créer 1er bien_ / _Créer 1re offre_ / _Inviter un propriétaire_.

---

## 3) Points techniques à corriger pour sécuriser l'expérience de départ

## Correctifs déjà appliqués dans ce lot
1. **Redirection post-inscription alignée avec la catégorie** (concierge → dashboard concierge, etc.), au lieu d'une redirection unique owner.
2. **Payload d'inscription corrigé**: `additionalInfo` envoyé avec la clé attendue par l'API.
3. **Gestion d'échec de connexion auto**: message explicite + redirection vers login.

Ces 3 points évitent des incohérences qui cassent la perception "pro" dès les premières minutes.

---

## 4) Diagnostic global: est-ce que tu pars bien ?

### Réponse courte
**Oui, tu pars bien**: l'architecture du tunnel d'inscription est déjà propre et suffisamment robuste pour itérer vite.

### Ce qu'il te manque pour un “excellent départ UX”
- **Pour Lynda**: plus de repères visuels, plus de simplicité lexicale, et une promesse locale rassurante.
- **Pour Christa**: un mode rapide, une perspective business immédiate, et une passerelle vers ses outils existants.

---

## 5) Backlog ultra-prioritaire (prochain sprint)

1. Afficher un **stepper d'onboarding** (1 semaine).
2. Ajouter un **mode lisibilité** sur onboarding (1 semaine).
3. Introduire un champ **rayon d'intervention** dès inscription concierge (1-2 semaines).
4. Créer un **onboarding express expert** (2 semaines).
5. Ajouter un écran post-inscription avec **3 CTA métier** (quelques jours).

Si ces 5 éléments sont livrés, ton entrée en expérience passera d'un bon niveau MVP à une UX bien plus personnalisée par persona.
