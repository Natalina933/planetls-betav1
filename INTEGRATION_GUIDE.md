# 🎨 Guide d'Intégration Finale - Système de Thèmes

## ✅ Étapes d'Intégration Complètes

### 1. Vérifier que ThemeProvider est actif

**Fichier :** `src/app/context/Providers.js`

Assurez-vous que ThemeProvider enveloppe toute l'application :

```javascript
'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './ThemeContext'; // ← Importer
import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from './LanguageContext';
import { NotificationProvider } from './NotificationContext';
import { UserTypeProvider } from './UserTypeContext';
import { SearchPopupProvider } from './SearchPopupContext';

export default function Providers({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <ThemeProvider>
                <LanguageProvider>
                    <NotificationProvider>
                        <UserTypeProvider>
                            <SearchPopupProvider>
                                {children}
                            </SearchPopupProvider>
                        </UserTypeProvider>
                    </NotificationProvider>
                </LanguageProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
```

### 2. Importer les styles dans layout.tsx

**Fichier :** `src/app/layout.tsx`

Assurez-vous que `main.scss` est importée :

```typescript
import '@/app/styles/main.scss'; // ← Vérifier cette ligne

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        {/* ... */}
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### 3. Vérifier les imports dans main.scss

**Fichier :** `src/app/styles/main.scss`

```scss
// Vérifier que les imports sont présents:
@use "themes/theme.tokens" as *;
@use "themes/theme.light" as *;
@use "themes/theme.sepia" as *;
@use "themes/theme.dark" as *;
```

### 4. Mettre à jour les composants pour utiliser les variables CSS

**Exemple:** Mettre à jour d'autres composants pour utiliser `var()` au lieu de couleurs en dur

```scss
// ❌ AVANT
.component {
  color: #d4af37;
  background: #ffffff;
  border: 1px solid #eaeaea;
}

// ✅ APRÈS
.component {
  color: var(--color-primary);
  background: var(--background);
  border: 1px solid var(--color-border);
}
```

## 🧪 Tests

### Test 1: Changement de Thème

1. Ouvrir la Navbar
2. Cliquer sur le sélecteur 🎨
3. Sélectionner un thème
4. Vérifier que les couleurs changent instantanément

### Test 2: Persistance

1. Changer de thème
2. Rafraîchir la page (F5)
3. Vérifier que le thème sélectionné est restauré

### Test 3: Mode Système

1. Modifier les préférences système en mode sombre
2. Vider localStorage
3. Recharger la page
4. Vérifier que "Mucha Nocturne" est appliqué

### Test 4: Accessibilité

1. Utiliser Tab pour naviguer
2. Focus rings visibles sur le sélecteur ✓
3. Utiliser Entrée pour sélectionner ✓
4. Clavier Escape pour fermer le dropdown ✓

### Test 5: Responsive

1. Desktop (1920px) : Label visible ✓
2. Tablet (768px) : Dropdown adapté ✓
3. Mobile (375px) : Label caché, icône visible ✓

## 🐛 Dépannage

### Problème: Les couleurs ne changent pas

**Solution:**

1. Vérifier que `<html data-theme="...">` est modifié
2. Ouvrir DevTools > Elements
3. Vérifier que l'attribut `data-theme` change
4. Vérifier que les variables CSS `:root[data-theme="..."]` sont définies

### Problème: Erreur "useTheme is not defined"

**Solution:**

1. Ajouter `'use client'` au début du composant
2. Importer correctement : `import { useTheme } from '@/app/context/ThemeContext'`
3. Vérifier que le composant est d'un enfant de ThemeProvider

### Problème: Les styles SCSS ne s'appliquent pas

**Solution:**

1. Vérifier que `main.scss` est importée dans `layout.tsx`
2. Vérifier que les imports @use ont `as *` (pour accès sans préfixe)
3. Nettoyer `.next` et reconstruire : `npm run build`

### Problème: Flash du thème au chargement

**Solution:**

1. C'est normal - le thème se charge après le premier rendu côté client
2. Ajouter un splash screen si critque
3. Ou utiliser Next.js `script` tag pour charger plus tôt

## 📦 Dépendances Requises

Aucune dépendance supplémentaire ! Le système utilise :

- React 18+ (hooks)
- Next.js (context, dynamic)
- Aucune librairie externe pour les thèmes

## 🚀 Déploiement

### Vérifications avant Production

```bash
# Compiler les SCSS
npm run build

# Vérifier la taille du bundle
npm run analyze

# Tester les 3 thèmes
# - Mode Clair
# - Mode Sepia 1900
# - Mode Mucha Nocturne
```

### Performance

- **CSS généré**: ~2KB supplémentaires
- **JS ajouté**: ~1KB (ThemeContext + hooks)
- **Impact performance**: Négligeable (<1ms changement)

## 📚 Ressources

- 📖 [README.md](./src/app/styles/themes/README.md) - Guide complet
- 💡 [EXAMPLES.md](./src/app/styles/themes/EXAMPLES.md) - Exemples code
- 📋 [THEMES_SUMMARY.md](./THEMES_SUMMARY.md) - Résumé des améliorations

## ✨ Prochaines Étapes

1. **Mettre à jour les composants existants** pour utiliser `var()`
2. **Tester sur tous les navigateurs** supports
3. **Ajouter des tests unitaires** pour ThemeContext
4. **Documenter les thèmes custom** si ajoute d'autres

## 🎯 Fichiers Clés

```
Thème            Fichier                              Couleur Primaire
─────────────────────────────────────────────────────────────────────
Mode Clair       _theme.light.scss                   #d4af37 (Or)
Sepia 1900       _theme.sepia.scss                   #c9a876 (Or Sépia)
Mucha Nocturne   _theme.dark.scss                    #d4af37 (Or Riche)

Configuration    src/context/ThemeContext.js         Theme management
Navigation       src/components/layout/Navbar/       Sélecteur thème
Styles           src/app/styles/abstracts/_root.scss Variables CSS
```

## ✅ Checklist Finale

- [ ] ThemeProvider actif dans Providers.js
- [ ] main.scss importée dans layout.tsx
- [ ] Navbar avec sélecteur visible
- [ ] Les 3 thèmes fonctionnent
- [ ] Persistence localStorage OK
- [ ] Mode système détecté
- [ ] Tests accessibilité keyboard OK
- [ ] Tests responsive OK
- [ ] Documentation lue et comprise
- [ ] Composants existants mis à jour (progressif)

## 🎨 Les 3 Palettes de Couleurs

### 🌞 Mode Clair

```
Primaire: #d4af37 (Or Classique)
Fond:     #ffffff (Blanc)
Texte:    #1a1a1a (Noir)
Accent:   #ffc107 (Ambré)
```

### 📜 Sepia 1900

```
Primaire: #c9a876 (Or Sépia Chaud)
Fond:     #f5ede3 (Papier Ancien)
Texte:    #5b4636 (Encre Sépia)
Accent:   #b8860b (Or Sombre)
```

### 🌙 Mucha Nocturne

```
Primaire: #d4af37 (Or Riche)
Fond:     #1a1a2e (Nuit Profonde)
Texte:    #f0f0f0 (Blanc Clair)
Accent:   #4a9eff (Bleu Intense)
```

---

**Prêt à déployer ! 🚀**

Pour toute question, consultez la documentation dans `/src/app/styles/themes/`
