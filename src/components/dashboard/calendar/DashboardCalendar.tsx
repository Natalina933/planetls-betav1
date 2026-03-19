'use client';

import React, { useMemo, useState } from 'react';
import { Calendar, dateFnsLocalizer, Event, type NavigateAction, type View } from 'react-big-calendar';
import { format, getDay, parse, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './DashboardCalendar.module.scss';

const locales = {
  fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: fr, weekStartsOn: 1 }),
  getDay: (date: Date) => getDay(date),
  locales,
});

export interface DashboardEvent extends Event {
  start: Date;
  end: Date;
  bookingId?: string;
  type: 'booking' | 'mission' | 'reminder';
}

interface DashboardCalendarProps {
  events: DashboardEvent[];
  title: string;
}

const EVENT_LABELS: Record<DashboardEvent['type'], string> = {
  booking: 'Reservations',
  mission: 'Missions',
  reminder: 'Rappels',
};

const EVENT_CLASSNAMES: Record<DashboardEvent['type'], string> = {
  booking: styles.bookingEvent,
  mission: styles.missionEvent,
  reminder: styles.reminderEvent,
};

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({ events, title }) => {
  const [view, setView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const counts = useMemo(() => {
    return events.reduce(
      (acc, event) => {
        acc[event.type] += 1;
        return acc;
      },
      { booking: 0, mission: 0, reminder: 0 } as Record<DashboardEvent['type'], number>,
    );
  }, [events]);

  const components = useMemo(
    () => ({
      event: ({ event }: { event: DashboardEvent }) => (
        <div className={styles.eventContent}>
          <span className={styles.eventType}>{EVENT_LABELS[event.type]}</span>
          <strong className={styles.eventTitle}>{event.title}</strong>
        </div>
      ),
    }),
    [],
  );

  const calendarProps = useMemo(
    () => ({
      localizer,
      events,
      view,
      views: ['month', 'week', 'day', 'agenda'] as View[],
      messages: {
        allDay: 'Toute la journee',
        previous: 'Precedent',
        next: 'Suivant',
        today: "Aujourd'hui",
        month: 'Mois',
        week: 'Semaine',
        day: 'Jour',
        agenda: 'Agenda',
        date: 'Date',
        time: 'Heure',
        event: 'Evenement',
        noEventsInRange: 'Aucun evenement dans cette periode.',
      },
      culture: 'fr',
      startAccessor: 'start' as keyof DashboardEvent,
      endAccessor: 'end' as keyof DashboardEvent,
      titleAccessor: 'title' as keyof DashboardEvent,
      date: currentDate,
      style: { height: 720 },
      popup: true,
      components,
      onView: (nextView: View) => setView(nextView),
      onNavigate: (nextDate: Date, nextView: View, action: NavigateAction) => {
        void nextView;
        void action;
        setCurrentDate(nextDate);
      },
      eventPropGetter: (event: DashboardEvent) => ({
        className: EVENT_CLASSNAMES[event.type],
      }),
    }),
    [components, currentDate, events, view],
  );

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          {title ? <h3 className={styles.title}>{title}</h3> : null}
          <p className={styles.subtitle}>
            {events.length > 0
              ? `${events.length} evenement(s) affiches sur la periode.`
              : 'Aucun evenement planifie pour le moment.'}
          </p>
        </div>

        <div className={styles.legend}>
          {(Object.keys(EVENT_LABELS) as DashboardEvent['type'][]).map((type) => (
            <div key={type} className={styles.legendItem}>
              <span className={`${styles.legendDot} ${EVENT_CLASSNAMES[type]}`} />
              <span className={styles.legendLabel}>
                {EVENT_LABELS[type]} {counts[type] > 0 ? `(${counts[type]})` : ''}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.calendarShell}>
        <div className={styles.calendarWrapper}>
          <Calendar {...calendarProps} />
        </div>
      </div>
    </section>
  );
};

export default DashboardCalendar;
