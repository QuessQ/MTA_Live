import { type FormEvent, useState, useCallback } from 'react';
import type { RouteSortOption } from '@/types';
import { SORT_LABELS } from '@/types';
import { fetchGeocode, type GeocodedPlace } from '@/services';
import { useLocation, useRoutePlanner, useSavedRoutes } from '@/hooks';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { RouteOptionCard } from '@/components/planner/RouteOptionCard';

export function PlannerPage() {
  const { coords } = useLocation();
  const { options, loading, error, sortBy, plan, setSortBy } = useRoutePlanner();
  const { routes: savedRoutes, add: saveRoute } = useSavedRoutes();

  const [destQuery, setDestQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [selectedDest, setSelectedDest] = useState<GeocodedPlace | null>(null);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [saved, setSaved] = useState(false);

  const searchPlaces = useCallback(async () => {
    if (destQuery.length < 3) return;
    setSearchingPlaces(true);
    try {
      const results = await fetchGeocode(destQuery);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    } finally {
      setSearchingPlaces(false);
    }
  }, [destQuery]);

  const selectPlace = (place: GeocodedPlace) => {
    setSelectedDest(place);
    setDestQuery(place.name.split(',')[0]);
    setSuggestions([]);
    setSaved(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!coords || !selectedDest) return;
    plan(coords, { latitude: selectedDest.latitude, longitude: selectedDest.longitude });
  };

  const handleSaveRoute = () => {
    if (!coords || !selectedDest) return;
    const name = `To ${destQuery.split(',')[0]}`;
    saveRoute({
      id: `route-${Date.now()}`,
      name,
      originName: 'Current Location',
      originLatitude: coords.latitude,
      originLongitude: coords.longitude,
      destinationName: selectedDest.name.split(',')[0],
      destinationLatitude: selectedDest.latitude,
      destinationLongitude: selectedDest.longitude,
      preferredRouteIds: [],
    });
    setSaved(true);
  };

  const alreadySaved = savedRoutes.some(
    (r) =>
      selectedDest &&
      Math.abs(r.destinationLatitude - selectedDest.latitude) < 0.001 &&
      Math.abs(r.destinationLongitude - selectedDest.longitude) < 0.001
  );

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
          <label htmlFor="dest">Destination</label>
          <div className="search-input-wrap">
            <input
              id="dest"
              type="text"
              placeholder="Search for a place..."
              value={destQuery}
              onChange={(e) => {
                setDestQuery(e.target.value);
                setSelectedDest(null);
                setSaved(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !selectedDest) {
                  e.preventDefault();
                  searchPlaces();
                }
              }}
              className="input"
              autoComplete="off"
              required
            />
            {!selectedDest && destQuery.length >= 3 && (
              <button
                type="button"
                className="btn btn-sm search-btn"
                onClick={searchPlaces}
                disabled={searchingPlaces}
              >
                {searchingPlaces ? '...' : 'Search'}
              </button>
            )}
          </div>
          {suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((place, i) => (
                <li key={i}>
                  <button type="button" className="suggestion-item" onClick={() => selectPlace(place)}>
                    {place.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="planner-actions">
          <button type="submit" className="btn btn-primary" disabled={loading || !coords || !selectedDest}>
            {loading ? 'Planning...' : 'Find Routes'}
          </button>
          {selectedDest && options.length > 0 && !alreadySaved && !saved && (
            <button type="button" className="btn" onClick={handleSaveRoute}>
              Save Route
            </button>
          )}
          {(alreadySaved || saved) && (
            <span className="save-confirm">Saved</span>
          )}
        </div>
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
