import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { openCustomer } from '@/components/cards';
import { OptionCard } from '@/components/form';
import { BottomSheet, ConfirmDialog, useToast } from '@/components/overlays';
import {
  Card,
  Divider,
  ErrorState,
  IconButton,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Touchable,
  type IconName,
} from '@/components/primitives';
import { RecordPaymentSheet } from '@/components/sheets';
import { Avatar, BookingStatusBadge, EVENT_ICON } from '@/components/status';
import { fmtDate, fmtFull, fmtLong, inr, MONTHS, parseISO } from '@/lib/format';
import { balanceOf, GST_RATE, paidOf, payState, SLOT_LABEL, type SlotKey, useStore } from '@/lib/store';
import { C, F, radius, T } from '@/lib/theme';

const SLOT_ICON: Record<SlotKey, IconName> = {
  full: 'sunny-outline',
  first: 'partly-sunny-outline',
  second: 'moon-outline',
  early: 'cloudy-night-outline',
};

const PAY_PILL = {
  paid: { label: 'PAID', icon: 'checkmark-circle-outline', bg: C.successSoft, fg: C.success },
  due: { label: 'PARTIAL', icon: 'time-outline', bg: C.warningSoft, fg: C.warning },
  unpaid: { label: 'UNPAID', icon: 'time-outline', bg: C.warningSoft, fg: C.warning },
  cancelled: { label: 'CANCELLED', icon: 'close-circle-outline', bg: C.dangerSoft, fg: C.danger },
} as const;

export default function BookingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bookings, customerById, hall, cancelBooking } = useStore();
  const toast = useToast();
  const [menu, setMenu] = useState(false);
  const [pay, setPay] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const booking = bookings.find((b) => b.id === id);
  if (!booking) {
    return (
      <Screen title="Booking Details" back>
        <ErrorState title="Booking not found" message="It may have been removed." />
      </Screen>
    );
  }

  const cust = customerById(booking.customerId);
  const phone = cust?.phone.replace(/\D/g, '') ?? '';
  const paid = paidOf(booking);
  const due = balanceOf(booking);
  const cancelled = booking.status === 'cancelled';
  const pill = PAY_PILL[payState(booking)];
  const d = parseISO(booking.date);
  const weekday = fmtLong(booking.date).split(',')[0];
  const edit = () => router.push({ pathname: '/booking/new', params: { id: booking.id } });
  const call = () => Linking.openURL(`tel:${phone}`);
  const whatsapp = () => Linking.openURL(`https://wa.me/91${phone}`);
  const extras = [
    ['Bride', booking.brideName],
    ['Groom', booking.groomName],
    ['Expected guests', booking.guests],
    ['Price note', booking.priceReason],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <Screen
      title="Booking Details"
      back
      right={<IconButton icon="ellipsis-vertical" plain onPress={() => setMenu(true)} accessibilityLabel="More actions" />}
      contentStyle={st.content}>
      {/* Summary */}
      <Card style={st.card}>
        <View style={st.between}>
          <Text style={st.number}>{booking.number}</Text>
          <BookingStatusBadge status={booking.status} />
        </View>
        <View style={st.summaryRow}>
          <View style={st.dateTile}>
            <Text style={st.dateDay}>{d.getDate()}</Text>
            <Text style={st.dateMonth}>
              {MONTHS[d.getMonth()].slice(0, 3).toUpperCase()} {d.getFullYear()}
            </Text>
            <View style={st.weekday}>
              <Text style={st.weekdayText}>{weekday}</Text>
            </View>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[st.title, cancelled && st.strike]} numberOfLines={2}>
              {booking.eventType}
            </Text>
            <View style={st.metaRow}>
              <Meta icon={SLOT_ICON[booking.slot]} label={SLOT_LABEL[booking.slot]} />
              <View style={st.metaSep} />
              <Meta icon={EVENT_ICON[booking.eventType] ?? 'calendar-clear-outline'} label={booking.eventType} />
              <View style={st.metaSep} />
              <Meta icon="business-outline" label={hall.name} />
            </View>
            <Meta icon="calendar-outline" label={`Booked on ${fmtLong(booking.bookedOn)}`} muted />
          </View>
        </View>
      </Card>

      {/* Customer */}
      <Card style={st.card} onPress={cust ? () => openCustomer(cust.id) : undefined}>
        <Text style={T.overline}>Customer</Text>
        <View style={st.rowGap}>
          <Avatar name={cust?.name ?? '?'} size={38} />
          <View style={{ flex: 1 }}>
            <Text style={st.name} numberOfLines={1}>
              {cust?.name ?? 'Unknown customer'}
            </Text>
            <Text style={T.caption}>{cust?.phone || 'No phone'}</Text>
          </View>
          {phone ? (
            <>
              <RoundAction icon="call" onPress={call} label="Call" />
              <RoundAction icon="logo-whatsapp" onPress={whatsapp} label="WhatsApp" />
            </>
          ) : null}
          {cust ? <Ionicons name="chevron-forward" size={18} color={C.textMuted} /> : null}
        </View>
      </Card>

      {/* Event */}
      <Card style={st.card}>
        <Text style={T.overline}>Event</Text>
        <View style={st.eventPanel}>
          <EventCell icon="calendar-outline" label="Date" value={fmtLong(booking.date)} />
          <View style={st.vSep} />
          <EventCell icon="time-outline" label="Timing" value={SLOT_LABEL[booking.slot]} />
          <View style={st.vSep} />
          <EventCell icon="business-outline" label="Hall" value={hall.name} />
        </View>
      </Card>

      {/* Payments */}
      <Card style={st.card}>
        <View style={st.between}>
          <Text style={T.overline}>Payments</Text>
          <View style={[st.pill, { backgroundColor: pill.bg }]}>
            <Ionicons name={pill.icon} size={11} color={pill.fg} />
            <Text style={[st.pillText, { color: pill.fg }]}>{pill.label}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Amount label="Total Amount" value={booking.total} />
          <View style={st.vSep} />
          <Amount label="Paid Amount" value={paid} color={paid > 0 ? C.success : C.textSecondary} />
          <View style={st.vSep} />
          <Amount
            label="Balance Amount"
            value={due}
            color={due > 0 && !cancelled ? C.accentText : C.textSecondary}
          />
        </View>
        {booking.gstAmount ? (
          <View style={{ gap: 6 }}>
            <Row label="Non-GST amount" value={inr(booking.nonGstAmount ?? 0)} />
            <Row label="GST amount" value={inr(booking.gstAmount)} />
            <Row label={`GST ${GST_RATE * 100}%`} value={inr(Math.round(booking.gstAmount * GST_RATE))} />
          </View>
        ) : null}
        {booking.payments.length > 0 ? (
          <View style={{ gap: 10 }}>
            <Divider />
            <Text style={T.overline}>History</Text>
            {booking.payments.map((p) => (
              <View key={p.id} style={st.rowGap}>
                <View style={st.payIcon}>
                  <Ionicons name="checkmark" size={16} color={C.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={T.bodyMedium}>{inr(p.amount)}</Text>
                  <Text style={T.caption}>
                    {p.mode} · {fmtDate(p.date)}
                    {p.reference ? ` · Ref ${p.reference}` : ''}
                  </Text>
                  {p.notes ? <Text style={T.caption}>{p.notes}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}
        {!cancelled && due > 0 ? <PrimaryButton title="Add Payment" icon="add" compact onPress={() => setPay(true)} /> : null}
      </Card>

      {/* Additional information */}
      <Card style={st.card}>
        <Text style={T.overline}>Additional Information</Text>
        {extras.map(([k, v]) => (
          <Row key={k} label={k} value={v} />
        ))}
        <Touchable style={st.rowGap} onPress={cancelled ? undefined : edit} disabled={cancelled}>
          <View style={st.noteIcon}>
            <Ionicons name="document-text-outline" size={16} color={C.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={T.caption}>Notes</Text>
            <Text style={[T.caption, { fontSize: 13, color: C.text, fontFamily: F.medium }]}>{booking.notes || '-'}</Text>
          </View>
          {!cancelled ? <Ionicons name="chevron-forward" size={18} color={C.textMuted} /> : null}
        </Touchable>
      </Card>

      {!cancelled && (
        <SecondaryButton
          title="Cancel Booking"
          tone="danger"
          icon="trash-outline"
          compact
          onPress={() => setConfirmCancel(true)}
          style={{ marginTop: 2 }}
        />
      )}

      <BottomSheet visible={menu} onClose={() => setMenu(false)} title="Booking actions">
        {!cancelled && (
          <OptionCard
            action
            icon="create-outline"
            title="Edit booking"
            onPress={() => {
              setMenu(false);
              edit();
            }}
          />
        )}
        {phone ? <OptionCard action icon="call-outline" title="Call customer" onPress={call} /> : null}
        {phone ? <OptionCard action icon="logo-whatsapp" title="WhatsApp customer" onPress={whatsapp} /> : null}
      </BottomSheet>

      <RecordPaymentSheet booking={booking} visible={pay} onClose={() => setPay(false)} />

      <ConfirmDialog
        visible={confirmCancel}
        destructive
        title="Cancel this booking?"
        message={`${booking.number} on ${fmtFull(booking.date)} will be marked cancelled and the slot freed. This can't be undone.`}
        confirmLabel="Cancel booking"
        cancelLabel="Keep booking"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          cancelBooking(booking.id);
          setConfirmCancel(false);
          toast('Booking cancelled');
        }}
      />
    </Screen>
  );
}

function Meta({ icon, label, muted }: { icon: IconName; label: string; muted?: boolean }) {
  return (
    <View style={st.meta}>
      <Ionicons name={icon} size={12} color={muted ? C.textSecondary : C.primary} />
      <Text style={[T.caption, { color: muted ? C.textSecondary : C.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function RoundAction({ icon, onPress, label }: { icon: IconName; onPress: () => void; label: string }) {
  return (
    <Touchable accessibilityRole="button" accessibilityLabel={label} hitSlop={4} onPress={onPress} style={st.round}>
      <Ionicons name={icon} size={15} color={C.primary} />
    </Touchable>
  );
}

function EventCell({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={st.eventCell}>
      <Ionicons name={icon} size={14} color={C.primary} />
      <View style={{ flex: 1 }}>
        <Text style={[T.caption, { fontSize: 11, lineHeight: 14 }]}>{label}</Text>
        <Text style={st.cellValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function Amount({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={{ flex: 1, gap: 2, paddingHorizontal: 4 }}>
      <Text style={[T.caption, { fontSize: 11, lineHeight: 14 }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[T.amountSm, { fontFamily: F.bold, fontSize: 14, lineHeight: 19 }, color ? { color } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {inr(value)}
      </Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={[st.between, { alignItems: 'flex-start', gap: 16 }]}>
      <Text style={T.caption}>{label}</Text>
      <Text style={[T.caption, { color: C.text, fontFamily: F.medium, flexShrink: 1, textAlign: 'right' }]}>
        {value}
      </Text>
    </View>
  );
}

const st = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 10 },
  card: { padding: 12, gap: 8, borderRadius: radius.md },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  strike: { textDecorationLine: 'line-through', color: C.textMuted },
  number: { ...T.caption, fontFamily: F.medium, letterSpacing: 0.6 },
  summaryRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  dateTile: {
    width: 52,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    gap: 2,
  },
  dateDay: { fontFamily: F.bold, fontSize: 19, lineHeight: 23, color: C.primary },
  dateMonth: { fontFamily: F.semibold, fontSize: 9, color: C.primary, letterSpacing: 0.4 },
  weekday: { marginTop: 3, paddingHorizontal: 7, paddingVertical: 1, borderRadius: 6, backgroundColor: C.primaryTint },
  weekdayText: { fontFamily: F.semibold, fontSize: 10, color: C.primary },
  title: { ...T.section, fontSize: 16, lineHeight: 21 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 3, columnGap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1 },
  metaSep: { width: 1, height: 11, backgroundColor: C.border },
  name: { ...T.cardTitle, fontSize: 14.5, lineHeight: 19 },
  round: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventPanel: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  eventCell: { flex: 1, flexDirection: 'row', gap: 5, paddingHorizontal: 5 },
  cellValue: { fontFamily: F.semibold, fontSize: 12, lineHeight: 16, color: C.text },
  vSep: { width: 1, alignSelf: 'stretch', backgroundColor: C.border },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill },
  pillText: { fontFamily: F.bold, fontSize: 9.5, letterSpacing: 0.4 },
  noteIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
