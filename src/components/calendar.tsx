import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconButton, Touchable } from '@/components/primitives';
import { BottomSheet } from '@/components/overlays';
import { MONTHS, parseISO, toISO, todayISO } from '@/lib/format';
import { useStore, type DateType } from '@/lib/store';
import { C, D, F, radius, S, T } from '@/lib/theme';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export type YM = { y: number; m: number };

export function shiftMonth({ y, m }: YM, d: number): YM {
  const nm = m + d;
  return { y: y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
}

export function currentYM(): YM {
  const t = parseISO(todayISO());
  return { y: t.getFullYear(), m: t.getMonth() };
}

/** Availability of a day summarised for the calendar dot. */
export type DayAvailability = 'free' | 'partial' | 'booked' | 'tentative' | 'blocked';

export function useDayAvailability() {
  const { segmentState } = useStore();
  return (iso: string, excludeId?: string): DayAvailability => {
    const s = Object.values(segmentState(iso, excludeId));
    if (s.every((x) => x === 'blocked')) return 'blocked';
    if (s.every((x) => x === 'free')) return 'free';
    if (s.every((x) => x === 'booked')) return 'booked';
    if (s.some((x) => x === 'booked')) return 'partial';
    return 'tentative';
  };
}

const DOT: Record<Exclude<DayAvailability, 'free'>, string> = {
  booked: S.booked,
  partial: S.partial,
  tentative: S.tentative,
  blocked: S.blocked,
};

const KIND_BG: Record<DateType, string> = {
  muhurtham: D.muhurtham.bg,
  valarpirai: D.valarpirai.bg,
  special: D.special.bg,
  holiday: D.holiday.bg,
};

export function MonthHeader({ ym, onChange }: { ym: YM; onChange: (v: YM) => void }) {
  const [picker, setPicker] = useState(false);
  return (
    <View style={st.monthRow}>
      <IconButton icon="chevron-back" size={40} onPress={() => onChange(shiftMonth(ym, -1))} accessibilityLabel="Previous month" />
      <Touchable style={st.monthTitle} onPress={() => setPicker(true)} accessibilityLabel="Choose month">
        <Text style={[T.section, { fontSize: 18 }]}>
          {MONTHS[ym.m]} {ym.y}
        </Text>
        <Ionicons name="chevron-down" size={16} color={C.textSecondary} />
      </Touchable>
      <IconButton icon="chevron-forward" size={40} onPress={() => onChange(shiftMonth(ym, 1))} accessibilityLabel="Next month" />
      <MonthPicker
        key={String(picker)}
        visible={picker}
        value={ym}
        onClose={() => setPicker(false)}
        onPick={(v) => {
          onChange(v);
          setPicker(false);
        }}
      />
    </View>
  );
}

/**
 * Month grid. `overview` shows date-category tint + availability dots; `pick` is used in forms
 * and greys out dates the caller marks as disabled.
 */
export function CalendarGrid({
  ym,
  selected,
  onSelect,
  isDisabled,
  showIndicators = true,
  excludeId,
}: {
  ym: YM;
  selected?: string | null;
  onSelect: (iso: string) => void;
  isDisabled?: (iso: string) => boolean;
  showIndicators?: boolean;
  excludeId?: string;
}) {
  const { typesFor } = useStore();
  const availability = useDayAvailability();
  const today = todayISO();

  const lead = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7;
  const days = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(lead).fill(null),
    ...Array.from({ length: days }, (_, i) => toISO(new Date(ym.y, ym.m, i + 1))),
  ];
  while (cells.length % 7) cells.push(null);

  return (
    <View>
      <View style={st.row}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={st.weekday}>
            {w}
          </Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={st.row}>
          {cells.slice(r * 7, r * 7 + 7).map((iso, i) => {
            if (!iso) return <View key={i} style={st.cell} />;
            const types = typesFor(iso);
            const kind: DateType | null = types.includes('muhurtham')
              ? 'muhurtham'
              : types.includes('special')
                ? 'special'
                : types.includes('valarpirai')
                  ? 'valarpirai'
                  : types.includes('holiday')
                    ? 'holiday'
                    : null;
            const avail = showIndicators ? availability(iso, excludeId) : 'free';
            const disabled = isDisabled?.(iso) ?? false;
            const isSel = selected === iso;
            const isToday = iso === today;
            return (
              <Touchable
                key={iso}
                style={st.cell}
                disabled={disabled}
                onPress={() => onSelect(iso)}
                accessibilityLabel={iso}>
                <View
                  style={[
                    st.day,
                    kind && showIndicators && { backgroundColor: KIND_BG[kind] },
                    isToday && !isSel && st.today,
                    isSel && { backgroundColor: C.primary },
                  ]}>
                  <Text
                    style={[
                      st.dayText,
                      kind === 'muhurtham' && showIndicators && { color: D.muhurtham.fg, fontFamily: F.semibold },
                      avail === 'blocked' && st.strike,
                      isSel && { color: C.onPrimary, fontFamily: F.semibold },
                    ]}>
                    {parseISO(iso).getDate()}
                  </Text>
                </View>
                <View style={[st.dot, avail !== 'free' && { backgroundColor: DOT[avail] }]} />
              </Touchable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function CalendarLegend() {
  const tints = [
    { c: D.muhurtham.bg, l: 'Muhurtham', square: true },
    { c: D.valarpirai.bg, l: 'Valarpirai', square: true },
    { c: D.special.bg, l: 'Special', square: true },
    { c: S.booked, l: 'Booked' },
    { c: S.partial, l: 'Partly booked' },
    { c: S.tentative, l: 'Tentative' },
    { c: S.blocked, l: 'Blocked' },
  ];
  return (
    <View style={st.legend}>
      {tints.map((t) => (
        <View key={t.l} style={st.legendItem}>
          <View
            style={
              t.square
                ? { width: 12, height: 12, borderRadius: 4, backgroundColor: t.c, borderWidth: 1, borderColor: C.border }
                : { width: 7, height: 7, borderRadius: 4, backgroundColor: t.c }
            }
          />
          <Text style={T.caption}>{t.l}</Text>
        </View>
      ))}
    </View>
  );
}

export function MonthPicker({
  visible,
  value,
  onClose,
  onPick,
}: {
  visible: boolean;
  value: YM;
  onClose: () => void;
  onPick: (v: YM) => void;
}) {
  const [year, setYear] = useState(value.y);
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Choose month">
      <View style={st.pickerYear}>
        <IconButton icon="chevron-back" size={40} onPress={() => setYear((y) => y - 1)} />
        <Text style={T.section}>{year}</Text>
        <IconButton icon="chevron-forward" size={40} onPress={() => setYear((y) => y + 1)} />
      </View>
      <View style={st.monthGrid}>
        {MONTHS.map((name, i) => {
          const on = year === value.y && i === value.m;
          return (
            <Touchable
              key={name}
              onPress={() => onPick({ y: year, m: i })}
              style={[st.monthCell, on && { backgroundColor: C.primary, borderColor: C.primary }]}>
              <Text style={[T.bodyMedium, on && { color: C.onPrimary }]}>{name.slice(0, 3)}</Text>
            </Touchable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const st = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthTitle: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 8 },
  row: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontFamily: F.medium,
    fontSize: 12,
    color: C.textMuted,
    paddingVertical: 8,
  },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 3, minHeight: 50 },
  day: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: { borderWidth: 1.5, borderColor: C.primary },
  dayText: { fontFamily: F.medium, fontSize: 15, color: C.text },
  strike: { textDecorationLine: 'line-through', color: C.textMuted },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 3 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 8, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pickerYear: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  monthCell: {
    width: '30%',
    flexGrow: 1,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
