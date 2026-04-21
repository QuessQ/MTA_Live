import type { SavedRoute } from '@/types';

interface SavedRouteCardProps {
  route: SavedRoute;
  onSelect: (route: SavedRoute) => void;
  onRemove: (id: string) => void;
}

export function SavedRouteCard({ route, onSelect, onRemove }: SavedRouteCardProps) {
  return (
    <div className="saved-route-card">
      <button className="saved-route-info" onClick={() => onSelect(route)}>
        <h3 className="saved-route-name">{route.name}</h3>
        <p className="saved-route-detail">
          {route.originName} &rarr; {route.destinationName}
        </p>
      </button>
      <button
        className="btn btn-sm btn-danger"
        onClick={() => onRemove(route.id)}
        aria-label={`Remove ${route.name}`}
      >
        Remove
      </button>
    </div>
  );
}
