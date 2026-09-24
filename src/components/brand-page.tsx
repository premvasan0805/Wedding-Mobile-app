import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useId, useState, type ComponentProps } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BrandGradient, Mandala, Mandapam } from '@/components/decor';
import { goBack, Touchable } from '@/components/primitives';
import { useStore, type SegmentKey, type SlotKey } from '@/lib/store';
import { C, elevation, F } from '@/lib/theme';

export type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const GOLD = '#D2A566';

const FLORAL = require('../../assets/images/customer/floral-bottom.png');

/** Each booking timing gets its own soft sky tone so the four read apart at a glance. */
export const SLOT_META: Record<SlotKey, { icon: MciName; fg: string; bg: string }> = {
  full: { icon: 'white-balance-sunny', fg: '#D98A1C', bg: '#FDF1DC' },
  first: { icon: 'weather-sunset-up', fg: '#C2334F', bg: '#FCE8EC' },
  second: { icon: 'moon-waning-crescent', fg: '#6A45B0', bg: '#EEE8F7' },
  early: { icon: 'weather-sunset', fg: '#2F7F9A', bg: '#E1F1F6' },
};

/** Day segments reuse the same sky tones as the timings they make up. */
export const SEGMENT_META: Record<SegmentKey, { icon: MciName; fg: string; bg: string }> = {
  early: { icon: 'weather-sunset-up', fg: '#D98A1C', bg: '#FDF1DC' },
  late: { icon: 'white-balance-sunny', fg: '#D98A1C', bg: '#FDF1DC' },
  evening: { icon: 'moon-waning-crescent', fg: '#6A45B0', bg: '#EEE8F7' },
};

/**
 * Burgundy page header for form-style screens: back button, two-tone serif title
 * (`title` in white, `accent` in gold), hall name, and a gold mandapam drawing.
 * Also sets a light status bar while the screen is focused.
 */
export function BrandPageHeader({ title, accent }: { title: string; accent: string }) {
  const insets = useSafeAreaInsets();
  const { hall } = useStore();
  const id = `bph-${useId().replace(/:/g, '')}`;
  const [focused, setFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  return (
    <View style={[st.header, { paddingTop: insets.top + 10 }]}>
      {focused ? <StatusBar style="light" /> : null}
      <BrandGradient id={id} from={C.gradientFrom} to={C.gradientTo} />
      <View style={st.mandala} pointerEvents="none">
        <Mandala size={150} color={C.accentOnPrimary} opacity={0.12} />
      </View>
      <View style={st.art} pointerEvents="none">
        <Mandapam width={96} color={C.accentOnPrimary} opacity={0.85} />
      </View>
      <Touchable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8} style={st.back}>
        <Ionicons name="arrow-back" size={18} color={C.onPrimary} />
      </Touchable>
      <View style={{ flex: 1 }}>
        <Text style={st.title}>
          {title} <Text style={{ color: C.accentOnPrimary }}>{accent}</Text>
        </Text>
        <Touchable onPress={() => router.push('/settings/hall')} accessibilityLabel="Hall details" style={st.hallRow}>
          <Text style={st.hallName} numberOfLines={1}>
            {hall.name}
          </Text>
          <Ionicons name="chevron-down" size={13} color={C.onPrimary} />
        </Touchable>
      </View>
    </View>
  );
}

/** Faint gold floral peeking in from the lower-left corner of a brand page. */
export function BrandFloral({ bottom = 0 }: { bottom?: number }) {
  return <Image source={FLORAL} style={[st.floral, { bottom }]} contentFit="contain" pointerEvents="none" />;
}

/** Thin gold line that fades out to the right — sits after a section label. */
export function GoldRule({ maxWidth = 110 }: { maxWidth?: number }) {
  const id = `gr-${useId().replace(/:/g, '')}`;
  return (
    <Svg height={2} style={{ flex: 1, maxWidth }}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={GOLD} stopOpacity={0.95} />
          <Stop offset="1" stopColor={GOLD} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="1.2" fill={`url(#${id})`} />
    </Svg>
  );
}

/** Burgundy gradient button with faint mandalas at both ends and a gold icon. */
export function BrandButton({
  title,
  icon,
  onPress,
  disabled,
  style,
}: {
  title: string;
  icon: MciName;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const id = `cta-${useId().replace(/:/g, '')}`;
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={[st.cta, style]}>
      <BrandGradient id={id} from={C.gradientTo} to={C.primaryDark} />
      <View style={st.ctaArtLeft} pointerEvents="none">
        <Mandala size={90} color={C.accentOnPrimary} opacity={0.18} />
      </View>
      <View style={st.ctaArtRight} pointerEvents="none">
        <Mandala size={90} color={C.accentOnPrimary} opacity={0.18} />
      </View>
      <MaterialCommunityIcons name={icon} size={20} color={C.accentOnPrimary} />
      <Text style={st.ctaText}>{title}</Text>
    </Touchable>
  );
}

/** Big burgundy call-to-action pinned to the bottom of a brand page. */
export function BrandCta(props: { title: string; icon: MciName; onPress: () => void; disabled?: boolean }) {
  return (
    <SafeAreaView edges={['bottom']} style={st.footer}>
      <BrandButton {...props} />
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
    backgroundColor: C.primary,
  },
  mandala: { position: 'absolute', left: '38%', top: -50 },
  art: { position: 'absolute', right: 12, bottom: -2 },
  back: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: F.serifBold, fontSize: 25, lineHeight: 30, color: C.onPrimary },
  hallRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  hallName: { fontFamily: F.medium, fontSize: 12, color: C.onPrimarySoft, flexShrink: 1 },
  floral: { position: 'absolute', left: 0, width: 167, height: 137, opacity: 0.6 },
  footer: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10, backgroundColor: C.bg },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: C.primary,
    ...elevation,
  },
  ctaArtLeft: { position: 'absolute', left: -30, top: -20 },
  ctaArtRight: { position: 'absolute', right: -30, top: -20 },
  ctaText: { fontFamily: F.serifBold, fontSize: 21, color: C.onPrimary },
});
