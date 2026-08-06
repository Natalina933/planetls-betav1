# Contexte technique PlanetLS

- Repo monolithique Next.js avec App Router.
- Types et logique utilitaire souvent regroupes dans `src/app`, `src/server` et `src/tests`.
- Les routes API admin et les pages serveur lisent deja des fichiers du depot pour le Master Plan et des vues de pilotage.
- L'ajout d'une dependance lourde pour parser des prompts n'est pas souhaite si un parseur maison simple suffit.
- Les tests actuels utilisent `node --test` et doivent rester rapides a executer localement.
