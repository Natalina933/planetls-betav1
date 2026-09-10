import {
    ArrowRight,
    Bell,
    Calendar,
    CalendarClock,
    FileText,
    Home,
    LayoutDashboard,
    MessageSquareText,
    Route,
    Search,
    Settings,
    Sparkles,
    Sun,
    Users,
    Wallet,
    Wrench,
} from "lucide-react";
import styles from "./OwnerReferenceDashboard.module.scss";

const SIDEBAR_LINKS: { label: string; icon: typeof LayoutDashboard; active?: boolean }[] = [
    { label: "Tableau de bord", icon: LayoutDashboard, active: true },
    { label: "Mes logements", icon: Home },
    { label: "Réservations", icon: CalendarClock },
    { label: "Calendrier", icon: Calendar },
    { label: "Revenus", icon: Wallet },
    { label: "Voyageurs", icon: Users },
    { label: "Messages", icon: MessageSquareText },
    { label: "Documents", icon: FileText },
    { label: "Prestations", icon: Wrench },
    { label: "Facturation", icon: FileText },
    { label: "Mon compte", icon: Settings },
];

const KPIS = [
    { value: "12", label: "Réservations à venir", meta: "+ 2 cette semaine", Icon: CalendarClock },
    { value: "4 320 €", label: "Revenus du mois", meta: "+ 12 % vs août", Icon: Wallet },
    { value: "3", label: "Logements en location", meta: "Taux d’occupation : 78 %", Icon: Home },
    { value: "4,8 / 5", label: "Note moyenne", meta: "48 avis voyageurs", Icon: Sparkles },
] as const;

const PROPERTIES = [
    { name: "Villa Horizon", city: "Le Barcarès", rate: "92 %", status: "En location", tone: "success" as const },
    { name: "Appartement Méditerranée", city: "Le Barcarès", rate: "76 %", status: "Arrivée samedi", tone: "warning" as const },
    { name: "Le Cocon du Port", city: "Le Barcarès", rate: "68 %", status: "Libre", tone: "neutral" as const },
];

const RESERVATIONS = [
    { date: "11 sept.", property: "Villa Horizon", travelers: "4", status: "Arrivée", tone: "warning" as const },
    { date: "18 sept.", property: "Appartement Méditerranée", travelers: "2", status: "Arrivée", tone: "warning" as const },
    { date: "25 sept.", property: "Le Cocon du Port", travelers: "6", status: "À venir", tone: "neutral" as const },
    { date: "2 oct.", property: "Villa Horizon", travelers: "4", status: "À venir", tone: "neutral" as const },
    { date: "10 oct.", property: "Appartement Méditerranée", travelers: "2", status: "À venir", tone: "neutral" as const },
];

const TASKS = [
    { label: "Vérifier le ménage – Villa Horizon", due: "Avant samedi" },
    { label: "Préparer le kit d’accueil", due: "Avant samedi" },
    { label: "Recharger les consommables", due: "Cette semaine" },
    { label: "Vérifier la climatisation", due: "Cette semaine" },
    { label: "Mettre à jour les tarifs d’octobre", due: "25 sept." },
];

const MESSAGES = [
    { name: "Sophie Martin", preview: "Tout est prêt pour votre arrivée !", time: "10:24" },
    { name: "Famille Bernard", preview: "Hâte de découvrir la villa !", time: "Hier" },
    { name: "Lucas Moreau", preview: "Merci pour votre réactivité 🙏", time: "Hier" },
    { name: "Emma Lefèvre", preview: "Séjour parfait, merci !", time: "6 sept." },
];

const SERVICES = [
    { title: "Confier le ménage", detail: "Service fiable", Icon: Sparkles },
    { title: "Maintenance", detail: "Intervention rapide", Icon: Wrench },
    { title: "Gestion des voyageurs", detail: "Nous nous en occupons", Icon: Users },
    { title: "Conseils & optimisation", detail: "Augmentez vos revenus", Icon: Route },
];

const REVENUE_MONTHS = [
    { label: "Avr", value: 46 },
    { label: "Mai", value: 58 },
    { label: "Juin", value: 68 },
    { label: "Juil", value: 82 },
    { label: "Août", value: 74 },
    { label: "Sept", value: 100 },
];

export default function OwnerReferenceDashboard() {
    return (
        <div className={styles.dashboardOwner} data-owner-dashboard-reference>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarLogo}>
                    <Home size={22} aria-hidden="true" />
                    <span className={styles.brand}>PlanetLS<small>Mon espace propriétaire</small></span>
                </div>
                <nav className={styles.sidebarNav} aria-label="Navigation propriétaire (démonstration)">
                    {SIDEBAR_LINKS.map(({ label, icon: Icon, active }) => (
                        <span key={label} className={[styles.sidebarLink, active ? styles.active : ""].join(" ")}>
                            <Icon size={17} aria-hidden="true" /> {label}
                        </span>
                    ))}
                </nav>
                <p className={styles.sidebarQuote}>Des séjours<br />sereins,<br />une valeur durable</p>
            </aside>

            <div className={styles.main}>
                <header className={styles.topbar}>
                    <div className={styles.searchBar}><Search size={16} aria-hidden="true" /> Rechercher une réservation, un logement, un voyageur...</div>
                    <div className={styles.topbarActions}>
                        <Bell size={18} aria-hidden="true" />
                        <span className={styles.profile}><strong>Jean Dupont</strong><small>Propriétaire</small></span>
                    </div>
                </header>

                <div className={styles.content}>
                    <section className={styles.hero} aria-label="Accueil propriétaire">
                        <div className={styles.heroContent}>
                            <h1>Bonjour Jean,</h1>
                            <p>Vos logements créent de beaux souvenirs.</p>
                            <blockquote>« Ensemble, valorisons<br />ce qui vous est cher »</blockquote>
                        </div>
                        <div className={styles.heroMeta}>
                            <span className={styles.heroDate}>Mardi<br />9 septembre 2026</span>
                            <span className={styles.heroWeather}><Sun size={20} aria-hidden="true" /> 24°C<small>Le Barcarès</small></span>
                        </div>
                    </section>

                    <section className={styles.kpiGrid} aria-label="Indicateurs propriétaire">
                        {KPIS.map(({ value, label, meta, Icon }) => (
                            <article key={label} className={styles.kpiCard}>
                                <Icon className={styles.kpiIcon} size={32} strokeWidth={1.6} aria-hidden="true" />
                                <div><strong>{value}</strong><span>{label}</span><small>{meta}</small></div>
                            </article>
                        ))}
                    </section>

                    <section className={styles.mainGrid} aria-label="Pilotage propriétaire">
                        <div className={styles.column}>
                            <article className={styles.card}>
                                <header className={styles.cardHeader}><h2>Prochaine arrivée</h2><span className={styles.badge}>Dans 2 jours</span></header>
                                <div className={styles.arrivalBody}>
                                    <div className={styles.arrivalImage} aria-hidden="true"><Home size={30} /></div>
                                    <div>
                                        <div className={styles.arrivalTop}><span>Samedi 11 septembre</span><strong>16:00</strong></div>
                                        <h3>Famille Bernard</h3>
                                        <p className={styles.arrivalProperty}>Villa Horizon</p>
                                        <ul className={styles.arrivalDetails}>
                                            <li>4 voyageurs</li>
                                            <li>7 nuits</li>
                                            <li>Check-in autonome</li>
                                        </ul>
                                        <div className={styles.arrivalActions}>
                                            <button type="button" className={styles.primaryButton}>Voir la réservation</button>
                                            <button type="button" className={styles.secondaryButton}>Contacter les voyageurs</button>
                                        </div>
                                    </div>
                                </div>
                            </article>

                            <article className={styles.card}>
                                <header className={styles.cardHeader}><h2>Mes prochaines réservations</h2><a href="#">Voir toutes les réservations <ArrowRight size={13} /></a></header>
                                <div className={styles.tableWrap}>
                                    <table>
                                        <thead><tr><th>Date</th><th>Logement</th><th>Voyageurs</th><th>Statut</th></tr></thead>
                                        <tbody>
                                            {RESERVATIONS.map((row) => (
                                                <tr key={`${row.date}-${row.property}`}>
                                                    <td>{row.date}</td>
                                                    <td>{row.property}</td>
                                                    <td>{row.travelers}</td>
                                                    <td><span className={[styles.tag, styles[row.tone]].join(" ")}>{row.status}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </article>
                        </div>

                        <div className={styles.column}>
                            <article className={styles.card}>
                                <header className={styles.cardHeader}><h2>Mes logements</h2><a href="#">Voir tous mes logements <ArrowRight size={13} /></a></header>
                                <ul className={styles.propertyList}>
                                    {PROPERTIES.map((property) => (
                                        <li key={property.name} className={styles.propertyRow}>
                                            <span className={styles.propertyThumb} aria-hidden="true"><Home size={18} /></span>
                                            <span>
                                                <strong>{property.name}</strong>
                                                <small>{property.city}</small>
                                                <span className={[styles.tag, styles[property.tone]].join(" ")}>{property.status}</span>
                                            </span>
                                            <span className={styles.propertyRate}><strong>{property.rate}</strong><small>Taux d’occupation</small></span>
                                        </li>
                                    ))}
                                </ul>
                            </article>

                            <article className={styles.card}>
                                <header className={styles.cardHeader}><h2>À ne pas oublier</h2><a href="#">Voir tout <ArrowRight size={13} /></a></header>
                                <ul className={styles.taskList}>
                                    {TASKS.map((task) => (
                                        <li key={task.label} className={styles.task}>
                                            <span className={styles.taskCheckbox} aria-hidden="true" />
                                            <span>{task.label}</span>
                                            <small>{task.due}</small>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        </div>

                        <div className={styles.column}>
                            <article className={styles.card}>
                                <header className={styles.cardHeader}><h2>Mes revenus</h2><span className={styles.filterTag}>Ce mois-ci</span></header>
                                <div className={styles.revenueValue}><strong>4 320 €</strong><span>+ 12 % vs août</span></div>
                                <div className={styles.revenueChart} aria-hidden="true">
                                    {REVENUE_MONTHS.map((month, index) => (
                                        <span
                                            key={month.label}
                                            className={[styles.revenueBar, index === REVENUE_MONTHS.length - 1 ? styles.current : ""].join(" ")}
                                            style={{ height: `${month.value}%` }}
                                            title={month.label}
                                        />
                                    ))}
                                </div>
                                <div className={styles.revenueMonths}>{REVENUE_MONTHS.map((month) => <span key={month.label}>{month.label}</span>)}</div>
                                <a href="#" className={styles.cardLink}>Voir le détail des revenus <ArrowRight size={13} /></a>
                            </article>

                            <article className={styles.card}>
                                <header className={styles.cardHeader}><h2>Messages récents</h2><a href="#">Voir tous <ArrowRight size={13} /></a></header>
                                <ul className={styles.messageList}>
                                    {MESSAGES.map((message) => (
                                        <li key={message.name} className={styles.message}>
                                            <span className={styles.avatar} aria-hidden="true">{message.name.charAt(0)}</span>
                                            <span>
                                                <strong>{message.name}</strong>
                                                <small>{message.preview}</small>
                                            </span>
                                            <time>{message.time}</time>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        </div>
                    </section>

                    <section className={styles.servicesCard} aria-label="Services PlanetLS">
                        <h2>Des services pour vous simplifier la vie</h2>
                        <div className={styles.servicesGrid}>
                            {SERVICES.map(({ title, detail, Icon }) => (
                                <div key={title} className={styles.service}>
                                    <Icon size={22} className={styles.serviceIcon} aria-hidden="true" />
                                    <strong>{title}</strong>
                                    <small>{detail}</small>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className={styles.estimateCard} aria-label="Estimer un autre bien">
                        <div className={styles.estimateContent}>
                            <h2>Vous possédez un autre bien ?</h2>
                            <p>Confiez-le nous et maximisez sa rentabilité.</p>
                            <button type="button" className={styles.primaryButton}>Estimer mes revenus</button>
                        </div>
                    </section>

                    <footer className={styles.footerSignature}>
                        <p>« Des biens d’exception,<br />des revenus durables »</p>
                        <span><Home size={16} aria-hidden="true" /> PlanetLS<br /><small>Mon espace propriétaire</small></span>
                    </footer>
                </div>
            </div>
        </div>
    );
}
