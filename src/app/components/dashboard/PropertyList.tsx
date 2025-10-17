import React from "react";

export interface Property {
    id: string;
    name: string | null;
    city: string | null;
    status?: string | null;
}

interface PropertyListProps {
    properties: Property[];
}

export default function PropertyList({ properties }: PropertyListProps) {
    if (!properties || properties.length === 0) {
        return <p>Aucune propriété trouvée.</p>;
    }

    return (
        <div className="property-list">
            {properties.map((property) => (
                <div key={property.id} className="property-card">
                    <h3>{property.name ?? "Propriété sans nom"}</h3>
                    <p>{property.city ?? "Ville non spécifiée"}</p>
                    <p className={`status ${property.status ?? "pending"}`}>
                        {property.status ?? "En attente"}
                    </p>
                </div>
            ))}
        </div>
    );
}
