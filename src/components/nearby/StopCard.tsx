import type { TransitStop } from '@/types';

interface StopCardProps {
  stop: TransitStop;
  distanceMeters?: number;
  onSelect: (stop: TransitStop) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function StopCard({ stop, distanceMeters, onSelect, isFavorite, onToggleFavorite }: StopCardProps) {
  const typeIcon = stop.type === 'subway' ? '\u{1F687}' : stop.type === 'bus' ? '\u{1F68C}' : '\u{26F4}';
  const distanceLabel = distanceMeters != null
    ? distanceMeters < 1000
      ? `${Math.round(distanceMeters)}m`
      : `${(distanceMeters / 1000).toFixed(1)}km`
    : null;

  return (
    <div className="stop-card">
      <button className="stop-card-main" onClick={() => onSelect(stop)}>
        <div className="stop-card-header">
          <span className="stop-icon">{typeIcon}</span>
          <span className="stop-name">{stop.name}</span>
          {distanceLabel && <span className="stop-distance">{distanceLabel}</span>}
        </div>
        <div className="stop-routes">
          {stop.routes.map((route) => (
            <span key={route} className="route-tag">
              {route}
            </span>
          ))}
        </div>
      </button>
      {onToggleFavorite && (
        <button
          className={`btn-fav ${isFavorite ? 'btn-fav-active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      )}
    </div>
  );
}
