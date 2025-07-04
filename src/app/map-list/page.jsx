// pages/index.js
import dynamic from 'next/dynamic';

// Leaflet ne fonctionne pas bien en SSR, on charge dynamiquement
const MapWithList = dynamic(() => import('../components/MapWithList/MapWithList'), {
  ssr: false,
});

export default function Home() {
  return (
    <div>
      <h1>Exemple système cartes à la Airbnb</h1>
      <MapWithList />
    </div>
  );
}
