// 🎯 PlanningPage.tsx (CORRIGÉ)
import DashboardCalendar, { DashboardEvent } from "@/app/components/dashboard/calendar/DashboardCalendar";
// Note : Assurez-vous d'avoir bien exporté l'interface DashboardEvent dans le fichier DashboardCalendar.tsx.

// ✅ CORRECTION APPLIQUÉE : Typage explicite du tableau.
const eventsDemo: DashboardEvent[] = [
  { 
    title: "Réservation 1", 
    start: new Date(), 
    end: new Date(), 
    bookingId: "123", 
    // ✅ TypeScript est maintenant sûr que la valeur "booking" est une chaîne de l'union autorisée.
    type: "booking" 
  }
];

export default function PlanningPage() {
  return (
    <div>
      <DashboardCalendar events={eventsDemo} title="Planning général" />
      {/* Autre contenu spécifique à la page */}
    </div>
  );
}