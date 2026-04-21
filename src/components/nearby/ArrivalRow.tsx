import type { Arrival } from '@/types';
import { getMinutesUntilArrival, isDelayed, getDelayMinutes } from '@/types';
import { Badge } from '../common/Badge';

interface ArrivalRowProps {
  arrival: Arrival;
}

export function ArrivalRow({ arrival }: ArrivalRowProps) {
  const minutes = getMinutesUntilArrival(arrival);
  const delayed = isDelayed(arrival);
  const delay = getDelayMinutes(arrival);

  return (
    <div className="arrival-row">
      <div className="arrival-route">
        <span className="route-name">{arrival.routeName}</span>
        <span className="arrival-direction">{arrival.direction}</span>
      </div>
      <div className="arrival-time">
        <span className={`minutes ${delayed ? 'delayed' : ''}`}>
          {minutes === 0 ? 'Now' : `${minutes} min`}
        </span>
        {delayed && <Badge label={`+${delay}m`} variant="warning" />}
        {arrival.isRealTime && <Badge label="Live" variant="success" />}
      </div>
    </div>
  );
}
