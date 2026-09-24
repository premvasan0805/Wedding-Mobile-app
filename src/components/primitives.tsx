import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { C, elevation, radius, space, T } from '@/lib/theme';

export type IconName = keyof typeof Ionicons.glyphMap;

// ---------- Touch ----------

/** Pressable with a consistent pressed state (slight dim + scale). */
export function Touchable({
  style,
  children,
  ...props
}: Omit<PressableProps, 'style' | 'children'> & { style?: StyleProp<ViewStyle>; children: ReactNode }) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        style,
        pressed && { opacity: 0.82, transform: [{ scale: 0.985 }] },
        props.disabled && { opacity: 0.5 },
      ]}>
      {children}
    </Pressable>
  );
}

// ---------- Layout ----------

export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function AppHeader({
  title,
  back,
  right,
  subtitle,
}: {
  title: string;
  back?: boolean;
  right?: ReactNode;
  subtitle?: string;
}) {
  return (
    <View style={st.header}>
      {back && <IconButton icon="arrow-back" onPress={goBack} plain accessibilityLabel="Back" />}
      <View style={{ flex: 1 }}>
        <Text style={[T.screenTitle, back && { fontSize: 21, lineHeight: 28 }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={T.secondary}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

/**
 * Standard screen: safe-area top, header, scrollable body and optional sticky footer.
 * Tab screens pass `tab` so the footer isn't padded for the home indicator (the tab bar handles it).
 */
export function Screen({
  title,
  subtitle,
  back,
  right,
  header,
  children,
  footer,
  scroll = true,
  onRefresh,
  tab,
  contentStyle,
}: {
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  onRefresh?: () => Promise<void> | void;
  tab?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[st.body, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh && Platform.OS !== 'web' ? <Refresh onRefresh={onRefresh} /> : undefined}>
      {children}
    </ScrollView>
  ) : (
    <View style={[st.body, { flex: 1, paddingBottom: 0 }, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={st.screen} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {header ?? (title ? <AppHeader title={title} subtitle={subtitle} back={back} right={right} /> : null)}
        {body}
        {footer ? (
          <SafeAreaView edges={tab ? [] : ['bottom']} style={st.footer}>
            {footer}
          </SafeAreaView>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Refresh({ onRefresh }: { onRefresh: () => Promise<void> | void }) {
  const [refreshing, setRefreshing] = useState(false);
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
      }}
      tintColor={C.primary}
      colors={[C.primary]}
    />
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  if (onPress) {
    return (
      <Touchable onPress={onPress} style={[st.card, style]}>
        {children}
      </Touchable>
    );
  }
  return <View style={[st.card, style]}>{children}</View>;
}

export function SectionHeader({
  title,
  action,
  onAction,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[st.sectionHeader, style]}>
      <Text style={T.section}>{title}</Text>
      {action ? (
        <Touchable onPress={onAction} hitSlop={8} style={st.sectionAction}>
          <Text style={[T.secondary, { color: C.primary, fontFamily: 'Inter_600SemiBold' }]}>{action}</Text>
          <Ionicons name="chevron-forward" size={14} color={C.primary} />
        </Touchable>
      ) : null}
    </View>
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginLeft: inset }} />;
}

// ---------- Buttons ----------

type BtnProps = {
  title: string;
  onPress?: () => void;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
};

export function PrimaryButton({ title, onPress, icon, disabled, loading, style, compact }: BtnProps) {
  return (
    <Touchable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[st.btn, compact && st.btnCompact, { backgroundColor: C.primary }, style]}>
      {loading ? (
        <ActivityIndicator color={C.onPrimary} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color={C.onPrimary} />}
          <Text style={[T.button, { color: C.onPrimary }]}>{title}</Text>
        </>
      )}
    </Touchable>
  );
}

export function SecondaryButton({
  title,
  onPress,
  icon,
  disabled,
  style,
  compact,
  tone = 'primary',
}: BtnProps & { tone?: 'primary' | 'danger' }) {
  const color = tone === 'danger' ? C.danger : C.primary;
  return (
    <Touchable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        st.btn,
        compact && st.btnCompact,
        { backgroundColor: C.surface, borderWidth: 1.2, borderColor: tone === 'danger' ? C.dangerBorder : C.primary },
        style,
      ]}>
      {icon && <Ionicons name={icon} size={18} color={color} />}
      <Text style={[T.button, { color }]}>{title}</Text>
    </Touchable>
  );
}

export function IconButton({
  icon,
  onPress,
  plain,
  filled,
  size = 44,
  color,
  badge,
  accessibilityLabel,
}: {
  icon: IconName;
  onPress?: () => void;
  plain?: boolean;
  filled?: boolean;
  size?: number;
  color?: string;
  badge?: boolean;
  accessibilityLabel?: string;
}) {
  const bg = filled ? C.primary : plain ? 'transparent' : C.surface;
  const fg = color ?? (filled ? C.onPrimary : plain ? C.text : C.primary);
  return (
    <Touchable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      onPress={onPress}
      style={[
        st.iconBtn,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg },
        !plain && !filled && { borderWidth: 1, borderColor: C.border },
      ]}>
      <Ionicons name={icon} size={plain ? 24 : 20} color={fg} />
      {badge && <View style={st.dotBadge} />}
    </Touchable>
  );
}

// ---------- States ----------

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  action,
  onAction,
}: {
  icon?: IconName;
  title: string;
  message?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={st.state}>
      <View style={st.stateIcon}>
        <Ionicons name={icon} size={26} color={C.primary} />
      </View>
      <Text style={[T.cardTitle, { textAlign: 'center' }]}>{title}</Text>
      {message ? <Text style={[T.secondary, { textAlign: 'center' }]}>{message}</Text> : null}
      {action ? <SecondaryButton title={action} onPress={onAction} compact style={{ marginTop: 8 }} /> : null}
    </View>
  );
}

export function ErrorState({ title = 'Something went wrong', message }: { title?: string; message?: string }) {
  return (
    <View style={st.state}>
      <View style={[st.stateIcon, { backgroundColor: C.dangerSoft }]}>
        <Ionicons name="alert-circle-outline" size={26} color={C.danger} />
      </View>
      <Text style={[T.cardTitle, { textAlign: 'center' }]}>{title}</Text>
      {message ? <Text style={[T.secondary, { textAlign: 'center' }]}>{message}</Text> : null}
      <SecondaryButton title="Go back" onPress={goBack} compact style={{ marginTop: 8 }} />
    </View>
  );
}

export function LoadingState() {
  return (
    <View style={[st.state, { flex: 1, justifyContent: 'center' }]}>
      <ActivityIndicator color={C.primary} size="large" />
    </View>
  );
}

/** Pulsing placeholder block for skeleton loading. */
export function Skeleton({ height = 16, width = '100%', style }: { height?: number; width?: number | `${number}%`; style?: StyleProp<ViewStyle> }) {
  const o = useSharedValue(0.5);
  useEffect(() => {
    o.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [o]);
  const a = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ height, width, borderRadius: 8, backgroundColor: C.surfaceAlt }, a, style]} />;
}

export const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.sm,
    minHeight: 56,
  },
  body: { paddingHorizontal: space.xl, paddingTop: space.sm, paddingBottom: 32, gap: space.md },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: space.md,
    backgroundColor: C.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: space.lg,
    ...elevation,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.sm,
  },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 },
  btn: {
    minHeight: 52,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: space.lg,
  },
  btnCompact: { minHeight: 44, borderRadius: radius.sm },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  dotBadge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.danger,
    borderWidth: 1.5,
    borderColor: C.surface,
  },
  state: { alignItems: 'center', gap: 8, paddingVertical: 40, paddingHorizontal: 24 },
  stateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
});
