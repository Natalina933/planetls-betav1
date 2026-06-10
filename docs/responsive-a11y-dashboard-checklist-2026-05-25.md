# Checklist audit responsive et accessibilite dashboard SaaS

_Date: 25 mai 2026_

## Objectif
Verifier qu'un dashboard SaaS reste lisible, utilisable au clavier et stable visuellement sur mobile, tablette et desktop avant deploiement.

## Statuts
- `PASS`: conforme
- `FAIL`: bloque le deploiement
- `A REVOIR`: acceptable temporairement, correction planifiee
- `N/A`: non applicable

## Priorites
- `P0`: bloque le deploiement
- `P1`: doit etre corrige avant release publique
- `P2`: amelioration qualite ou dette UI

---

## 1) Grille responsive 12 / 8 / 4 colonnes

### Desktop - 12 colonnes
- [ ] `P0` Le contenu principal utilise une grille 12 colonnes ou un conteneur equivalent avec largeur max controlee.
- [ ] `P0` Aucun composant ne force un `min-width` superieur au viewport ou au conteneur parent.
- [ ] `P1` Les panneaux metier gardent une largeur de lecture confortable, sans lignes de texte trop longues.
- [ ] `P1` Les sidebars, filtres et panneaux secondaires ne reduisent pas la zone principale sous un seuil utilisable.
- [ ] `P2` Les espacements horizontaux sont coherents entre header, page shell, cards et tableaux.

### Tablette - 8 colonnes
- [ ] `P0` Les layouts dashboard passent de 12 a 8 colonnes sans chevauchement.
- [ ] `P0` Les tableaux, listes et grilles se replient proprement ou activent un scroll interne controle.
- [ ] `P1` Les filtres restent accessibles sans occuper toute la hauteur initiale.
- [ ] `P1` Les widgets KPI et cards critiques passent en 2 colonnes si la largeur le permet.
- [ ] `P2` Les paddings sont reduits sans donner une impression de densite excessive.

### Mobile - 4 colonnes
- [ ] `P0` Tous les blocs structurants passent en une colonne ou en pile verticale lisible.
- [ ] `P0` Il n'y a aucun scroll horizontal global.
- [ ] `P0` Les zones tactiles interactives font au moins 44px de hauteur ou de largeur utile.
- [ ] `P1` Les cards, filtres, formulaires et actions principales utilisent toute la largeur disponible.
- [ ] `P1` Les contenus secondaires sont replis, deplaces sous le contenu principal ou masques derriere une action explicite.
- [ ] `P2` Les textes longs, badges, emails, adresses et identifiants cassent proprement sur plusieurs lignes.

---

## 2) Auto Layout et comportements de composants

### Regles communes
- [ ] `P0` Chaque composant partage definit une direction mobile-first: colonne par defaut, ligne seulement si l'espace le permet.
- [ ] `P0` Les composants utilisent `min-width: 0` dans les enfants flex/grid qui contiennent du texte.
- [ ] `P0` Les images, icones, graphiques et medias ont une largeur fluide et ne depassent jamais leur parent.
- [ ] `P1` Les espacements internes suivent une echelle stable: mobile compact, tablette intermediaire, desktop confortable.
- [ ] `P1` Les etats loading, empty, error et success conservent la meme empreinte responsive que l'etat charge.
- [ ] `P2` Les composants repetes exposent des variantes simples plutot que des styles locaux divergents.

### Cas limites composants partages
- [ ] `P0` Card avec titre tres long, badge multiple et action secondaire: pas de chevauchement.
- [ ] `P0` Button avec libelle long: texte centre, wrap propre ou largeur adaptee.
- [ ] `P0` Tabs avec 5+ onglets: wrap, scroll horizontal local ou menu alternatif.
- [ ] `P0` Select/autocomplete avec valeurs longues: label, valeur et menu restent lisibles.
- [ ] `P0` Table ou data grid avec 6+ colonnes: version mobile card, colonnes prioritaires ou scroll interne signale.
- [ ] `P1` Avatar + nom + role + actions: le nom long ne pousse pas les actions hors ecran.
- [ ] `P1` KPI card avec valeur extreme, devise, pourcentage negatif ou statut long: pas de rupture.
- [ ] `P1` Chart sans donnees ou avec labels longs: fallback accessible et lisible.
- [ ] `P1` Toast/banner empile: ne masque pas durablement la navigation ou les CTA principaux.
- [ ] `P2` Skeleton/loading: dimensions proches du contenu final pour eviter les sauts de layout.

---

## 3) Priorite au-dessus de la ligne de flottaison

### Dashboard home
- [ ] `P0` Le titre de page, le contexte utilisateur et l'action principale sont visibles sans scroll sur mobile.
- [ ] `P0` Les alertes critiques ou actions bloquantes apparaissent avant les KPI secondaires.
- [ ] `P1` Les KPI prioritaires apparaissent avant les graphiques decoratifs ou les listes longues.
- [ ] `P1` La navigation active est identifiable immediatement.
- [ ] `P2` Les textes d'aide ne repoussent pas les actions principales sous la ligne de flottaison.

### Pages metier
- [ ] `P0` L'utilisateur comprend la page en moins de 5 secondes: titre, statut, action principale.
- [ ] `P0` Les actions destructives ou engageantes sont distinguees des actions secondaires.
- [ ] `P1` Les filtres sont disponibles rapidement sans prendre toute la hauteur mobile.
- [ ] `P1` Les informations de decision apparaissent avant les details administratifs.
- [ ] `P2` Les empty states proposent une action utile sans bloc de texte trop long.

---

## 4) Semantique HTML interactive

### Boutons et liens
- [ ] `P0` Une action qui modifie l'etat utilise un `button`, pas un `div` ou un `a` detourne.
- [ ] `P0` Une navigation utilise un lien avec `href` valide.
- [ ] `P0` Les boutons icon-only ont un nom accessible via `aria-label` ou texte masque.
- [ ] `P1` Les boutons indiquent correctement `disabled`, `aria-busy` ou l'etat de chargement.
- [ ] `P1` Les menus deroulants exposent `aria-expanded` et `aria-controls` si applicable.

### Formulaires
- [ ] `P0` Chaque champ a un `label` associe par `htmlFor` / `id` ou une alternative accessible.
- [ ] `P0` Les erreurs sont reliees au champ avec `aria-describedby` ou une structure equivalente.
- [ ] `P0` Les champs requis sont identifies visuellement et programmaticalement.
- [ ] `P1` Les groupes de champs utilisent `fieldset` / `legend` quand le contexte est necessaire.
- [ ] `P1` Les messages d'erreur sont comprehensibles sans couleur seule.
- [ ] `P2` Les claviers mobiles sont adaptes: email, tel, numeric, autocomplete pertinent.

### Modales, popups et drawers
- [ ] `P0` La modale a un role adapte: `dialog` ou `alertdialog`.
- [ ] `P0` La modale expose un titre accessible via `aria-labelledby` ou `aria-label`.
- [ ] `P0` Le focus entre dans la modale a l'ouverture et revient au declencheur a la fermeture.
- [ ] `P0` `Escape` ferme la modale quand le contexte le permet.
- [ ] `P0` Le focus est piege dans la modale tant qu'elle est ouverte.
- [ ] `P1` Le scroll de page est bloque sur mobile uniquement quand l'overlay le necessite.
- [ ] `P1` Les modales mobiles utilisent largeur pleine ou bottom sheet avec hauteur max et scroll interne.

---

## 5) Focus clavier et navigation

### Parcours clavier
- [ ] `P0` Toute action visible est atteignable avec `Tab`.
- [ ] `P0` L'ordre de tabulation suit l'ordre visuel et logique.
- [ ] `P0` Aucun focus n'est perdu apres changement d'etat, filtrage, pagination ou fermeture de modale.
- [ ] `P0` Les composants custom supportent `Enter` et `Space` selon leur role.
- [ ] `P1` Les menus, combobox, tabs et accordions suivent les patterns clavier attendus.
- [ ] `P1` Les liens d'evitement ou mecanismes equivalents permettent de passer la navigation repetitive.

### Indicateur de focus
- [ ] `P0` Le focus visible n'est jamais supprime.
- [ ] `P0` Le focus ring a un contraste suffisant sur fonds clairs et fonces.
- [ ] `P1` Le style de focus est coherent entre boutons, liens, champs, cards cliquables et onglets.
- [ ] `P2` Les etats hover/focus/active ne provoquent pas de deplacement de layout.

---

## 6) Contraste, couleur et etats visuels

### Contraste
- [ ] `P0` Texte normal: contraste minimum 4.5:1.
- [ ] `P0` Texte large et icones essentielles: contraste minimum 3:1.
- [ ] `P0` Les erreurs, alertes et statuts ne reposent pas uniquement sur la couleur.
- [ ] `P1` Les boutons primaires, secondaires et destructifs restent lisibles dans tous les themes.
- [ ] `P1` Les placeholders ne remplacent jamais un label permanent.
- [ ] `P2` Les graphiques utilisent motifs, labels ou legendes en plus des couleurs proches.

### Etats UI
- [ ] `P0` Loading, disabled, selected, expanded, invalid et success sont distincts.
- [ ] `P1` Les badges et statuts gardent une nomenclature constante dans tout le dashboard.
- [ ] `P1` Les contrastes sont testes sur mobile en luminosite forte.
- [ ] `P2` Les ombres, bordures et fonds ne creent pas une hierarchie contradictoire.

---

## 7) Espacement mobile / tablette / desktop

### Echelle d'espacement
- [ ] `P0` Les composants critiques ne collent jamais aux bords du viewport mobile.
- [ ] `P0` Les zones cliquables ont un espacement suffisant pour eviter les erreurs de tap.
- [ ] `P1` Les sections utilisent une echelle coherente: compact mobile, medium tablette, large desktop.
- [ ] `P1` Les cards alignees gardent des gutters constants dans une meme zone.
- [ ] `P2` Les espaces entre titre, meta, contenu et actions suivent un rythme commun.

### Densite dashboard
- [ ] `P0` Les pages longues restent scannables: titres, separations et groupes visuels clairs.
- [ ] `P1` Les filtres et barres d'actions ne masquent pas le contenu principal sur petits ecrans.
- [ ] `P1` Les sticky headers ou footers n'occupent pas une part excessive du viewport mobile.
- [ ] `P2` Les espaces vides desktop ne deviennent pas des gouffres visuels sur grands ecrans.

---

## 8) Navigation, sidebar et header

- [ ] `P0` La sidebar mobile s'ouvre, se ferme et annonce correctement son etat.
- [ ] `P0` L'overlay mobile ne bloque pas le desktop.
- [ ] `P0` Le bouton menu est accessible au clavier et a un nom clair.
- [ ] `P0` La route active est indiquee visuellement et programmaticalement si possible.
- [ ] `P1` La navigation reste utilisable avec zoom navigateur a 200%.
- [ ] `P1` Les sous-menus sont atteignables au clavier et refermables.
- [ ] `P2` Le header conserve une hauteur stable entre pages.

---

## 9) Tables, listes et donnees denses

- [ ] `P0` Les donnees essentielles restent visibles sur mobile.
- [ ] `P0` Les tableaux larges ont une strategie mobile explicite: cards, colonnes prioritaires ou scroll local.
- [ ] `P0` Les actions de ligne restent accessibles sans precision excessive.
- [ ] `P1` Les en-tetes de colonnes restent associes aux valeurs, meme en mode card.
- [ ] `P1` Les tris, filtres et pagination sont accessibles au clavier.
- [ ] `P1` Les listes vides, erreurs API et chargements gardent une structure stable.
- [ ] `P2` Les libelles repetes sont reduits sur desktop mais explicites sur mobile.

---

## 10) Verification avant deploiement

### Viewports minimaux
- [ ] `P0` Mobile: 360 x 800.
- [ ] `P0` Mobile courant: 390 x 844.
- [ ] `P0` Tablette: 768 x 1024.
- [ ] `P0` Desktop: 1280 x 800.
- [ ] `P1` Desktop large: 1440 x 1000 ou plus.
- [ ] `P1` Zoom navigateur: 200%.
- [ ] `P1` Orientation paysage mobile si le parcours est critique.

### Parcours a tester
- [ ] `P0` Connexion puis arrivee dashboard.
- [ ] `P0` Ouverture/fermeture sidebar mobile.
- [ ] `P0` Creation ou edition via formulaire.
- [ ] `P0` Ouverture/validation/fermeture d'une modale.
- [ ] `P0` Navigation clavier complete d'une page critique.
- [ ] `P1` Filtrage, recherche, pagination ou tri.
- [ ] `P1` Gestion erreur API et empty state.
- [ ] `P1` Action destructive avec confirmation.

### Critere de sortie
- [ ] `P0` Aucun scroll horizontal global.
- [ ] `P0` Aucun element interactif inaccessible au clavier.
- [ ] `P0` Aucun contraste critique en dessous du seuil.
- [ ] `P0` Aucun focus perdu dans modale, drawer ou navigation.
- [ ] `P0` Aucun bouton/action principale hors viewport mobile sans raison metier.
- [ ] `P1` Tous les composants partages critiques ont ete testes avec contenu long.
- [ ] `P1` Les snapshots ou tests visuels sont mis a jour uniquement apres verification manuelle.

---

## 11) Notes d'audit a renseigner

| Zone | Viewport | Probleme | Priorite | Fichier / composant | Decision | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard shell | Mobile |  |  |  |  |  |
| Sidebar / Header | Mobile / Tablette |  |  |  |  |  |
| Cards KPI | Mobile / Desktop |  |  |  |  |  |
| Formulaires | Mobile |  |  |  |  |  |
| Modales / Drawers | Mobile / Tablette |  |  |  |  |  |
| Tables / Listes | Mobile |  |  |  |  |  |
| Composants partages | Tous |  |  |  |  |  |

## 12) Notes d'execution

### 25/05/2026 - Lot modales owner

| Zone | Viewport | Probleme | Priorite | Fichier / composant | Decision | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| Demandes owner | Tous | Popup de creation sans focus trap complet | P0 | `src/app/dashboard/owner/demandes/page.tsx` | Ajout focus initial, Escape, trap Tab, retour focus, scroll body bloque | PASS technique, test manuel mobile a faire |
| Missions voyageurs owner | Tous | Atelier de creation encore inline au lieu d'une popup | P0 | `src/app/dashboard/owner/missions/voyageurs/page.tsx` | Conversion en vraie modale `dialog` avec focus trap et overlay | PASS technique, test manuel mobile a faire |
