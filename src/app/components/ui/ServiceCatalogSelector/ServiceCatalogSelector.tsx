import React, { useEffect, useState, useCallback } from "react";
import { LucideLoader2, LucideCheckCircle, LucideAlertTriangle, LucideListTodo, LucideSave } from 'lucide-react';

// --- Définitions de types TypeScript ---

/**
 * Interface pour un élément de service unique.
 */
interface ServiceItem {
    id: string;
    category: string;
    service: string;
    description: string;
    isConcierge: boolean;
}
// interface ServiceCatalogSelectorProps {
//   selected: string[];
//   onChange: (selected: string[]) => void;
//   disabled?: boolean;
// }

/**
 * Type pour la structure du catalogue groupé par catégorie.
 */
type GroupedCatalog = Record<string, ServiceItem[]>;

// --- Données du Catalogue Simulé (fusionnant les concepts de CategoryPopup et ServiceCatalogSelector) ---

// Les services reçoivent des IDs pour simuler le comportement basé sur l'ID de la DB.
const MOCK_SERVICE_ITEMS: ServiceItem[] = [
    // Services Concierge (Category: Entretien)
    { id: 'svc_c_001', category: 'Entretien & Ménage', service: 'Ménage et entretien intérieur', description: 'Nettoyage approfondi et maintenance quotidienne.', isConcierge: true },
    { id: 'svc_c_002', category: 'Entretien & Ménage', service: 'Gestion du linge', description: 'Lavage, repassage et rangement du linge de maison.', isConcierge: true },
    // Services Concierge (Category: Logistique)
    { id: 'svc_c_003', category: 'Logistique & Accueil', service: 'Accueil et check-in/check-out', description: 'Gestion des arrivées et départs des locataires.', isConcierge: true },
    { id: 'svc_c_004', category: 'Logistique & Accueil', service: 'Courses et intendance', description: 'Achat de provisions, gestion des stocks.', isConcierge: true },
    { id: 'svc_c_005', category: 'Logistique & Accueil', service: 'Gestion administrative des locations', description: 'Suivi des réservations, communication client.', isConcierge: true },
    { id: 'svc_c_006', category: 'Logistique & Accueil', service: 'Conciergerie digitale', description: 'Suivi à distance et automatisation des processus.', isConcierge: true },
    // Services Concierge (Category: Technique)
    { id: 'svc_c_007', category: 'Technique & Réparation', service: 'Maintenance et petites réparations', description: 'Réparation rapide des équipements et installations.', isConcierge: true },
    { id: 'svc_c_008', category: 'Technique & Réparation', service: 'Entretien extérieur (jardin, piscine, terrasses)', description: 'Maintenance des espaces verts et des équipements de loisirs.', isConcierge: true },
    // Services Concierge (Category: Confort)
    { id: 'svc_c_009', category: 'Confort & Bien-être', service: 'Services de confort (chef, massage, baby-sitting…)', description: 'Services personnalisés pour améliorer l\'expérience client.', isConcierge: true },
    { id: 'svc_c_010', category: 'Confort & Bien-être', service: 'Sécurité du logement', description: 'Surveillance et mesures de sécurité.', isConcierge: true },

    // Services Propriétaire (À qui le concierge s'adresse - pour le contexte)
    { id: 'svc_p_001', category: 'Propriétaire', service: 'Gestion complète du logement', description: 'Planning, communication, ménage.', isConcierge: false },
    { id: 'svc_p_002', category: 'Propriétaire', service: 'Service ponctuel', description: 'Remplacement, urgence, imprévu.', isConcierge: false },
];

const simulateApiLoading = (data: ServiceItem[]): Promise<GroupedCatalog> => new Promise(resolve => {
    setTimeout(() => {
        // Groupement des données par catégorie
        const grouped: GroupedCatalog = data.reduce((acc: GroupedCatalog, item: ServiceItem) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
        }, {} as GroupedCatalog); // Utilisation de l'assertion pour le type initial
        resolve(grouped);
    }, 800);
});

// Le composant principal ServiceCatalogSelector refactorisé pour être autonome
const ServiceCatalogSelector = () => {
    // État local du catalogue groupé
    const [catalog, setCatalog] = useState<GroupedCatalog>({});
    // État pour simuler le chargement des données (similaire à la récupération API)
    const [loading, setLoading] = useState<boolean>(true);
    // État simulant les services déjà sélectionnés par le profil utilisateur
    // Initialiser avec quelques IDs pour montrer l'état "coché"
    const [selected, setSelected] = useState<string[]>(['svc_c_003', 'svc_c_007']); 
    const [isSaving, setIsSaving] = useState<boolean>(false);
    // Utilisation de l'union de types pour le statut de sauvegarde
    const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);

    // Simule le chargement du catalogue
    useEffect(() => {
        const loadCatalog = async () => {
            setLoading(true);
            try {
                // Filtrer uniquement les services pertinents pour le rôle (ex: Concierge)
                const conciergeServices: ServiceItem[] = MOCK_SERVICE_ITEMS.filter(item => item.isConcierge);
                const groupedCatalog: GroupedCatalog = await simulateApiLoading(conciergeServices);
                setCatalog(groupedCatalog);
            } catch (err) {
                console.error("Erreur lors du chargement du catalogue:", err);
            } finally {
                setLoading(false);
            }
        };
        loadCatalog();
    }, []);

    // Fonction de basculement (toggle)
    const toggle = useCallback((id: string) => {
        // La désactivation est gérée par l'interface utilisateur, pas par la prop ici.
        setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
    }, []);

    // Fonction de sauvegarde simulée
    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus(null);
        console.log("Sauvegarde de la sélection:", selected);
        
        // Simuler un délai de sauvegarde de 1.5s
        await new Promise(resolve => setTimeout(resolve, 1500)); 

        try {
            // Ici, vous feriez l'appel à la DB ou à l'API pour persister 'selected'
            // Exemple: await updateProfileServices(selected); 
            setSaveStatus('success');
            console.log("Sélection enregistrée avec succès !");
        } catch (error) {
            setSaveStatus('error');
            console.error("Erreur lors de la sauvegarde:", error);
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveStatus(null), 3000); // Effacer le statut
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-60 bg-white rounded-xl shadow-lg p-6">
                <LucideLoader2 className="w-6 h-6 animate-spin text-indigo-600 mr-3" />
                <p className="text-gray-700 font-medium">Chargement des services...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center border-b pb-3">
                <LucideListTodo className="w-6 h-6 mr-3 text-indigo-600" />
                Définir votre Catalogue de Services
            </h2>
            
            <p className="text-gray-600">
                Sélectionnez les services spécifiques que vous êtes en mesure de proposer en tant que Concierge Professionnel. Ces options définiront votre offre pour les propriétaires et clients.
            </p>

            <div className="space-y-6">
                {/* Typage pour Object.entries, forçant les catégories à être des chaînes et les services GroupedCatalog */}
                {Object.entries(catalog as GroupedCatalog).map(([category, services]: [string, ServiceItem[]]) => (
                    <div key={category} className="border-t pt-4">
                        <h3 className="text-xl font-semibold text-indigo-700 mb-4">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Typage pour map sur services, forçant item à ServiceItem */}
                            {services.map((item: ServiceItem) => (
                                <label 
                                    key={item.id} 
                                    className={`p-4 rounded-lg border cursor-pointer transition duration-200 block shadow-sm
                                        ${selected.includes(item.id) 
                                            ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200' 
                                            : 'bg-gray-50 border-gray-200 hover:border-indigo-300 hover:bg-white'
                                        }`
                                    }
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(item.id)}
                                        onChange={() => toggle(item.id)}
                                        className="sr-only" // Masque la checkbox native
                                    />
                                    <div className="flex items-start">
                                        <div className="mt-1 w-5 h-5 flex-shrink-0">
                                            {selected.includes(item.id) ? (
                                                <LucideCheckCircle className="w-5 h-5 text-indigo-600 fill-indigo-100" />
                                            ) : (
                                                <div className="w-4 h-4 border-2 border-gray-400 rounded-sm mt-0.5" />
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            <span className={`block font-medium ${selected.includes(item.id) ? 'text-indigo-800' : 'text-gray-900'}`}>
                                                {item.service}
                                            </span>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bouton de Sauvegarde et Statut */}
            <div className="pt-6 border-t flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {saveStatus === 'success' && (
                    <div className="text-sm font-medium text-green-600 flex items-center">
                        <LucideCheckCircle className="w-5 h-5 mr-1" /> Sélection enregistrée !
                    </div>
                )}
                {saveStatus === 'error' && (
                    <div className="text-sm font-medium text-red-600 flex items-center">
                        <LucideAlertTriangle className="w-5 h-5 mr-1" /> Erreur d&apos;enregistrement.
                    </div>
                )}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`w-full sm:w-auto px-6 py-3 border border-transparent rounded-lg shadow-lg text-base font-medium text-white transition duration-200 ease-in-out
                        ${isSaving
                            ? 'bg-indigo-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        }`
                    }
                >
                    {isSaving ? (
                        <span className="flex items-center">
                            <LucideLoader2 className="w-5 h-5 animate-spin mr-2" />
                            Sauvegarde...
                        </span>
                    ) : (
                        <span className="flex items-center">
                            <LucideSave className="w-5 h-5 mr-2" />
                            Enregistrer ma sélection
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}

// Composant App de démonstration pour le rendu du ServiceCatalogSelector
const App = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-10">Gestion du Catalogue de Services</h1>
            <ServiceCatalogSelector />
        </div>
    );
};

export default App;