# Art Deco SaaS Marketplace Design System

## 1. Design Recommendations
- Use Art Deco as a structural accent (frames, separators, focus rings), not as heavy ornamentation.
- Prioritize information hierarchy, clear CTAs, and predictable interaction patterns.
- Keep strict spacing rhythm (8px baseline) and alignment to increase perceived trust.

## 2. Improved Layout Structure
- Hero: value proposition, search, trust badges.
- Discovery: category cards grouped by actor type.
- Search workspace: filter sidebar + results + map panel.
- Profile area: proof-first cards (verification, SLA, volume, ratings).
- Feature area: business capabilities (matching, billing, messaging, compliance).

## 3. Color Palette (CSS Variables)
- `--ui-color-bg: #F4F6F8`
- `--ui-color-surface: #FFFFFF`
- `--ui-color-surface-soft: #EBEFF2`
- `--ui-color-border: #D5DBDF`
- `--ui-color-text: #2C3E50`
- `--ui-color-text-muted: #5D6D7E`
- `--ui-color-primary: #D4AF37`
- `--ui-color-primary-strong: #B5A642`
- `--ui-color-accent: #1A2530`

## 4. Typography Pairing
- Display headings: `Cormorant Garamond` via `--font-primary`.
- Body/UI text: `Open Sans` and `Montserrat` for labels and actions.
- Heading treatment: uppercase + subtle tracking (`0.04em`) on section titles.

## 5. UI Component Style Suggestions
- Cards: thin neutral border + inner gold frame.
- Buttons: geometric corners (`3-4px`), dark/gold contrast, crisp focus ring.
- Inputs/selects: strong text contrast, gold focus outline, clean spacing.
- Separators: thin horizontal line with central diamond motif.

## 6. Animation and Micro-interactions
- Hover lift: `translateY(-2px)`.
- Duration: `180-260ms`.
- Easing: soft transitions to avoid abrupt motion.
- Maintain visible keyboard focus states on all controls.

## 7. Textures and Visual Motifs
- Use low-opacity geometric backgrounds in hero/footer.
- Keep pattern opacity under 10% to preserve readability.
- Favor line-based motifs (diamond, nested rectangles, stepped frames).

## 8. Trust and Professionalism
- Surface verification badges and service-level indicators above fold.
- Standardize profile card structure with measurable proof points.
- Keep photography consistent in tone and quality across actor profiles.

## Implementation Notes
- Theme available via `.theme-art-deco` or `[data-theme="art-deco"]`.
- New showcase route: `/design-system`.
- Core primitives now support tokenized geometry:
  - `--ui-button-radius`
  - `--ui-input-radius`
  - `--ui-select-radius`
  - `--ui-card-radius`

## 9. Bibliotheque d'inspiration UI/UX - Materio et NextJSTemplates

Date de consultation : 3 septembre 2026. Cette bibliotheque est un outil interne de conception. Elle est distincte de la bibliotheque d'inspiration metier du dashboard concierge, qui stocke des liens YouTube et des recherches dans le profil du concierge.

### Cadre d'utilisation

- Les inspirations servent a evaluer des principes de composition, de densite et de responsive ; elles ne sont ni copiees, ni importees.
- Les composants existants, les tokens `--ds-*`, les modules SCSS et les permissions PlanetLS restent la base de toute evolution.
- Ne pas ajouter Material UI, Tailwind, une dependance de template, une authentification ou une navigation parallele pour reproduire une reference.
- Les dashboards reels restent les preuves du metier. Les pages sous `/design-system/*` restent des prototypes ou catalogues internes.

### References consultees

| Reference | Editeur | Objectif observe | Pages effectivement consultees | Decision |
| --- | --- | --- | --- | --- |
| [Materio - MUI Next.js Admin Template](https://demos.themeselection.com/marketplace/materio-mui-nextjs-admin-template/landing-page/) | ThemeSelection | Kit admin Next.js/MUI avec layouts, applications et composants. | Landing officielle, [documentation d'ensemble](https://demos.themeselection.com/materio-mui-nextjs-admin-template/documentation/docs/guide/overview/), [layout vertical](https://demos.themeselection.com/materio-mui-nextjs-admin-template/documentation/docs/guide/layout/vertical-layout-components/), [cartes statistiques](https://demos.themeselection.com/materio-mui-nextjs-admin-template/documentation/docs/guide/components/custom/card-statistics/). | A tester comme source de principes uniquement. |
| [TailAdmin Next.js](https://nextjs-demo.tailadmin.com/) | TailAdmin / NextJSTemplates | Dashboard operationnel avec navigation laterale, KPI, periode, tableaux et etats UI. | Demo e-commerce publique, page catalogue [NextJSTemplates SaaS](https://nextjstemplates.com/saas), article officiel [dashboard templates](https://nextjstemplates.com/blog/admin-dashboard-templates). | Retenu pour hierarchy et densite, pas pour la stack Tailwind. |
| [Finorio](https://finorio.demo.nextjstemplates.com/) | NextJSTemplates | Presentation finance avec solde, activite recente, budget et tendances. | Demo publique finance et fiche catalogue SaaS NextJSTemplates. | A tester uniquement pour les syntheses financieres owner/concierge. |
| [Play](https://play.nextjstemplates.com/) | NextJSTemplates | Boilerplate SaaS et pages marketing. | Demo publique et catalogue SaaS NextJSTemplates. | Rejete pour les dashboards : utile pour pages marketing, pas pour le cockpit metier. |

La demo directe Materio n'a pas ete consultee : elle n'etait pas accessible via l'outil de consultation. Aucune page premium, aucun compte et aucun code source n'ont ete contournes, telecharges ou integres.

### Principes Materio a evaluer

| Principe observe | Interet pour PlanetLS | Espaces concernes | Limite et adaptation |
| --- | --- | --- | --- |
| Sidebar structuree par sections, groupes et sous-elements | Rend les familles metier lisibles dans des espaces denses. | Concierge, artisan, admin. | Garder la navigation et les permissions PlanetLS ; ne pas multiplier les niveaux ni reprendre les libelles generiques. |
| Layout vertical avec topbar et sidebar repliable | Permet une lecture stable sur desktop et une navigation compacte sur petit ecran. | Tous les espaces. | S'appuyer sur la sidebar existante et son responsive ; ne pas introduire le layout MUI. |
| Cartes KPI avec valeur, tendance, icone et statut semantique | Confirme le pattern deja porte par `DashboardMetricCard` et `StatsCard`. | Owner, concierge, artisan ; admin en evolution future. | Limiter chaque vue a des indicateurs actionnables, pas a une grille decorative. |
| Separations claires entre actions immediates, graphiques et listes | Aide a donner le premier ecran aux urgences plutot qu'aux analyses. | Concierge et artisan en priorite. | Les graphiques ne doivent etre ajoutes que si une donnee fiable et une decision associee existent. |
| Variantes de layout et de theme | Montre l'interet d'un cadre de composition coherent. | Referentiel uniquement. | Conserver l'identite Art Deco et les tokens `--ds-*`; ne pas creer un mode sombre ou un customizer sans besoin produit. |
| Tables avec filtres, actions et statuts | Bon rappel des etats necessaires autour d'un flux. | Demandes, missions, devis, admin. | PlanetLS n'a pas encore de primitive Table/Filter/Pagination officielle : conserver les implementations metier jusqu'a un lot dedie. |

Ne pas reprendre de Materio : Material UI, son theming, ses routes/auth guards, ses applications CRM/e-commerce, ses dependances et sa densite de navigation par defaut.

### References NextJSTemplates retenues

| Reference | Elements transposables | Elements incompatibles ou inutiles |
| --- | --- | --- |
| TailAdmin | Navigation pliee par groupes, premier rang de KPI, filtres de periode proches des statistiques, tableau recent avec statut et action, conteneur horizontal pour les tables mobiles. | Tailwind, inventaire massif de composants, tableaux e-commerce, navigation SaaS/CRM standardisee et accumulation de graphiques. |
| Finorio | Une synthese financiere qui articule montant principal, activite recente, progression et detail par categorie. | Terminologie de portefeuille, cartes bancaires, QR payment, marketing mobile-first finance. |
| Play | Decoupage simple entre proposition de valeur, preuve, tarif et FAQ pour les pages publiques. | Ne constitue pas une reference de dashboard operationnel ; pas de report vers les espaces connectes. |

### Comparaison avec PlanetLS

| Inspiration | Principe observe | Situation actuelle dans PlanetLS | Adaptation proposee | Espace concerne | Priorite | Risque |
| --- | --- | --- | --- | --- | --- | --- |
| Materio | KPI valeur + statut + tendance | `UnifiedRoleDashboard`, `DashboardMetricCard` et `StatsCard` existent deja. | Fixer un maximum de 4 KPI actionnables avant les listes. | Owner, concierge, artisan | Important | Faible |
| Materio | Sidebar par groupes | Les sidebars sont deja configurees par role. | Revoir les libelles et regroupements lors de chaque lot metier, sans changer les routes ni droits. | Concierge, artisan | Amelioration | Moyen |
| TailAdmin | Periode et filtre au voisinage des stats | Le dashboard admin le fait deja ; les autres espaces ont des filtres locaux. | Reutiliser le principe uniquement quand une periode modifie reellement les donnees. | Owner, concierge, artisan | A etudier | Moyen |
| TailAdmin | Table recente avec statut et action | Les tableaux et listes metier existent, avec des styles locaux. | Documenter un contrat visuel table mobile : statut semantique, action explicite, scroll horizontal. | Demandes, missions, devis | Important | Faible |
| TailAdmin | Navigation et catalogue UI tres etendus | Le referentiel PlanetLS est volontairement plus petit. | Ajouter seulement les etats prouves : modal, filtre, pagination et confirmation, sans reproduire le catalogue. | Design System | Amelioration | Moyen |
| Finorio | Synthese et tendances financieres | Owner et concierge possedent des donnees devis/factures ou revenus selon les parcours. | Mettre le montant et l'action suivante avant les graphiques ; n'afficher une tendance que si la periode est fiable. | Owner, concierge | A etudier | Moyen |
| Play | Boilerplate SaaS complet | PlanetLS possede deja son auth, ses APIs et ses parcours. | Aucune adaptation aux espaces connectes. | Public seulement | Incompatible | Eleve |
| Materio / TailAdmin | Themes, bibliotheques et dependances de template | PlanetLS est SCSS + tokens `--ds-*`, sans MUI. | Ne pas importer de stack ou de code template. | Tous | Incompatible | Eleve |

### Propositions par espace

| Espace | Structure adaptee a evaluer | Donnees reellement presentes | Garde-fou |
| --- | --- | --- | --- |
| Proprietaire (`/dashboard/owner`) | KPI parc/missions/devis, file d'actions, sejours et logements, puis finance. | Logements, missions, demandes, devis, factures, messages et onboarding sont lus par le dashboard. | Ne pas masquer les actions de finalisation logement ou les alertes sous des graphiques. |
| Concierge (`/dashboard/concierge`) | Priorite urgente, planning du jour, demandes/messages/devis, parc, puis widgets secondaires. | Hook concierge, missions, planning, demandes, conversations, devis, proprietaires et widgets locaux. | La bibliotheque YouTube reste une fonctionnalite metier secondaire, distincte du moodboard interne. |
| Artisan (`/dashboard/provider`) | Nouvelles demandes, devis a preparer, interventions du jour, justificatifs et paiements. | `UnifiedRoleDashboard`, missions et etats vides sont deja presents. | Ne pas annoncer les paiements ou disponibilites comme finalises sans preuve de parcours. |
| Administrateur (`/dashboard/admin`) | Conserver le cockpit actuel ; noter seulement le principe de filtres de periode et de tables hierarchisees. | KPI, filtres role/periode, sante technique, tables et etats degrades sont deja en place. | Aucune refonte dans ce chantier. |

### Decisions de conception

**A reprendre comme principe**

- Une premiere lecture limitee a la priorite du jour, 3 a 4 KPI et une action suivante explicite.
- Des cartes de statut semantique, des tables recentes et une hierarchie qui se degrade proprement sur mobile.
- Un filtre de periode ou de role seulement lorsqu'il change des donnees et une decision utilisateur.

**A adapter a PlanetLS**

- La sidebar compacte, les regroupements de navigation et les tableaux responsives, en conservant routes, libelles, permissions et SCSS PlanetLS.
- Les indicateurs de tendance, avec les tokens `--ds-*`, des donnees sourcees et une phrase expliquant le calcul ou la periode.
- Les futurs composants generiques Table, Filter, Modal, Confirmation et Pagination, apres inventaire des implementations metier existantes.

**A ne pas reprendre**

- Material UI, Tailwind, dependances, auth, schemas et code des templates.
- Les ecrans CRM, e-commerce, banque, chat ou AI non justifies par un parcours PlanetLS.
- Les tableaux de bord surcharges, les graphiques sans action et les modes de theme sans decision produit.

### Validations produit requises

1. Valider la regle de densite : priorite du jour, quatre KPI maximum et une seule zone d'actions rapides avant les contenus secondaires.
2. Choisir le premier contrat transverse a formaliser dans le Design System : table responsive, filtre, modale/confirmation ou pagination.
3. Valider, avant tout report, les sections du prototype concierge qui doivent rejoindre le cockpit reel ; aucune proposition de cette etude ne vaut implementation.

## 10. Contrat transverse Table + filtres

### Regle de densite validee

La zone immediatement visible d'un dashboard peut montrer une urgence principale, quatre KPI maximum et une action principale. Cette regle ne concerne pas l'ensemble de la page : les informations secondaires restent accessibles plus bas. Lorsqu'aucune urgence n'existe, le dashboard affiche un etat calme ou une prochaine action reelle, jamais une fausse alerte.

### Inventaire de reference

| Implementation reelle | Route / profil | Donnees et controles observes | Etats et mobile | Duplication / limite |
| --- | --- | --- | --- | --- |
| `src/app/dashboard/concierge/sejours/page.tsx` | `/dashboard/concierge/sejours` | Sejours, recherche texte, filtres de statut, selection d'un sejour. | `AsyncState` loading/vide/erreur; table desktop et cartes mobiles. | Pattern le plus complet pour une exception cartes mobile. |
| `src/app/dashboard/provider/interventions/page.tsx` | `/dashboard/provider/interventions` | Interventions, recherche, statut, tri, dates, export, actions et pagination locale. | Etats locaux loading/vide; cartes deja mobiles. | Toolbar, compteurs, pagination et actions restent locaux. |
| `src/app/dashboard/owner/missions/OwnerMissionsFilters.tsx` | `/dashboard/owner/missions` | Statut, logement et periode. | Le responsive est porte par la page parente. | Utilise des `select` locaux, sans compteur ni reset commun. |
| `src/app/dashboard/admin/page.tsx` | `/dashboard/admin` | Tables utilisateurs, demandes et missions; filtres de periode et role au niveau cockpit. | Tables annot ees et adaptation mobile existante. | Structure admin specialisee et liee aux KPI, non reutilisable telle quelle. |

### Contrat officiel

- `DataTable` est une primitive de presentation : caption obligatoire, colonnes typees, identifiant de ligne stable, alignement, statut via `Badge` et action principale optionnelle.
- `TableFilters` est une enveloppe de controles fournis par la page : elle affiche resultats, filtres actifs et reset. Recherche, periode, statut, role, tri, selection et pagination sont optionnels.
- Les valeurs manquantes doivent recevoir un libelle explicite (`Non renseigne`, `Date a confirmer`) ; les etats loading, vide et erreur sont portes par `AsyncState` autour de la table.
- Accessibilite : `caption`, `scope`, libelles de controles, action de ligne nommee et annonce du nombre de resultats.
- Responsive par defaut : defilement horizontal dans un conteneur dedie. Exception `cards` uniquement quand une ligne reste complete, avec ses actions, hors alignement tabulaire.
- Les filtres ne sont synchronises avec l'URL ou conserves que lorsqu'un parcours existant le justifie ; le contrat ne le force pas.

### Premiere migration recommandee

Tester d'abord le contrat sur une liste concierge qui n'a pas de mutation complexe, apres validation du prototype. Ne pas migrer en masse les interventions artisan : elles combinent pagination, edition, export et actions de statut et constituent un risque de regression plus eleve.

## 11. Comparaison des quatre dashboards — 6 septembre 2026

### Périmètre et état de départ

Mission rattachée à `PLS-DS-001`, **P1 Prioritaire — 🟡 En cours**. Les dashboards réels sont analysés en lecture seule. L'audit ci-dessous décrit le code et ses sources de données ; il ne certifie pas les valeurs d'un compte connecté ni le fonctionnement de chaque mutation métier. Les travaux non validés déjà présents (Personas, sécurité, TypeScript et CI) sont conservés. TypeScript et UTF-8 passent avant modification. Un serveur utilisateur `npm run dev` est actif : il est préservé ; la compilation du lot utilise `test-results/design-system-build`.

Le prototype concierge existant réagit au bouton Chargement dans le navigateur. L'ancien incident était une interaction du test avant la fin du chargement, pas une absence de JavaScript. Les tests attendent `load`, vérifient les scripts, puis exercent réellement les boutons. L'admin conserve sa composition existante, complétée par des états simulés ; propriétaire et artisan sont de nouvelles routes isolées.

### Matrice métier avant choix visuels

| Espace | Besoin principal | Informations prioritaires | Action principale proposée | KPI utiles | Sections secondaires | Ton visuel |
| --- | --- | --- | --- | --- | --- | --- |
| Administrateur | Repérer les opérations qui demandent un contrôle humain | Priorités, demandes et missions en suivi | Traiter les priorités | Nouveaux comptes, logements suivis, missions en cours, profils à vérifier | Activité, contrôles et raccourcis | Structuré, précis, relativement dense |
| Propriétaire | Comprendre la prochaine décision pour son logement | Devis attendu, prochains séjours et logement à compléter | Consulter le devis dans l'exemple ; dépendra de la file réelle | Logements suivis, missions à venir, devis reçus, demandes en cours | Logements et activité récente | Calme, simple, accueillant |
| Concierge | Organiser le travail quotidien | Urgence réelle si présente, missions et horaires | Ouvrir la mission prioritaire | Interventions du jour, demandes à traiter, logements suivis, devis à envoyer | Repères planning et création de mission/message/logement | Opérationnel, lecture rapide |
| Artisan | Lire la demande et préparer la prochaine intervention | Demande à répondre, interventions et devis | Lire la demande | Nouvelles demandes, devis en attente, interventions du jour, messages à lire | Devis et activité récente | Direct, pratique, adapté au téléphone |

### Audit des écrans réels : sources et limites

| Espace | Informations, actions et sources présentes dans le code | Chargement, vide, erreur et données de remplacement | Composants, styles, navigation et responsive |
| --- | --- | --- | --- |
| Admin | `admin/page.tsx` lit `/api/admin/operations`, `/api/admin/overview`, `/api/admin/control-tower`, `/api/kpis/overview`. Filtres période/rôle ; six KPI dans la configuration actuelle ; priorités, onboarding, e-mail, demandes, missions, facturation ; tableaux utilisateurs/demandes/missions ; répartition des rôles, courbe d'activation et barres par zone ; liens vers les pages de contrôle. | Chargement explicite, erreur et avertissements par source, état sans activité et sans priorité. Les valeurs dépendent des réponses API ; un état invérifiable existe. Le nombre ou la couleur d'un indicateur ne certifie pas la sécurité. | `UnifiedRoleDashboard` variante admin, `Badge`, listes/tableaux spécialisés, `AdminDashboard.module.scss`, `adminNavigation.ts`. Déjà avancé : conserver la structure ; vérifier ultérieurement la densité des six KPI. Grilles adaptées aux petits écrans, défilement des tables à examiner lors de l'intégration. |
| Owner | `owner/page.tsx` et `useOwnerDashboardData.ts` : logements, missions (limite 24 sur la page), devis, factures, avis, conversations, demandes. Cinq KPI configurés ; file d'actions logement/devis/factures/messages/demandes ; séjours dérivés des missions, portefeuille de logements, dernier devis et finance. Liens de consultation et popup de première arrivée avec indicateur localStorage. | Écran de chargement de l'identité et états vides par liste. Le hook expose une erreur mais la page ne la récupère pas : risque de confondre indisponibilité et absence de données. Pas de preuve connectée ajoutée ici. Dates absentes et valeurs manquantes utilisent des libellés de remplacement, pas de nouveaux séjours de démonstration. | `UnifiedRoleDashboard`, `UnifiedPropertyPortfolio`, `UnifiedSpotlightList`, `UnifiedStatStack`, `DashboardEmptyState`, `OwnerUnifiedDashboard.module.scss`. Navigation par logements, missions, séjours, devis et messages ; grilles et cartes responsives. Pas de nouveau graphique dans le prototype : le détail financier reste secondaire. |
| Concierge | `DashboardPage.tsx`, `useConciergeDashboardData.ts` : demandes (limite 10), missions (40), KPI missions, conversations, logements, devis, propriétaires. Mode de travail, radar, urgence, planning, parc, widgets, bibliothèque YouTube. Les widgets/modes utilisent du stockage local ; la bibliothèque est persistée via `/api/profiles` dans le produit. | Chargement de l'identité ; `AsyncState` sur les demandes ; états vides des listes. Plusieurs lectures utilisent des valeurs de secours `[]`/`null`, qui peuvent masquer une indisponibilité. Une mission sans fin reçoit une durée de secours de 90 minutes : horaire à qualifier avant de l'exposer comme exact. | `UnifiedRoleDashboard`, listes partagées, `Dashboard.module.scss`, contrôles de mode et widgets. Navigation missions/planning/demandes/logements/propriétaires/messages ; densité variable selon mode. Les widgets et la bibliothèque sont secondaires, aucun nouvel outil de tournée/stock n'est ajouté. |
| Provider | `provider/page.tsx`, `useProviderDashboardData.ts` : clients, interventions, alertes, messages, devis et historique de facturation via les API provider/quotes/billing. Demandes reçues, devis brouillons/envoyés/acceptés, prochaines interventions, activité, paiements attendus. Actions de la page principalement des liens vers les espaces spécialisés ; certains montants sont prévisionnels. | `DashboardLoadingScreen`, états vides, échec partiel récupéré via `Promise.allSettled` et affiché dans le sous-titre. Il ne faut pas assimiler zéro, montant manquant et paiement reçu. Fonctionnement des paiements/justificatifs non certifié par cet audit visuel. | `UnifiedRoleDashboard`, `UnifiedSpotlightList`, `UnifiedStatStack`, `ProviderDashboard.module.scss`, configuration artisan. Navigation interventions/planning/devis/messages/clients. Cartes terrain déjà présentes ; aucune courbe marketing ajoutée. |

Les routes et composants existants démontrent une implémentation ; ils ne valent pas recette métier complète. Les défauts RLS/sessions de PLS-SEC-005 restent ouverts et ne sont pas corrigés dans ce lot. Les demandes, missions, devis et profils des prototypes sont **tous fictifs**, sans lecture métier, compte créé ni persistance. Les idées de tournée optimisée, stock avancé et synthèse financière nouvelle ne sont pas exposées comme disponibles. Aucun concept futur n'est ajouté à ces quatre vues ; s'il est montré plus tard, le libellé obligatoire est « Concept — non disponible dans le produit actuel ».

### Cadre commun et différences

- Contenu plafonné à 1 280 px (1 200 px pour le concierge existant), avec marge souple de 16 à 32 px. Navigation de comparaison de 220 px, réduite à 190 px, puis menu dépliable sous 800 px. Cette navigation appartient à l'atelier ; les sidebars métier actuelles ne sont pas remplacées.
- Espacements de 8, 16 et 24 px ; cartes à hauteur naturelle ; grille principale et colonne secondaire, ramenées à une colonne quand la largeur le nécessite. Quatre KPI au plus dans l'entrée, deux colonnes compactes sur mobile pour propriétaire/artisan/concierge. Pas de hauteur forcée qui coupe le texte.
- Un titre principal, des titres de section, une seule action prioritaire ; les filtres sont immédiatement au-dessus de la liste concernée et la recherche porte un nom accessible. Les contrôles d'état sont explicitement des outils de démonstration.
- Owner : motif maison discret, accueil rassurant, séjours avant historique. Provider : icône outil, demande avant interventions, vocabulaire terrain. Concierge : urgence simulée avant KPI, planning puis widgets secondaires. Admin : composition dense conservée, état calme et contrôles, aucun nouveau graphique inventé.
- Fond ivoire, surfaces claires, typographies et composants PlanetLS communs. Pas de palette concurrente par profil : l'icône, le vocabulaire, les sections et leur densité suffisent. Les couleurs de statut gardent leur sens. Le brun `--ds-color-secondary` remplace le fond doré trop clair des actions principales **dans les prototypes seulement** ; texte secondaire renforcé localement.
- `Button`, `Badge`, `Card`, `StatsCard`, `DataTable`, `TableFilters` sont réutilisés. Deux libellés optionnels de TableFilters permettent « résultat(s) » et « Réinitialiser » dans les prototypes ; les valeurs par défaut des pages existantes sont conservées. Le chargement réutilise `AsyncState` ; vide/erreur sont composés avec Card et des textes français dans l'atelier.
- Les tables owner/provider/concierge deviennent des cartes complètes sous 640 px ; la légende garde toute sa largeur. Le tableau spécialisé admin conserve son défilement interne. Les barres de progression concierge non expliquées et l'indicateur admin « Parcours sains » sans définition ont été retirés.

### Inspirations consultées légalement le 6 septembre 2026

| Source | Principe observé | Espace concerné | Adaptation proposée | Décision |
| --- | --- | --- | --- | --- |
| [Materio, documentation du layout vertical](https://demos.themeselection.com/materio-mui-nextjs-admin-template/documentation/docs/guide/layout/vertical-layout-components/) | Navigation organisée en groupes ; commande mobile | Tous | Repères stables et menu de comparaison repliable ; pas de MUI | Adapter |
| [TailAdmin, démonstration publique](https://nextjs-demo.tailadmin.com/) | KPI, listes et filtres proches du contenu | Concierge, artisan, admin | Quatre repères utiles puis le travail à traiter ; retirer les graphiques sans décision associée | Adapter |
| [NextJSTemplates, catalogue SaaS](https://nextjstemplates.com/saas) | Variété de compositions selon l'usage | Tous | Comparer des principes, conserver la pile SCSS et les composants PlanetLS | Retenir comme référence, rejeter l'import de templates |
| [Tabler, démonstration publique](https://preview.tabler.io/) | Groupement des informations et variantes de densité | Admin, concierge | Cartes et sections lisibles ; pas de grand catalogue de menus ni d'indicateurs commerciaux génériques | Adapter |
| [Finorio, démonstration publique](https://finorio.demo.nextjstemplates.com/) | Synthèse financière et activité | Futures vues financières seulement | À évaluer dans un lot distinct avec données financières qualifiées | Tester plus tard ; rejet pour ce lot |

Aucun code, composant, logo, texte ou image de template importé ; aucune dépendance ajoutée. Les principes observés sont adaptés au code métier inventorié ci-dessus.

### Validation et décision produit

Comparer les quatre espaces via `/design-system/dashboards`. Les accès restent ceux du Design System existant : routes accessibles sans garde admin dédiée dans le code actuel, jamais de données confidentielles dans les exemples. Cette limite est documentée, sans changer l'authentification.

Le test `e2e/dashboard-prototypes.spec.ts` vérifie HTTP, scripts chargés, changement réel des quatre états, recherche/statut/réinitialisation, activation clavier, focus visible, menu mobile, hauteur des boutons, absence de débordement global et absence d'erreurs console. Toutes les requêtes autres que GET/HEAD/OPTIONS sont bloquées et comptées. Captures aux largeurs 1600, 1366, 768 et 390 ; surface réduite à 683 px pour contrôler le réagencement équivalent à une fenêtre de 1366 px zoomée à 200 %. Ce dernier contrôle n'est pas une certification exhaustive des fonctions de zoom de tous les navigateurs ou lecteurs d'écran.

Commande locale : `$env:PROTOTYPE_BROWSER_CHANNEL='msedge'; npx.cmd playwright test --config e2e/dashboard-prototypes.config.ts` avec le serveur déjà ouvert sur `127.0.0.1:3000`. Rapports et captures dans `test-results/dashboard-prototypes*`. Les résultats définitifs et limites de compilation sont consignés dans le Master Plan, sans second audit concurrent.

À valider par Nathalie : hiérarchie des quatre premières zones, niveau de densité, tables mobiles en cartes, sobriété des accents et choix des actions principales. Aucune intégration métier avant cette validation. Ordre proposé ensuite : propriétaire (lecture simple), concierge (planning existant), artisan (plus d'actions terrain à préserver), puis retouches ciblées admin (déjà avancé). Chaque intégration aura sa recette permissions/erreurs/données ; elle ne peut pas déduire sa sécurité de la réussite des prototypes.
