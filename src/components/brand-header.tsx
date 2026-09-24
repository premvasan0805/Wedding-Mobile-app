import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { BrandGradient, Mandala } from '@/components/decor';
import { Touchable } from '@/components/primitives';
import { initials, todayISO } from '@/lib/format';
import { useStore } from '@/lib/store';
import { C, F } from '@/lib/theme';

/**
 * Compact burgundy header shared by the Bookings, Customers and Settings tabs: brand, hall switcher,
 * bell and profile over faint mandalas with a warm gold glow in the lower-right corner.
 */
export function CompactBrandHeader({ topInset }: { topInset: number }) {
  const { hall, bookings } = useStore();
  const today = todayISO();
  const hasUpcoming = bookings.some((b) => b.status !== 'cancelled' && b.date >= today);
  const id = `hdr-${useId().replace(/:/g, '')}`;

  return (
    <View style={[st.header, { paddingTop: topInset + 12 }]}>
      <BrandGradient id={`${id}-grad`} from={C.gradientTo} to={C.primaryDark} />
      {/* Gold glow warming the lower-right corner. */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id={`${id}-glow`} cx="100%" cy="100%" rx="38%" ry="75%">
            <Stop offset="0" stopColor="#E9B774" stopOpacity={0.75} />
            <Stop offset="0.45" stopColor="#C77A5A" stopOpacity={0.3} />
            <Stop offset="1" stopColor="#C77A5A" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id}-glow)`} />
      </Svg>
      <View style={st.artRight} pointerEvents="none">
        <Mandala size={230} color={C.accentOnPrimary} opacity={0.2} />
      </View>
      <View style={st.artCorner} pointerEvents="none">
        <Mandala size={120} color={C.accentOnPrimary} opacity={0.12} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={st.brand}>
          Hall<Text style={{ color: C.accentOnPrimary }}>Book</Text>
        </Text>
        <Touchable onPress={() => router.push('/settings/hall')} accessibilityLabel="Hall details" style={st.hallRow}>
          <MaterialCommunityIcons name="bank-outline" size={19} color={C.accentOnPrimary} />
          <Text style={st.hallName} numberOfLines={1}>
            {hall.name}
          </Text>
          <Ionicons name="chevron-down" size={14} color={C.onPrimary} />
        </Touchable>
      </View>

      <View style={st.icons}>
        <Touchable
          onPress={() => router.push('/settings/notifications')}
          accessibilityLabel="Notifications"
          hitSlop={6}
          style={st.bell}>
          <Ionicons name="notifications" size={23} color={C.onPrimary} />
          {hasUpcoming ? <View style={st.bellDot} /> : null}
        </Touchable>
        <Touchable onPress={() => router.push('/more')} accessibilityLabel="Profile" style={st.avatar}>
          <Text style={st.avatarText}>{initials(hall.role)}</Text>
        </Touchable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingBottom: 14,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
    backgroundColor: C.primary,
  },
  artRight: { position: 'absolute', right: 40, top: -70 },
  artCorner: { position: 'absolute', right: -40, bottom: -50 },
  brand: { fontFamily: F.serifBold, fontSize: 38, lineHeight: 42, color: C.onPrimary },
  hallRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 1, alignSelf: 'flex-start' },
  hallName: { fontFamily: F.serifSemibold, fontSize: 17, color: C.onPrimary, flexShrink: 1 },
  icons: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  bell: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  bellDot: {
    position: 'absolute',
    top: 3,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E5283A',
    borderWidth: 1.5,
    borderColor: C.onPrimary,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C49468',
    borderWidth: 2.5,
    borderColor: '#F0D9B5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: F.medium, fontSize: 19, color: C.onPrimary },
});
