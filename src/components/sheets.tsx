import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Chip, OptionCard, TextField } from '@/components/form';
import { BottomSheet, useToast } from '@/components/overlays';
import { PrimaryButton } from '@/components/primitives';
import { AmountDisplay } from '@/components/status';
import { fmtLong, inr, parseISO, toNum, todayISO } from '@/lib/format';
import { balanceOf, paidOf, useStore, type Booking, type Customer } from '@/lib/store';
import { C, radius } from '@/lib/theme';

const METHODS = ['Cash', 'UPI', 'Card', 'Bank transfer', 'Cheque'];
const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Record Payment — validates against the remaining due so totals can never go negative. */
export function RecordPaymentSheet({
  booking,
  visible,
  onClose,
}: {
  booking: Booking | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { addPayment } = useStore();
  const toast = useToast();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [method, setMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!booking) return null;
  const due = balanceOf(booking);
  const value = toNum(amount);
  const dateOk = ISO_RE.test(date) && !isNaN(parseISO(date).getTime());
  const amountError = value > due ? `Cannot exceed remaining due of ${inr(due)}` : undefined;
  const valid = value > 0 && !amountError && dateOk;

  const reset = () => {
    setAmount('');
    setDate(todayISO());
    setMethod('Cash');
    setReference('');
    setNotes('');
    setSaving(false);
  };

  const save = () => {
    if (!valid || saving) return; // guard against double taps creating duplicate payments
    setSaving(true);
    addPayment(booking.id, {
      amount: value,
      date,
      mode: method,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    toast(`Payment of ${inr(value)} recorded`);
    reset();
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Record Payment"
      subtitle={booking.number}
      footer={<PrimaryButton title="Save Payment" icon="checkmark" disabled={!valid} loading={saving} onPress={save} />}>
      <View style={st.summary}>
        <AmountDisplay label="Booking total" value={booking.total} />
        <AmountDisplay label="Received" value={paidOf(booking)} color={C.success} />
        <AmountDisplay label="Remaining" value={due} color={C.warning} />
      </View>
      <TextField
        label="Amount received"
        prefix="₹"
        keyboardType="number-pad"
        placeholder="0"
        value={amount}
        onChangeText={setAmount}
        error={amountError}
        hint={due > 0 ? `Tap “Full due” to fill ${inr(due)}` : undefined}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Chip label="Full due" onPress={() => setAmount(String(due))} />
        <Chip label="Half" onPress={() => setAmount(String(Math.round(due / 2)))} />
      </View>
      <TextField
        label="Payment date"
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
        error={date && !dateOk ? 'Use YYYY-MM-DD' : undefined}
      />
      <View style={{ gap: 8 }}>
        <Text style={st.label}>Payment method</Text>
        <View style={st.wrap}>
          {METHODS.map((m) => (
            <Chip key={m} label={m} active={method === m} onPress={() => setMethod(m)} />
          ))}
        </View>
      </View>
      <TextField label="Reference number (optional)" placeholder="UPI / cheque / txn no." value={reference} onChangeText={setReference} />
      <TextField label="Notes (optional)" multiline value={notes} onChangeText={setNotes} />
    </BottomSheet>
  );
}

/** Pick which booking to pay against (used from the customer profile). */
export function PickBookingSheet({
  bookings,
  visible,
  onClose,
  onPick,
}: {
  bookings: Booking[];
  visible: boolean;
  onClose: () => void;
  onPick: (b: Booking) => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Select booking" subtitle="Bookings with an amount due">
      {bookings.map((b) => (
        <OptionCard action
          key={b.id}
          icon="receipt-outline"
          title={`${b.eventType} · ${fmtLong(b.date)}`}
          subtitle={`${b.number} · due ${inr(balanceOf(b))}`}
          onPress={() => onPick(b)}
        />
      ))}
    </BottomSheet>
  );
}

export function CustomerFormSheet({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved?: (c: Customer) => void;
}) {
  const { addCustomer, customers } = useStore();
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const digits = phone.replace(/\D/g, '');
  const phoneError = digits && digits.length !== 10 ? 'Enter a 10-digit mobile number' : undefined;
  const dup = digits.length === 10 && customers.some((c) => c.phone === digits);
  const valid = name.trim().length > 1 && !phoneError && !dup;

  const close = () => {
    setName('');
    setPhone('');
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={close}
      title="New customer"
      footer={
        <PrimaryButton
          title="Save Customer"
          disabled={!valid}
          onPress={() => {
            const c = addCustomer({ name: name.trim(), phone: digits });
            toast(`${c.name} added`);
            onSaved?.(c);
            close();
          }}
        />
      }>
      <TextField label="Full name" placeholder="e.g. Arun Kumar" value={name} onChangeText={setName} autoFocus />
      <TextField
        label="Mobile number"
        placeholder="10-digit number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        error={phoneError ?? (dup ? 'A customer with this number already exists' : undefined)}
      />
    </BottomSheet>
  );
}

const st = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: C.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },
  label: { fontFamily: 'Inter_500Medium', fontSize: 13.5, color: C.text },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
