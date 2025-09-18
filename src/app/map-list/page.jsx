import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const MapListContent = dynamic(() => import('@/components/MapWithList/MapListContent'), {
  ssr: false,
});

export default function MapWithListPage() {
  return (
    <Suspense fallback={<div>Chargement de la carte...</div>}>
      <MapListContent />
    </Suspense>
  );
}
