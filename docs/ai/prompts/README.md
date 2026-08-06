# Bibliotheque de prompts PlanetLS

La bibliotheque regroupe les prompts Codex utiles a PlanetLS sans dupliquer le contexte stable du projet.

## Principe

- Les fichiers Markdown dans `docs/ai/prompts/` sont la source officielle.
- Les contextes communs sont references via `../planetls-context.md`, `../codex-rules.md` et les contextes modulaires.
- L'interface `Centre IA` de `Pilotage Business` lit cette bibliotheque ; elle ne la remplace pas.

## Comment choisir un prompt

- Commencer par la categorie la plus proche du besoin.
- Verifier le champ `Quand utiliser`.
- Verifier le statut et le niveau de risque.
- Renseigner les variables minimales avant copie.

## Comment creer ou modifier un prompt

- Partir de [`_template.md`](./_template.md)
- Reutiliser le contexte central plutot que recopier PlanetLS
- Incrementer la version
- Mettre a jour `updatedAt`
- Ajouter la provenance et l'historique court

## Versionnage

- `MAJOR` : changement important de methode ou structure
- `MINOR` : ajout significatif
- `PATCH` : correction, clarification ou precision

## Archivage

- `active` : prompt pret a l'emploi
- `draft` : en construction
- `needs-review` : utile mais a revoir apres usage
- `deprecated` : encore lisible mais plus recommande
- `archived` : conserve pour l'historique

## Index initial

| Prompt | Categorie | Usage | Statut | Version |
| --- | --- | --- | --- | --- |
| `ux-page-refactor` | `ux-ui` | Ameliorer une page existante | `active` | `1.0.0` |
| `owner-concierge-journey-audit` | `product` | Auditer un parcours metier | `active` | `1.0.0` |
| `workflow-payments-audit` | `quality` | Auditer demandes, devis, missions, paiements | `active` | `1.0.0` |
| `subscription-strategy` | `business` | Cadrer abonnement, prix et tests | `active` | `1.0.0` |
| `risks-opportunities-review` | `business` | Analyser risques et opportunites | `active` | `1.0.0` |
| `lean-validation-30-days` | `business` | Lancer une validation terrain frugale | `active` | `1.0.0` |
| `technical-audit` | `technical` | Auditer architecture, roles et dette | `active` | `1.0.0` |
| `predeployment-regression` | `quality` | Verifier avant release | `active` | `1.0.0` |
| `documentation-update` | `documentation` | Mettre a jour docs et preuves | `active` | `1.0.0` |
| `master-plan-update` | `project-management` | Mettre a jour le pilotage officiel | `active` | `1.0.0` |

## Categories

- `business/`
- `documentation/`
- `product/`
- `project-management/`
- `quality/`
- `technical/`
- `ux-ui/`

## Resultats et runs

Les resultats utiles peuvent etre resumes dans `docs/ai/runs/` avec un `metadata.json` leger, sans stocker une conversation complete.
