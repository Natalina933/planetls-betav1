# Cartographie des champs profils

Date: 2026-06-19

## Objectif

Cartographier les champs actuellement utilises dans les profils utilisateurs et les relier a la cible validee par persona.

Cette cartographie sert de base pour:

- l'issue GitHub `#11`
- la validation par role
- la refonte des ecrans profils
- la reduction de la dette de modelisation

## Sources principales

- `src/server/profiles/currentProfile.ts`
- `src/app/api/profiles/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/service-requests/route.ts`
- `src/app/api/profiles/workspaces/route.ts`
- `src/features/onboarding-assistant/onboardingPayload.ts`

## Legende

- `Conserver`: champ deja coherent avec la cible
- `Rattacher`: champ a rattacher a une section cible plus claire
- `Normaliser`: champ utile mais trop ambigu ou trop transversal
- `Migrer`: information utile stockee aujourd'hui au mauvais endroit
- `Limiter`: champ a garder seulement en compatibilite legacy

## 1. Socle profil actuellement expose

Le socle actuellement expose par `CURRENT_PROFILE_SELECT` couvre:

- identite
- avatar
- presentation
- role et orientation
- entreprise / legal
- adresse
- reseaux
- assurances / certifications
- zone et disponibilites
- tarification
- experience
- banque
- onboarding

Le probleme principal n'est pas le manque de champs, mais leur melange entre:

- donnees identitaires
- donnees metier
- preferences d'onboarding
- signaux de workspace
- donnees commerciales

## 2. Cartographie du socle commun

| Champ actuel | Usage actuel | Role(s) actuel(s) | Destination cible | Action |
| --- | --- | --- | --- | --- |
| `id` | identifiant profil | tous | socle technique | Conserver |
| `created_at` | historique | tous | socle technique | Conserver |
| `updated_at` | historique | tous | socle technique | Conserver |
| `username` | identite publique / login secondaire | tous | Profil > Identite | Conserver |
| `first_name` | identite | tous | Profil > Identite | Conserver |
| `last_name` | identite | tous | Profil > Identite | Conserver |
| `email` | contact / auth | tous | Profil > Identite | Conserver |
| `phone` | contact | tous | Profil > Identite | Conserver |
| `avatar_url` | avatar principal | tous | Profil > Identite visuelle | Conserver |
| `image` | alias ou fallback image | tous | compatibilite avatar | Limiter |
| `avatar_scale` | recadrage avatar | tous | parametres UI avatar | Conserver |
| `avatar_offset_x` | recadrage avatar | tous | parametres UI avatar | Conserver |
| `avatar_offset_y` | recadrage avatar | tous | parametres UI avatar | Conserver |
| `avatar_rotation` | recadrage avatar | tous | parametres UI avatar | Conserver |
| `avatar_width` | dimensions avatar | tous | parametres UI / legacy | Limiter |
| `avatar_height` | dimensions avatar | tous | parametres UI / legacy | Limiter |
| `street_address` | adresse | owner, concierge, artisan | Profil > Presence locale / facturation | Conserver |
| `postal_code` | adresse | owner, concierge, artisan | Profil > Presence locale | Conserver |
| `city` | ancrage local | owner, concierge, artisan | Profil > Presence locale | Conserver |
| `country` | adresse | owner, concierge, artisan | Profil > Presence locale | Conserver |
| `website` | lien public | concierge, artisan, owner pro eventuel | Profil > Presentation / Structure | Conserver |
| `linkedin` | reseau social | concierge, artisan | Profil > Presentation | Conserver |
| `facebook` | reseau social | concierge, artisan | Profil > Presentation | Conserver |
| `instagram` | reseau social | concierge, artisan | Profil > Presentation | Conserver |
| `additional_info` | texte libre tres transversal | tous | Profil > Presentation ou champ dedie par persona | Normaliser |
| `role` | role principal de securite / routing | tous | socle d'autorisation | Conserver |
| `status` | statut de compte | tous | socle lifecycle | Conserver |

## 3. Champs de classification et de routage aujourd'hui ambigus

| Champ actuel | Usage actuel | Role(s) actuel(s) | Destination cible | Action |
| --- | --- | --- | --- | --- |
| `category` | categorie metier, type de profil, orientation artisan/concierge/owner | tous | `metier principal` artisan, `categorie publique` si necessaire, plus role clair | Normaliser |
| `location` | ville ou zone libre saisie | owner, concierge, artisan | remplacer par `city` + `service_area` selon contexte | Rattacher |
| `service_area` | zone d'intervention ou ville | concierge, artisan | Zone d'intervention > Zone principale | Conserver puis normaliser |
| `service_radius_km` | rayon d'intervention | concierge, artisan | Zone d'intervention > Rayon | Conserver |
| `search_target` | orientation de recherche / workspace hints | owner et multi-workspace | Preferences owner ou lien de workspace selon usage | Normaliser |
| `option` | services choisis, categories, hints divers | concierge, owner onboarding, workspace detection | remplacer par `services actifs`, `preferences services`, ou champ dedie | Migrer |

## 4. Champs entreprise, legal et confiance

| Champ actuel | Usage actuel | Role(s) actuel(s) | Destination cible | Action |
| --- | --- | --- | --- | --- |
| `company_name` | marque commerciale ou structure | concierge, artisan, owner pro | Profil > Structure / Marque | Conserver |
| `legal_form` | forme legale | concierge principalement | Profil > Structure legale | Conserver |
| `siret` | identification legale | concierge | Profil > Conformite | Conserver |
| `siren` | identification legale | concierge | Profil > Conformite | Conserver |
| `vat_number` | fiscalite | concierge / pro eventuel | Profil > Conformite | Conserver |
| `insurance_number` | assurance | concierge | Profil > Conformite | Conserver |
| `insurance_company` | assurance | concierge | Profil > Conformite | Conserver |
| `certifications` | signal de confiance libre | concierge, artisan potentiel | Profil > Conformite / Competences | Normaliser |
| `certification_level` | niveau de certification | backoffice / verification | Profil > Conformite | Conserver |
| `certification_date` | verification | backoffice / verification | Profil > Conformite | Conserver |
| `certification_expires_at` | verification | backoffice / verification | Profil > Conformite | Conserver |
| `certification_metadata` | details de verification | backoffice / verification | Profil > Conformite technique | Conserver |

## 5. Champs experience, tarification et capacite operationnelle

| Champ actuel | Usage actuel | Role(s) actuel(s) | Destination cible | Action |
| --- | --- | --- | --- | --- |
| `years_experience` | experience | concierge, artisan | Profil > Experience | Conserver |
| `experience_level` | niveau d'experience | concierge, artisan | Profil > Experience | Conserver |
| `hourly_rate` | tarification | concierge, artisan potentiel | Services / Offre commerciale | Rattacher |
| `monthly_rate` | tarification | concierge | Services / Offre commerciale | Rattacher |
| `travel_fee` | frais de deplacement | concierge, artisan potentiel | Services / Offre commerciale ou Zone | Rattacher |
| `emergency_service` | service urgent | concierge | Disponibilites / Reactivite | Rattacher |

## 6. Champs bancaires et cycle de vie

| Champ actuel | Usage actuel | Role(s) actuel(s) | Destination cible | Action |
| --- | --- | --- | --- | --- |
| `iban` | paiement / finance | concierge, pro eventuel | Profil > Facturation / Paiement | Conserver |
| `bic` | paiement / finance | concierge, pro eventuel | Profil > Facturation / Paiement | Conserver |
| `onboarding_complete` | etat onboarding | tous | lifecycle onboarding | Conserver |
| `onboarding_completed_at` | historique onboarding | tous | lifecycle onboarding | Conserver |

## 7. Champ polymorphe majeur: `availability_hours`

### Usage actuel observe

`availability_hours` sert aujourd'hui a stocker plusieurs familles d'information:

- disponibilites hebdomadaires
- zones
- missionProfile et services actifs
- signaux d'urgence / reactivite
- payload d'onboarding
- payload `preferences`
- informations artisan / owner issues de l'inscription

### Sous-structures observees

| Sous-structure actuelle | Usage observe | Persona(s) | Destination cible | Action |
| --- | --- | --- | --- | --- |
| `schedule` | plages hebdomadaires | concierge | Disponibilites > Planning | Migrer progressivement hors JSON polyvalent |
| `zones` | zones d'intervention | concierge, inscription pro | Zone d'intervention | Migrer / normaliser |
| `missionProfile` | services et configuration mission | concierge | Services + configuration operationnelle | Migrer vers structures metier dediees |
| `onboarding.availability` | preference d'inscription | owner, concierge, artisan | onboarding ou disponibilites selon role | Rattacher |
| `onboarding.missionPreference` | preference d'inscription | owner, concierge | preferences metier ou onboarding | Rattacher |
| `onboarding.onboardingGoal` | objectif de demarrage | owner, concierge | Preferences owner / onboarding | Migrer |
| `onboarding.supportNeed` | besoin d'accompagnement | owner, concierge | Preferences owner / onboarding | Migrer |
| `onboarding.selectedServices` | services choisis a l'inscription | concierge, artisan | Services proposes / services actifs | Migrer |
| `onboarding.existingTools` | contexte operationnel | concierge | Profil > Contexte operationnel | Rattacher |
| `onboarding.propertyTypes` | types de biens | owner, concierge | Preferences owner / contexte concierge | Migrer |
| `onboarding.propertyType` | type principal | owner | Preferences > Contexte d'exploitation | Migrer |
| `onboarding.needVolume` | volume d'activite | owner, concierge | Preferences / contexte metier | Migrer |
| `onboarding.tradeBody` | description ou identite artisan | artisan | Metiers et specialites / presentation | Migrer |
| `onboarding.startingPriceRange` | fourchette prix | artisan, concierge potentiel | Offre commerciale | Migrer |
| `onboarding.firstRequestTemplate` | brouillon de premiere demande | owner | Preferences ou aide onboarding | Migrer |
| `preferences.*` | copie quasi miroir du bloc onboarding | owner, concierge, artisan | vrais objets de preferences par persona | Migrer |

### Decision recommandee

`availability_hours` doit cesser d'etre le conteneur principal des donnees metier transverses.

A terme, il devrait se limiter au maximum a:

- planning de disponibilites
- eventuels signaux de reactivite

Le reste doit etre extrait vers:

- preferences proprietaire
- services concierge / artisan
- metiers et specialites artisan
- contexte d'onboarding si necessaire

## 8. Donnees owner aujourd'hui stockees hors profil principal

Les preferences owner ciblees ne vivent pas encore dans un profil stable. Elles sont principalement reconstruites depuis les demandes.

### Metadonnees de demandes owner

| Donnee actuelle | Stockage actuel | Destination cible | Action |
| --- | --- | --- | --- |
| `owner_goal` | `service_requests.metadata` | Preferences Proprietaire > Objectif | Migrer |
| `collaboration_type` | `service_requests.metadata` | Preferences Proprietaire > Delegation / Type de collaboration | Migrer |
| `collaboration_frequency` | `service_requests.metadata` | Preferences Proprietaire > Rythme | Migrer |
| `estimated_duration` | `service_requests.metadata` | Preferences Proprietaire > Rythme / Duree | Migrer |
| `responsibility_level` | `service_requests.metadata` | Preferences Proprietaire > Delegation | Migrer |
| `property_type` | `service_requests.metadata` | Preferences Proprietaire > Contexte d'exploitation | Migrer ou dupliquer intelligemment |
| `sleeping_capacity` | `service_requests.metadata` | Logement ou contexte d'exploitation | Rattacher |
| `property_constraints` | `service_requests.metadata` | Preferences Proprietaire > Contraintes recurrentes ou logement | Rattacher |
| `requested_services` | `service_requests.requested_services` | Preferences Proprietaire > Attentes de services ou demande ponctuelle | Rattacher |
| `request_summary` | `service_requests.metadata` | sortie calculee, pas source profil | Limiter |

### Decision recommandee

Les demandes owner doivent devenir un consommateur des preferences profil, pas leur source principale.

## 9. Workspaces et liens multi-profils

`/api/profiles/workspaces` detecte les espaces a partir de:

- `role`
- `category`
- `option`
- `search_target`
- parfois `additional_info` comme marqueur de rattachement

### Cartographie

| Champ actuel | Usage workspace | Destination cible | Action |
| --- | --- | --- | --- |
| `role` | source principale de workspace | securite / routage | Conserver |
| `category` | fallback detection | metier principal ou categorie publique | Limiter dans le routing |
| `option` | fallback detection | ne doit plus servir au routing | Supprimer de cette responsabilite |
| `search_target` | fallback detection / intention owner | preferences owner ou onboarding | Normaliser |
| `additional_info` | contient parfois `workspace_parent_email:*` | champ technique de liaison dedie | Migrer |

### Decision recommandee

Le routing multi-workspace ne doit plus dependre a terme de champs metier libres comme `option` ou `additional_info`.

## 10. Mapping cible par persona

### Proprietaire

| Destination cible | Champs actuels candidats | Commentaire |
| --- | --- | --- |
| Profil > Identite | `first_name`, `last_name`, `email`, `phone`, `username`, `avatar_url` | base saine |
| Profil > Presence locale | `city`, `postal_code`, `country`, `street_address` | base saine |
| Profil > Presentation | `additional_info` | a renommer fonctionnellement |
| Profil > Structure | `company_name`, `legal_form` | utile surtout owner pro |
| Preferences > Objectif | `service_requests.metadata.owner_goal`, `availability_hours.preferences.onboardingGoal` | doit sortir des demandes / JSON |
| Preferences > Delegation | `service_requests.metadata.collaboration_type`, `service_requests.metadata.responsibility_level` | doit devenir profil |
| Preferences > Rythme | `service_requests.metadata.collaboration_frequency`, `estimated_duration`, `needVolume` | a normaliser |
| Preferences > Contexte exploitation | `propertyType`, `propertyTypes`, `service_requests.metadata.property_type` | eclate aujourd'hui |
| Preferences > Attentes services | `requested_services`, `option`, `selectedServices` | a separer entre profil et demande ponctuelle |

### Concierge

| Destination cible | Champs actuels candidats | Commentaire |
| --- | --- | --- |
| Profil > Identite | `first_name`, `last_name`, `email`, `phone`, `avatar_url` | base saine |
| Profil > Marque | `company_name` | base saine |
| Profil > Presence locale | `city`, `postal_code`, `country`, `street_address`, `location` | `location` doit cesser d'etre ambigu |
| Profil > Presentation | `additional_info`, `website`, `linkedin`, `facebook`, `instagram` | globalement coherent |
| Profil > Conformite | `legal_form`, `siren`, `siret`, `vat_number`, `insurance_*`, `certifications`, `iban`, `bic` | a mieux separer par sous-section |
| Zone d'intervention | `service_area`, `service_radius_km`, `availability_hours.zones` | aujourd'hui double source |
| Services | `option`, `availability_hours.missionProfile`, `availability_hours.onboarding.selectedServices` | doit etre un vrai domaine |
| Disponibilites | `availability_hours.schedule`, `emergency_service` | a recentrer |
| Offre commerciale | `hourly_rate`, `monthly_rate`, `travel_fee` | a rattacher explicitement aux services |

### Artisan

| Destination cible | Champs actuels candidats | Commentaire |
| --- | --- | --- |
| Profil > Identite | `first_name`, `last_name`, `email`, `phone`, `avatar_url` | base saine |
| Profil > Structure | `company_name` | aujourd'hui parfois alimente avec `tradeBody` |
| Profil > Presence locale | `city`, `postal_code`, `country`, `location` | `location` doit etre normalise |
| Profil > Presentation | `additional_info`, `availability_hours.onboarding.tradeBody` | aujourd'hui disperse |
| Metier principal | `category` | a clarifier semantiquement |
| Specialites | `category`, `option`, `tradeBody`, `selectedServices` | besoin d'un vrai modele |
| Zone d'intervention | `service_area`, `service_radius_km`, `availability_hours.zones` | peu expose en UI aujourd'hui |
| Disponibilites | `availability_hours.schedule`, `availability_hours.onboarding.availability` | doit devenir editable clairement |
| Services proposes | `option`, `selectedServices`, `hourly_rate`, `startingPriceRange` | aujourd'hui non structure |
| Experience | `years_experience`, `experience_level` | base saine |

## 11. Decisions de migration prioritaires

### A conserver quasi tel quel

- `first_name`
- `last_name`
- `email`
- `phone`
- `avatar_url`
- `street_address`
- `postal_code`
- `city`
- `country`
- `company_name`
- `service_area`
- `service_radius_km`
- `years_experience`
- `experience_level`

### A normaliser rapidement

- `additional_info`
- `category`
- `location`
- `search_target`
- `certifications`
- `hourly_rate`
- `monthly_rate`
- `travel_fee`

### A sortir des conteneurs ambigus

- services portes par `option`
- preferences dupliquees dans `availability_hours.preferences`
- onboarding metier stocke dans `availability_hours.onboarding`
- preferences owner stockees dans `service_requests.metadata`
- liens multi-workspace marques dans `additional_info`

## 12. Conclusion

La plateforme dispose deja de presque tous les champs necessaires, mais ils sont distribues dans trois couches melangees:

1. `profiles`
2. `availability_hours`
3. `service_requests.metadata`

La priorite de `#11` est donc moins d'inventer de nouveaux champs que de:

- clarifier leur responsabilite
- ramener chaque information dans le bon domaine
- reduire les champs "fourre-tout"
- preparer une validation stricte par persona

## Suite recommandee

La suite logique apres cette cartographie est:

1. utiliser ce mapping pour traiter `#15` validations par role
2. choisir les premiers champs a sortir de `availability_hours` et `option`
3. lancer la conception de `Profil Artisan` et `Preferences Proprietaire` sur une base deja clarifiee
