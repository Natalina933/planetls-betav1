"use client";

import { GoogleMap, Marker, Circle, Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { useRef } from "react";
import type { MissionAvailability } from "./types";

interface MissionMapProps {
    zones: MissionAvailability["zones"];
    radiusKm: number;
    onZonesChange: (zones: MissionAvailability["zones"]) => void;
    onRadiusChange: (radiusKm: number) => void;
    isEditing: boolean;
}

export default function MissionMap({
    zones,
    radiusKm,
    onZonesChange,
    onRadiusChange,
    isEditing,
}: MissionMapProps) {
    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ["places"],
    });

    const autoRef = useRef<google.maps.places.Autocomplete | null>(null);

    const addPlace = () => {
        if (!autoRef.current) return;
        const place = autoRef.current.getPlace();
        if (!place?.geometry || !place.place_id) return;

        onZonesChange([
            ...zones,
            {
                placeId: place.place_id,
                label: place.formatted_address ?? "",
                lat: place.geometry.location?.lat() ?? 0,
                lng: place.geometry.location?.lng() ?? 0,
            },
        ]);
    };

    if (!isLoaded) return <p>Chargement de la carte…</p>;

    return (
        <div>
            {isEditing && (
                <Autocomplete
                    onLoad={(ref) => (autoRef.current = ref)}
                    onPlaceChanged={addPlace}
                >
                    <input placeholder="Ajouter une zone (ville, adresse…)" />
                </Autocomplete>
            )}

            <GoogleMap
                center={
                    zones[0] ? { lat: zones[0].lat, lng: zones[0].lng } : { lat: 48.8566, lng: 2.3522 }
                }
                zoom={10}
                mapContainerStyle={{ height: 300 }}
            >
                {zones.map((z) => (
                    <Marker key={z.placeId} position={{ lat: z.lat, lng: z.lng }} />
                ))}

                {zones.map((z) => (
                    <Circle key={z.placeId} center={{ lat: z.lat, lng: z.lng }} radius={radiusKm * 1000} />
                ))}
            </GoogleMap>

            {isEditing && (
                <input
                    type="range"
                    min={5}
                    max={100}
                    value={radiusKm}
                    onChange={(e) => onRadiusChange(Number(e.target.value))}
                />
            )}
        </div>
    );
}
