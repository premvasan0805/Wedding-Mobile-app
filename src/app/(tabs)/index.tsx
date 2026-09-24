import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { ClipPath, Defs, Image as SvgImage, Path } from 'react-native-svg';

import { openBooking } from '@/components/cards';
import { currentYM, shiftMonth } from '@/components/calendar';
import { BrandGradient, Lotus, Mandala } from '@/components/decor';
import { EmptyState, Screen, Touchable, type IconName } from '@/components/primitives';
import { fmtClock, fmtLong, greeting, initials, inr, inrShort, MONTHS, parseISO, todayISO } from '@/lib/format';
import { balanceOf, payState, SLOT_LABEL, useStore, type Booking, type Segment } from '@/lib/store';
import { appWidth, C, elevation, F } from '@/lib/theme';

const VENUE = require('../../../assets/images/home/venue.png');

/** Home is laid out on the 903px-wide design reference; `u(px)` converts a reference pixel to dp. */
const REF_WIDTH = 903;

/**
 * Hero card outline in reference px (833×194): full height on the left, then an S-curve
 * steps the top edge down 66px so more of the venue photo shows on the right.
 */
const HERO_SHAPE =
  'M0 30Q0 0 30 0L487 0C558 0 558 66 629 66L803 66Q833 66 833 96L833 164Q833 194 803 194L30 194Q0 194 0 164Z';

/** True when a point (hero-local reference px) is on or below the hero's curved top edge. */
function inHeroShape(x: number, y: number) {
  if (x < 0 || x > 833 || y > 194) return false;
  if (x <= 487) return y >= 0;
  if (x >= 629) return y >= 66;
  // The S-curve's cubic has flat tangents at both ends, which smoothstep matches closely.
  const t = (x - 487) / 142;
  return y >= 66 * t * t * (3 - 2 * t);
}

/**
 * Venue photo outline in reference px (355×222): the left edge runs diagonally up from under the
 * hero card, then eases into a near-flat top so the tagline and header sit on plain background.
 */
const PHOTO_EDGE = 'M0 196L135 70Q190 20 260 15L355 8';
const PHOTO_SHAPE = `${PHOTO_EDGE}L355 222L0 222Z`;

type Trend = { text: string; dir: 'up' | 'down' | 'flat' };

function pctTrend(cur: number, prev: number): Trend {
  if (prev === 0) return cur > 0 ? { text: 'New this month', dir: 'up' } : { text: 'No change this month', dir: 'flat' };
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) return { text: 'No change this month', dir: 'flat' };
  return { text: `${pct > 0 ? '+' : ''}${pct}% this month`, dir: pct > 0 ? 'up' : 'down' };
}

function countTrend(cur: number, prev: number): Trend {
  const d = cur - prev;
  if (d === 0) return { text: 'No change this month', dir: 'flat' };
  return { text: `${d > 0 ? '+' : ''}${d} this month`, dir: d > 0 ? 'up' : 'down' };
}

function timeLabel(b: Booking, segs: Segment[]) {
  if (b.slot === 'full') return 'All Day';
  const key = b.slot === 'first' ? 'late' : b.slot === 'second' ? 'evening' : 'early';
  const s = segs.find((x) => x.key === key);
  return s ? `${fmtClock(s.start)} - ${fmtClock(s.end)}` : SLOT_LABEL[b.slot];
}

export default function HomeScreen() {
  const { hall, bookings, monthSummary, customerById, segments } = useStore();
  const { width } = useWindowDimensions();
  const u = (px: number) => (appWidth(width) / REF_WIDTH) * px;
  /** Font size from the reference, never below 11dp so small print stays readable. */
  const fs = (px: number) => Math.max(u(px), 11);
  const [heroPressed, setHeroPressed] = useState(false);

  const today = todayISO();
  const ym = currentYM();
  const prevYm = shiftMonth(ym, -1);
  const sum = monthSummary(ym.y, ym.m);
  const prev = monthSummary(prevYm.y, prevYm.m);

  const active = bookings.filter((b) => b.status !== 'cancelled');
  const todays = active.filter((b) => b.date === today);
  const upcoming = active.filter((b) => b.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const next = todays[0] ?? upcoming[0];

  const stats: { icon: IconName; value: string; label: string; tint: { fg: string; bg: string }; trend: Trend; onPress?: () => void }[] = [
    {
      icon: 'bar-chart',
      value: inrShort(sum.revenue),
      label: 'Revenue',
      tint: { fg: C.primary, bg: C.primarySoft },
      trend: pctTrend(sum.revenue, prev.revenue),
    },
    {
      icon: 'wallet',
      value: inrShort(sum.received),
      label: 'Received',
      tint: { fg: C.success, bg: C.successSoft },
      trend: pctTrend(sum.received, prev.received),
    },
    {
      icon: 'time-outline',
      value: inrShort(sum.due),
      label: 'Due',
      tint: { fg: C.accentText, bg: C.accentSoft },
      trend: pctTrend(sum.due, prev.due),
      onPress: () => router.push({ pathname: '/bookings', params: { filter: 'unpaid' } }),
    },
    {
      icon: 'people-outline',
      value: String(sum.count),
      label: 'Total Bookings',
      tint: { fg: C.primary, bg: C.primarySoft },
      trend: countTrend(sum.count, prev.count),
      onPress: () => router.push('/calendar'),
    },
  ];

  const openHero = () => (next ? openBooking(next.id) : router.push('/calendar'));

  return (
    <Screen
      tab
      onRefresh={() => new Promise((r) => setTimeout(r, 500))}
      contentStyle={{ paddingHorizontal: u(62), paddingTop: 0, gap: 0, flexGrow: 1 }}>
      {/* ---------- Greeting, tagline, venue photo and today's bookings ---------- */}
      <View style={{ height: u(442), marginHorizontal: -u(62) }}>
        <View style={{ position: 'absolute', left: -u(22), top: u(140) }} pointerEvents="none">
          <Lotus size={u(150)} color={C.accent} opacity={0.22} />
        </View>

        <View style={{ position: 'absolute', left: u(65), top: u(24), right: u(460) }}>
          <Text style={{ fontFamily: F.regular, fontSize: u(25), lineHeight: u(32), color: C.textSecondary }}>
            {greeting()},
          </Text>
          <Text
            style={{ fontFamily: F.serifBold, fontSize: u(54), lineHeight: u(62), color: C.text }}
            numberOfLines={1}>
            {hall.role}
          </Text>
          <Touchable
            onPress={() => router.push('/settings/hall')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: u(12), marginTop: u(6) }}
            accessibilityLabel="Hall details">
            <Ionicons name="business-outline" size={u(28)} color={C.primary} />
            <Text style={{ fontFamily: F.regular, fontSize: u(25), color: C.text, flexShrink: 1 }} numberOfLines={1}>
              {hall.name}
            </Text>
            <Ionicons name="chevron-forward" size={u(22)} color={C.text} />
          </Touchable>
        </View>

        {/* Venue photo bleeds off the right edge; the hero card overlaps its bottom, bell and avatar sit on top. */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: u(548), top: u(100), width: u(355), height: u(222), zIndex: 0 }}>
          <Svg width="100%" height="100%" viewBox="0 0 355 222">
            <Defs>
              <ClipPath id="venueClip">
                <Path d={PHOTO_SHAPE} />
              </ClipPath>
            </Defs>
            <SvgImage
              href={VENUE}
              width={355}
              height={222}
              preserveAspectRatio="xMinYMid slice"
              clipPath="url(#venueClip)"
            />
            <Path d={PHOTO_EDGE} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={5} />
          </Svg>
        </View>

        <View style={{ position: 'absolute', left: u(462), top: u(70), zIndex: 2 }} pointerEvents="none">
          <Text style={{ fontFamily: F.serif, fontSize: u(31), lineHeight: u(33), color: C.textSecondary }}>
            Make Every
          </Text>
          <Text style={{ fontFamily: F.serif, fontSize: u(31), lineHeight: u(33), color: C.accentText }}>
            Celebration{'\n'}Memorable
          </Text>
          <View style={{ width: u(44), height: u(3), backgroundColor: C.accent, marginTop: u(20) }} />
        </View>

        {/* Only the curved outline is tappable: touches are hit-tested against the curve; the content ignores them. */}
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel="Today's bookings"
          accessibilityActions={[{ name: 'activate' }]}
          onAccessibilityAction={openHero}
          onStartShouldSetResponder={(e) => inHeroShape(e.nativeEvent.locationX / u(1), e.nativeEvent.locationY / u(1))}
          onResponderGrant={() => setHeroPressed(true)}
          onResponderTerminate={() => setHeroPressed(false)}
          onResponderRelease={(e) => {
            setHeroPressed(false);
            if (inHeroShape(e.nativeEvent.locationX / u(1), e.nativeEvent.locationY / u(1))) openHero();
          }}
          style={[
            st.hero,
            { left: u(56), top: u(248), width: u(833), height: u(194) },
            heroPressed && { opacity: 0.82, transform: [{ scale: 0.985 }] },
          ]}>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <BrandGradient id="heroGrad" from={C.gradientFrom} to={C.gradientTo} viewBox="0 0 833 194" shape={HERO_SHAPE} />
          </View>
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={{ position: 'absolute', left: u(430), top: u(-40) }}>
              <Mandala size={u(230)} color={C.accentOnPrimary} opacity={0.13} />
            </View>
            <View style={{ position: 'absolute', left: u(40), top: u(30), flexDirection: 'row', alignItems: 'center', gap: u(22) }}>
              <MaterialCommunityIcons name="calendar-month-outline" size={u(40)} color={C.accentOnPrimary} />
              <Text style={{ fontFamily: F.serifBold, fontSize: u(31), lineHeight: u(38), color: C.accentOnPrimary }}>
                Today&apos;s Bookings
              </Text>
            </View>
            <Text
              style={{
                position: 'absolute',
                left: u(40),
                top: u(72),
                fontFamily: F.serifBold,
                fontSize: u(104),
                lineHeight: u(116),
                color: C.accentOnPrimary,
                fontVariant: ['lining-nums'],
              }}>
              {todays.length}
            </Text>
            <View style={{ position: 'absolute', left: u(140), top: u(92), width: u(470) }}>
              {todays.length > 0 ? (
                <>
                  <Text style={st.heroTitle(u)} numberOfLines={1}>
                    {todays[0].eventType} · {SLOT_LABEL[todays[0].slot]}
                  </Text>
                  <Text style={st.heroSub(u)} numberOfLines={1}>
                    {customerById(todays[0].customerId)?.name ?? ''} · {fmtLong(today)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={st.heroTitle(u)} numberOfLines={1}>
                    No events today
                  </Text>
                  <Text style={st.heroSub(u)} numberOfLines={1}>
                    {next ? `Next: ${customerById(next.customerId)?.name ?? ''} · ${fmtLong(next.date)}` : fmtLong(today)}
                  </Text>
                </>
              )}
            </View>
            <View
              style={{
                position: 'absolute',
                left: u(640),
                top: u(106),
                width: u(160),
                height: u(62),
                borderRadius: u(31),
                borderWidth: 1,
                borderColor: 'rgba(255,240,210,0.9)',
                overflow: 'hidden',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: u(14),
                ...elevation,
              }}>
              <BrandGradient id="heroViewGrad" from="#FCEFD3" to="#E8C88C" />
              <Text style={{ fontFamily: F.semibold, fontSize: u(26), color: C.primary }}>View</Text>
              <Ionicons name="arrow-forward" size={u(26)} color={C.primary} />
            </View>
          </View>
        </View>

        <Touchable
          onPress={() => router.push('/settings/notifications')}
          accessibilityLabel="Notifications"
          style={{
            position: 'absolute',
            left: u(686),
            top: u(26),
            width: u(58),
            height: u(58),
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
          }}>
          <Ionicons name="notifications-outline" size={u(44)} color={C.text} />
          {upcoming.length > 0 ? (
            <View
              style={{
                position: 'absolute',
                top: u(6),
                right: u(8),
                width: u(15),
                height: u(15),
                borderRadius: u(8),
                backgroundColor: C.danger,
              }}
            />
          ) : null}
        </Touchable>
        <Touchable
          onPress={() => router.push('/more')}
          accessibilityLabel="Profile"
          style={{
            position: 'absolute',
            left: u(769),
            top: u(18),
            width: u(74),
            height: u(74),
            borderRadius: u(37),
            backgroundColor: C.primaryTint,
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
          }}>
          <Text style={{ fontFamily: F.semibold, fontSize: u(32), color: C.primary }}>{initials(hall.role)}</Text>
        </Touchable>
      </View>

      {/* ---------- This month ---------- */}
      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: u(16), rowGap: u(14), marginTop: u(22) }}
        accessibilityLabel={`${MONTHS[ym.m]} overview`}>
        {stats.map((s) => (
          <Touchable
            key={s.label}
            onPress={s.onPress}
            accessibilityRole={s.onPress ? 'button' : 'summary'}
            style={[
              st.card,
              {
                width: (appWidth(width) - u(62) * 2 - u(16)) / 2,
                height: u(152),
                borderRadius: u(22),
                paddingLeft: u(23),
                gap: u(32),
              },
            ]}>
            <View
              style={{
                width: u(93),
                height: u(93),
                borderRadius: u(22),
                backgroundColor: s.tint.bg,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name={s.icon} size={u(44)} color={s.tint.fg} />
            </View>
            <MiniBars color={s.tint.fg} u={u} />
            <View style={{ flex: 1, paddingRight: u(12) }}>
              <Text
                style={{ fontFamily: F.bold, fontSize: u(34), lineHeight: u(42), color: C.text }}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {s.value}
              </Text>
              <Text style={{ fontFamily: F.regular, fontSize: fs(23), color: C.textSecondary, marginTop: u(2) }} numberOfLines={1}>
                {s.label}
              </Text>
              <TrendLine trend={s.trend} u={u} fs={fs} />
            </View>
          </Touchable>
        ))}
      </View>

      {/* ---------- Upcoming events ---------- */}
      <View style={[st.sectionRow, { marginTop: u(36), marginBottom: u(20) }]}>
        <Text style={{ fontFamily: F.serifBold, fontSize: u(42), lineHeight: u(50), color: C.text }}>Upcoming Events</Text>
        {upcoming.length ? (
          <Touchable
            onPress={() => router.push({ pathname: '/bookings', params: { filter: 'upcoming' } })}
            style={{ flexDirection: 'row', alignItems: 'center', gap: u(6), paddingVertical: u(8) }}>
            <Text style={{ fontFamily: F.semibold, fontSize: u(24), color: C.primary }}>See all</Text>
            <Ionicons name="arrow-forward" size={u(24)} color={C.primary} />
          </Touchable>
        ) : null}
      </View>
      {upcoming.length === 0 ? (
        <EmptyState icon="calendar-outline" title="No upcoming events" message="New bookings will appear here." />
      ) : (
        <View style={{ gap: u(16) }}>
          {upcoming.slice(0, 5).map((b) => (
            <EventRow
              key={b.id}
              booking={b}
              name={customerById(b.customerId)?.name ?? 'Unknown customer'}
              time={timeLabel(b, segments)}
              hall={hall.name}
              u={u}
              fs={fs}
            />
          ))}
        </View>
      )}

      {/* ---------- Add booking — pinned above the tab bar when content is shorter than the screen ---------- */}
      <View style={{ flexGrow: 1, minHeight: u(30) }} />
      <Touchable
        accessibilityRole="button"
        onPress={() => router.push('/booking/new')}
        style={[st.cta, { height: u(103), borderRadius: u(24), gap: u(22) }]}>
        <BrandGradient id="ctaGrad" from={C.gradientFrom} to={C.gradientTo} />
        <View style={{ position: 'absolute', left: u(610), top: u(-10)  }} pointerEvents="none">
          <Mandala size={u(170)} color={C.accentOnPrimary} opacity={0.2} />
        </View>
        <Ionicons name="add" size={u(46)} color={C.onPrimary} />
        <Text style={{ fontFamily: F.serifBold, fontSize: u(38), color: C.onPrimary }}>Add Booking</Text>
      </Touchable>
    </Screen>
  );
}

/** Three faint ascending bars tucked into a stat card's right side. */
function MiniBars({ color, u }: { color: string; u: (n: number) => number }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', right: u(24), top: u(44), flexDirection: 'row', alignItems: 'flex-end', gap: u(6), opacity: 0.22 }}>
      {[26, 40, 56].map((h) => (
        <View key={h} style={{ width: u(14), height: u(h), borderRadius: u(5), backgroundColor: color }} />
      ))}
    </View>
  );
}

function TrendLine({ trend, u, fs }: { trend: Trend; u: (n: number) => number; fs: (n: number) => number }) {
  const color = trend.dir === 'up' ? C.success : trend.dir === 'down' ? C.danger : C.textMuted;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(6), marginTop: u(8) }}>
      {trend.dir !== 'flat' ? (
        <Ionicons name={trend.dir === 'up' ? 'arrow-up' : 'arrow-down'} size={fs(20)} color={color} />
      ) : null}
      <Text style={{ fontFamily: F.regular, fontSize: fs(19), color, flexShrink: 1 }} numberOfLines={1}>
        {trend.text}
      </Text>
    </View>
  );
}

function EventRow({
  booking,
  name,
  time,
  hall,
  u,
  fs,
}: {
  booking: Booking;
  name: string;
  time: string;
  hall: string;
  u: (n: number) => number;
  fs: (n: number) => number;
}) {
  const d = parseISO(booking.date);
  const marriage = booking.eventType === 'Wedding' || booking.eventType === 'Reception';
  const block = marriage ? { bg: C.primarySoft, fg: C.primary } : { bg: C.accentSoft, fg: C.accentText };
  const pay = payState(booking);
  const badge =
    pay === 'paid'
      ? { label: 'PAID', bg: C.successSoft, fg: C.success }
      : pay === 'due'
        ? { label: `DUE ${inr(balanceOf(booking))}`, bg: C.accentSoft, fg: C.accentText }
        : { label: 'UNPAID', bg: C.primaryTint, fg: C.primary };

  return (
    <Touchable
      onPress={() => openBooking(booking.id)}
      accessibilityLabel={`${name}, ${booking.eventType}, ${inr(booking.total)}, ${badge.label}`}
      style={[st.card, { minHeight: u(144), borderRadius: u(22), paddingLeft: u(20), paddingRight: u(18), gap: u(24) }]}>
      <View
        style={{
          width: u(98),
          height: u(106),
          borderRadius: u(18),
          backgroundColor: block.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ fontFamily: F.serifBold, fontSize: u(46), lineHeight: u(50), color: block.fg, fontVariant: ['lining-nums'] }}>
          {String(d.getDate()).padStart(2, '0')}
        </Text>
        <Text style={{ fontFamily: F.medium, fontSize: fs(22), color: block.fg, letterSpacing: 0.5 }}>
          {MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1, paddingVertical: u(16) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(10) }}>
          <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: u(27), lineHeight: u(36), color: C.text }} numberOfLines={1}>
            {name}
          </Text>
          <Text style={{ fontFamily: F.bold, fontSize: u(27), lineHeight: u(36), color: C.text }}>
            {inr(booking.total)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: u(10), marginTop: u(2) }}>
          <Text style={{ flex: 1, fontFamily: F.regular, fontSize: fs(23), color: C.textSecondary }} numberOfLines={1}>
            {booking.eventType} · {SLOT_LABEL[booking.slot]}
          </Text>
          <View style={{ backgroundColor: badge.bg, borderRadius: u(20), paddingHorizontal: u(18), paddingVertical: u(6) }}>
            <Text style={{ fontFamily: F.bold, fontSize: fs(19), color: badge.fg, letterSpacing: 0.3 }}>{badge.label}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: u(10), gap: u(10) }}>
          <Ionicons name="time-outline" size={fs(22)} color={C.primary} />
          <Text style={[st.meta(fs), { flexShrink: 0 }]} numberOfLines={1}>
            {time}
          </Text>
          <Ionicons name="location" size={fs(22)} color={C.primary} style={{ marginLeft: u(18) }} />
          <Text style={[st.meta(fs), { flexShrink: 1 }]} numberOfLines={1}>
            {hall}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={u(28)} color={C.textMuted} />
    </Touchable>
  );
}

const st = {
  ...StyleSheet.create({
    hero: { position: 'absolute', overflow: 'hidden', zIndex: 1 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.surface,
      ...elevation,
    },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  }),
  heroTitle: (u: (n: number) => number) => ({ fontFamily: F.semibold, fontSize: u(31), lineHeight: u(40), color: C.onPrimary }),
  heroSub: (u: (n: number) => number) => ({
    fontFamily: F.regular,
    fontSize: Math.max(u(24), 11),
    color: C.onPrimarySoft,
    marginTop: u(6),
  }),
  meta: (u: (n: number) => number) => ({ fontFamily: F.regular, fontSize: u(21), color: C.textSecondary }),
};
