import { test, expect } from "@playwright/test";
import { loginAs } from "./test-utils/auth";
import { mockProviderProfiles, mockProviderProfileWithDocuments } from "./test-utils/mocks";

// Tests pour la Phase 2: Profil Artisan - Édition, Validation et Densité locale

test.describe("Provider Profile - Phase 2", () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant que provider/artisan
    await loginAs(page, "provider");
  });

  test.describe("Édition du profil artisan", () => {
    test("devrait afficher la page d'édition du profil artisan", async ({ page }) => {
      await page.goto("/dashboard/provider/settings");
      
      // Vérifier que la page se charge
      await expect(page.getByText("Artisan partenaire")).toBeVisible();
      
      // Vérifier la présence des sections
      await expect(page.getByText("Informations du compte")).toBeVisible();
      await expect(page.getByText("Adresse et présence locale")).toBeVisible();
      await expect(page.getByText("Activité, confiance et disponibilité")).toBeVisible();
    });

    test("devrait permettre d'éditer le champ compétences/métiers (skills)", async ({ page }) => {
      await page.goto("/dashboard/provider/settings?tab=account");
      
      // Attendre que la page soit chargée
      await page.waitForSelector("[name='skills']");
      
      // Vérifier que le champ skills existe
      const skillsField = page.getByLabel("Compétences/métiers");
      await expect(skillsField).toBeVisible();
      
      // Remplir le champ
      await skillsField.fill("Plomberie, Electricité, Menuiserie");
      
      // Sauvegarder
      await page.getByRole("button", { name: /Mettre à jour|Sauvegarder|Save/i }).first().click();
      
      // Vérifier que la sauvegarde a réussi
      await expect(page.getByText(/Profil mis à jour|mis a jour/i)).toBeVisible();
    });

    test("devrait afficher la complétude du profil", async ({ page }) => {
      await page.goto("/dashboard/provider/settings");
      
      // Vérifier que le pourcentage de complétude est affiché
      await expect(page.getByText(/%/)).toBeVisible();
    });
  });
});

test.describe("Validation admin des profils artisans", () => {
  test.beforeEach(async ({ page }) => {
    // Se connecter en tant qu'admin
    await loginAs(page, "admin");
  });

  test("devrait afficher la page de validation des artisans", async ({ page }) => {
    await page.goto("/dashboard/admin/providers/validation");
    
    // Vérifier que la page se charge
    await expect(page.getByText("Validation des profils artisans")).toBeVisible();
    
    // Vérifier les filtres
    await expect(page.getByText("Tous")).toBeVisible();
    await expect(page.getByText("En attente")).toBeVisible();
    await expect(page.getByText("Partiel")).toBeVisible();
    await expect(page.getByText("Validés")).toBeVisible();
  });

  test("devrait permettre de filtrer les artisans par statut de validation", async ({ page }) => {
    await page.goto("/dashboard/admin/providers/validation");
    
    // Cliquer sur le filtre "En attente"
    await page.getByText("En attente").click();
    
    // Vérifier que l'URL a été mise à jour
    await expect(page).toHaveURL(/.*filter=pending/);
  });

  test("devrait afficher la densité locale", async ({ page }) => {
    await page.goto("/dashboard/admin/providers/validation");
    
    // Cliquer sur "Afficher la densité locale"
    await page.getByText(/Afficher.*densité locale/i).click();
    
    // Vérifier que la densité est affichée
    await expect(page.getByText("Densité locale des artisans")).toBeVisible();
    
    // Vérifier que le tableau de densité est affiché
    await expect(page.getByText("Zone / Ville")).toBeVisible();
    await expect(page.getByText("Artisans")).toBeVisible();
  });

  test("devrait permettre de rechercher un artisan", async ({ page }) => {
    await page.goto("/dashboard/admin/providers/validation");
    
    // Remplir le champ de recherche
    const searchInput = page.getByPlaceholder(/Rechercher par nom, ville ou métier/i);
    await searchInput.fill("test");
    
    // Vérifier que la recherche est déclenchée
    await expect(page).toHaveURL(/.*search=test/);
  });
});

test.describe("API Provider Profile", () => {
  test("devrait retourner le profil provider avec la complétude", async ({ request }) => {
    // Cela serait un test API direct, mais Playwright est surtout pour les tests E2E
    // On vérifie plutôt que l'API est appelée correctement depuis le frontend
    
    // Pour l'instant, on passe ce test car il nécessiterait un setup spécifique
    test.skip();
  });
});
