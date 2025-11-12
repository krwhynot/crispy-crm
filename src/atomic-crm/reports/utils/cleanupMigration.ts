/**
 * Cleanup migration utility for transitioning from old reports to tabbed interface
 * Removes localStorage keys used by the previous reports implementation
 */
export function cleanupOldReportKeys() {
  const oldKeys = [
    'reports.opportunities.filters',
    'reports.weekly.filters',
    'reports.campaign.filters',
    'report-view-preference',
  ];

  oldKeys.forEach(key => {
    localStorage.removeItem(key);
  });

  // Mark migration as complete
  localStorage.setItem('reports.migration.completed', 'true');

  if (process.env.NODE_ENV === 'development') {
    console.log('[Reports Migration] Cleaned up old localStorage keys');
  }
}
