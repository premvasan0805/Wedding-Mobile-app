import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { ClipPath, Defs, Image as SvgImage, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { openBooking } from '@/components/cards';
import { CalendarBoard, DayDetail } from '@/components/calendar-board';
import { currentYM, type YM } from '@/components/calendar';
import { BrandGradient, Lotus, Mandala } from '@/components/decor';
import { ConfirmDialog, useToast } from '@/components/overlays';
import { Touchable } from '@/components/primitives';
import { fmtFull, initials, parseISO, todayISO } from '@/lib/format';
import { useStore } from '@/lib/store';
import { C, elevation, F } from '@/lib/theme';

const VENUE = require('../../../assets/images/home/venue.png');

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(false);
  const [ym, setYm] = useState<YM>(currentYM());
  const [selected, setSelected] = useState<string>(todayISO());

  // Light status bar only while this tab (with its burgundy header) is on screen.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const goToday = () => {
    setYm(currentYM());
    setSelected(todayISO());
  };

  return (
    <View style={st.screen}>
      {focused ? <StatusBar style="light" /> : null}
      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        {/* Faint gold florals peeking in from the page edges. */}
        <View style={[st.floral, { top: 250, left: -70 }]} pointerEvents="none">
          <Mandala size={150} color={C.accent} opacity={0.18} />
        </View>
        <View style={[st.floral, { top: 1010, right: -70 }]} pointerEvents="none">
          <Mandala size={150} color={C.accent} opacity={0.18} />
        </View>

        <BrandHeader topInset={insets.top} />

        <View style={st.card}>
          <View style={st.titleRow}>
            <View>
              <Text style={st.title}>Calendar</Text>
              <Text style={st.subtitle}>Plan • Book • Celebrate</Text>
            </View>
            <View style={st.flourish} pointerEvents="none">
              <View style={st.flourishLine} />
              <View style={st.flourishDot} />
              <Lotus size={30} color={C.accent} />
              <View style={st.flourishDot} />
              <View style={st.flourishLine} />
            </View>
            <Touchable
              onPress={goToday}
              accessibilityRole="button"
              accessibilityLabel="Go to today"
              hitSlop={8}
              style={st.todayBtn}>
              <MaterialCommunityIcons name="calendar-check-outline" size={17} color={C.primary} />
              <Text style={st.todayText}>Today</Text>
            </Touchable>
          </View>
          <CalendarBoard
            ym={ym}
            onChangeYm={setYm}
            selected={selected}
            onSelect={(iso) => {
              setSelected(iso);
              const d = parseISO(iso);
              if (d.getMonth() !== ym.m || d.getFullYear() !== ym.y) setYm({ y: d.getFullYear(), m: d.getMonth() });
            }}
          />

          <Animated.View key={selected} entering={FadeIn.duration(180)} style={st.dayBlock}>
            <DayDetail
              iso={selected}
              onBook={(slot) => router.push({ pathname: '/booking/new', params: { date: selected, slot } })}
              onOpenBooking={(b) => openBooking(b.id)}
            />
            <DayActions iso={selected} />
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

/** Photo's left edge inside a w×h box: sweeps out from the top and opens toward the bottom. */
const photoEdge = (w: number, h: number) => `M${w * 0.26} 0C${w * 0.04} ${h * 0.3} ${w * 0.3} ${h * 0.7} ${w * 0.44} ${h}`;

function BrandHeader({ topInset }: { topInset: number }) {
  const { hall, bookings } = useStore();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const today = todayISO();
  const hasUpcoming = bookings.some((b) => b.status !== 'cancelled' && b.date >= today);
  const pw = size.w * 0.62;
  const edge = photoEdge(pw, size.h);

  return (
    <View
      style={[st.header, { paddingTop: topInset + 14 }]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {size.w > 0 ? (
        <View style={[st.photo, { width: pw, height: size.h }]} pointerEvents="none">
          <Svg width={pw} height={size.h}>
            <Defs>
              <ClipPath id="calHeaderClip">
                <Path d={`${edge}L${pw} ${size.h}L${pw} 0Z`} />
              </ClipPath>
              <LinearGradient id="calHeaderShade" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0.2" stopColor={C.primaryDark} stopOpacity={0.55} />
                <Stop offset="0.5" stopColor={C.primaryDark} stopOpacity={0} />
                <Stop offset="0.72" stopColor={C.primaryDark} stopOpacity={0.35} />
                <Stop offset="1" stopColor={C.primaryDark} stopOpacity={0.9} />
              </LinearGradient>
            </Defs>
            <SvgImage
              href={VENUE}
              width={pw}
              height={size.h}
              preserveAspectRatio="xMidYMid slice"
              clipPath="url(#calHeaderClip)"
            />
            <Rect width={pw} height={size.h} fill="url(#calHeaderShade)" clipPath="url(#calHeaderClip)" />
            <Path d={edge} fill="none" stroke={C.accentOnPrimary} strokeOpacity={0.6} strokeWidth={1.5} />
          </Svg>
        </View>
      ) : null}

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
        <Text style={st.motto}>Celebrate Beautiful Beginnings</Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <View style={st.headerIcons}>
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
        <Text style={st.quote}>
          “Great Events{'\n'}Create Lasting{'\n'}— Memories”
        </Text>
      </View>
    </View>
  );
}

function DayActions({ iso }: { iso: string }) {
  const { bookingsOn, segmentState, blockedDays, toggleBlock } = useStore();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const list = bookingsOn(iso);
  const blocked = blockedDays.includes(iso);
  const anyFree = Object.values(segmentState(iso)).some((s) => s === 'free');

  return (
    <>
      <View style={st.actions}>
        <Touchable
          onPress={() => router.push({ pathname: '/booking/new', params: { date: iso } })}
          disabled={blocked || !anyFree}
          accessibilityRole="button"
          style={[st.actionBtn, st.addBtn]}>
          <BrandGradient id="addBookingGrad" from={C.gradientTo} to={C.primaryDark} />
          <Ionicons name="add" size={22} color={C.onPrimary} />
          <Text style={[st.actionText, { color: C.onPrimary }]}>Add Booking</Text>
        </Touchable>
        <Touchable
          onPress={() => (blocked ? (toggleBlock(iso), toast('Date unblocked')) : setConfirm(true))}
          accessibilityRole="button"
          style={[st.actionBtn, st.blockBtn]}>
          <Ionicons name={blocked ? 'lock-open-outline' : 'lock-closed-outline'} size={19} color={C.primary} />
          <Text style={[st.actionText, { color: C.primary }]}>{blocked ? 'Unblock' : 'Block Date'}</Text>
        </Touchable>
      </View>

      <ConfirmDialog
        visible={confirm}
        title="Block this date?"
        message={
          list.length > 0
            ? `${fmtFull(iso)} will be unavailable for new bookings. Its ${list.length} existing booking${list.length > 1 ? 's stay' : ' stays'} as is.`
            : `${fmtFull(iso)} will be unavailable for new bookings.`
        }
        confirmLabel="Block date"
        onConfirm={() => {
          toggleBlock(iso);
          setConfirm(false);
          toast('Date blocked');
        }}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 14, paddingBottom: 24 },
  floral: { position: 'absolute' },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.primary,
    marginHorizontal: -14,
    marginBottom: -30,
    paddingHorizontal: 22,
    paddingBottom: 44,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  photo: { position: 'absolute', right: 0, top: 0 },
  brand: { fontFamily: F.serifBold, fontSize: 38, lineHeight: 42, color: C.onPrimary },
  hallRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 1, alignSelf: 'flex-start' },
  hallName: { fontFamily: F.serifSemibold, fontSize: 17, color: C.onPrimary, flexShrink: 1 },
  motto: {
    fontFamily: F.medium,
    fontSize: 9.5,
    letterSpacing: 1.9,
    color: C.accentOnPrimary,
    marginTop: 7,
  },
  headerIcons: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  quote: {
    fontFamily: F.serifItalic,
    fontSize: 13.5,
    lineHeight: 15,
    color: C.accentOnPrimary,
    textAlign: 'right',
    marginTop: 8,
  },

  /** One ivory sheet holding the title, month board, selected day and actions. */
  card: {
    backgroundColor: '#FFFCF9',
    borderRadius: 22,
    paddingHorizontal: 5,
    paddingTop: 10,
    paddingBottom: 10,
    ...elevation,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingLeft: 20, paddingRight: 4 },
  title: { fontFamily: F.serifBold, fontSize: 33, lineHeight: 36, color: C.primary },
  subtitle: { fontFamily: F.regular, fontSize: 10.5, letterSpacing: 1.4, color: C.textSecondary, marginTop: -1 },
  flourish: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingHorizontal: 6 },
  flourishLine: { flex: 1, maxWidth: 30, height: 1, backgroundColor: C.accent },
  flourishDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: C.accent },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 11,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: '#EFE7E0',
    ...elevation,
  },
  todayText: { fontFamily: F.semibold, fontSize: 12.5, color: C.primary },

  dayBlock: { gap: 8, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    height: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  addBtn: { flex: 1.7, ...elevation },
  blockBtn: { flex: 1, backgroundColor: C.surface, borderWidth: 1.2, borderColor: C.primary },
  actionText: { fontFamily: F.semibold, fontSize: 14, color: C.primary },
});
