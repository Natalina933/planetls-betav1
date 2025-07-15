import { CalendarCheck, Users, MessageSquareHeart } from 'lucide-react';
import styles from "./ServiceList.module.scss";

const services = [
    {
        id: 1,
        icon: <MessageSquareHeart className={styles.icon} />,
        title: "Accompagnement sur-mesure",
        description: "Une équipe dédiée vous accompagne à chaque étape, vous guide dans l'utilisation de la plateforme et répond à toutes vos questions en direct."
    },
    {
        id: 2,
        icon: <Users className={styles.icon} />,
        title: "Mise en relation qualifiée",
        description: "Accédez à un réseau d’artisans, de concierges et de propriétaires fiables : filtrez par besoins, profils ou avis et entrez en contact en un clic."
    },
    {
        id: 3,
        icon: <CalendarCheck className={styles.icon} />,
        title: "Gestion automatisée & planning intelligent",
        description: "Centralisez vos tâches, recevez des rappels, gérez votre calendrier et vos dossiers fiscaux en toute simplicité, sans perdre de temps sur l'administratif."
    }
];

export default function ServiceList() {
    return (
        <section className={styles.platformSection}>
            <h2 className={styles.sectionTitle}>Louer, gérer, collaborer en toute confiance</h2>
            <p className={styles.sectionIntro}>
                <b>PlanetLs, la plateforme qui simplifie et sécurise toutes vos démarches de location saisonnière.</b>
                <br />
                Automatisez, centralisez et accédez à un accompagnement humain et technologique unique pour réussir, que vous soyez propriétaire, professionnel ou artisan.
            </p>
            <ul className={styles.keyPoints}>
                <li>Tableau de bord complet, pilotage intelligent</li>
                <li>Planning partagé, automatisations, rapports</li>
                <li>Sécurité des accès, gestion simplifiée des documents</li>
                <li>Espace membre privé et assistance personnalisée</li>
            </ul>
            <div className={styles.serviceList}>
                {services.map(({ id, icon, title, description }) => (
                    <div key={id} className={styles.serviceItem}>
                        <div className={styles.iconCircle}>
                            {icon}
                        </div>
                        <h3 className={styles.serviceTitle}>{title}</h3>
                        <p className={styles.serviceDescription}>{description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
