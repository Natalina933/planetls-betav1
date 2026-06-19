# Matrice de validation profils par role

Date: 2026-06-19

## Objectif

Definir les regles de validation cibles pour les mises a jour de profils, role par role.

Cette matrice sert de base pour:

- l'issue GitHub `#15`
- le durcissement de `PATCH /api/profiles`
- les tests de permissions et validations

## Portee

Cette version couvre les roles metier principaux:

- `owner`
- `owner_pro`
- `concierge`
- `concierge_pro`
- `artisan`
- `artisan_pro`
- `provider`
- `provider_pro`

Les roles `admin` et `super_admin` sont traites comme cas a part:

- ils peuvent corriger ou administrer
- mais ne doivent pas contourner les schemas de forme sans raison

## Principe de validation

Chaque mise a jour profil doit etre evaluee selon 4 axes:

1. `Champs autorises`
2. `Champs interdits`
3. `Contraintes de forme`
4. `Contraintes de coherence metier`

## Strategie recommandee

### Phase 1 - Durcissement immediat

Objectif:

- filtrer par role
- empecher les ecritures manifestement hors scope
- conserver une compatibilite legacy minimale

### Phase 2 - Durcissement cible

Objectif:

- appliquer des schemas plus stricts par section
- sortir les donnees critiques des champs polymorphes

## 1. Socle commun a tous les roles

### Champs modifiables par tous les utilisateurs sur leur propre profil

| Champ | Regle |
| --- | --- |
| `username` | autorise, string non vide, format propre |
| `first_name` | autorise, string non vide |
| `last_name` | autorise, string non vide |
| `phone` | autorise, string ou null |
| `avatar_url` | autorise, string ou null |
| `avatar_scale` | autorise, number ou null |
| `avatar_offset_x` | autorise, number ou null |
| `avatar_offset_y` | autorise, number ou null |
| `avatar_rotation` | autorise, number ou null |
| `street_address` | autorise, string ou null |
| `postal_code` | autorise, string ou null |
| `city` | autorise, string ou null |
| `country` | autorise, string ou null |
| `website` | autorise selon role et pertinence |
| `linkedin` | autorise selon role et pertinence |
| `facebook` | autorise selon role et pertinence |
| `instagram` | autorise selon role et pertinence |

### Champs jamais modifiables librement par l'utilisateur via le schema standard

| Champ | Regle |
| --- | --- |
| `id` | interdit |
| `email` | interdit dans `PATCH /api/profiles`, gere ailleurs |
| `created_at` | interdit |
| `updated_at` | interdit en entree |
| `status` | interdit |
| `role` | interdit sauf admin |
| `onboarding_completed_at` | interdit en ecriture directe |
| `certification_*` | interdit sauf admin / workflow backoffice |

## 2. Schema cible - Owner / Owner Pro

### Champs autorises

| Section cible | Champs autorises immediatement | Champs cibles futurs |
| --- | --- | --- |
| Profil > Identite | `username`, `first_name`, `last_name`, `phone`, `avatar_url`, reglages avatar | idem |
| Profil > Presence locale | `street_address`, `postal_code`, `city`, `country` | idem |
| Profil > Presentation | `additional_info` | `owner_profile_bio` si separation future |
| Profil > Structure | `company_name`, `legal_form` pour `owner_pro` | idem |
| Profil > Liens | `website` si pertinent | idem |
| Preferences owner | aucun champ stable direct aujourd'hui hormis legacy | futurs champs dedies type `owner_goal`, `collaboration_type`, `responsibility_level`, `frequency`, `property_context` |
| Orientation legacy | `search_target` seulement en compatibilite | a sortir du schema principal ensuite |

### Champs interdits pour owner

| Champ | Pourquoi |
| --- | --- |
| `category` | ne doit pas servir au proprietaire comme champ metier editable libre |
| `service_area` | reserve aux roles operateurs, sauf futur besoin explicite |
| `service_radius_km` | reserve aux roles operateurs |
| `hourly_rate` | hors scope owner |
| `monthly_rate` | hors scope owner |
| `travel_fee` | hors scope owner |
| `availability_hours` | ne doit pas rester la source principale des preferences owner |
| `option` | trop ambigu pour owner |
| `insurance_number` | hors scope owner standard |
| `insurance_company` | hors scope owner standard |
| `siret`, `siren`, `vat_number` | sauf `owner_pro` si besoin explicitement retenu |
| `emergency_service` | hors scope owner |
| `years_experience`, `experience_level` | hors scope owner |
| `iban`, `bic` | hors scope owner standard via ce formulaire |

### Champs requis pour considerer une mise a jour owner valide

Pas d'obligation que tous soient presents dans chaque patch partiel, mais le schema de profil complet doit pouvoir verifier:

- `first_name`
- `last_name`
- `phone`
- `city`
- `country`

### Contraintes de coherence owner

- `owner` ne peut pas modifier de champs operateur
- les preferences owner ne doivent plus etre ecrites durablement dans `availability_hours`
- `search_target` doit etre tolere seulement comme legacy transitoire

## 3. Schema cible - Concierge / Concierge Pro

### Champs autorises

| Section cible | Champs autorises immediatement | Champs cibles futurs |
| --- | --- | --- |
| Profil > Identite | socle commun | idem |
| Profil > Marque | `company_name` | idem |
| Profil > Presence locale | `street_address`, `postal_code`, `city`, `country`, `location` | `location` a normaliser puis reduire |
| Profil > Presentation | `additional_info`, `website`, `linkedin`, `facebook`, `instagram` | idem |
| Profil > Conformite | `legal_form`, `siret`, `siren`, `vat_number`, `insurance_number`, `insurance_company`, `certifications` | idem mais schemas plus stricts |
| Zone d'intervention | `service_area`, `service_radius_km` | idem |
| Services / Offre | `hourly_rate`, `monthly_rate`, `travel_fee` | idem |
| Disponibilites | `availability_hours`, `emergency_service` | a restreindre ensuite au sous-domaine planning |
| Experience | `years_experience`, `experience_level` | idem |
| Paiement | `iban`, `bic` | peut etre deplace vers un sous-formulaire dedie plus tard |

### Champs interdits pour concierge

| Champ | Pourquoi |
| --- | --- |
| `search_target` | n'est pas une donnee metier concierge stable |
| `option` | trop ambigu, a remplacer par un domaine services |
| `category` | ne doit pas etre librement manipule pour porter le role |
| `onboarding_completed_at` | derive |
| `status` | reserve admin |

### Champs requis pour considerer une mise a jour concierge valide

Pour un profil complet, il faut pouvoir verifier:

- `first_name`
- `last_name`
- `phone`
- `company_name`
- `city` ou `service_area`
- `service_area`
- `availability_hours` avec signal de planning exploitable

### Contraintes de coherence concierge

- si `service_radius_km` est defini, `service_area` ne doit pas etre vide
- `hourly_rate`, `monthly_rate`, `travel_fee` doivent etre positifs ou null
- `experience_level` doit etre dans la liste autorisee
- `availability_hours` doit etre accepte seulement comme legacy transitoire global

## 4. Schema cible - Artisan / Provider

### Champs autorises

| Section cible | Champs autorises immediatement | Champs cibles futurs |
| --- | --- | --- |
| Profil > Identite | socle commun | idem |
| Profil > Structure | `company_name` | idem |
| Profil > Presence locale | `street_address`, `postal_code`, `city`, `country`, `location` | `location` a normaliser |
| Profil > Presentation | `additional_info` | presentation metier dediee plus tard |
| Metier principal | `category` en compatibilite transitoire | futur `primary_trade` |
| Zone d'intervention | `service_area`, `service_radius_km` | idem |
| Disponibilites | `availability_hours` | futur sous-schema plus clair |
| Experience | `years_experience`, `experience_level` | idem |
| Liens publics | `website`, `linkedin`, `facebook`, `instagram` | idem |

### Champs autorises avec reserve forte

| Champ | Reserve |
| --- | --- |
| `hourly_rate` | autorisable seulement si le produit confirme cette brique pour artisan |
| `travel_fee` | idem |
| `option` | uniquement legacy transitoire, ne pas etendre |

### Champs interdits pour artisan/provider

| Champ | Pourquoi |
| --- | --- |
| `legal_form` | a autoriser seulement si vraie cible pro retenue pour artisan |
| `siret`, `siren`, `vat_number` | idem, ne pas ouvrir par defaut tant que le parcours n'est pas cadre |
| `insurance_number`, `insurance_company` | idem, a ouvrir seulement si section conformite artisan est explicite |
| `monthly_rate` | plutot concierge pour l'etat actuel |
| `search_target` | hors scope artisan |
| `onboarding_completed_at` | derive |
| `status` | reserve admin |

### Champs requis pour considerer une mise a jour artisan valide

Pour un profil complet, il faut pouvoir verifier:

- `first_name`
- `last_name`
- `phone`
- `city`
- `category` tant que le metier principal n'a pas ete remplace
- `service_area`
- `availability_hours` avec minimum de disponibilite declaree

### Contraintes de coherence artisan

- si `service_radius_km` est defini, `service_area` ne doit pas etre vide
- `category` ne doit pas etre utilise pour changer de role
- `availability_hours` reste transitoire, ne pas y ajouter de nouvelles preferences non liees a la disponibilite

## 5. Schema admin

### Champs autorises pour admin

Un admin peut corriger:

- tous les champs de profil visibles dans `CURRENT_PROFILE_SELECT`
- `role`
- `status`
- champs de certification / verification

### Contraintes admin recommandees

- l'admin doit passer par les memes validations de forme que les utilisateurs
- seul le perimetre de champs autorises change
- les mutations admin doivent rester traceables si un audit est mis en place plus tard

## 6. Matrice synthetique par champ

| Champ | Owner | Concierge | Artisan/Provider | Admin |
| --- | --- | --- | --- | --- |
| `username` | Oui | Oui | Oui | Oui |
| `first_name` | Oui | Oui | Oui | Oui |
| `last_name` | Oui | Oui | Oui | Oui |
| `phone` | Oui | Oui | Oui | Oui |
| `avatar_url` + reglages avatar | Oui | Oui | Oui | Oui |
| `additional_info` | Oui | Oui | Oui | Oui |
| `company_name` | Oui, surtout `owner_pro` | Oui | Oui | Oui |
| `legal_form` | Oui, `owner_pro` seulement si retenu | Oui | Plus tard / non par defaut | Oui |
| `street_address` | Oui | Oui | Oui | Oui |
| `postal_code` | Oui | Oui | Oui | Oui |
| `city` | Oui | Oui | Oui | Oui |
| `country` | Oui | Oui | Oui | Oui |
| `website` | Limite / si pertinent | Oui | Oui | Oui |
| `linkedin` | Limite / si pertinent | Oui | Oui | Oui |
| `facebook` | Limite / si pertinent | Oui | Oui | Oui |
| `instagram` | Limite / si pertinent | Oui | Oui | Oui |
| `category` | Non | Non par defaut | Oui, transitoire | Oui |
| `location` | Oui, transitoire | Oui, transitoire | Oui, transitoire | Oui |
| `option` | Non | Legacy seulement | Legacy seulement | Oui |
| `search_target` | Legacy seulement | Non | Non | Oui |
| `service_area` | Non | Oui | Oui | Oui |
| `service_radius_km` | Non | Oui | Oui | Oui |
| `availability_hours` | Non | Oui, transitoire | Oui, transitoire | Oui |
| `hourly_rate` | Non | Oui | A confirmer | Oui |
| `monthly_rate` | Non | Oui | Non par defaut | Oui |
| `travel_fee` | Non | Oui | A confirmer | Oui |
| `emergency_service` | Non | Oui | Plus tard / a confirmer | Oui |
| `years_experience` | Non | Oui | Oui | Oui |
| `experience_level` | Non | Oui | Oui | Oui |
| `siret` / `siren` / `vat_number` | Limite au `owner_pro` si besoin reel | Oui | Non par defaut | Oui |
| `insurance_*` | Non | Oui | Non par defaut | Oui |
| `certifications` | Non | Oui | Plus tard / a cadrer | Oui |
| `iban` / `bic` | Non | Oui | Non par defaut | Oui |
| `role` | Non | Non | Non | Oui |
| `status` | Non | Non | Non | Oui |
| `onboarding_complete` | Oui si flux explicite | Oui si flux explicite | Oui si flux explicite | Oui |
| `onboarding_completed_at` | Non direct | Non direct | Non direct | Oui |

## 7. Contraintes de forme communes

### Strings

- trim automatique
- chaine vide convertie en `null` pour les champs nullable quand pertinent
- longueur max explicite par champ

### Numbers

- nombre fini uniquement
- valeurs negatives interdites pour:
  - `service_radius_km`
  - `hourly_rate`
  - `monthly_rate`
  - `travel_fee`
  - `years_experience`

### Enums

- `experience_level` dans `debutant | intermediaire | experimente`
- `role` uniquement pour admin, dans la liste autorisee

### Localisation

- si `location`, `service_area` ou `city` changent, la normalisation commune continue de s'appliquer
- `service_area` et `city` ne doivent pas se contredire grossierement

## 8. Recommandation d'implementation

### Etape 1 - Filtrer les champs par role

Introduire une whitelist par role avant toute validation detaillee.

### Etape 2 - Appliquer un schema par role

Exemples:

- `ownerProfilePatchSchema`
- `conciergeProfilePatchSchema`
- `artisanProfilePatchSchema`
- `adminProfilePatchSchema`

### Etape 3 - Gerer explicitement le legacy

Traiter a part:

- `option`
- `search_target`
- `location`
- `availability_hours`

avec un commentaire de transition et une date cible de reduction si possible.

## 9. Definition de done pour #15

L'issue `#15` peut etre consideree comme couverte si:

- une whitelist de champs existe par role
- un schema de validation existe par role
- les champs hors scope sont rejetes ou ignores explicitement
- les contraintes numeriques et enum sont unifiees
- le traitement legacy est documente et borne

## 10. Suite recommandee

Apres cette matrice:

1. implementer les schemas dans `PATCH /api/profiles`
2. traiter `#16` et `#17` en code et en tests
3. preparer les futurs champs dedies pour `Preferences Proprietaire` et `Profil Artisan`
