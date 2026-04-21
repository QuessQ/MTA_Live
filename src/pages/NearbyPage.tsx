import { useState } from 'react';
import type { TransitStop } from '@/types';
import { distanceMeters } from '@/services';
import { useLocation, useNearbyStops, useArrivals } from '@/hooks';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { StopCard } from '@/components/nearby/StopCard';
import { ArrivalRow } from '@/components/nearby/ArrivalRow';

export function NearbyPage() {
  const { coords, error: locError, loading: locLoading, refresh: refreshLoc } = useLocation(true);
  const { stops, loading: stopsLoading, error: stopsError } = useNearbyStops(coords);
  const [selectedStop, setSelectedStop] = useState<TransitStop | null>(null);
  const { arrivals, loading: arrivalsLoading, error: arrivalsError, refresh: refreshArrivals } =
    useArrivals(selectedStop?.id ?? null);

  if (locLoading) return <LoadingSpinner message="Finding your location..." />;
  if (locError) return <ErrorBanner message={locError} onRetry={refreshLoc} />;

  return (
    <div className="page nearby-page">
      <h1>Nearby Transit</h1>

      {stopsLoading && <LoadingSpinner message="Finding stops..." />}
      {stopsError && <ErrorBanner message={stopsError} />}

      {!selectedStop && (
        <div className="stop-list">
          {stops.map((stop) => (
            <StopCard
              key={stop.id}
              stop={stop}
              distanceMeters={coords ? distanceMeters(coords, { latitude: stop.latitude, longitude: stop.longitude }) : undefined}
              onSelect={setSelectedStop}
            />
          ))}
          {!stopsLoading && stops.length === 0 && !stopsError && (
            <p className="empty-state">No stops found nearby.</p>
          )}
        </div>
      )}

      {selectedStop && (
        <div className="arrivals-panel">
          <button className="btn btn-back" onClick={() => setSelectedStop(null)}>
            &larr; Back
          </button>
          <h2>{selectedStop.name}</h2>

          {arrivalsLoading && <LoadingSpinner message="Loading arrivals..." />}
          {arrivalsError && <ErrorBanner message={arrivalsError} onRetry={refreshArrivals} />}

          <div className="arrivals-list">
            {arrivals.map((arrival) => (
              <ArrivalRow key={arrival.id} arrival={arrival} />
            ))}
            {!arrivalsLoading && arrivals.length === 0 && !arrivalsError && (
              <p className="empty-state">No upcoming arrivals.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
