import { useState, useCallback } from 'react';
import type { TransitStop } from '@/types';
import { distanceMeters } from '@/services';
import { useLocation, useNearbyStops, useArrivals, useFavoriteStops } from '@/hooks';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { StopCard } from '@/components/nearby/StopCard';
import { ArrivalRow } from '@/components/nearby/ArrivalRow';
import { StopMap } from '@/components/nearby/StopMap';

type ViewMode = 'list' | 'map';

export function NearbyPage() {
  const { coords, error: locError, loading: locLoading, refresh: refreshLoc } = useLocation(true);
  const { stops, loading: stopsLoading, error: stopsError } = useNearbyStops(coords);
  const [selectedStop, setSelectedStop] = useState<TransitStop | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const { arrivals, loading: arrivalsLoading, error: arrivalsError, refresh: refreshArrivals } =
    useArrivals(selectedStop?.id ?? null);
  const { stops: favoriteStops, add: addFavorite, remove: removeFavorite } = useFavoriteStops();

  const isFavorite = (stopId: string) => favoriteStops.some((f) => f.stopId === stopId);

  const toggleFavorite = (stop: TransitStop) => {
    if (isFavorite(stop.id)) {
      const fav = favoriteStops.find((f) => f.stopId === stop.id);
      if (fav) removeFavorite(fav.id);
    } else {
      addFavorite({
        id: `fav-${stop.id}`,
        stopId: stop.id,
        name: stop.name,
        type: stop.type,
        trackedRoutes: stop.routes,
      });
    }
  };

  const handleMapSelectStop = useCallback((stop: TransitStop) => {
    setSelectedStop(stop);
  }, []);

  if (locLoading) return <LoadingSpinner message="Finding your location..." />;
  if (locError) return <ErrorBanner message={locError} onRetry={refreshLoc} />;

  return (
    <div className="page nearby-page">
      <div className="page-header">
        <h1>Nearby Transit</h1>
        {!selectedStop && (
          <div className="view-toggle">
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'map' ? 'btn-active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              Map
            </button>
          </div>
        )}
      </div>

      {stopsLoading && <LoadingSpinner message="Finding stops..." />}
      {stopsError && <ErrorBanner message={stopsError} />}

      {!selectedStop && viewMode === 'map' && coords && (
        <StopMap coords={coords} stops={stops} onSelectStop={handleMapSelectStop} />
      )}

      {!selectedStop && viewMode === 'list' && (
        <div className="stop-list">
          {stops.map((stop) => (
            <StopCard
              key={stop.id}
              stop={stop}
              distanceMeters={coords ? distanceMeters(coords, { latitude: stop.latitude, longitude: stop.longitude }) : undefined}
              onSelect={setSelectedStop}
              isFavorite={isFavorite(stop.id)}
              onToggleFavorite={() => toggleFavorite(stop)}
            />
          ))}
          {!stopsLoading && stops.length === 0 && !stopsError && (
            <p className="empty-state">No stops found nearby.</p>
          )}
        </div>
      )}

      {selectedStop && (
        <div className="arrivals-panel">
          <div className="arrivals-header">
            <button className="btn btn-back" onClick={() => setSelectedStop(null)}>
              &larr; Back
            </button>
            <button
              className={`btn btn-sm ${isFavorite(selectedStop.id) ? 'btn-active' : ''}`}
              onClick={() => toggleFavorite(selectedStop)}
            >
              {isFavorite(selectedStop.id) ? 'Saved' : 'Save Stop'}
            </button>
          </div>
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
