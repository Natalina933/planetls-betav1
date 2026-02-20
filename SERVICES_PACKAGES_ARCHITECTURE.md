# 🎯 Architecture Professionnelle : Services → Tarifs → Contrats

## 📋 Vue d'ensemble

Ce système crée un **flux professionnel et fluide** où :

```
Services Proposés (ServiceCatalogManager)
         ↓
    Packs de Services (NEW)
         ↓
Tarifs Dynamiques (PricingGridManager)
         ↓
   Modèles de Contrats (NEW)
         ↓
   Contrats Signés (ContractsManager)
```

## 🔗 Composants du système

### 1️⃣ **ServiceCatalogManager** (Existant)

- Liste complète des services disponibles
- Flag `isProposed: true` = service proposé par le concierge
- Export des services proposés aux autres modules

**Exemple :**

```
Ménage → isProposed: true
Check-in/Check-out → isProposed: true
Linge bébé → isProposed: true
```

### 2️⃣ **ServicePackageManager** (NOUVEAU)

- Groupe les services proposés en **packs logiques**
- Packs typiques :
  - `"Pack Budget"` = Ménage + Check-in + Linge
  - `"Pack Luxe"` = Tous les services + Concierge 24/7
  - `"Pack Courte Durée"` = Check-in + Ménage entre voyageurs + Check-out
  - `"Pack Maintenance"` = Contrôle état + Petites réparations + Urgences

**Stockage :**

```sql
services_packages (
  id, profile_id, name, description, category, created_at
)

services_package_items (
  id, package_id, service_id
)
```

### 3️⃣ **PricingGridManager** (À améliorer)

- Crée des tarifs **basés sur les packs**
- Chaque pack peut avoir plusieurs tarifs selon :
  - Type de propriété (studio, T2, T3, villa)
  - Type de durée (horaire, forfait, mensuel)
  - Saisonnalité

**Liaison :**

```sql
pricing_packages (
  id, profile_id, package_id, label, type, amount, ...
)
```

### 4️⃣ **ContractTemplateManager** (NOUVEAU)

- Crée des **modèles de contrats** basés sur les packs
- Chaque modèle inclut les conditions des services du pack
- Exemple pour "Pack Budget" :
  - Conditions de ménage
  - Responsabilités check-in/out
  - États des linges

**Stockage :**

```sql
contract_templates (
  id, profile_id, package_id, title, content, variables, created_at
)
```

## 🔄 Flux de synchronisation

### Étape 1 : Sélectionner les services proposés

```
ServiceCatalogManager → [Ménage✓, Check-in✓, Linge✓]
```

### Étape 2 : Créer un pack

```
ServicePackageManager.create({
  name: "Pack Budget",
  category: "Courte Durée",
  service_ids: [1, 16, 13]
})
→ Package créé avec ID: pkg_001
```

### Étape 3 : Créer un tarif pour le pack

```
PricingGridManager.create({
  package_id: "pkg_001",
  label: "Pack Budget - Studio",
  type: "fixed",
  amount: 150,
  property_type: "studio"
})
→ Pricing créé avec ID: pricing_001
→ Lien automatique : pricing_packages(package_id=pkg_001)
```

### Étape 4 : Créer un modèle de contrat

```
ContractTemplateManager.create({
  package_id: "pkg_001",
  title: "Modèle Pack Budget",
  content: "Incluant les services : Ménage Standard, Check-in/Check-out, Gestion linge"
})
→ Template créé avec ID: tpl_001
```

### Étape 5 : Générer un contrat final

```
ContractsManager.create({
  template_id: "tpl_001",
  pricing_id: "pricing_001",
  variables: { client_name, start_date, amount, ...}
})
→ Contrat prêt à signer
```

## 📊 Avantages du système

| Avantage              | Impact                                                             |
| --------------------- | ------------------------------------------------------------------ |
| **Centralisation**    | Une modification du pack = mise à jour auto des tarifs et contrats |
| **Professionnalisme** | Tarifs cohérents, contrats standardisés                            |
| **Flexibilité**       | Créer des variantes (studio vs T3) du même pack                    |
| **Rapidité**          | Créer plusieurs tarifs/contrats en minutes                         |
| **Traçabilité**       | Historique complet Service → Pack → Tarif → Contrat                |

## 🗄️ Structure base de données (à créer)

```sql
-- Packs de services
CREATE TABLE services_packages (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP,
  UNIQUE(profile_id, name)
);

-- Services dans les packs
CREATE TABLE services_package_items (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES services_packages(id) ON DELETE CASCADE,
  service_id VARCHAR(50),
  UNIQUE(package_id, service_id)
);

-- Tarifs liés aux packs
CREATE TABLE pricing_packages (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  package_id UUID REFERENCES services_packages(id),
  label VARCHAR(255),
  type VARCHAR(20), -- hourly, fixed, monthly
  amount DECIMAL(10, 2),
  property_type VARCHAR(50),
  created_at TIMESTAMP
);

-- Modèles de contrats
CREATE TABLE contract_templates (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  package_id UUID REFERENCES services_packages(id),
  title VARCHAR(255),
  content TEXT,
  variables JSONB, -- {client_name, amount, services, ...}
  created_at TIMESTAMP
);
```

## 🚀 Intégration dans le Dashboard

### Nouvelle route dashboard concierge :

```
/dashboard/concierge/services-packages
```

### Ajouter à la navigation :

```tsx
<NavItem
  icon={Package}
  label="Packs de Services"
  href="/dashboard/concierge/services-packages"
/>
```

## 📝 Prochaines étapes

1. ✅ ~~ServicePackageManager créé~~
2. ⏳ **Créer ContractTemplateManager**
3. ⏳ **Modifier PricingGridManager** pour lister les packs
4. ⏳ **Créer pages dashboard** pour intégration
5. ⏳ **Migration base de données**
6. ⏳ **Tests de synchronisation** Pack → Tarifs → Contrats

## 💡 Cas d'usage

### Scénario 1 : Concierge avec 2 packs

```
Pack Budget (Ménage + Check-in + Linge)
  ├─ Tarif Studio : 120€
  ├─ Tarif T2 : 150€
  ├─ Contrat Template "Budget Standard"
  └─ Contrat Template "Budget Long Séjour"

Pack Luxe (Tous les services)
  ├─ Tarif Studio : 250€
  ├─ Tarif Villa : 500€
  ├─ Contrat Template "Luxe VIP"
  └─ Contrat Template "Luxe Premium"
```

### Scénario 2 : Modification rapide

```
Concierge : "Je retire le service 'Linge' du Pack Budget"
→ Package mis à jour
→ Historique des contrats préservé
→ Nouveaux contrats sans linge
→ Anciens contrats inchangés (version figée)
```

---

**Documentation continue dans les fichiers composants**
