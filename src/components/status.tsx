import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Card, type IconName } from '@/components/primitives';
import { inr, initials } from '@/lib/format';
import { balanceOf, payState, type Booking, type BookingStatus, type DateType } from '@/lib/store';
import { C, D, F, T } from '@/lib/theme';

type Tone = 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'brand';
const TONES: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: C.successSoft, fg: C.success },
  warning: { bg: C.warningSoft, fg: C.warning },
  danger: { bg: C.dangerSoft, fg: C.danger },
  neutral: { bg: C.surfaceAlt, fg: C.textSecondary },
  info: { bg: C.infoSoft, fg: C.info },
  brand: { bg: C.primarySoft, fg: C.primary },
};

export function StatusBadge({ label, tone, style }: { label: string; tone: Tone; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[st.badge, { backgroundColor: TONES[tone].bg }, style]}>
      <Text style={[st.badgeText, { color: TONES[tone].fg }]}>{label}</Text>
    </View>
  );
}

/** PAID / DUE ₹x / UNPAID / CANCELLED — the one payment badge used everywhere. */
export function PaymentBadge({ booking }: { booking: Booking }) {
  const s = payState(booking);
  if (s === 'cancelled') return <StatusBadge label="CANCELLED" tone="danger" />;
  if (s === 'paid') return <StatusBadge label="PAID" tone="success" />;
  if (s === 'unpaid') return <StatusBadge label="UNPAID" tone="neutral" />;
  return <StatusBadge label={`DUE ${inr(balanceOf(booking))}`} tone="warning" />;
}

const BOOKING_TONE: Record<BookingStatus, Tone> = {
  confirmed: 'success',
  tentative: 'warning',
  enquiry: 'info',
  cancelled: 'danger',
};
export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <StatusBadge label={status.toUpperCase()} tone={BOOKING_TONE[status]} />;
}

/** Important-date category colours — kept separate from booking-availability colours. */
export const DATE_TONE: Record<DateType, { fg: string; bg: string }> = {
  muhurtham: D.muhurtham,
  valarpirai: D.valarpirai,
  special: D.special,
  holiday: D.holiday,
};

export const EVENT_ICON: Record<string, IconName> = {
  Wedding: 'heart-outline',
  Engagement: 'diamond-outline',
  Party: 'sparkles-outline',
  'Family Function': 'people-outline',
  Reception: 'wine-outline',
  'Company Function': 'business-outline',
};

export function EventIcon({ type, size = 44 }: { type: string; size?: number }) {
  return (
    <View style={[st.eventIcon, { width: size, height: size, borderRadius: size * 0.32 }]}>
      <Ionicons name={EVENT_ICON[type] ?? 'calendar-clear-outline'} size={size * 0.45} color={C.primary} />
    </View>
  );
}

const AVATAR_BG = [C.primarySoft, C.accentSoft, '#EEEAF0', '#F1EAE3', '#E9EEF1'];
const AVATAR_FG = [C.primary, C.accentText, '#5B4A63', '#6E5340', '#44586A'];

export function Avatar({ name, size = 46 }: { name: string; size?: number }) {
  const i = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_BG.length;
  return (
    <View style={[st.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: AVATAR_BG[i] }]}>
      <Text style={{ fontFamily: F.semibold, fontSize: size * 0.36, color: AVATAR_FG[i] }}>{initials(name)}</Text>
    </View>
  );
}

export function AmountDisplay({
  label,
  value,
  color,
  size = 'md',
}: {
  label: string;
  value: number;
  color?: string;
  size?: 'md' | 'lg';
}) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={T.caption}>{label}</Text>
      <Text style={[size === 'lg' ? T.amount : T.amountSm, color ? { color } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {inr(value)}
      </Text>
    </View>
  );
}

export function SummaryCard({
  icon,
  value,
  label,
  tint,
  onPress,
}: {
  icon: IconName;
  value: string;
  label: string;
  tint: { fg: string; bg: string };
  onPress?: () => void;
}) {
  return (
    <Card style={st.summary} onPress={onPress}>
      <View style={[st.summaryIcon, { backgroundColor: tint.bg }]}>
        <Ionicons name={icon} size={20} color={tint.fg} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[T.amountSm, { fontFamily: F.bold, fontSize: 17 }]} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={T.caption} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </Card>
  );
}

const st = StyleSheet.create({
  badge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontFamily: F.bold, fontSize: 10.5, letterSpacing: 0.5 },
  eventIcon: { backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  summary: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  summaryIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
