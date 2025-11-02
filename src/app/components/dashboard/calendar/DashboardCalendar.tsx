// src/app/components/dashboard/Calendar/DashboardCalendar.tsx
'use client';

import React, { useMemo } from 'react';
// 🛑 CORRECTION 1 : L'importation de 'Event' et 'Calendar' est correcte.
// Assurez-vous d'avoir installé @types/react-big-calendar.
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar';

// 🛑 CORRECTION 2 : Utilisez l'importation nommée pour 'fr'
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale/fr'; // ✅ Importation nommée correcte
// import { endOfWeek } from 'date-fns'; // 🛑 CORRECTION 3 : 'endOfWeek' retiré car inutilisé
import 'react-big-calendar/lib/css/react-big-calendar.css';

// ----------------------------------------------------
// Configuration de la Locale (français)
// ----------------------------------------------------

const locales = {
    'fr': fr,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    // 🛑 CORRECTION 4 : Définition des types pour les paramètres (date: Date)
    startOfWeek: (date: Date) => startOfWeek(date, { locale: fr, weekStartsOn: 1 }),
    getDay: (date: Date) => getDay(date), // Définition du type 'date' pour éviter 'any'
    locales,
});

// ----------------------------------------------------
// Définition de l'Événement (pour le typage)
// ----------------------------------------------------

export interface DashboardEvent extends Event {
    // title: string; // Laisser l'interface Event gérer ceci, MAIS:
    // S'assurer que les autres propriétés correspondent
    start: Date;
    end: Date;
    bookingId?: string;
    type: 'booking' | 'mission' | 'reminder';
}

interface DashboardCalendarProps {
    events: DashboardEvent[];
    title: string;
}

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({ events, title }) => {
    // Déclarer tous les accesseurs ici pour plus de clarté
    const eventTitleAccessor = 'title' as keyof DashboardEvent;
    // ✅ CORRECTION APPLIQUÉE : Casting pour startAccessor et endAccessor
    const eventStartAccessor = 'start' as keyof DashboardEvent; 
    const eventEndAccessor = 'end' as keyof DashboardEvent;

    const calendarProps = useMemo(() => ({
        localizer: localizer,
        events: events,
        defaultView: 'month' as const,
        messages: {
            // ... (Vos traductions)
            allDay: 'Toute la journée',
            previous: 'Précédent',
            next: 'Suivant',
            today: 'Aujourd\'hui',
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
            agenda: 'Agenda',
            date: 'Date',
            time: 'Heure',
            event: 'Événement',
            noEventsInRange: 'Aucun événement dans cette période.',
        },
        culture: 'fr',
        
        // ✅ Utilisation des variables castées pour les accesseurs
        startAccessor: eventStartAccessor, 
        endAccessor: eventEndAccessor, 
        titleAccessor: eventTitleAccessor,
        
        style: { height: 700 },
        defaultDate: new Date(),
    }), [events, eventTitleAccessor, eventStartAccessor, eventEndAccessor]); // Les dépendances incluent tous les accesseurs

    return (
        <div className="dashboard-calendar-container">
            <h3 className="calendar-title">{title}</h3>
            <div className="calendar-wrapper">
                <Calendar {...calendarProps} />
            </div>
        </div>
    );
};

export default DashboardCalendar;