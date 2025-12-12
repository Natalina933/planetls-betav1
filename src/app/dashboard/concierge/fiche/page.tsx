import React, { useState } from 'react';
import { Check, X, Clock, User, MessageSquare, Calendar } from 'lucide-react';

/**
 * Composant de la Fiche Conciergerie.
 * Il affiche les détails d'une demande de conciergerie et permet de la modifier.
 * Utilise Tailwind CSS pour le style.
 */
const FicheConciergerie = () => {
    // État initial pour simuler les données d'une fiche
    const [fiche, setFiche] = useState({
        id: 'REQ-2025-001',
        type: 'Réservation de restaurant',
        statut: 'En cours',
        client: 'Mme. Sophie Dubois',
        description: "Réserver une table pour 4 personnes au restaurant 'Le Ciel' pour le samedi 15 décembre à 20h00. Doit être une table près de la fenêtre.",
        dateCreation: '2025-12-10',
        dateLimite: '2025-12-14',
        notesConcierge: "Contacté le restaurant, l'option fenêtre n'est pas garantie mais demandée.",
    });

    const [isEditing, setIsEditing] = useState(false);

    // Gère la mise à jour des champs lors de la modification
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFiche(prev => ({ ...prev, [name]: value }));
    };

    // Logique de sauvegarde (simulée)
    const handleSave = () => {
        console.log('Fiche sauvegardée:', fiche);
        // Ici, on enverrait les données à une API ou à Firestore
        setIsEditing(false);
    };

    // Logique d'annulation des modifications
    const handleCancel = () => {
        // Dans une vraie application, on rechargerait les données originales.
        // Pour cet exemple, on quitte simplement le mode édition.
        setIsEditing(false);
    };

    // Helper pour afficher le badge de statut
    const getStatusBadge = (status) => {
        let colorClass;
        switch (status) {
            case 'Terminé':
                colorClass = 'bg-green-100 text-green-800 ring-green-500';
                break;
            case 'En cours':
                colorClass = 'bg-blue-100 text-blue-800 ring-blue-500';
                break;
            case 'En attente':
                colorClass = 'bg-yellow-100 text-yellow-800 ring-yellow-500';
                break;
            default:
                colorClass = 'bg-gray-100 text-gray-800 ring-gray-500';
        }
        return (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${colorClass} ring-1 ring-inset`}>
                {status}
            </span>
        );
    };

    const FieldDisplay = ({ label, value, icon: Icon }) => (
        <div className="flex items-start space-x-3 p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition duration-150">
            <Icon className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />
            <div>
                <dt className="text-sm font-medium text-gray-500">{label}</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">{value}</dd>
            </div>
        </div>
    );

    const EditableField = ({ label, name, value, isTextArea = false }) => (
        <div className="mb-4">
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            {isTextArea ? (
                <textarea
                    id={name}
                    name={name}
                    rows="3"
                    value={value}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-y"
                />
            ) : (
                <input
                    type="text"
                    id={name}
                    name={name}
                    value={value}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                {/* En-tête de la Fiche */}
                <div className="flex justify-between items-center pb-6 border-b border-gray-200">
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
                        Fiche Conciergerie: <span className="ml-3 text-indigo-600">{fiche.id}</span>
                    </h1>
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Modifier la Fiche
                        </button>
                    ) : (
                        <div className="flex space-x-3">
                            <button
                                onClick={handleSave}
                                className="flex items-center px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            >
                                <Check className="w-5 h-5 mr-2" /> Sauvegarder
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex items-center px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                <X className="w-5 h-5 mr-2" /> Annuler
                            </button>
                        </div>
                    )}
                </div>

                {/* Corps de la Fiche */}
                <div className="mt-8 bg-white p-6 rounded-xl shadow-2xl">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Informations Clés</h2>

                    {/* Grille des informations principales */}
                    <dl className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <FieldDisplay label="Client" value={fiche.client} icon={User} />
                        <div className="flex items-start space-x-3 p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
                            <Clock className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Statut</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900">
                                    {getStatusBadge(fiche.statut)}
                                </dd>
                            </div>
                        </div>
                        <FieldDisplay label="Date de Création" value={fiche.dateCreation} icon={Calendar} />
                        <FieldDisplay label="Date Limite" value={fiche.dateLimite} icon={Calendar} />
                    </dl>

                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Détails de la Demande</h2>

                        {isEditing ? (
                            <div className="space-y-4">
                                <EditableField label="Type de Demande" name="type" value={fiche.type} />
                                <EditableField label="Description du Client" name="description" value={fiche.description} isTextArea />
                                <EditableField label="Notes du Concierge" name="notesConcierge" value={fiche.notesConcierge} isTextArea />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Type de Demande */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                                        <Check className="w-4 h-4 mr-2 text-indigo-500" /> Type de Demande
                                    </h3>
                                    <p className="mt-1 text-lg text-gray-900 bg-gray-50 p-3 rounded-md">{fiche.type}</p>
                                </div>

                                {/* Description du Client */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                                        <MessageSquare className="w-4 h-4 mr-2 text-indigo-500" /> Description du Client
                                    </h3>
                                    <div className="mt-1 text-base text-gray-700 p-4 border border-gray-200 rounded-md whitespace-pre-wrap">
                                        {fiche.description}
                                    </div>
                                </div>

                                {/* Notes du Concierge */}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 flex items-center">
                                        <User className="w-4 h-4 mr-2 text-indigo-500" /> Notes du Concierge
                                    </h3>
                                    <div className="mt-1 text-base text-gray-700 bg-indigo-50 p-4 border border-indigo-200 rounded-md whitespace-pre-wrap">
                                        {fiche.notesConcierge || 'Aucune note ajoutée pour le moment.'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pied de page pour actions supplémentaires en mode non-édition */}
                {!isEditing && (
                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={() => console.log('Action de clôture simulée')}
                            className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-lg hover:bg-red-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Clôturer la Demande
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default FicheConciergerie;