import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { ScrollView, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandButton, BrandCta, BrandFloral, BrandPageHeader, GOLD, GoldRule, type MciName } from '@/components/brand-page';
import { CalendarGrid, MonthHeader, type YM } from '@/components/calendar';
import { OrnamentRule } from '@/components/decor';
import { BottomSheet, ConfirmDialog, useToast } from '@/components/overlays';
import { EmptyState, Touchable } from '@/components/primitives';
import { DATE_TONE } from '@/components/status';
import { fmtFull, fmtLong, MONTHS, parseISO, toISO, todayISO } from '@/lib/format';
import { DATE_TYPE_META, useStore, type DateType, type ImportantDate } from '@/lib/store';
import { C, elevation, F, noOutline, radius, T } from '@/lib/theme';

type Filter = 'all' | DateType;
const TYPES = Object.keys(DATE_TYPE_META) as DateType[];
const FILTERS: Filter[] = ['all', ...TYPES];

const SHEET_FLORAL = require('../../../assets/images/customer/floral-top.png');

/** Chip icon per type; types without one show their colour dot. */
const TYPE_ICON: Partial<Record<DateType, MciName>> = {
  muhurtham: 'star-four-points',
  holiday: 'calendar-blank-outline',
};

/** Keeps only digits and inserts the dashes of YYYY-MM-DD as the user types. */
function maskISO(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)].filter(Boolean).join('-');
}

const isValidISO = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && toISO(parseISO(v)) === v;

/** Labelled input row: icon cell on the left, input filling the rest. */
function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={st.label}>{label}</Text>
      <View style={[st.field, !!error && { borderColor: C.danger }]}>{children}</View>
      {error ? <Text style={[T.caption, { color: C.danger }]}>{error}</Text> : null}
    </View>
  );
}

export default function ImportantDatesScreen() {
  const { importantDates, addImportantDate, removeImportantDate, typesFor } = useStore();
  const toast = useToast();
  const [year, setYear] = useState(parseISO(todayISO()).getFullYear());
  const [filter, setFilter] = useState<Filter>('all');
  const [adding, setAdding] = useState(false);
  const [toDelete, setToDelete] = useState<ImportantDate | null>(null);

  // Add-date sheet state
  const [pickYm, setPickYm] = useState<YM>({ y: year, m: parseISO(todayISO()).getMonth() });
  const [dateText, setDateText] = useState(todayISO());
  const [showCal, setShowCal] = useState(false);
  const [pickType, setPickType] = useState<DateType>('muhurtham');
  const [title, setTitle] = useState('');

  const items = importantDates
    .filter((d) => d.date.startsWith(String(year)) && (filter === 'all' || d.type === filter))
    .sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));
  const sections = MONTHS.map((title, m) => ({
    title,
    data: items.filter((d) => parseISO(d.date).getMonth() === m),
  })).filter((s) => s.data.length > 0);

  const pickDate = isValidISO(dateText) ? dateText : null;
  const dateError = dateText.length === 10 && !pickDate ? 'Enter a real date as YYYY-MM-DD.' : undefined;
  const alreadyExists = !!pickDate && typesFor(pickDate).includes(pickType);

  const openCalendar = () => {
    if (!showCal && pickDate) {
      const d = parseISO(pickDate);
      setPickYm({ y: d.getFullYear(), m: d.getMonth() });
    }
    setShowCal((v) => !v);
  };

  const save = () => {
    if (!pickDate || alreadyExists) return;
    addImportantDate(pickDate, pickType, title.trim());
    setYear(parseISO(pickDate).getFullYear());
    setAdding(false);
    toast(`${DATE_TYPE_META[pickType].label} added`);
  };

  return (
    <View style={st.screen}>
      <BrandFloral />
      <BrandPageHeader title="Important" accent="Dates" />

      <View style={st.top}>
        {/* Year switcher */}
        <View style={st.yearCard}>
          <Touchable
            onPress={() => setYear((y) => y - 1)}
            accessibilityRole="button"
            accessibilityLabel="Previous year"
            style={st.yearBtn}>
            <Ionicons name="chevron-back" size={18} color={C.primary} />
          </Touchable>
          <View style={st.yearMid}>
            <OrnamentRule width={52} color={GOLD} />
            <MaterialCommunityIcons name="calendar-blank-outline" size={20} color={C.primary} />
            <Text style={st.year}>{year}</Text>
            <OrnamentRule width={52} color={GOLD} />
          </View>
          <Touchable
            onPress={() => setYear((y) => y + 1)}
            accessibilityRole="button"
            accessibilityLabel="Next year"
            style={st.yearBtn}>
            <Ionicons name="chevron-forward" size={18} color={C.primary} />
          </Touchable>
        </View>

        {/* Type filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.filters}>
          {FILTERS.map((f) => {
            const on = filter === f;
            return (
              <Touchable
                key={f}
                onPress={() => setFilter(f)}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={[st.filter, on && st.filterOn]}>
                {f !== 'all' ? <View style={[st.dot, { backgroundColor: DATE_TONE[f].fg }]} /> : null}
                <Text style={[st.filterText, on && { color: C.onPrimary }]}>
                  {f === 'all' ? 'All' : DATE_TYPE_META[f].label}
                </Text>
              </Touchable>
            );
          })}
        </ScrollView>
      </View>

      <SectionList
        style={{ flex: 1 }}
        sections={sections}
        keyExtractor={(d) => d.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.list}
        ListEmptyComponent={
          <EmptyState icon="star-outline" title={`No important dates in ${year}`} message="Tap Add Date to create one." />
        }
        renderSectionHeader={({ section }) => (
          <View style={st.monthRow}>
            <Text style={st.month}>{section.title}</Text>
            <GoldRule maxWidth={80} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => {
          const d = parseISO(item.date);
          const tone = DATE_TONE[item.type];
          return (
            <View style={st.row}>
              <View style={[st.tile, { backgroundColor: tone.bg }]}>
                <Text style={st.tileDay}>{String(d.getDate()).padStart(2, '0')}</Text>
                <Text style={st.tileMonth}>{MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={st.rowDate}>{fmtLong(item.date)}</Text>
                <View style={st.typeRow}>
                  <View style={[st.dot, { backgroundColor: tone.fg }]} />
                  <Text style={[st.typeText, { color: tone.fg }]}>{DATE_TYPE_META[item.type].label}</Text>
                  {item.title ? (
                    <Text style={st.rowTitle} numberOfLines={1}>
                      · {item.title}
                    </Text>
                  ) : null}
                </View>
              </View>
              <Touchable
                onPress={() => setToDelete(item)}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${fmtLong(item.date)}`}
                hitSlop={6}
                style={st.trash}>
                <Ionicons name="trash-outline" size={18} color={C.primary} />
              </Touchable>
            </View>
          );
        }}
      />

      <BrandCta
        title="Add Date"
        icon="plus"
        onPress={() => {
          setDateText(todayISO());
          setShowCal(false);
          setPickType('muhurtham');
          setTitle('');
          setAdding(true);
        }}
      />

      <BottomSheet
        visible={adding}
        onClose={() => setAdding(false)}
        footer={
          <BrandButton
            title="Save"
            icon="content-save-outline"
            disabled={!pickDate || alreadyExists}
            onPress={save}
            style={st.save}
          />
        }>
        <Image source={SHEET_FLORAL} style={st.sheetFloral} contentFit="contain" pointerEvents="none" />

        <View style={st.sheetHead}>
          <View style={st.sheetIcon}>
            <MaterialCommunityIcons name="calendar-star" size={20} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={st.sheetTitle}>Add important date</Text>
            <Text style={st.sheetSub}>Mark special dates for easy reference.</Text>
          </View>
        </View>

        <Field label="Date (YYYY-MM-DD)" error={dateError}>
          <Touchable
            onPress={openCalendar}
            accessibilityRole="button"
            accessibilityLabel={showCal ? 'Hide calendar' : 'Pick from calendar'}
            style={[st.fieldIcon, showCal && { backgroundColor: C.primarySoft }]}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={18} color={C.primary} />
          </Touchable>
          <TextInput
            value={dateText}
            onChangeText={(v) => setDateText(maskISO(v))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={C.textMuted}
            keyboardType="number-pad"
            maxLength={10}
            accessibilityLabel="Date"
            style={st.fieldInput}
          />
        </Field>

        {showCal ? (
          <View style={st.pickCard}>
            <MonthHeader ym={pickYm} onChange={setPickYm} />
            <CalendarGrid
              ym={pickYm}
              selected={pickDate}
              onSelect={(iso) => {
                setDateText(iso);
                setShowCal(false);
              }}
              showIndicators={false}
            />
          </View>
        ) : null}

        <View style={{ gap: 6 }}>
          <Text style={st.label}>Date type</Text>
          <View style={st.types}>
            {TYPES.map((t) => {
              const on = pickType === t;
              const icon = TYPE_ICON[t];
              const tone = DATE_TONE[t];
              return (
                <Touchable
                  key={t}
                  onPress={() => setPickType(t)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={[st.type, on && st.typeOn]}>
                  {icon ? (
                    <MaterialCommunityIcons name={icon} size={15} color={t === 'muhurtham' ? C.accent : tone.fg} />
                  ) : (
                    <View style={[st.typeDot, { backgroundColor: tone.fg }]} />
                  )}
                  <Text style={[st.typeLabel, t === 'holiday' && { color: tone.fg }, on && { color: C.accentText }]}>
                    {DATE_TYPE_META[t].label}
                  </Text>
                </Touchable>
              );
            })}
          </View>
        </View>

        <Field label="Title (optional)">
          <View style={st.fieldIcon}>
            <Ionicons name="document-text-outline" size={17} color={C.textSecondary} />
          </View>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Thai Poosam, Pongal..."
            placeholderTextColor={C.textMuted}
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={save}
            accessibilityLabel="Title"
            style={st.fieldInput}
          />
        </Field>

        {alreadyExists ? (
          <View style={st.warn}>
            <Ionicons name="information-circle-outline" size={16} color={C.warning} />
            <Text style={[T.caption, { color: C.warning }]}>This date is already marked {DATE_TYPE_META[pickType].label}.</Text>
          </View>
        ) : null}
      </BottomSheet>

      <ConfirmDialog
        visible={!!toDelete}
        destructive
        title="Delete this date?"
        message={toDelete ? `${fmtFull(toDelete.date)} will no longer be marked ${DATE_TYPE_META[toDelete.type].label}. Rates for that day will change.` : ''}
        confirmLabel="Delete"
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) removeImportantDate(toDelete.id);
          setToDelete(null);
          toast('Date removed');
        }}
      />
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  top: { paddingTop: 12, gap: 12 },
  yearCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    padding: 8,
    borderRadius: radius.md,
    backgroundColor: C.surface,
    ...elevation,
  },
  yearBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearMid: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  year: { fontFamily: F.serifBold, fontSize: 25, lineHeight: 30, color: C.primary, fontVariant: ['lining-nums'] },
  filters: { gap: 8, paddingHorizontal: 14, paddingVertical: 2 },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  filterOn: { backgroundColor: C.primary, borderColor: GOLD, borderWidth: 1.4, paddingHorizontal: 18 },
  filterText: { fontFamily: F.serifSemibold, fontSize: 15, color: C.text },
  dot: { width: 9, height: 9, borderRadius: 5 },
  list: { paddingHorizontal: 14, paddingBottom: 16 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, marginBottom: 8 },
  month: { ...T.overline, letterSpacing: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    paddingRight: 10,
    borderRadius: radius.md,
    backgroundColor: C.surface,
    ...elevation,
  },
  tile: { width: 54, paddingVertical: 5, borderRadius: 10, alignItems: 'center' },
  tileDay: { fontFamily: F.serifBold, fontSize: 21, lineHeight: 24, color: C.primaryDark, fontVariant: ['lining-nums'] },
  tileMonth: { fontFamily: F.medium, fontSize: 10.5, letterSpacing: 0.4, color: C.textSecondary },
  rowDate: { fontFamily: F.serifBold, fontSize: 16, lineHeight: 21, color: C.text, fontVariant: ['lining-nums'] },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  typeText: { fontFamily: F.medium, fontSize: 12.5 },
  rowTitle: { flexShrink: 1, fontFamily: F.regular, fontSize: 12.5, color: C.textSecondary },
  trash: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetFloral: { position: 'absolute', top: -12, right: -20, width: 130, height: 100, opacity: 0.35 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 2 },
  sheetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: { fontFamily: F.serifBold, fontSize: 21, lineHeight: 25, color: C.primary },
  sheetSub: { fontFamily: F.regular, fontSize: 12, lineHeight: 16, color: C.textSecondary },
  label: { fontFamily: F.semibold, fontSize: 12.5, color: C.text },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.borderStrong,
    backgroundColor: C.surface,
    overflow: 'hidden',
  },
  fieldIcon: {
    width: 42,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceAlt,
  },
  fieldInput: {
    flex: 1,
    alignSelf: 'stretch',
    paddingHorizontal: 12,
    fontFamily: F.regular,
    fontSize: 14.5,
    color: C.text,
    fontVariant: ['lining-nums'],
    ...noOutline,
  },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  type: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  typeOn: { backgroundColor: C.accentSoft, borderColor: C.primary, borderWidth: 1.4, ...elevation },
  typeDot: { width: 11, height: 11, borderRadius: 6 },
  typeLabel: { fontFamily: F.medium, fontSize: 13, color: C.text },
  save: { height: 46, borderWidth: 1.4, borderColor: GOLD },
  pickCard: {
    backgroundColor: C.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 8,
  },
  warn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
