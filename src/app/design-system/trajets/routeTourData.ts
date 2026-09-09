export type RouteStopStatus =
  | "upcoming"
  | "en-route"
  | "in-progress"
  | "done"
  | "delayed"
  | "urgent";

export type RouteStop = {
  id: string;
  order: number;
  time: string;
  property: string;
  mission: string;
  address: string;
  duration: string;
  travelFromPrevious?: string;
  distanceFromPrevious?: string;
  status: RouteStopStatus;
  statusLabel: string;
  note?: string;
  mapPosition: { left: string; top: string };
};

export const routeTourData = {
  dateLabel: "Jeudi 9 septembre 2026",
  placeLabel: "Le Barcarès et alentours",
  totalMissions: 6,
  totalDistance: "31 km",
  totalDuration: "4 h 20",
  currentMargin: "12 min",
  currentStopId: "mediterranee",
  initialOrderSaving: "18 min et 6 km",
  nextMission: {
    property: "Appartement Méditerranée",
    time: "10:30",
    mission: "Check-out",
    address: "12 rue des Tamaris, Le Barcarès",
    duration: "45 min sur place",
    travel: "8 min depuis Villa Horizon",
    status: "En route",
  },
  stops: [
    {
      id: "horizon",
      order: 1,
      time: "09:00",
      property: "Villa Horizon",
      mission: "Check-out",
      address: "4 avenue du Soleil, Le Barcarès",
      duration: "45 min",
      status: "done",
      statusLabel: "Terminée",
      note: "État des lieux transmis",
      mapPosition: { left: "20%", top: "66%" },
    },
    {
      id: "mediterranee",
      order: 2,
      time: "10:30",
      property: "Appartement Méditerranée",
      mission: "Ménage",
      address: "12 rue des Tamaris, Le Barcarès",
      duration: "1 h",
      travelFromPrevious: "8 min",
      distanceFromPrevious: "2,1 km",
      status: "en-route",
      statusLabel: "En route",
      note: "Prochaine mission",
      mapPosition: { left: "40%", top: "44%" },
    },
    {
      id: "marina",
      order: 3,
      time: "11:20",
      property: "Résidence Marina",
      mission: "Livraison de linge",
      address: "8 quai des Dosses, Le Barcarès",
      duration: "20 min",
      travelFromPrevious: "8 min",
      distanceFromPrevious: "2,1 km",
      status: "delayed",
      statusLabel: "Retard 15 min",
      note: "Impact possible du retard actuel",
      mapPosition: { left: "65%", top: "30%" },
    },
    {
      id: "dunes",
      order: 4,
      time: "13:00",
      property: "Maison des Dunes",
      mission: "Préparation arrivée",
      address: "27 chemin des Dunes, La Presqu'île",
      duration: "1 h 15",
      travelFromPrevious: "18 min",
      distanceFromPrevious: "9,4 km",
      status: "urgent",
      statusLabel: "Urgente",
      note: "Arrivée voyageur à 15:00",
      mapPosition: { left: "76%", top: "62%" },
    },
    {
      id: "lagune",
      order: 5,
      time: "14:35",
      property: "Studio Lagune",
      mission: "Contrôle rapide",
      address: "3 rue des Embruns, Le Barcarès",
      duration: "30 min",
      travelFromPrevious: "12 min",
      distanceFromPrevious: "6,8 km",
      status: "upcoming",
      statusLabel: "À venir",
      mapPosition: { left: "54%", top: "78%" },
    },
    {
      id: "canal",
      order: 6,
      time: "15:30",
      property: "Maison du Canal",
      mission: "Remise de clés",
      address: "19 rue du Canal, Le Barcarès",
      duration: "30 min",
      travelFromPrevious: "10 min",
      distanceFromPrevious: "4,6 km",
      status: "upcoming",
      statusLabel: "À venir",
      mapPosition: { left: "30%", top: "22%" },
    },
  ] satisfies RouteStop[],
} as const;

export const routeStatusTone: Record<
  RouteStopStatus,
  "success" | "info" | "warning" | "danger" | "neutral"
> = {
  upcoming: "neutral",
  "en-route": "info",
  "in-progress": "info",
  done: "success",
  delayed: "warning",
  urgent: "danger",
};
