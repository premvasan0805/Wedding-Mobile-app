import { useState } from 'react';

import { Screen } from '@/components/primitives';
import { ToggleList } from '@/components/toggle-list';

export default function NotificationSettingsScreen() {
  const [v, setV] = useState<Record<string, boolean>>({
    upcoming: true,
    due: true,
    tentative: true,
    daily: false,
  });
  return (
    <Screen title="Notifications" back>
      <ToggleList
        values={v}
        onChange={(k, val) => setV((s) => ({ ...s, [k]: val }))}
        items={[
          { key: 'upcoming', title: 'Upcoming events', sub: 'Remind me a day before each event' },
          { key: 'due', title: 'Payment due', sub: 'Remind me about unpaid balances' },
          { key: 'tentative', title: 'Tentative holds', sub: 'Nudge me to confirm tentative bookings' },
          { key: 'daily', title: 'Daily summary', sub: "Morning digest of today's schedule" },
        ]}
      />
    </Screen>
  );
}
