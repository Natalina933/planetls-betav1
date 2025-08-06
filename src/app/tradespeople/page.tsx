import Card from '../components/common/Cards/Card';
import Badge from '../components/common/Badge';
import styles from './page.module.scss';

export default function TradespeoplePage() {
    return (
        <main className={styles.main}>
            <h1 className={styles.heading}>
                Bienvenue sur l’espace <Badge color="#ff9800">Artisans & Commerçants</Badge>
            </h1>
            <Card>
                <p>
                    Cette page est dédiée aux artisans et commerçants. Découvrez ici les services et ressources qui vous sont proposés pour développer votre activité.
                </p>
                <ul className={styles.list}>
                    <li>• Mise en relation avec des propriétaires et concierges</li>
                    <li>• Accès à un espace personnel pour gérer vos offres</li>
                    <li>• Visibilité accrue auprès de la communauté PlanetLs</li>
                    <li>• Support et accompagnement dédiés</li>
                </ul>
            </Card>
        </main>
    );
}