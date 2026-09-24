import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CompactBrandHeader } from '@/components/brand-header';
import { openBooking } from '@/components/cards';
import { OrnamentRule } from '@/components/decor';
import { EmptyState, ErrorState, goBack, Touchable, type IconName } from '@/components/primitives';
import { fmtDate, fmtShort, initials, inr, MONTHS, parseISO } from '@/lib/format';
import { payState, SLOT_LABEL, useStore, type Booking, type PayState } from '@/lib/store';
import { C, elevation, F, T } from '@/lib/theme';

const RULE_GOLD = '#D2A566';

/**
 * Customer profile: burgundy brand header, contact card with quick actions, and the customer's bookings
 * as date-block cards. Rendered inside the Customers tab and, from a booking, as a full-screen route.
 */
export function CustomerProfile({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const { customerById, bookings } = useStore();
  const [focused, setFocused] = useState(false);
  const [ruleWidth, setRuleWidth] = useState(0);

  // Light status bar only while this screen (with its burgundy header) is on top.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const cust = customerById(id);
  const list = cust
    ? bookings.filter((b) => b.customerId === cust.id).sort((a, b) => b.date.localeCompare(a.date))
    : [];
  const phone = cust?.phone.replace(/\D/g, '') ?? '';

  return (
    <View style={st.screen}>
      {focused ? <StatusBar style="light" /> : null}

      <ScrollView contentContainerStyle={st.content} showsVerticalScrollIndicator={false}>
        <CompactBrandHeader topInset={insets.top} />

        <View style={st.body}>

          <View style={st.titleRow}>
            <Touchable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={10}>
              <Ionicons name="arrow-back" size={22} color={C.primaryDark} />
            </Touchable>
            <Text style={st.title}>Customer</Text>
            <OrnamentRule width={106} color={RULE_GOLD} />
          </View>

          {!cust ? (
            <ErrorState title="Customer not found" />
          ) : (
            <>
              <View style={[st.card, st.profile]}>
                <View style={st.who}>
                  <View style={st.avatar}>
                    <Text style={st.avatarText}>{initials(cust.name)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.name} numberOfLines={1}>
                      {cust.name}
                    </Text>
                    <Text style={st.phone}>{cust.phone || 'No phone number'}</Text>
                  </View>
                </View>
                {phone ? (
                  <View style={st.actions}>
                    <Action icon="call" label="Call" onPress={() => Linking.openURL(`tel:${phone}`)} />
                    <Action
                      icon="logo-whatsapp"
                      label="WhatsApp"
                      onPress={() => Linking.openURL(`https://wa.me/91${phone}`)}
                    />
                    <Action icon="chatbubble-ellipses" label="SMS" onPress={() => Linking.openURL(`sms:${phone}`)} />
                  </View>
                ) : null}
              </View>

              <View style={st.sectionRow}>
                <MaterialCommunityIcons name="calendar-month" size={18} color={C.primary} />
                <Text style={st.section}>Bookings</Text>
                <View style={{ flex: 1 }} onLayout={(e) => setRuleWidth(Math.round(e.nativeEvent.layout.width))}>
                  {ruleWidth > 0 ? <OrnamentRule width={ruleWidth} color={RULE_GOLD} kind="bud" at={0.62} /> : null}
                </View>
              </View>

              {list.length === 0 ? (
                <EmptyState icon="receipt-outline" title="No bookings yet" message="Bookings for this customer show here." />
              ) : (
                list.map((b) => <BookingRow key={b.id} booking={b} name={cust.name} />)
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Action({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Touchable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={st.action}>
      <View style={st.actionIcon}>
        <Ionicons name={icon} size={15} color={C.primary} />
      </View>
      <Text style={st.actionLabel}>{label}</Text>
    </Touchable>
  );
}

const PAY_PILL: Record<PayState, { label: string; icon: IconName; fg: string; bg: string }> = {
  cancelled: { label: 'CANCELLED', icon: 'close-circle-outline', fg: '#C41E3A', bg: '#FCE8EC' },
  paid: { label: 'PAID', icon: 'checkmark-circle-outline', fg: C.success, bg: C.successSoft },
  due: { label: 'DUE', icon: 'time-outline', fg: C.warning, bg: C.warningSoft },
  unpaid: { label: 'UNPAID', icon: 'ellipse-outline', fg: C.textSecondary, bg: C.surfaceAlt },
};

/** Booking card: blush date block, event slot and booked-on date, then amount and payment state. */
function BookingRow({ booking, name }: { booking: Booking; name: string }) {
  const d = parseISO(booking.date);
  const pill = PAY_PILL[payState(booking)];

  return (
    <Touchable
      onPress={() => openBooking(booking.id)}
      accessibilityRole="button"
      accessibilityLabel={`${fmtDate(booking.date)}, ${SLOT_LABEL[booking.slot]}, ${inr(booking.total)}, ${pill.label}`}
      style={[st.card, st.booking]}>
      <View style={st.dateBlock}>
        <Text style={st.dateDay}>{String(d.getDate()).padStart(2, '0')}</Text>
        <Text style={st.dateMonth}>
          {MONTHS[d.getMonth()].slice(0, 3).toUpperCase()} {d.getFullYear()}
        </Text>
        <View style={st.dateRule} />
        <Text style={st.dateWeekday}>{fmtShort(booking.date).split(' ')[0]}</Text>
      </View>

      <View style={st.bookingMid}>
        <Text style={st.bookingName} numberOfLines={1}>
          {name}
        </Text>
        <View style={st.metaRow}>
          <MaterialCommunityIcons name="calendar-star" size={12} color={C.textSecondary} />
          <Text style={st.metaStrong} numberOfLines={1}>
            {SLOT_LABEL[booking.slot]}
          </Text>
        </View>
        <View style={st.midRule} />
        <View style={st.metaRow}>
          <Ionicons name="document-text-outline" size={12} color={C.textSecondary} />
          <Text style={st.meta} numberOfLines={1}>
            Booked on {fmtDate(booking.bookedOn)}
          </Text>
        </View>
      </View>

      <View style={st.vRule} />

      <View style={st.bookingRight}>
        <Text style={st.amount}>{inr(booking.total)}</Text>
        <View style={[st.pill, { backgroundColor: pill.bg }]}>
          <Ionicons name={pill.icon} size={11} color={pill.fg} />
          <Text style={[st.pillText, { color: pill.fg }]}>{pill.label}</Text>
        </View>
      </View>
    </Touchable>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 32 },
  body: { paddingHorizontal: 16, gap: 10 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, marginBottom: 2, paddingLeft: 3 },
  title: { fontFamily: F.serifBold, fontSize: 25, lineHeight: 32, color: C.primary },

  card: { backgroundColor: C.surface, borderRadius: 14, ...elevation },
  profile: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, gap: 8 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: F.serifSemibold, fontSize: 16, color: C.primary },
  name: { ...T.cardTitle, fontSize: 14.5, lineHeight: 19 },
  phone: { ...T.caption, letterSpacing: 0.4 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 32 },
  action: { alignItems: 'center', gap: 4, minWidth: 56 },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { ...T.caption, fontSize: 11, lineHeight: 14, color: '#3B3537' },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, paddingLeft: 2 },
  section: { fontFamily: F.serifBold, fontSize: 19, lineHeight: 24, color: C.primary },

  booking: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingRight: 10, gap: 10 },
  dateBlock: {
    width: 50,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: C.primarySoft,
  },
  /** Lining figures — Cormorant defaults to old-style digits that dip below the baseline. */
  dateDay: { fontFamily: F.serifBold, fontSize: 19, lineHeight: 22, color: C.primary, fontVariant: ['lining-nums'] },
  dateMonth: { fontFamily: F.medium, fontSize: 9, letterSpacing: 0.2, color: C.primaryDark },
  dateRule: { alignSelf: 'stretch', height: StyleSheet.hairlineWidth, backgroundColor: C.primaryMuted, marginHorizontal: 9, marginVertical: 4 },
  dateWeekday: { ...T.caption, fontSize: 10.5, lineHeight: 13 },

  bookingMid: { flex: 1, minWidth: 0, gap: 3 },
  bookingName: { ...T.cardTitle, fontSize: 14, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaStrong: { ...T.caption, fontSize: 12, color: '#4A4346', flexShrink: 1 },
  meta: { ...T.caption, fontSize: 11, lineHeight: 14, flexShrink: 1 },
  midRule: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginVertical: 1 },
  vRule: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: C.border, marginVertical: 6 },

  bookingRight: { width: 86, alignItems: 'flex-end', gap: 5 },
  amount: { ...T.amountSm, fontFamily: F.bold, fontSize: 14, lineHeight: 18 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  pillText: { fontFamily: F.bold, fontSize: 9.5, letterSpacing: 0.4 },
});
