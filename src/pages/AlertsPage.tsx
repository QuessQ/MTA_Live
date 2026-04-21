import { useAlerts, useTrackedLines } from '@/hooks';
import { isAlertActive } from '@/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { AlertCard } from '@/components/alerts/AlertCard';

export function AlertsPage() {
  const { lineIds } = useTrackedLines();
  const { alerts, loading, error, refresh } = useAlerts(
    lineIds.length > 0 ? lineIds : undefined
  );

  const activeAlerts = alerts.filter(isAlertActive);

  return (
    <div className="page alerts-page">
      <h1>Service Alerts</h1>

      {lineIds.length > 0 && (
        <p className="filter-note">
          Showing alerts for: {lineIds.join(', ')}
        </p>
      )}

      {loading && <LoadingSpinner message="Loading alerts..." />}
      {error && <ErrorBanner message={error} onRetry={refresh} />}

      <div className="alerts-list">
        {activeAlerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
        {!loading && activeAlerts.length === 0 && !error && (
          <p className="empty-state">No active alerts. Service is running normally.</p>
        )}
      </div>
    </div>
  );
}
