"use client";

import React, { useState, ChangeEvent } from 'react';
import { Check, X, Clock, User, MessageSquare, Calendar, LucideIcon } from 'lucide-react';

// --- Interfaces TypeScript ---
interface Fiche {
    id: string;
    type: string;
    statut: 'En cours' | 'Terminé' | 'En attente' | 'Annulé';
    client: string;
    description: string;
    dateCreation: string;
    dateLimite: string;
    notesConcierge: string;
}

interface FieldDisplayProps {
    label: string;
    value: string;
    icon: LucideIcon;
}

interface EditableFieldProps {
    label: string;
    name: keyof Fiche;
    value: string;
    isTextArea?: boolean;
}

const FicheConciergerie = () => {
    const [fiche, setFiche] = useState<Fiche>({
        id: 'REQ-2025-001',
        type: 'Réservation de restaurant',
        statut: 'En cours',
        client: 'Mme. Sophie Dubois',
        description: "Réserver une table pour 4 personnes au restaurant 'Le Ciel' pour le samedi 15 décembre à 20h00. Doit être une table près de la fenêtre.",
        dateCreation: '2025-12-10',
        dateLimite: '2025-12-14',
        notesConcierge: "Contacté le restaurant, l'option fenêtre n'est pas garantie mais demandée.",
    });

    const [isEditing, setIsEditing] = useState<boolean>(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFiche(prev => ({ ...prev, [name as keyof Fiche]: value }));
    };

    const handleSave = () => {
        console.log('Fiche sauvegardée:', fiche);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    // Composant StatusCard indépendant (✅ Sémantique parfaite)
    const StatusCard = ({ status }: { status: Fiche['statut'] }) => {
        const colorClass = {
            'Terminé': 'bg-green-100 text-green-800 ring-green-500',
            'En cours': 'bg-blue-100 text-blue-800 ring-blue-500',
            'En attente': 'bg-yellow-100 text-yellow-800 ring-yellow-500',
            'Annulé': 'bg-gray-100 text-gray-800 ring-gray-500'
        }[status] || 'bg-gray-100 text-gray-800 ring-gray-500';

        return (
            <article className="flex items-start space-x-3 p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition duration-150">
                <Clock className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" aria-hidden="true" />
                <div>
                    <span className="text-sm font-medium text-gray-500 block mb-1">Statut</span>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${colorClass} ring-1 ring-inset`}>
                        {status}
                    </span>
                </div>
            </article>
        );
    };

    const FieldDisplay: React.FC<FieldDisplayProps> = ({ label, value, icon: Icon }) => (
        <article className="flex items-start space-x-3 p-4 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition duration-150">
            <Icon className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" aria-hidden="true" />
            <div>
                <span className="text-sm font-medium text-gray-500 block mb-1">{label}</span>
                <span className="text-lg font-semibold text-gray-900 block">{value}</span>
            </div>
        </article>
    );

    const EditableField: React.FC<EditableFieldProps> = ({ label, name, value, isTextArea = false }) => (
        <div className="mb-4">
            <label htmlFor={name as string} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            {isTextArea ? (
                <textarea
                    id={name as string}
                    name={name as string}
                    rows={3}
                    value={value}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-300 shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-y"
                />
            ) : (
                <input
                    type="text"
                    id={name as string}
                    name={name as string}
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
                <header className="flex justify-between items-center pb-6 border-b border-gray-200">
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
                                <Check className="w-5 h-5 mr-2" aria-hidden="true" /> Sauvegarder
                            </button>
                            <button
                                onClick={handleCancel}
                                className="flex items-center px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                <X className="w-5 h-5 mr-2" aria-hidden="true" /> Annuler
                            </button>
                        </div>
                    )}
                </header>

                {/* Corps de la Fiche */}
                <main className="mt-8 bg-white p-6 rounded-xl shadow-2xl">
                    <section aria-labelledby="info-title">
                        <h2 id="info-title" className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                            Informations Clés
                        </h2>
                        
                        {/* ✅ Grille SEMANTIQUE - plus de dl/dt/dd */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <FieldDisplay label="Client" value={fiche.client} icon={User} />
                            <StatusCard status={fiche.statut} />
                            <FieldDisplay label="Date de Création" value={fiche.dateCreation} icon={Calendar} />
                            <FieldDisplay label="Date Limite" value={fiche.dateLimite} icon={Calendar} />
                        </div>
                    </section>

                    <section aria-labelledby="details-title" className="mt-8">
                        <h2 id="details-title" className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
                            Détails de la Demande
                        </h2>

                        {isEditing ? (
                            <form className="space-y-4">
                                <EditableField label="Type de Demande" name="type" value={fiche.type} />
                                <EditableField label="Description du Client" name="description" value={fiche.description} isTextArea />
                                <EditableField label="Notes du Concierge" name="notesConcierge" value={fiche.notesConcierge} isTextArea />
                                <EditableField label="Statut" name="statut" value={fiche.statut} />
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <article>
                                    <h3 className="text-sm font-medium text-gray-500 flex items-center mb-3">
                                        <Check className="w-4 h-4 mr-2 text-indigo-500" aria-hidden="true" /> Type de Demande
                                    </h3>
                                    <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-md">{fiche.type}</p>
                                </article>

                                <article>
                                    <h3 className="text-sm font-medium text-gray-500 flex items-center mb-3">
                                        <MessageSquare className="w-4 h-4 mr-2 text-indigo-500" aria-hidden="true" /> Description du Client
                                    </h3>
                                    <div className="text-base text-gray-700 p-4 border border-gray-200 rounded-md whitespace-pre-wrap">
                                        {fiche.description}
                                    </div>
                                </article>

                                <article>
                                    <h3 className="text-sm font-medium text-gray-500 flex items-center mb-3">
                                        <User className="w-4 h-4 mr-2 text-indigo-500" aria-hidden="true" /> Notes du Concierge
                                    </h3>
                                    <div className="text-base text-gray-700 bg-indigo-50 p-4 border border-indigo-200 rounded-md whitespace-pre-wrap">
                                        {fiche.notesConcierge || 'Aucune note ajoutée pour le moment.'}
                                    </div>
                                </article>
                            </div>
                        )}
                    </section>
                </main>

                {/* Pied de page */}
                {!isEditing && (
                    <footer className="mt-8 flex justify-end">
                        <button
                            onClick={() => console.log('Action de clôture simulée')}
                            className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg shadow-lg hover:bg-red-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Clôturer la Demande
                        </button>
                    </footer>
                )}
            </div>
        </div>
    );
};

export default FicheConciergerie;
