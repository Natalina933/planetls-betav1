# Runs IA PlanetLS

Ce dossier permet de conserver des resumes utiles d'utilisations de prompts, sans enregistrer toute une conversation.

## Structure recommandee

```text
docs/ai/runs/
└── 2026/
    └── 08/
        └── 2026-08-03-example-run/
            ├── input.md
            ├── result.md
            └── metadata.json
```

## Contenu minimal de `metadata.json`

- `id`
- `promptId`
- `promptVersion`
- `objective`
- `summary`
- `modifiedFiles`
- `tests`
- `decisions`
- `limitations`
- `nextActions`
- `createdAt`

## Regles

- Ne pas stocker de secret, token, cookie ou donnee personnelle sensible
- Garder un resume utile, pas un transcript integral
- Preferer un enregistrement seulement pour les runs importants
