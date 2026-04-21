import { useSavedRoutes, useFavoriteStops, useTrackedLines } from '@/hooks';
import { SavedRouteCard } from '@/components/routes/SavedRouteCard';

export function RoutesPage() {
  const { routes, remove: removeRoute } = useSavedRoutes();
  const { stops: favoriteStops, remove: removeFavorite } = useFavoriteStops();
  const { lineIds: trackedLines, toggle: toggleLine } = useTrackedLines();

  return (
    <div className="page routes-page">
      <h1>My Routes</h1>

      <section>
        <h2>Saved Routes</h2>
        {routes.length === 0 ? (
          <p className="empty-state">No saved routes yet. Plan a trip to save one.</p>
        ) : (
          <div className="saved-routes-list">
            {routes.map((route) => (
              <SavedRouteCard
                key={route.id}
                route={route}
                onSelect={() => {}}
                onRemove={removeRoute}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Favorite Stops</h2>
        {favoriteStops.length === 0 ? (
          <p className="empty-state">No favorite stops yet. Tap a stop to save it.</p>
        ) : (
          <div className="favorites-list">
            {favoriteStops.map((fav) => (
              <div key={fav.id} className="favorite-item">
                <span>{fav.name}</span>
                <span className="favorite-type">{fav.type}</span>
                <button className="btn btn-sm" onClick={() => removeFavorite(fav.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Tracked Lines</h2>
        {trackedLines.length === 0 ? (
          <p className="empty-state">No tracked lines. Add lines to get status alerts.</p>
        ) : (
          <div className="tracked-lines-list">
            {trackedLines.map((lineId) => (
              <div key={lineId} className="tracked-line-item">
                <span className="route-tag">{lineId}</span>
                <button className="btn btn-sm" onClick={() => toggleLine(lineId)}>
                  Untrack
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
