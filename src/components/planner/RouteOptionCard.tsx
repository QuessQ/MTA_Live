import type { RouteOption } from '@/types';
import { RELIABILITY_LABELS } from '@/types';
import { Badge } from '../common/Badge';

interface RouteOptionCardProps {
  option: RouteOption;
}

export function RouteOptionCard({ option }: RouteOptionCardProps) {
  const reliabilityVariant =
    option.reliability === 'high' ? 'success' : option.reliability === 'moderate' ? 'warning' : 'danger';

  return (
    <div className="route-option-card">
      <div className="route-option-header">
        <span className="route-duration">{option.totalDurationMinutes} min</span>
        <Badge label={RELIABILITY_LABELS[option.reliability]} variant={reliabilityVariant} />
        {option.hasActiveAlerts && <Badge label="Alerts" variant="warning" />}
      </div>
      <div className="route-option-stats">
        <span>{option.transferCount} transfer{option.transferCount !== 1 ? 's' : ''}</span>
        <span>{option.totalWalkingMinutes} min walking</span>
      </div>
      <div className="route-legs">
        {option.legs.map((leg) => (
          <div key={leg.id} className="route-leg">
            <span className={`leg-type leg-${leg.type}`}>
              {leg.type === 'walk' ? 'Walk' : leg.routeName ?? leg.type}
            </span>
            <span className="leg-detail">
              {leg.from} &rarr; {leg.to}
            </span>
            <span className="leg-duration">{leg.durationMinutes}m</span>
          </div>
        ))}
      </div>
    </div>
  );
}
