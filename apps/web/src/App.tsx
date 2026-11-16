import { useState } from 'react';
import { VibeOS } from './VibeOS';
import { LegacyDashboard } from './LegacyDashboard';

/*
 * Two levels, one door each.
 *
 * The main view is the Vibe OS chat. The full instrument panel still exists,
 * but it is mounted only when asked for, so nothing heavy runs behind the
 * calm surface and no telemetry grid is shown uninvited.
 */
export function App() {
  const [dashboardOpen, setDashboardOpen] = useState(false);

  if (dashboardOpen) return <LegacyDashboard onClose={() => setDashboardOpen(false)} />;
  return <VibeOS onOpenDashboard={() => setDashboardOpen(true)} />;
}

export default App;
