# 🎨 Système de Thèmes - Documentation

## Vue d'ensemble

Le système de thèmes PlanetLS propose **trois thèmes élégants** basés sur des palettes historiques et artistiques :

- **🌞 Mode Clair** : Thème moderne lumineux avec or elegant
- **📜 Sepia 1900** : Thème nostalgique inspiré par l'esthétique vintage 1900s
- **🌙 Mucha Nocturne** : Thème sombre avec esthétique Art Nouveau d'Alphonse Mucha

## Architecture

### Fichiers de Thèmes

```
src/app/styles/themes/
├── index.scss              # Index centralisant tous les thèmes
├── _theme.tokens.scss      # Tokens communs partagés
├── _theme.light.scss       # Thème Mode Clair (défaut)
├── _theme.sepia.scss       # Thème Sepia 1900
└── _theme.dark.scss        # Thème Mucha Nocturne
```

### Variables CSS Partagées

Tous les thèmes utilisent ces variables CSS standardisées :

```css
/* Couleurs */
--color-primary                /* Couleur principale du thème */
--color-primary-rgb            /* RGB de la couleur primaire */
--color-primary-hover          /* Couleur hover de la primaire */
--color-primary-light          /* Version claire de la primaire */

/* Arrière-plans */
--background                   /* Fond principal */
--background-secondary         /* Fond secondaire */
--background-tertiary          /* Fond tertiaire */
--color-bg                     /* Fond alternatif */

/* Texte */
--color-text                   /* Texte primaire */
--color-text-secondary         /* Texte secondaire */
--color-text-muted             /* Texte atténué */
--color-text-light             /* Texte clair */

/* Bordures */
--color-border                 /* Bordure primaire */
--color-border-light           /* Bordure légère */
--color-border-dark            /* Bordure foncée */

/* Accents */
--color-accent                 /* Accent principal */
--color-accent-light           /* Accent clair */
--color-success                /* Couleur succès */
--color-error                  /* Couleur erreur */
--color-warning                /* Couleur avertissement */
--color-info                   /* Couleur info */

/* Overlay & Ombres */
--color-overlay                /* Overlay semi-transparent */
--color-shadow                 /* Ombre */
--color-focus-ring             /* Ring de focus accessibility */

/* Inputs */
--input-bg                     /* Fond input */
--input-border                 /* Bordure input */
--input-text                   /* Texte input */
--input-placeholder            /* Placeholder input */
--input-focus-ring             /* Focus ring input */
```

## Utilisation

### 1. Dans React (Changer de thème)

```typescript
import { useTheme, THEMES, THEME_LABELS } from '@/app/providers/ThemeProvider';

export function MyComponent() {
    const { theme, changeTheme, themes, labels } = useTheme();

    return (
        <>
            <p>Thème actuel: {labels[theme]}</p>

            <button onClick={() => changeTheme(THEMES.LIGHT)}>
                Mode Clair
            </button>

            <button onClick={() => changeTheme(THEMES.SEPIA)}>
                Sepia 1900
            </button>

            <button onClick={() => changeTheme(THEMES.MUCHA_DARK)}>
                Mucha Nocturne
            </button>
        </>
    );
}
```

### 2. Dans SCSS/CSS

Utilisez les variables CSS dans vos styles :

```scss
.myComponent {
  background: var(--background);
  color: var(--color-text);
  border: 1px solid var(--color-border);

  &:hover {
    color: var(--color-primary);
  }
}
```

### 3. Saut de thème avec préférence système

Le système détecte automatiquement les préférences du système d'exploitation.
Si aucun thème n'est sauvegardé et l'OS est en mode sombre, il applique "Mucha Nocturne".

## Détails des Thèmes

### 🌞 Mode Clair

- **Contexte** : Moderne, professionnel, accessible
- **Couleur Primaire** : Or classique (`#d4af37`)
- **Fond** : Blanc pur (`#ffffff`)
- **Texte** : Noir profond (`#1a1a1a`)
- **Cible** : Utilisation diurne, documents, lectures

### 📜 Sepia 1900

- **Contexte** : Nostalgique, élégant, histoire
- **Couleur Primaire** : Or sépia chaud (`#c9a876`)
- **Fond** : Papier ancien (`#f5ede3`)
- **Texte** : Encre sépia (`#5b4636`)
- **Cible** : Historique, authentique, vintage
- **Inspirations** : Art Nouveau, Affiches anciennes, Calligraphie historique

### 🌙 Mucha Nocturne

- **Contexte** : Art Nouveau, mystérieux, élégant
- **Couleur Primaire** : Or riche (`#d4af37`)
- **Fond** : Nuit profonde (`#1a1a2e`)
- **Texte** : Clair (`#f0f0f0`)
- **Cible** : Utilisation nocturne, théâtral, art
- **Inspirations** : Alphonse Mucha, Art Nouveau, Design luxe

## Customisation

### Ajouter un nouveau thème

1. Créez `src/app/styles/themes/_theme.myname.scss` :

```scss
[data-theme="myname"] {
  --color-primary: #yourcolor;
  --background: #yourbackground;
  /* ... autres variables ... */
}
```

2. Mettez à jour `src/app/providers/ThemeProvider.tsx` :

```javascript
export const THEMES = {
  // ... autres thèmes ...
  MY_THEME: "myname",
};

export const THEME_LABELS = {
  // ... autres labels ...
  myname: "🎨 Mon Thème",
};
```

3. Importez dans `styles/main.scss` :

```scss
@use "themes/theme.myname";
```

## Performance

- Les thèmes utilisent les **CSS Custom Properties (variables CSS)**
- Changement instantané sans rechargement
- Pas de duplication CSS inutile
- Sauvegarde en **localStorage** pour persistance
- Poids minimal (~2KB CSS supplémentaire)

## Accessibilité

- Tous les thèmes respectent les ratios WCAG AA
- Mode sombre Mucha reduce la fatigue oculaire
- Focus rings visibles sur tous les éléments interactifs
- Transitions lisses pour éviter les épilepsies photosensibles

## Support Navigateur

- ✅ Chrome/Edge 49+
- ✅ Firefox 31+
- ✅ Safari 9.1+
- ✅ iOS Safari 9.3+
- ✅ Android Browser 4.4+

Les variables CSS sont largement supportées. Les anciens navigateurs verront le thème par défaut (Mode Clair).

## Dépannage

### Le changement de thème ne fonctionne pas

Assurez-vous que :

1. `ThemeProvider` enveloppe votre application
2. Les fichiers de thème SCSS sont importés dans `main.scss`
3. Inspectez `<html data-theme="...">` dans DevTools

### Les styles ne s'appliquent pas

Vérifiez que vous utilisez `var(--color-variable)` et non des valeurs en dur.

### Performance slow

- Réduisez les transitions si elles sont trop longues
- Utilisez `will-change: color` sur les éléments qui changent fréquemment
- Optimisez les images pour chaque thème

## Évolution Future

- [ ] Palette personnalisée par utilisateur
- [ ] Thèmes basés sur géolocalisation (soleil/lune)
- [ ] Transitions animées entre thèmes
- [ ] Editor de thèmes visuel
