import { useEffect } from 'react';
import { useAlerts, useTrackedLines, useNotifications } from '@/hooks';
import { isAlertActive } from '@/types';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { AlertCard } from '@/components/alerts/AlertCard';

export function AlertsPage() {
  const { lineIds } = useTrackedLines();
  const { alerts, loading, error, refresh } = useAlerts(
    lineIds.length > 0 ? lineIds : undefined
  );
  const { supported, enabled, permission, toggle, notifyAlerts } = useNotifications();

  const activeAlerts = alerts.filter(isAlertActive);

  useEffect(() => {
    if (activeAlerts.length > 0) {
      notifyAlerts(activeAlerts);
    }
  }, [activeAlerts, notifyAlerts]);

  return (
    <div className="page alerts-page">
      <div className="page-header">
        <h1>Service Alerts</h1>
        {supported && (
          <button
            className={`btn btn-sm ${enabled ? 'btn-active' : ''}`}
            onClick={toggle}
            title={
              permission === 'denied'
                ? 'Notifications blocked in browser settings'
                : enabled
                  ? 'Disable notifications'
                  : 'Enable notifications'
            }
          >
            {permission === 'denied' ? 'Blocked' : enabled ? 'Notifications On' : 'Notifications Off'}
          </button>
        )}
      </div>

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
