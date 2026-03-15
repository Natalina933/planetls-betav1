# Mini Design System

## Regles visuelles figees

- Card `small`: largeur max 320px, usage map/suggestions/resultats compacts.
- Card `large`: largeur max 520px, usage profils/resultats detailles.
- Avatars: `sm` 32px, `md` 48px, `lg` 72px.
- Loader: `sm` 20px, `md` 32px, `lg` 48px.
- Espacements: utiliser uniquement `--ui-space-*` ou `--ds-space-*`.
- Layout page: `Container` pour la largeur, `Section` pour le rythme vertical.
- Badges statuts: `Badge`.
- Labels/categories: `Tag`.
- Actions UI: `Button`, `ButtonLink` ou `UILink`.
- Champs saisie: `Input | Select | Textarea | Checkbox`.
- Recherche simple: `SearchBar`.

## Variants autorises

- `Button`: `primary | secondary | outline | ghost | paper | dark`
- `Badge`: `neutral | gold | dark | success | warning | danger | info`
- `Tag`: `default | category | status`
- `Card`: sizes `small | large`, tones `elevated | outlined | soft | dark`
- `Tabs`: `Tabs | TabsList | TabsTrigger | TabsContent`
- `Loader`: `sm | md | lg`
- `Input | Select | Textarea`: `default | soft | dark`
- `Checkbox`: sans variant (version de base DS)

## Interdictions

- Pas de nouvelle primitive dans `src/app/components/common/*`.
- Pas de style inline pour boutons/cartes/badges/inputs/tags/avatars.
- Pas de nouveaux variants locaux hors `src/components/ui/*`.

## Mapping migration

- `common/Cards/Card` -> `ui/Card`
- `common/Badge` -> `ui/Badge`
- `common/Avatar` -> `ui/Avatar`
- `common/Inputs/Input` -> `ui/Input`
- `common/Buttons/*` -> `ui/Button` ou `ui/ButtonLink`
- `common/Loader/*` -> `ui/Loader`
- `input[type="checkbox"]` local -> `ui/Checkbox`
- `select` local -> `ui/Select`
- `textarea` local -> `ui/Textarea`

## Statut migration (frozen)

- Etape 1: primitives `common/*` remplacees sur pages trafic prioritaire (`Home`, `Owner Concierges`, `MapWithList`).
- Etape 2: styles inline retires pour primitives boutons/cartes/badges/inputs dans ces zones.
- Etape 3: variants centralises dans `src/components/ui/*`.
- Etape 4: anciens composants `src/app/components/common/*` supprimes (aucun import restant).
- Etape 5: ce document est la reference figee des regles UI.

## Import

```ts
import {
  Button,
  ButtonLink,
  UILink,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Tag,
  Avatar,
  Container,
  Section,
  Input,
  Select,
  Textarea,
  Checkbox,
  SearchBar,
  Loader,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
```
