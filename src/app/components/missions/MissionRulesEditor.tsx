"use client";

import type { MissionAvailability } from "./types";

type MissionRules = MissionAvailability["rules"];

interface MissionRulesEditorProps {
    value: MissionRules;
    isEditing: boolean;
    onChange: (value: MissionRules) => void;
}

export default function MissionRulesEditor({
    value,
    isEditing,
    onChange,
}: MissionRulesEditorProps) {
    const toggle = (key: keyof MissionRules) =>
        onChange({ ...value, [key]: !value[key] });

    return (
        <div>
            <h4>Règles automatiques</h4>

            {(
                [
                    ["refuseOutOfZone", "Refuser automatiquement hors zone"],
                    ["refuseOutOfSchedule", "Refuser hors horaires"],
                    ["autoAcceptEmergency", "Accepter automatiquement les urgences"],
                ] as [keyof MissionRules, string][]
            ).map(([key, label]) => (
                <label key={key}>
                    <input
                        type="checkbox"
                        checked={value[key]}
                        onChange={() => toggle(key)}
                        disabled={!isEditing}
                    />
                    {label}
                </label>
            ))}
        </div>
    );
}
