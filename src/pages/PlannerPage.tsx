import { type FormEvent, useState } from 'react';
import type { RouteSortOption } from '@/types';
import { SORT_LABELS } from '@/types';
import { useLocation, useRoutePlanner } from '@/hooks';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { RouteOptionCard } from '@/components/planner/RouteOptionCard';

export function PlannerPage() {
  const { coords } = useLocation();
  const { options, loading, error, sortBy, plan, setSortBy } = useRoutePlanner();
  const [destLat, setDestLat] = useState('');
  const [destLon, setDestLon] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!coords) return;
    const lat = parseFloat(destLat);
    const lon = parseFloat(destLon);
    if (isNaN(lat) || isNaN(lon)) return;
    plan(coords, { latitude: lat, longitude: lon });
  };

  return (
    <div className="page planner-page">
      <h1>Trip Planner</h1>

      <form className="planner-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="origin">From</label>
          <input
            id="origin"
            type="text"
            value={coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Locating...'}
            readOnly
            className="input"
          />
        </div>
        <div className="form-group">
          <label htmlFor="dest-lat">Destination Latitude</label>
          <input
            id="dest-lat"
            type="text"
            inputMode="decimal"
            placeholder="40.7128"
            value={destLat}
            onChange={(e) => setDestLat(e.target.value)}
            className="input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="dest-lon">Destination Longitude</label>
          <input
            id="dest-lon"
            type="text"
            inputMode="decimal"
            placeholder="-74.0060"
            value={destLon}
            onChange={(e) => setDestLon(e.target.value)}
            className="input"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading || !coords}>
          {loading ? 'Planning...' : 'Find Routes'}
        </button>
      </form>

      {loading && <LoadingSpinner message="Finding routes..." />}
      {error && <ErrorBanner message={error} />}

      {options.length > 0 && (
        <>
          <div className="sort-controls">
            <span>Sort by:</span>
            {(Object.keys(SORT_LABELS) as RouteSortOption[]).map((key) => (
              <button
                key={key}
                className={`btn btn-sm ${sortBy === key ? 'btn-active' : ''}`}
                onClick={() => setSortBy(key)}
              >
                {SORT_LABELS[key]}
              </button>
            ))}
          </div>
          <div className="route-options-list">
            {options.map((option) => (
              <RouteOptionCard key={option.id} option={option} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
