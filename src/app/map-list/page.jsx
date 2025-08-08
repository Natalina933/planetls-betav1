import { Suspense } from 'react';
import MapListContent from '../components/MapWithList/MapListContent';

export default function MapListPage() {
  return (
    <Suspense fallback={<div>Chargement de la carte...</div>}>
      <MapListContent />
    </Suspense>
  );
}
