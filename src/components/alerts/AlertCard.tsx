import { useState } from 'react';
import type { ServiceAlert, AlertSeverity } from '@/types';
import { Badge } from '../common/Badge';

interface AlertCardProps {
  alert: ServiceAlert;
}

const SEVERITY_VARIANT: Record<AlertSeverity, 'info' | 'warning' | 'danger'> = {
  info: 'info',
  warning: 'warning',
  severe: 'danger',
  emergency: 'danger',
};

export function AlertCard({ alert }: AlertCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`alert-card alert-${alert.severity}`}>
      <button className="alert-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="alert-title-row">
          <Badge label={alert.severity.toUpperCase()} variant={SEVERITY_VARIANT[alert.severity]} />
          <Badge label={alert.category} />
          <h3 className="alert-title">{alert.title}</h3>
        </div>
        <div className="alert-routes">
          {alert.affectedRoutes.map((r) => (
            <span key={r} className="route-tag">
              {r}
            </span>
          ))}
        </div>
        <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="alert-card-body">
          <p>{alert.body}</p>
          <p className="alert-updated">
            Updated: {new Date(alert.updatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
