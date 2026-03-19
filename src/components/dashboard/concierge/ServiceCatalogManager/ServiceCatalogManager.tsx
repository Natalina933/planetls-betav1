import React, { useState, useMemo, useCallback } from 'react';
import { Search, Plus, CheckCircle, XCircle, Grid, List } from 'lucide-react'; // Utilisation d'icônes lucide-react

// --- Définition des types (adaptée de votre catalogue) ---

// Catégories (pour le regroupement)
type Category =
    'Ménage' | 'Linge' | 'Accueil' | 'Maintenance' | 'Courses' |
    'Administratif' | 'Extérieur' | 'Sécurité' | 'Confort' | 'Éco';

// Structure d'un service
interface Service {
    id: string;
    category: Category;
    service: string;
    description: string;
    isProposed: boolean; // État ajouté pour la fonctionnalité concierge
}

// --- Données initiales (basées sur votre SQL, avec isProposed=true par défaut) ---

const initialServices: Service[] = [
    // Ménage
    { id: '1', category: 'Ménage', service: 'Ménage standard', description: 'Nettoyage complet : sols, poussière, salle de bain, cuisine', isProposed: true },
    { id: '2', category: 'Ménage', service: 'Ménage entre voyageurs', description: 'Nettoyage rapide entre 2 locations courte durée', isProposed: true },
    { id: '3', category: 'Ménage', service: 'Grand ménage', description: 'Nettoyage en profondeur : vitres, placards, réfrigérateur', isProposed: false },
    { id: '4', category: 'Ménage', service: 'Désinfection complète', description: 'Désinfection sanitaire du logement', isProposed: false },
    { id: '5', category: 'Ménage', service: 'Nettoyage fin de séjour', description: 'Nettoyage très approfondi en fin de location longue', isProposed: true },
    { id: '6', category: 'Ménage', service: 'Vitres et menuiseries', description: 'Nettoyage extérieur des vitres et cadres', isProposed: false },
    { id: '7', category: 'Ménage', service: 'Nettoyage moquette/tapis', description: 'Shampoing moquettes et tapis', isProposed: false },
    { id: '8', category: 'Ménage', service: 'Nettoyage four/micro-ondes', description: 'Nettoyage appareils encastrés', isProposed: false },
    // Linge
    { id: '9', category: 'Linge', service: 'Changement de linge', description: 'Draps, housses, taies, serviettes', isProposed: true },
    { id: '10', category: 'Linge', service: 'Blanchisserie complète', description: 'Lavage, séchage, repassage du linge', isProposed: true },
    { id: '11', category: 'Linge', service: 'Fourniture de linge', description: 'Draps et serviettes neufs (linge hôtelier)', isProposed: true },
    { id: '12', category: 'Linge', service: 'Nettoyage édredons', description: 'Nettoyage à sec des édredons et couettes', isProposed: false },
    { id: '13', category: 'Linge', service: 'Gestion stock linge', description: 'Inventaire et renouvellement du stock', isProposed: true },
    { id: '14', category: 'Linge', service: 'Linge de table', description: 'Nappes, serviettes de table, torchons', isProposed: false },
    { id: '15', category: 'Linge', service: 'Linge bébé', description: 'Draps/lit parapluie, matelas à langer', isProposed: true },
    // Accueil
    { id: '16', category: 'Accueil', service: 'Check-in / Check-out', description: 'Accueil voyageurs + remise clés', isProposed: true },
    { id: '17', category: 'Accueil', service: 'Conciergerie 24/7', description: 'Disponibilité 24h/24 et 7j/7', isProposed: true },
    { id: '18', category: 'Accueil', service: 'Kit de bienvenue', description: 'Kit d\'accueil personnalisé (eau, café, savon)', isProposed: true },
    { id: '19', category: 'Accueil', service: 'Visite guidée logement', description: 'Présentation complète du logement', isProposed: false },
    { id: '20', category: 'Accueil', service: 'Instructions digitales', description: 'Création guide digital personnalisé', isProposed: true },
    { id: '21', category: 'Accueil', service: 'Gestion clés physiques', description: 'Gestion et duplication des clés', isProposed: true },
    { id: '22', category: 'Accueil', service: 'Check-in autonome', description: 'Codes digitaux + serrures connectées', isProposed: true },
    { id: '23', category: 'Accueil', service: 'Assistance voyageurs', description: 'Aide pendant le séjour (urgences, infos)', isProposed: true },
    { id: '24', category: 'Accueil', service: 'Late check-out', description: 'Extension départ jusqu\'à 14h', isProposed: false },
    // Maintenance
    { id: '25', category: 'Maintenance', service: 'Contrôle d\'état', description: 'Vérification complète état logement', isProposed: true },
    { id: '26', category: 'Maintenance', service: 'Petites réparations', description: 'Réparations mineures et dépannages', isProposed: true },
    { id: '27', category: 'Maintenance', service: 'Intervention d\'urgence', description: 'Disponibilité 24/7 urgences', isProposed: false },
    { id: '28', category: 'Maintenance', service: 'Remplacement consommables', description: 'Ampoules, piles, savon, papier', isProposed: true },
    { id: '29', category: 'Maintenance', service: 'Contrôle équipements', description: 'Clim, wifi, TV, électroménager', isProposed: true },
    { id: '30', category: 'Maintenance', service: 'Gestion prestataires', description: 'Coordination artisans externes', isProposed: true },
    { id: '31', category: 'Maintenance', service: 'Préparation check-out', description: 'Vérifications avant départ locataire', isProposed: false },
    { id: '32', category: 'Maintenance', service: 'Dépannage serrures', description: 'Serrures, poignées, verrous', isProposed: true },
    { id: '33', category: 'Maintenance', service: 'Entretien plomberie', description: 'Débouchements, fuites mineures', isProposed: false },
    { id: '34', category: 'Maintenance', service: 'Test sécurité électrique', description: 'Prises, interrupteurs, tableau', isProposed: false },
    // Courses
    { id: '35', category: 'Courses', service: 'Courses d\'arrivée', description: 'Produits première nécessité', isProposed: true },
    { id: '36', category: 'Courses', service: 'Courses complètes', description: 'Remplissage réfrigérateur complet', isProposed: false },
    { id: '37', category: 'Courses', service: 'Produits d\'entretien', description: 'Produits ménagers recharge', isProposed: true },
    { id: '38', category: 'Courses', service: 'Vin et spécialités', description: 'Sélection vins régionaux', isProposed: false },
    { id: '39', category: 'Courses', service: 'Bébé/enfant', description: 'Couches, lait, jouets, matériel bébé', isProposed: false },
    { id: '40', category: 'Courses', service: 'Animaux', description: 'Nourriture, litière, jouets pour animaux', isProposed: false },
    // Administratif
    { id: '41', category: 'Administratif', service: 'Gestion réservations', description: 'Gestion calendrier réservations', isProposed: true },
    { id: '42', category: 'Administratif', service: 'Communication voyageurs', description: 'Messages avant/pendant/après séjour', isProposed: true },
    { id: '43', category: 'Administratif', service: 'Optimisation annonces', description: 'Amélioration Airbnb/Booking', isProposed: true },
    { id: '44', category: 'Administratif', service: 'Reporting mensuel', description: 'Rapport revenus/occupations', isProposed: true },
    { id: '45', category: 'Administratif', service: 'Photographie pro', description: 'Shooting professionnel logement', isProposed: false },
    { id: '46', category: 'Administratif', service: 'Déclarations fiscales', description: 'Suivi déclaration revenus locatifs', isProposed: false },
    { id: '47', category: 'Administratif', service: 'Gestion cautions', description: 'Gestion cautions et litiges', isProposed: true },
    { id: '48', category: 'Administratif', service: 'Réclamations plateformes', description: 'Gestion litiges Airbnb/Booking', isProposed: false },
    { id: '49', category: 'Administratif', service: 'Calendrier dynamique', description: 'Prix dynamiques selon saisonnalité', isProposed: true },
    // Extérieur
    { id: '50', category: 'Extérieur', service: 'Jardinage', description: 'Tonte, taille, arrosage', isProposed: false },
    { id: '51', category: 'Extérieur', service: 'Nettoyage piscine', description: 'Entretien et nettoyage piscine', isProposed: false },
    { id: '52', category: 'Extérieur', service: 'Déneigement', description: 'Déneigement hiver', isProposed: false },
    { id: '53', category: 'Extérieur', service: 'Nettoyage terrasses', description: 'Nettoyage terrasses et mobiliers', isProposed: false },
    { id: '54', category: 'Extérieur', service: 'Entretien voirie', description: 'Accès, portails, allées', isProposed: false },
    { id: '55', category: 'Extérieur', service: 'Nettoyage gouttières', description: 'Débouchage et nettoyage gouttières', isProposed: false },
    { id: '56', category: 'Extérieur', service: 'Entretien toiture', description: 'Vérification et nettoyage toiture', isProposed: false },
    // Sécurité
    { id: '57', category: 'Sécurité', service: 'Contrôle sécurité incendie', description: 'Vérification détecteurs, extincteurs', isProposed: true },
    { id: '58', category: 'Sécurité', service: 'Gestion des accès digitaux', description: 'Codes digitaux, serrures connectées', isProposed: true },
    { id: '59', category: 'Sécurité', service: 'Ronde de sécurité', description: 'Contrôle sécurité nocturne', isProposed: false },
    { id: '60', category: 'Sécurité', service: 'Caméras de surveillance', description: 'Installation/maintenance caméras', isProposed: false },
    { id: '61', category: 'Sécurité', service: 'Coffre-fort', description: 'Installation et gestion coffre-fort', isProposed: false },
    // Confort
    { id: '62', category: 'Confort', service: 'Préparation petit-déjeuner', description: 'Préparation de petit-déjeuner', isProposed: false },
    { id: '63', category: 'Confort', service: 'Service femme de ménage quotidienne', description: 'Ménage quotidien pendant le séjour', isProposed: true },
    { id: '64', category: 'Confort', service: 'Transfert aéroport', description: 'Organisation de transferts aéroport', isProposed: true },
    { id: '65', category: 'Confort', service: 'Chef à domicile', description: 'Repas préparés par chef professionnel', isProposed: false },
    { id: '66', category: 'Confort', service: 'Massage à domicile', description: 'Massages et soins bien-être', isProposed: false },
    { id: '67', category: 'Confort', service: 'Baby-sitting', description: 'Garde d\'enfants certifiée', isProposed: false },
    // Éco
    { id: '68', category: 'Éco', service: 'Produits ménagers éco', description: 'Nettoyage avec produits écologiques certifiés', isProposed: true },
    { id: '69', category: 'Éco', service: 'Gestion des déchets triés', description: 'Tri et gestion des déchets du séjour', isProposed: true },
    { id: '70', category: 'Éco', service: 'Compostage', description: 'Mise en place composteur organique', isProposed: false },
    { id: '71', category: 'Éco', service: 'Audit énergétique', description: 'Diagnostic performance énergétique logement', isProposed: false },
];

const categoriesOrder: Category[] = [
    'Ménage', 'Linge', 'Accueil', 'Maintenance', 'Courses',
    'Administratif', 'Extérieur', 'Sécurité', 'Confort', 'Éco'
];

// --- Composant Principal ---

const ServiceCatalogManager: React.FC = () => {
    const [services, setServices] = useState<Service[]>(initialServices);
    const [searchTerm, setSearchTerm] = useState('');
    const [newServiceName, setNewServiceName] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid'); // Mode d'affichage

    // Fonction pour basculer l'état "Proposé"
    const toggleProposed = useCallback((id: string) => {
        setServices(prevServices =>
            prevServices.map(service =>
                service.id === id ? { ...service, isProposed: !service.isProposed } : service
            )
        );
        // NOTE: En production, ici vous feriez un appel API (e.g., PUT /api/services/{id}) pour sauvegarder l'état.
    }, []);

    // Fonction pour ajouter un nouveau service (simulation)
    const addCustomService = useCallback(() => {
        if (newServiceName.trim() === '') return;

        const newId = (services.length + 1).toString();
        const newService: Service = {
            id: newId,
            category: 'Maintenance', // Catégorie par défaut pour les services personnalisés
            service: newServiceName.trim(),
            description: 'Service personnalisé ajouté par le concierge.',
            isProposed: true, // Proposé par défaut lors de la création
        };

        setServices(prevServices => [...prevServices, newService]);
        setNewServiceName('');
        // NOTE: En production, ici vous feriez un appel API (e.g., POST /api/services) pour sauvegarder.
    }, [newServiceName, services.length]);

    // Filtrage et regroupement des services
    const filteredAndGroupedServices = useMemo(() => {
        const lowerSearchTerm = searchTerm.toLowerCase();

        // 1. Filtrer
        const filtered = services.filter(service =>
            service.service.toLowerCase().includes(lowerSearchTerm) ||
            service.description.toLowerCase().includes(lowerSearchTerm)
        );

        // 2. Regrouper
        const grouped = filtered.reduce((acc, service) => {
            const category = service.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(service);
            return acc;
        }, {} as Record<Category, Service[]>);

        return grouped;
    }, [services, searchTerm]);

    // Composant d'une carte de service (Vue Grid)
    const ServiceCard: React.FC<{ service: Service }> = ({ service }) => (
        <div
            className={`p-4 border rounded-xl shadow-md transition-all duration-300 ${service.isProposed ? 'bg-white border-green-200 hover:shadow-lg' : 'bg-gray-50 border-gray-300 opacity-80 hover:shadow-md'
                }`}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className={`text-lg font-semibold ${service.isProposed ? 'text-gray-800' : 'text-gray-500'}`}>
                    {service.service}
                </h3>
                <button
                    onClick={() => toggleProposed(service.id)}
                    className={`p-1.5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 ${service.isProposed
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                    aria-label={service.isProposed ? 'Ne plus proposer' : 'Proposer ce service'}
                >
                    {service.isProposed ? (
                        <CheckCircle className="w-5 h-5" />
                    ) : (
                        <XCircle className="w-5 h-5" />
                    )}
                </button>
            </div>
            <p className={`text-sm mb-3 ${service.isProposed ? 'text-gray-600' : 'text-gray-400'}`}>
                {service.description}
            </p>
            <div className="flex justify-between items-center text-xs font-medium">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">
                    {service.category}
                </span>
                <span className={`italic ${service.isProposed ? 'text-green-500' : 'text-red-500'}`}>
                    {service.isProposed ? 'Proposé' : 'Non Proposé'}
                </span>
            </div>
        </div>
    );

    // Composant d'une ligne de service (Vue List)
    const ServiceRow: React.FC<{ service: Service }> = ({ service }) => (
        <div
            className={`flex items-center justify-between p-3 border-b transition-colors duration-200 ${service.isProposed ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100 opacity-90'
                }`}
        >
            <div className="flex-1 min-w-0 mr-4">
                <p className={`text-base font-medium ${service.isProposed ? 'text-gray-800' : 'text-gray-500'}`}>
                    {service.service}
                    <span className="ml-2 px-2 py-0.5 text-xs bg-indigo-100 text-indigo-600 rounded-full">
                        {service.category}
                    </span>
                </p>
                <p className="text-sm text-gray-500 truncate">
                    {service.description}
                </p>
            </div>
            <button
                onClick={() => toggleProposed(service.id)}
                className={`flex items-center p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 ${service.isProposed
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                    }`}
                aria-label={service.isProposed ? 'Ne plus proposer' : 'Proposer ce service'}
            >
                {service.isProposed ? (
                    <>
                        <CheckCircle className="w-5 h-5 mr-2" /> Proposé
                    </>
                ) : (
                    <>
                        <XCircle className="w-5 h-5 mr-2" /> Non Proposé
                    </>
                )}
            </button>
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen rounded-xl shadow-inner">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Gestion du Catalogue de Services</h1>
            <p className="text-gray-500 mb-6">
                En tant que concierge, gérez les services que vous souhaitez proposer à vos propriétaires/voyageurs.
            </p>

            {/* Barre de Recherche et Boutons d'Action */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                {/* Recherche */}
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Rechercher un service (Ménage, Linge, etc.)..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>

                {/* Boutons d'affichage */}
                <div className="flex space-x-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-3 rounded-xl transition-colors ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-100'}`}
                        aria-label="Affichage en Grille"
                    >
                        <Grid className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-3 rounded-xl transition-colors ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-700 border hover:bg-gray-100'}`}
                        aria-label="Affichage en Liste"
                    >
                        <List className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Ajout de Nouveau Service (UX pour "créer d'autre si besoins") */}
            <div className="bg-white p-4 rounded-xl shadow-lg mb-8 flex flex-col md:flex-row gap-3 items-stretch">
                <input
                    type="text"
                    placeholder="Nom du nouveau service personnalisé à ajouter..."
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:border-purple-500 focus:ring-purple-500"
                />
                <button
                    onClick={addCustomService}
                    disabled={newServiceName.trim() === ''}
                    className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white font-medium rounded-lg shadow-md hover:bg-purple-700 transition-colors disabled:bg-purple-300"
                >
                    <Plus className="w-5 h-5 mr-2" /> Créer & Proposer
                </button>
            </div>

            {/* Affichage des Services Regroupés */}
            {categoriesOrder.map(category => {
                const servicesInCategory = filteredAndGroupedServices[category];

                if (!servicesInCategory || servicesInCategory.length === 0) {
                    return null; // N'affiche pas la catégorie si aucun service ne correspond au filtre
                }

                return (
                    <div key={category} className="mb-10">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2 border-indigo-200">
                            {category} ({servicesInCategory.length})
                        </h2>

                        {viewMode === 'grid' ? (
                            // Vue Grille (UX : Permet de voir plus de détails)
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {servicesInCategory.map(service => (
                                    <ServiceCard key={service.id} service={service} />
                                ))}
                            </div>
                        ) : (
                            // Vue Liste (UX : Permet une modification rapide des statuts)
                            <div className="bg-white rounded-xl shadow-md divide-y divide-gray-200 border border-gray-200">
                                {servicesInCategory.map(service => (
                                    <ServiceRow key={service.id} service={service} />
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {Object.keys(filteredAndGroupedServices).length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg text-gray-500">
                        Aucun service trouvé. Essayez d&apos;ajuster votre recherche ou ajoutez-en un nouveau.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ServiceCatalogManager;