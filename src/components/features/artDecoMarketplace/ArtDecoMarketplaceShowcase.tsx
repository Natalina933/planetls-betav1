import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tag } from "@/components/ui/Tag";
import styles from "./ArtDecoMarketplaceShowcase.module.scss";

const categories = [
  { title: "Conciergerie Premium", text: "Gestion multi-biens, check-in, relation voyageur, reporting proprietaire." },
  { title: "Artisans Verifies", text: "Interventions rapides et planifiees pour maintenance, renovation et depannage." },
  { title: "Services Voyageurs", text: "Accueil, menage, linge, transfert, experiences locales." },
  { title: "Partenaires Commercants", text: "Reseau local pour les besoins recurrents des sejours courte duree." },
];

const profiles = [
  {
    name: "Maison Riviera Concierge",
    role: "Conciergerie",
    city: "Nice",
    stats: "4.9/5 - 186 missions",
  },
  {
    name: "Atelier Cobalt",
    role: "Artisan",
    city: "Cannes",
    stats: "98% interventions < 24h",
  },
  {
    name: "Louise Martin",
    role: "Proprietaire",
    city: "Antibes",
    stats: "12 biens actifs",
  },
];

const features = [
  { title: "Matching Qualifie", text: "Priorisation des prestataires selon zone, disponibilite, SLA et niveau de verification." },
  { title: "Pilotage Financier", text: "Suivi devis, factures, marges et projections de revenus par portefeuille de biens." },
  { title: "Messagerie Metier", text: "Conversations contextualisees par mission avec historique, pieces jointes et statuts." },
  { title: "Conformite & Tracabilite", text: "Donnees structurees, preuves d'intervention et journal d'actions auditable." },
];

export function ArtDecoMarketplaceShowcase() {
  return (
    <div className={styles.theme}>
      <div className={styles.page}>
        <section className={styles.hero}>
          <Tag tone="category" className={styles.kicker}>
            Marketplace SaaS Belle Epoque
          </Tag>
          <h1>Plateforme Premium pour l'Ecosysteme de la Location Courte Duree</h1>
          <p>
            Connectez proprietaires, concierges, artisans et prestataires dans une interface elegante,
            fiable et orientee performance operationnelle.
          </p>
          <form className={styles.heroSearch} role="search">
            <Input bare placeholder="Ville, service, profil..." aria-label="Recherche principale" />
            <Button type="submit">Rechercher</Button>
          </form>
          <div className={styles.heroTrust}>
            <Badge variant="success">Profils verifies</Badge>
            <Badge variant="info">SLA visibles</Badge>
            <Badge variant="warning">Paiements securises</Badge>
          </div>
        </section>

        <div className={styles.separator} aria-hidden />

        <section className={styles.block}>
          <h2>Category Cards</h2>
          <div className={styles.categoryGrid}>
            {categories.map((item) => (
              <Card key={item.title} interactive className={styles.decoCard}>
                <CardHeader>
                  <h3>{item.title}</h3>
                </CardHeader>
                <CardBody>
                  <p>{item.text}</p>
                </CardBody>
                <CardFooter>
                  <Button size="sm" variant="outline">
                    Explorer
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <div className={styles.separator} aria-hidden />

        <section className={styles.block}>
          <h2>Search & Map Interface</h2>
          <div className={styles.searchLayout}>
            <aside className={styles.filters}>
              <h3>Filtres</h3>
              <Select defaultValue="all" aria-label="Type de profil">
                <option value="all">Tous les profils</option>
                <option value="concierge">Concierges</option>
                <option value="artisan">Artisans</option>
                <option value="owner">Proprietaires</option>
              </Select>
              <Select defaultValue="any" aria-label="Delai d'intervention">
                <option value="any">Delai: indifferente</option>
                <option value="24h">Intervention sous 24h</option>
                <option value="48h">Intervention sous 48h</option>
              </Select>
              <Input bare placeholder="Budget max mensuel" aria-label="Budget maximum" />
              <Button variant="secondary">Appliquer</Button>
            </aside>
            <div className={styles.resultsArea}>
              <Card className={styles.resultCard}>
                <CardHeader>
                  <h3>Riviera Check-In Services</h3>
                  <Badge variant="success">Verifie</Badge>
                </CardHeader>
                <CardBody>
                  <p>Accueil voyageurs - Nice centre - Reponse moyenne 28 min</p>
                </CardBody>
              </Card>
              <Card className={styles.resultCard}>
                <CardHeader>
                  <h3>Atelier Azur Maintenance</h3>
                  <Badge variant="info">Disponible</Badge>
                </CardHeader>
                <CardBody>
                  <p>Electricite et plomberie - Antibes - 96% missions completes</p>
                </CardBody>
              </Card>
              <div className={styles.mapMock} role="img" aria-label="Carte des resultats">
                <span>Map View</span>
              </div>
            </div>
          </div>
        </section>

        <div className={styles.separator} aria-hidden />

        <section className={styles.block}>
          <h2>Profile Cards</h2>
          <div className={styles.profileGrid}>
            {profiles.map((profile) => (
              <Card key={profile.name} interactive className={styles.profileCard}>
                <CardHeader>
                  <div>
                    <h3>{profile.name}</h3>
                    <p>
                      {profile.role} - {profile.city}
                    </p>
                  </div>
                  <Badge variant="success">Verifie</Badge>
                </CardHeader>
                <CardBody>
                  <p>{profile.stats}</p>
                  <Tag tone="status">Confiance elevee</Tag>
                </CardBody>
                <CardFooter>
                  <Button size="sm">Voir le profil</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>

        <div className={styles.separator} aria-hidden />

        <section className={styles.block}>
          <h2>Platform Feature Cards</h2>
          <div className={styles.featureGrid}>
            {features.map((feature) => (
              <Card key={feature.title} className={styles.featureCard}>
                <CardHeader>
                  <h3>{feature.title}</h3>
                </CardHeader>
                <CardBody>
                  <p>{feature.text}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
