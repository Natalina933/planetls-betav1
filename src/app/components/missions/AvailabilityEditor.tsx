"use client";

import type { MissionAvailability, WeekDay } from "./types";

type DaySchedule = MissionAvailability["schedule"][number];
type TimeRange = DaySchedule["ranges"][number];

const DAYS: { id: WeekDay; label: string }[] = [
    { id: "mon", label: "Lundi" },
    { id: "tue", label: "Mardi" },
    { id: "wed", label: "Mercredi" },
    { id: "thu", label: "Jeudi" },
    { id: "fri", label: "Vendredi" },
    { id: "sat", label: "Samedi" },
    { id: "sun", label: "Dimanche" },
];

interface AvailabilityEditorProps {
    value: DaySchedule[];
    emergency24h: boolean;
    isEditing: boolean;
    onChange: (value: DaySchedule[], emergency24h: boolean) => void;
}

export default function AvailabilityEditor({
    value,
    emergency24h,
    isEditing,
    onChange,
}: AvailabilityEditorProps) {
    const updateDay = (day: WeekDay, ranges: TimeRange[]) => {
        const next = value.filter((d) => d.day !== day);
        if (ranges.length) next.push({ day, ranges });
        onChange(next, emergency24h);
    };

    return (
        <div>
            <h4>Disponibilités</h4>

            {DAYS.map((d) => {
                const dayData = value.find((v) => v.day === d.id);
                return (
                    <div key={d.id}>
                        <strong>{d.label}</strong>
                        {isEditing && (
                            <button
                                type="button"
                                onClick={() =>
                                    updateDay(d.id, [
                                        ...(dayData?.ranges ?? []),
                                        { start: "09:00", end: "12:00" },
                                    ])
                                }
                            >
                                + plage
                            </button>
                        )}

                        {dayData?.ranges.map((r, i) => (
                            <div key={i}>
                                <input type="time" value={r.start} readOnly={!isEditing} />
                                <input type="time" value={r.end} readOnly={!isEditing} />
                            </div>
                        ))}
                    </div>
                );
            })}

            <label>
                <input
                    type="checkbox"
                    checked={emergency24h}
                    onChange={(e) => onChange(value, e.target.checked)}
                />
                Disponible 24h/7 (urgence)
            </label>
        </div>
    );
}
