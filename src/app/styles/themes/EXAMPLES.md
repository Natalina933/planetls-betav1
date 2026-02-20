// ============================================
// EXEMPLES D'UTILISATION DU SYSTÈME DE THÈMES
// ============================================

/\*\*

- 1.  UTILISER LES THÈMES DANS UN COMPOSANT REACT
      \*/

// ❌ AVANT : Thème basic light/dark
export function OldThemeExample() {
const { theme, toggleTheme } = useTheme();

    return (
        <button onClick={toggleTheme}>
            Mode: {theme === 'light' ? 'Clair' : 'Sombre'}
        </button>
    );

}

// ✅ APRÈS : Thèmes sophistiqués
import { useTheme, THEMES, THEME_LABELS } from '@/app/context/ThemeContext';

export function ImprovedThemeSelector() {
const { theme, changeTheme, themes, labels, getCurrentLabel } = useTheme();

    return (
        <div className="theme-selector">
            <p>Thème actuel: <strong>{getCurrentLabel()}</strong></p>

            <div className="theme-buttons">
                {Object.entries(themes).map(([key, value]) => (
                    <button
                        key={key}
                        onClick={() => changeTheme(value)}
                        className={theme === value ? 'active' : ''}
                    >
                        {labels[value]}
                    </button>
                ))}
            </div>
        </div>
    );

}

/\*\*

- 2.  UTILISER LES VARIABLES DANS SCSS
      \*/

// ❌ AVANT : Couleurs en dur
.button {
background: #d4af37;
color: #222;
border: 1px solid #eaeaea;

    &:hover {
        background: #b99b2e;
    }

}

// ✅ APRÈS : Variables CSS dynamiques
.button {
background: var(--color-primary);
color: var(--color-text);
border: 1px solid var(--color-border);
transition: all var(--transition-base);

    &:hover {
        background: var(--color-primary-hover);
        box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.25);
    }

    &:focus {
        outline: 2px solid var(--color-focus-ring);
        outline-offset: 2px;
    }

}

/\*\*

- 3.  FORME AVANCÉE : COMPOSANT AVEC DESIGN RESPONSIVE
      \*/

'use client';

import { useTheme } from '@/app/context/ThemeContext';
import styles from './ComponentExample.module.scss';

export function AdvancedComponentExample() {
const { theme, changeTheme, themes, labels } = useTheme();

    return (
        <section className={styles.container}>
            <h1>Sélectionner un Thème</h1>

            <div className={styles.grid}>
                {Object.entries(themes).map(([key, themeId]) => {
                    const isActive = theme === themeId;

                    return (
                        <button
                            key={key}
                            onClick={() => changeTheme(themeId)}
                            className={`${styles.card} ${isActive ? styles.active : ''}`}
                            aria-pressed={isActive}
                        >
                            <div className={styles.preview}>
                                <div className={styles.color1}></div>
                                <div className={styles.color2}></div>
                            </div>
                            <h3>{labels[themeId]}</h3>
                            {isActive && <span className={styles.badge}>✓ Actif</span>}
                        </button>
                    );
                })}
            </div>
        </section>
    );

}

/\*\*

- 4.  SCSS POUR LE COMPOSANT AVANCÉ
      \*/

// ComponentExample.module.scss

.container {
padding: 2rem;
background: var(--background);
color: var(--color-text);
transition: all var(--transition-smooth);
}

.grid {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
gap: 1.5rem;
margin-top: 2rem;
}

.card {
display: flex;
flex-direction: column;
gap: 1rem;
padding: 1.5rem;
background: var(--background-secondary);
border: 2px solid var(--color-border);
border-radius: var(--radius-lg);
cursor: pointer;
transition: all var(--transition-base);
position: relative;

    &:hover {
        border-color: var(--color-primary);
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(var(--color-primary-rgb), 0.2);
    }

    &.active {
        border-color: var(--color-primary);
        background: rgba(var(--color-primary-rgb), 0.08);
    }

}

.preview {
display: flex;
gap: 0.5rem;
height: 60px;
}

.color1 {
flex: 1;
background: var(--color-primary);
border-radius: var(--radius-sm);
}

.color2 {
flex: 1;
background: var(--background);
border: 1px solid var(--color-border);
border-radius: var(--radius-sm);
}

.badge {
position: absolute;
top: 1rem;
right: 1rem;
background: var(--color-success);
color: white;
padding: 0.25rem 0.75rem;
border-radius: var(--radius-pill);
font-size: 0.75rem;
font-weight: 700;
}

/\*\*

- 5.  UTILISER DANS LE HOOK CUSTOM
      \*/

// hooks/useThemeStyles.ts
import { useTheme } from '@/app/context/ThemeContext';
import { useMemo } from 'react';

export function useThemeStyles() {
const { theme } = useTheme();

    const styles = useMemo(() => ({
        isDark: theme === 'mucha-dark',
        isSepia: theme === 'sepia',
        isLight: theme === 'light',
    }), [theme]);

    return styles;

}

// Utilisation:
function MyComponent() {
const { isDark, isSepia, isLight } = useThemeStyles();

    if (isDark) {
        // Logique spécifique au thème sombre
    }

    return <div>Thème détecté</div>;

}

/\*\*

- 6.  INTÉGRATION AVEC STYLED COMPONENTS (si utilisé)
      \*/

// Note: Recommandé d'utiliser CSS modules ou SCSS classes plutôt que styled-components
// Pour éviter les conflits avec le système de thèmes CSS

/\*\*

- 7.  ACCESSIBILITÉ - CONSIDÉRATIONS
      \*/

// Les thèmes respectent:
// ✅ WCAG AA contrast ratios
// ✅ Focus visible sur tous les éléments
// ✅ Transitions lisses (pas d'épilepsie photosensible)
// ✅ Support prefers-color-scheme système

// Exemple avec focus ring accessible:
.button {
outline: 2px solid transparent;
outline-offset: 2px;
transition: outline-color var(--transition-fast);

    &:focus-visible {
        outline-color: var(--color-focus-ring);
    }

}
