export type SidebarItem = {
  id: string;
  label: string;
  icon: string;
};

export type StatTrend = "up" | "down" | "flat";

export type DashboardStat = {
  id: string;
  label: string;
  value: string;
  hint: string;
  trend: StatTrend;
};

export type BookingStatus = "confirmed" | "pending" | "checked_in" | "completed";

export type Booking = {
  id: string;
  guestName: string;
  property: string;
  checkIn: string;
  checkOut: string;
  amount: number;
  status: BookingStatus;
};

export type RevenuePoint = {
  label: string;
  value: number;
};

export type CalendarReservation = {
  day: number;
  title: string;
};

export type PropertyPerformanceItem = {
  id: string;
  name: string;
  occupancyRate: number;
  monthlyRevenue: number;
  reviewsAverage: number;
};
