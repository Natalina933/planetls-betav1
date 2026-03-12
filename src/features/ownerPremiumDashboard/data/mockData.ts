import {
  Booking,
  CalendarReservation,
  DashboardStat,
  PropertyPerformanceItem,
  RevenuePoint,
  SidebarItem,
} from "../types";

export const sidebarItems: SidebarItem[] = [
  { id: "overview", label: "Dashboard Overview", icon: "[]" },
  { id: "properties", label: "My Properties", icon: "H" },
  { id: "reservations", label: "Reservations", icon: "R" },
  { id: "earnings", label: "Earnings", icon: "$" },
  { id: "messages", label: "Messages", icon: "M" },
  { id: "reviews", label: "Reviews", icon: "*" },
  { id: "settings", label: "Settings", icon: "S" },
];

export const stats: DashboardStat[] = [
  { id: "earnings", label: "Total earnings", value: "$42,860", hint: "+12.4% vs last month", trend: "up" },
  { id: "occupancy", label: "Occupancy rate", value: "84%", hint: "+4 pts vs last month", trend: "up" },
  { id: "upcoming", label: "Upcoming reservations", value: "18", hint: "Next 30 days", trend: "flat" },
  { id: "rating", label: "Average rating", value: "4.92", hint: "Across 146 reviews", trend: "up" },
];

export const revenueSeries: RevenuePoint[] = [
  { label: "Jan", value: 12400 }, { label: "Feb", value: 11800 }, { label: "Mar", value: 14200 },
  { label: "Apr", value: 15600 }, { label: "May", value: 17100 }, { label: "Jun", value: 18400 },
  { label: "Jul", value: 22100 }, { label: "Aug", value: 21400 }, { label: "Sep", value: 19300 },
  { label: "Oct", value: 20100 }, { label: "Nov", value: 18600 }, { label: "Dec", value: 23500 },
];

export const recentBookings: Booking[] = [
  { id: "BK-1904", guestName: "Sophie Martin", property: "Loft Rivoli", checkIn: "2026-03-15", checkOut: "2026-03-20", amount: 1450, status: "confirmed" },
  { id: "BK-1907", guestName: "James Carter", property: "Canal Saint-Martin Studio", checkIn: "2026-03-19", checkOut: "2026-03-22", amount: 980, status: "pending" },
  { id: "BK-1912", guestName: "Lina Ortega", property: "Montmartre Suite", checkIn: "2026-03-23", checkOut: "2026-03-27", amount: 1720, status: "checked_in" },
  { id: "BK-1915", guestName: "Noah Kim", property: "Bastille Duplex", checkIn: "2026-03-29", checkOut: "2026-04-03", amount: 2190, status: "confirmed" },
  { id: "BK-1889", guestName: "Emma Bell", property: "Marais One-Bedroom", checkIn: "2026-03-07", checkOut: "2026-03-12", amount: 1260, status: "completed" },
];

export const calendarReservations: CalendarReservation[] = [
  { day: 5, title: "Loft Rivoli" }, { day: 8, title: "Montmartre Suite" }, { day: 12, title: "Bastille Duplex" },
  { day: 15, title: "Loft Rivoli" }, { day: 18, title: "Marais One-Bedroom" }, { day: 21, title: "Canal Saint-Martin Studio" },
  { day: 24, title: "Bastille Duplex" }, { day: 27, title: "Montmartre Suite" },
];

export const propertyPerformance: PropertyPerformanceItem[] = [
  { id: "P-1", name: "Loft Rivoli", occupancyRate: 92, monthlyRevenue: 6840, reviewsAverage: 4.95 },
  { id: "P-2", name: "Montmartre Suite", occupancyRate: 87, monthlyRevenue: 5920, reviewsAverage: 4.9 },
  { id: "P-3", name: "Bastille Duplex", occupancyRate: 81, monthlyRevenue: 5510, reviewsAverage: 4.86 },
  { id: "P-4", name: "Canal Saint-Martin Studio", occupancyRate: 76, monthlyRevenue: 4240, reviewsAverage: 4.74 },
];
