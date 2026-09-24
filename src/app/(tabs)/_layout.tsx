import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '@/components/primitives';
import { useStore } from '@/lib/store';
import { C, F } from '@/lib/theme';

/** Outline icon when idle, filled burgundy icon when active. */
function tabIcon(outline: IconName, filled: IconName) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <Ionicons name={focused ? filled : outline} size={22} color={color} />;
  };
}

/** Calendar uses the dotted month-grid glyph, filled when active. */
function CalendarIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
  return (
    <MaterialCommunityIcons
      name={focused ? 'calendar-month' : 'calendar-month-outline'}
      size={23}
      color={color as string}
    />
  );
}

/** Label with a short burgundy underline marking the active tab. */
function TabLabel({ focused, color, children }: { focused: boolean; color: ColorValue; children: string }) {
  return (
    <View style={st.labelWrap}>
      <Text style={[st.label, { color }, focused && { fontFamily: F.semibold }]}>{children}</Text>
      <View style={[st.underline, focused && st.underlineOn]} />
    </View>
  );
}

export default function TabsLayout() {
  const { signedIn } = useStore();
  const insets = useSafeAreaInsets();
  if (!signedIn) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.textSecondary,
        tabBarLabel: TabLabel,
        tabBarStyle: [st.bar, { marginBottom: Math.max(insets.bottom, 10) }],
        tabBarItemStyle: st.item,
        tabBarIconStyle: st.icon,
        tabBarActiveBackgroundColor: C.primarySoft,
        sceneStyle: { backgroundColor: C.bg },
        animation: 'shift',
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home-outline', 'home') }} />
      <Tabs.Screen
        name="calendar"
        options={{ title: 'Calendar', tabBarIcon: CalendarIcon }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ title: 'Bookings', tabBarIcon: tabIcon('document-text-outline', 'document-text') }}
      />
      <Tabs.Screen
        name="customers"
        options={{ title: 'Customers', tabBarIcon: tabIcon('people-outline', 'people') }}
      />
      <Tabs.Screen name="more" options={{ title: 'Settings', tabBarIcon: tabIcon('settings-outline', 'settings') }} />
    </Tabs>
  );
}

const st = StyleSheet.create({
  /** Floating rounded bar; the active tab gets a soft blush pill with a short burgundy bar under its label. */
  bar: {
    height: 72,
    marginHorizontal: 13,
    paddingHorizontal: 6,
    paddingTop: 7,
    paddingBottom: 7,
    borderRadius: 18,
    backgroundColor: C.surface,
    borderTopWidth: 0,
    shadowColor: '#57152C',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  item: { borderRadius: 12, marginHorizontal: 4, paddingTop: 4, paddingBottom: 0, overflow: 'hidden' },
  icon: { marginBottom: 0 },
  labelWrap: { alignItems: 'center', marginTop: 2 },
  label: { fontFamily: F.regular, fontSize: 10.5, lineHeight: 13 },
  underline: { width: 22, height: 3.5, borderRadius: 2, marginTop: 4, backgroundColor: 'transparent' },
  underlineOn: { backgroundColor: C.primary },
});
