// components/MapWithList.js
import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix icône Leaflet par défaut (important)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const generateRandomProperties = (count) => {
    // Zone autour de Paris par exemple
    const latMin = 48.80;
    const latMax = 48.90;
    const lngMin = 2.30;
    const lngMax = 2.40;
    const properties = [];
    for (let i = 0; i < count; i++) {
        properties.push({
            id: i,
            title: `Bien n°${i + 1}`,
            lat: latMin + Math.random() * (latMax - latMin),
            lng: lngMin + Math.random() * (lngMax - lngMin),
        });
    }
    return properties;
};

export default function MapWithList() {
    const properties = useMemo(() => generateRandomProperties(30), []);
    const [hoveredId, setHoveredId] = useState(null);

    return (
        <div style={{ display: 'flex', height: '600px' }}>
            {/* Liste des biens */}
            <div
                style={{
                    flex: '1',
                    overflowY: 'auto',
                    borderRight: '1px solid #ccc',
                    padding: '10px',
                }}
            >
                <h2>Liste des biens</h2>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {properties.map((p) => (
                        <li
                            key={p.id}
                            onMouseEnter={() => setHoveredId(p.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            style={{
                                padding: '8px',
                                cursor: 'pointer',
                                backgroundColor: hoveredId === p.id ? '#def' : 'transparent',
                                borderRadius: '4px',
                                marginBottom: '4px',
                            }}
                        >
                            {p.title}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Carte */}
            <div style={{ flex: 2 }}>
                <MapContainer
                    center={[48.85, 2.35]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {properties.map((p) => (
                        <Marker
                            key={p.id}
                            position={[p.lat, p.lng]}
                            opacity={hoveredId === p.id ? 1 : 0.5}
                        // On peut aussi changer l'icône pour surbrillance si besoin
                        >
                            <Popup>{p.title}</Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
