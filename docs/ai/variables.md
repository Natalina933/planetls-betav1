# Variables standardisees des prompts PlanetLS

## Variables obligatoires frequentes

- `{{PAGE_PATH}}` : page ou route concernee
- `{{CURRENT_PROBLEM}}` : probleme observe aujourd'hui
- `{{EXPECTED_RESULT}}` : resultat attendu concret
- `{{KNOWN_FILES}}` : fichiers a lire en priorite

## Variables facultatives frequentes

- `{{MODULE_NAME}}` : nom de module ou fonctionnalite
- `{{TARGET_USERS}}` : profils concernes
- `{{BUSINESS_PRIORITY}}` : priorite business du moment
- `{{CONSTRAINTS}}` : contraintes fonctionnelles ou techniques
- `{{DEADLINE}}` : echeance si elle existe
- `{{SUCCESS_SIGNAL}}` : preuve attendue de reussite

## Regles d'usage

- Preferer des formulations lisibles par la fondatrice.
- Utiliser une valeur par defaut quand cela evite un champ vide inutile.
- Ne pas multiplier les variables si un fichier de contexte suffit.
