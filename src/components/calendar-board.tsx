import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { MonthPicker, shiftMonth, type YM } from '@/components/calendar';
import { BrandGradient } from '@/components/decor';
import { Touchable } from '@/components/primitives';
import { fmtClock, fmtFull, inr, MONTHS, parseISO, toISO, todayISO } from '@/lib/format';
import {
  CATEGORY_LABEL,
  SLOT_SEGMENTS,
  useStore,
  type Booking,
  type SegmentKey,
  type SegState,
  type SlotKey,
} from '@/lib/store';
import { C, D, elevation, F, S } from '@/lib/theme';

/** Gold line-art wedding scene (mandapam, couple, priest, temples) for the foot of the date strip. */
const MANDAP_SCENE = require('../../assets/images/home/mandap-scene.png');

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** One dot per day segment (early / late / evening), in that order. */
const DOT: Record<SegState, string> = {
  free: S.vacant,
  booked: S.booked,
  tentative: S.tentative,
  blocked: S.blocked,
};

/** Day-cell tints. Priority: muhurtham > special > fully blocked > partly booked > weekend. */
const TINT = {
  muhurtham: '#FCF1DE',
  special: '#F1ECFA',
  blocked: '#ECF0F8',
  partly: '#FCEBEE',
  weekend: '#F3F1FB',
  outside: '#F8F5F1',
};
const SPECIAL_FG = '#7A2E9E';
const WEEKEND_FG = '#7065B8';
const PARTLY_DOT = '#F2A7BA';
const MOON_FG = '#6F93D6';
const LEAF_FG = '#3E9A5A';

/** Waxing (valarpirai) or waning (theipirai) moon phase for a date. */
export function lunarPhase(types: string[]) {
  return types.includes('valarpirai')
    ? { key: 'valarpirai' as const, label: 'Valarpirai' }
    : { key: 'theipirai' as const, label: 'Theipirai' };
}

/** The small mark before a date: special > weekend > moon phase. */
function DayMark({ special, weekend, waxing, light }: { special: boolean; weekend: boolean; waxing: boolean; light: boolean }) {
  if (special) return <MaterialCommunityIcons name="asterisk" size={10} color={light ? C.onPrimary : SPECIAL_FG} />;
  if (weekend)
    return <MaterialCommunityIcons name="calendar-month-outline" size={10} color={light ? C.onPrimary : WEEKEND_FG} />;
  if (waxing) return <Ionicons name="leaf-outline" size={10} color={light ? '#9FE0AE' : LEAF_FG} />;
  return <MaterialCommunityIcons name="moon-waning-crescent" size={10} color={light ? C.onPrimary : MOON_FG} />;
}

// ---------- Month board ----------

export function CalendarBoard({
  ym,
  onChangeYm,
  selected,
  onSelect,
}: {
  ym: YM;
  onChangeYm: (v: YM) => void;
  selected: string;
  onSelect: (iso: string) => void;
}) {
  const { typesFor, segmentState, segments } = useStore();
  const [picker, setPicker] = useState(false);
  const today = todayISO();

  // Leading/trailing days from the neighbouring months fill the first and last weeks.
  const lead = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7;
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const total = Math.ceil((lead + days) / 7) * 7;
  const cells = Array.from({ length: total }, (_, i) => new Date(ym.y, ym.m, i - lead + 1));

  return (
    <View>
      <View style={st.inner}>
        <View style={st.monthRow}>
          <NavButton icon="chevron-back" label="Previous month" onPress={() => onChangeYm(shiftMonth(ym, -1))} />
          <Touchable style={st.monthTitle} onPress={() => setPicker(true)} accessibilityLabel="Choose month">
            <Text style={st.monthText}>
              {MONTHS[ym.m]} {ym.y}
            </Text>
            <Ionicons name="chevron-down" size={15} color={C.primary} />
          </Touchable>
          <NavButton icon="chevron-forward" label="Next month" onPress={() => onChangeYm(shiftMonth(ym, 1))} />
        </View>

        <View style={st.row}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={st.weekday}>
              {w}
            </Text>
          ))}
        </View>

        <View style={{ gap: 7 }}>
          {Array.from({ length: total / 7 }, (_, r) => (
            <View key={r} style={st.row}>
              {cells.slice(r * 7, r * 7 + 7).map((date, i) => {
                const iso = toISO(date);
                if (date.getMonth() !== ym.m) {
                  return (
                    <Touchable
                      key={iso}
                      onPress={() => onSelect(iso)}
                      accessibilityLabel={fmtFull(iso)}
                      style={[st.cell, st.cellOutside]}>
                      <Text style={st.numOutside}>{date.getDate()}</Text>
                    </Touchable>
                  );
                }
                const types = typesFor(iso);
                const seg = segmentState(iso);
                const states = segments.map((s) => seg[s.key]);
                const muhurtham = types.includes('muhurtham');
                const special = types.includes('special');
                const weekend = i >= 5;
                const allBlocked = states.every((s) => s === 'blocked');
                const partly = states.some((s) => s === 'booked' || s === 'tentative') && states.includes('free');
                const tint = muhurtham
                  ? TINT.muhurtham
                  : special
                    ? TINT.special
                    : allBlocked
                      ? TINT.blocked
                      : partly
                        ? TINT.partly
                        : weekend
                          ? TINT.weekend
                          : C.surface;
                const isSel = iso === selected;
                const isToday = iso === today;
                return (
                  <Touchable
                    key={iso}
                    onPress={() => onSelect(iso)}
                    accessibilityLabel={fmtFull(iso)}
                    accessibilityState={{ selected: isSel }}
                    style={[
                      st.cell,
                      { backgroundColor: tint },
                      tint === C.surface && st.cellPlain,
                      isToday && !isSel && st.cellToday,
                      isSel && st.cellSelected,
                    ]}>
                    {isSel ? (
                      <>
                        <BrandGradient id={`sel-${iso}`} from={C.gradientTo} to={C.primaryDark} />
                        <View style={st.selRing} pointerEvents="none" />
                      </>
                    ) : null}
                    <View style={st.mark} pointerEvents="none">
                      <DayMark special={special} weekend={weekend} waxing={types.includes('valarpirai')} light={isSel} />
                    </View>
                    {muhurtham ? (
                      <Ionicons name="star" size={12} color={isSel ? '#F2CF8A' : C.accent} style={st.star} />
                    ) : null}
                    <Text style={[st.num, isSel && { color: C.onPrimary }]}>{date.getDate()}</Text>
                    <View style={st.dots}>
                      {states.map((s, k) => (
                        <View key={k} style={[st.dot, { backgroundColor: DOT[s] }]} />
                      ))}
                    </View>
                  </Touchable>
                );
              })}
            </View>
          ))}
        </View>

        <Legend />
      </View>

      <MonthPicker
        key={String(picker)}
        visible={picker}
        value={ym}
        onClose={() => setPicker(false)}
        onPick={(v) => {
          onChangeYm(v);
          setPicker(false);
        }}
      />
    </View>
  );
}

function NavButton({ icon, label, onPress }: { icon: 'chevron-back' | 'chevron-forward'; label: string; onPress: () => void }) {
  return (
    <Touchable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={st.nav}>
      <Ionicons name={icon} size={18} color={C.primary} />
    </Touchable>
  );
}

function Legend() {
  const marks: { label: string; icon: ReactNode }[] = [
    { label: 'Muhurtham', icon: <Ionicons name="star" size={14} color={C.accent} /> },
    { label: 'Valarpirai', icon: <Ionicons name="leaf-outline" size={14} color={LEAF_FG} /> },
    { label: 'Theipirai', icon: <MaterialCommunityIcons name="moon-waning-crescent" size={14} color={MOON_FG} /> },
    { label: 'Special', icon: <MaterialCommunityIcons name="asterisk" size={14} color={SPECIAL_FG} /> },
    { label: 'Weekend', icon: <MaterialCommunityIcons name="calendar-month-outline" size={15} color={C.primary} /> },
  ];
  const dots = [
    { label: 'Vacant', color: S.vacant },
    { label: 'Booked', color: S.booked },
    { label: 'Tentative', color: S.tentative },
    { label: 'Blocked', color: S.blocked },
    { label: 'Partly Booked', color: PARTLY_DOT },
  ];
  return (
    <View style={st.legend}>
      <View style={st.legendRow}>
        {marks.map((m) => (
          <View key={m.label} style={st.legendItem}>
            {m.icon}
            <Text style={st.legendText}>{m.label}</Text>
          </View>
        ))}
      </View>
      <View style={st.legendRule} />
      <View style={st.legendRow}>
        {dots.map((d) => (
          <View key={d.label} style={st.legendItem}>
            <View style={[st.legendDot, { backgroundColor: d.color }]} />
            <Text style={st.legendText}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------- Selected day ----------

type SegIcon =
  | { lib: 'mci'; name: ComponentProps<typeof MaterialCommunityIcons>['name'] }
  | { lib: 'ion'; name: ComponentProps<typeof Ionicons>['name'] };

const SEG_ICON: Record<SegmentKey, SegIcon> = {
  early: { lib: 'mci', name: 'weather-sunset-up' },
  late: { lib: 'ion', name: 'sunny-outline' },
  evening: { lib: 'ion', name: 'moon-outline' },
};

/** The booking slot a segment's "Book" button starts. */
const SEG_SLOT: Record<SegmentKey, SlotKey> = { early: 'early', late: 'first', evening: 'second' };

const STATE_PILL: Record<SegState, { label: string; fg: string; bg: string }> = {
  free: { label: 'Vacant', fg: S.vacant, bg: S.vacantSoft },
  booked: { label: 'Booked', fg: S.booked, bg: S.bookedSoft },
  tentative: { label: 'Tentative', fg: S.tentativeText, bg: S.tentativeSoft },
  blocked: { label: 'Blocked', fg: S.blocked, bg: S.blockedSoft },
};

/**
 * Status pill and action sit side by side only when the slot label still gets ~100px;
 * narrower (most phones) they stack so the label and time stay readable.
 */
const INLINE_MIN_WIDTH = 250;

/** Grows the compact 28pt slot buttons to a 44pt touch target without changing their look. */
const BTN_SLOP = { top: 8, bottom: 8, left: 4, right: 4 };

export function DayDetail({
  iso,
  onBook,
  onOpenBooking,
}: {
  iso: string;
  onBook: (slot: SlotKey) => void;
  onOpenBooking: (b: Booking) => void;
}) {
  const { typesFor, segmentState, segments, categoryFor, priceFor, bookingsOn } = useStore();
  const [bodyWidth, setBodyWidth] = useState(0);
  const d = parseISO(iso);
  const types = typesFor(iso);
  const phase = lunarPhase(types);
  const waxing = phase.key === 'valarpirai';
  const seg = segmentState(iso);
  const list = bookingsOn(iso);
  const inline = bodyWidth >= INLINE_MIN_WIDTH;

  return (
    <View style={st.detail}>
      <View style={st.dateCol}>
        <BrandGradient id="dateColGrad" from={C.gradientTo} to={C.primaryDark} />
        <View style={st.dateArt} pointerEvents="none">
          <Image source={MANDAP_SCENE} style={st.dateArtImg} contentFit="contain" />
        </View>
        <Text style={st.dateNum}>{d.getDate()}</Text>
        <Text style={st.dateMonth}>
          {MONTHS[d.getMonth()].slice(0, 3).toUpperCase()} {d.getFullYear()}
        </Text>
        <Text style={st.dateWeekday}>{WEEKDAY_LONG[d.getDay()]}</Text>
        {waxing ? (
          <Ionicons name="leaf-outline" size={20} color="#8ED39C" style={{ marginTop: 8 }} />
        ) : (
          <MaterialCommunityIcons name="moon-waning-crescent" size={20} color="#A9C3EE" style={{ marginTop: 8 }} />
        )}
        <Text style={st.datePhase}>{phase.label}</Text>
      </View>

      <View style={st.detailBody} onLayout={(e) => setBodyWidth(e.nativeEvent.layout.width)}>
        <View style={st.detailHead}>
          <Text style={st.detailTitle}>{fmtFull(iso)}</Text>
          <View style={[st.chip, !waxing && { backgroundColor: D.theipirai.bg }]}>
            {waxing ? (
              <Ionicons name="leaf-outline" size={14} color={LEAF_FG} />
            ) : (
              <MaterialCommunityIcons name="moon-waning-crescent" size={14} color={MOON_FG} />
            )}
            <Text style={[st.chipText, !waxing && { color: D.theipirai.fg }]}>{phase.label}</Text>
          </View>
        </View>
        <View style={st.subRow}>
          <Text style={st.subText}>
            {list.length === 0 ? 'No bookings' : `${list.length} booking${list.length > 1 ? 's' : ''}`}
          </Text>
          <View style={st.rate}>
            <Text style={st.subText}>{CATEGORY_LABEL[categoryFor(iso)]} rate</Text>
            <Text style={st.rateValue}>{inr(priceFor(iso, 'full'))}</Text>
          </View>
        </View>
        {types.includes('muhurtham') || types.includes('special') ? (
          <View style={st.tagRow}>
            {types.includes('muhurtham') ? (
              <View style={[st.chip, { backgroundColor: D.muhurtham.bg }]}>
                <Ionicons name="star" size={12} color={C.accent} />
                <Text style={[st.chipText, { color: D.muhurtham.fg }]}>Muhurtham</Text>
              </View>
            ) : null}
            {types.includes('special') ? (
              <View style={[st.chip, { backgroundColor: TINT.special }]}>
                <MaterialCommunityIcons name="asterisk" size={12} color={SPECIAL_FG} />
                <Text style={[st.chipText, { color: SPECIAL_FG }]}>Special</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ gap: 5, marginTop: 8 }}>
          {segments.map((s) => {
            const state = seg[s.key];
            const pill = STATE_PILL[state];
            const slot = SEG_SLOT[s.key];
            const bookable = state === 'free' && SLOT_SEGMENTS[slot].every((k) => seg[k] === 'free');
            const booking = list.find((b) => SLOT_SEGMENTS[b.slot].includes(s.key));
            const icon = SEG_ICON[s.key];
            const action =
              state === 'free' ? (
                <Touchable
                  onPress={() => onBook(slot)}
                  disabled={!bookable}
                  accessibilityRole="button"
                  accessibilityLabel={`Book ${s.label}`}
                  hitSlop={BTN_SLOP}
                  style={[st.actBtn, inline && st.actBtnWide]}>
                  <Ionicons name="add" size={15} color={C.onPrimary} />
                  <Text style={st.actText}>Book</Text>
                </Touchable>
              ) : booking ? (
                <Touchable
                  onPress={() => onOpenBooking(booking)}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${s.label} booking`}
                  hitSlop={BTN_SLOP}
                  style={[st.actBtn, inline && st.actBtnWide, st.viewBtn]}>
                  <Text style={[st.actText, { color: C.primary }]}>View</Text>
                  <Ionicons name="chevron-forward" size={14} color={C.primary} />
                </Touchable>
              ) : inline ? (
                <View style={st.actBtnWide} />
              ) : null;
            return (
              <View key={s.key} style={st.slot}>
                <View style={st.slotIcon}>
                  {icon.lib === 'mci' ? (
                    <MaterialCommunityIcons name={icon.name} size={20} color={C.accent} />
                  ) : (
                    <Ionicons name={icon.name} size={19} color={C.accent} />
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={st.slotLabel} numberOfLines={1}>
                    {s.label}
                  </Text>
                  <Text style={st.slotTime} numberOfLines={1} adjustsFontSizeToFit>
                    {fmtClock(s.start)} – {fmtClock(s.end)}
                  </Text>
                </View>
                <View style={inline ? st.slotInline : st.slotStack}>
                  <View style={[st.pill, inline && st.pillWide, { backgroundColor: pill.bg }]}>
                    <Text style={[st.pillText, { color: pill.fg }]}>{pill.label}</Text>
                  </View>
                  {action}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  inner: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1E9E2',
    paddingHorizontal: 7,
    paddingTop: 8,
    paddingBottom: 8,
    ...elevation,
    shadowOpacity: 0.04,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 5 },
  nav: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: '#EFE7E0',
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation,
  },
  monthTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 8 },
  monthText: { fontFamily: F.serifBold, fontSize: 23, lineHeight: 28, color: C.text, fontVariant: ['lining-nums'] },
  row: { flexDirection: 'row', gap: 5 },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: F.regular,
    fontSize: 11,
    color: C.textSecondary,
    paddingBottom: 7,
  },
  /** Wider than tall, like the printed wall calendars halls keep at the desk. */
  cell: {
    flex: 1,
    height: 37,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    overflow: 'hidden',
  },
  cellPlain: {
    borderWidth: 1,
    borderColor: '#EEE5DE',
    shadowColor: '#57152C',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  cellOutside: { backgroundColor: TINT.outside },
  cellToday: { borderWidth: 1.5, borderColor: C.primary },
  cellSelected: {
    borderWidth: 1.5,
    borderColor: C.primaryDark,
    shadowColor: '#57152C',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  selRing: {
    position: 'absolute',
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  mark: { position: 'absolute', top: 6, left: 4 },
  num: { fontFamily: F.semibold, fontSize: 12.5, lineHeight: 15, color: C.text, paddingLeft: 3 },
  numOutside: { fontFamily: F.regular, fontSize: 12.5, color: '#CFC6BF' },
  star: { position: 'absolute', top: 3, right: 4 },
  dots: { flexDirection: 'row', gap: 3.5 },
  dot: { width: 5.5, height: 5.5, borderRadius: 3 },

  legend: { marginTop: 10, backgroundColor: '#F8F4EF', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 8 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 6, columnGap: 4 },
  legendRule: { height: 1, backgroundColor: '#ECE3DA', marginVertical: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { fontFamily: F.regular, fontSize: 10, color: C.text },
  legendDot: { width: 10, height: 10, borderRadius: 5 },

  detail: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    borderRadius: 14,
    overflow: 'hidden',
    ...elevation,
  },
  dateCol: {
    width: 84,
    backgroundColor: C.primary,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 64,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  dateArt: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  dateArtImg: { width: '100%', aspectRatio: 582 / 408 },
  dateNum: { fontFamily: F.serifBold, fontSize: 44, lineHeight: 48, color: C.onPrimary, fontVariant: ['lining-nums'] },
  dateMonth: { fontFamily: F.serifSemibold, fontSize: 14, color: C.onPrimary, fontVariant: ['lining-nums'] },
  dateWeekday: { fontFamily: F.serifSemibold, fontSize: 14, color: C.onPrimary, marginTop: 1 },
  datePhase: { fontFamily: F.serifSemibold, fontSize: 14, color: C.onPrimary, marginTop: 3 },
  detailBody: { flex: 1, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 8 },
  detailHead: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 6,
    rowGap: 4,
    paddingLeft: 4,
  },
  detailTitle: { fontFamily: F.serifBold, fontSize: 19, lineHeight: 23, color: C.text, fontVariant: ['lining-nums'] },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: S.vacantSoft,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  chipText: { fontFamily: F.medium, fontSize: 11.5, color: S.vacant },
  subRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    columnGap: 6,
    marginTop: 2,
    paddingLeft: 4,
  },
  subText: { fontFamily: F.regular, fontSize: 10.5, color: C.textSecondary },
  rate: { flexDirection: 'row', alignItems: 'baseline', gap: 5, marginLeft: 'auto' },
  rateValue: { fontFamily: F.bold, fontSize: 16, color: C.primary },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5, paddingLeft: 4 },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: '#FFFDFB',
    borderWidth: 1,
    borderColor: '#F2EBE4',
  },
  slotIcon: {
    width: 32,
    height: 32,
    borderRadius: 7,
    backgroundColor: '#FBF2E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabel: { fontFamily: F.semibold, fontSize: 12, color: C.text },
  slotTime: { fontFamily: F.regular, fontSize: 10, color: C.textSecondary, marginTop: 1 },
  slotInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotStack: { alignItems: 'stretch', gap: 5 },
  pill: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4, alignItems: 'center', justifyContent: 'center' },
  pillWide: { height: 25, minWidth: 48 },
  pillText: { fontFamily: F.medium, fontSize: 11.5 },
  actBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingHorizontal: 9,
    height: 28,
  },
  actBtnWide: { height: 28, minWidth: 58, borderRadius: 8 },
  viewBtn: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.primary },
  actText: { fontFamily: F.semibold, fontSize: 12, color: C.onPrimary },
});
