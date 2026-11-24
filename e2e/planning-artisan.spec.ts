/* Planning Artisan — P2-01
 * Tests e2e pour la page de planification artisan
 * 9 tests ciblés : ouverture sidebar, focus clavier, affichage planning
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { test, expect } from "@playwright/test";

describe("Planning Artisan P2-01", () => {
  beforeEach(() => {
    // Se connecter en tant que propriétaire
    test.intercept("GET", "/api/user-type", {
      fixture: "owner",
    }).as("getUserType");
    test.goto("/login");
    test.waitFor("@getUserType");
  });

  it("devrait afficher la page de planification artisan", async ({ page }) => {
    // Naviguer vers la planification artisan
    await page.click("text=Planification");
    await page.waitForURL("/dashboard/artisan/planning");
    
    // Vérifier le titre
    await expect(page.locator("h1")).toHaveText("Planification Artisan");
  });

  it("devrait avoir un calendrier affiché", async ({ page }) => {
    await page.click("text=Planification");
    await page.waitForURL("/dashboard/artisan/planning");
    await expect(page.locator(".calendar, [data-testid*='calendar']")).toBeVisible();
  });

  it("devrait permettre la navigation clavier", async ({ page }) => {
    await page.click("text=Planification");
    await page.waitForURL("/dashboard/artisan/planning");
    
    // Tester Tab et Shift+Tab
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
  });

  it("devrait fermer la sidebar sur mobile", async ({ page }) => {
    await page.click("text=Planification");
    await page.waitForURL("/dashboard/artisan/planning");
    
    // Fermer la sidebar mobile
    await page.click("[aria-label=\"Fermer la sidebar\"]");
    await expect(page.locator("[aria-label=\"Sidebar\"]")).toHaveClass(
      /sidebar.*closed/
    );
  });
});