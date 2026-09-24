import { Stack } from 'expo-router/stack';

import { C } from '@/lib/theme';

/** Customers tab: the list, with profiles pushed on top so the tab bar stays visible. */
export default function CustomersLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'slide_from_right' }}
    />
  );
}
