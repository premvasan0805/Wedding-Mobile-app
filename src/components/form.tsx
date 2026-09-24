import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Touchable, type IconName } from '@/components/primitives';
import { C, F, noOutline, radius, T } from '@/lib/theme';

export function TextField({
  label,
  hint,
  error,
  prefix,
  multiline,
  style,
  ...props
}: TextInputProps & { label?: string; hint?: string; error?: string; prefix?: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={st.label}>{label}</Text> : null}
      <View
        style={[
          st.inputWrap,
          focus && { borderColor: C.primary, backgroundColor: C.surface },
          !!error && { borderColor: C.danger },
          multiline && { minHeight: 88, alignItems: 'flex-start' },
        ]}>
        {prefix ? <Text style={st.prefix}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={C.textMuted}
          multiline={multiline}
          onFocus={(e) => {
            setFocus(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            props.onBlur?.(e);
          }}
          style={[st.input, multiline && { textAlignVertical: 'top', paddingTop: 12 }, style]}
          {...props}
        />
      </View>
      {error ? (
        <Text style={[T.caption, { color: C.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={T.caption}>{hint}</Text>
      ) : null}
    </View>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  right,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  right?: ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
      <View style={st.search}>
        <Ionicons name="search-outline" size={18} color={C.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.textMuted}
          style={st.searchInput}
          returnKeyType="search"
        />
        {value ? (
          <Touchable hitSlop={10} onPress={() => onChangeText('')}>
            <Ionicons name="close-circle" size={18} color={C.textMuted} />
          </Touchable>
        ) : null}
      </View>
      {right}
    </View>
  );
}

/** Pill-style segmented tabs; the active tab is filled with brand green. */
export function SegmentedTabs<K extends string>({
  options,
  value,
  onChange,
  variant = 'solid',
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
  variant?: 'solid' | 'soft';
}) {
  return (
    <View style={st.tabs}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Touchable
            key={o.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            style={[
              st.tab,
              on && (variant === 'solid' ? { backgroundColor: C.primary } : st.tabSoftOn),
            ]}>
            <Text
              numberOfLines={1}
              style={[
                st.tabText,
                on && { color: variant === 'solid' ? C.onPrimary : C.primary, fontFamily: F.semibold },
              ]}>
              {o.label}
            </Text>
          </Touchable>
        );
      })}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
  tint,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  /** Optional dot colour shown before the label. */
  tint?: string;
}) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityState={{ selected: active }}
      style={[st.chip, active && { backgroundColor: C.primarySoft, borderColor: C.primary }]}>
      {tint ? <View style={[st.chipDot, { backgroundColor: tint }]} /> : null}
      {icon ? <Ionicons name={icon} size={15} color={active ? C.primary : C.textSecondary} /> : null}
      <Text style={[st.chipText, active && { color: C.primary, fontFamily: F.semibold }]}>{label}</Text>
    </Touchable>
  );
}

/** Large selectable option card (used for slots, statuses, payment methods). */
export function OptionCard({
  title,
  subtitle,
  selected,
  disabled,
  onPress,
  icon,
  right,
  action,
}: {
  /** `action` rows open something (chevron); otherwise the row is a choice (radio). */
  action?: boolean;
  title: string;
  subtitle?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  icon?: IconName;
  right?: ReactNode;
}) {
  return (
    <Touchable
      disabled={disabled}
      onPress={onPress}
      accessibilityState={{ selected, disabled }}
      style={[st.option, selected && st.optionOn]}>
      {icon ? (
        <View style={[st.optionIcon, selected && { backgroundColor: C.primary }]}>
          <Ionicons name={icon} size={18} color={selected ? C.onPrimary : C.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[T.bodyMedium, selected && { color: C.primaryDark, fontFamily: F.semibold }]}>{title}</Text>
        {subtitle ? <Text style={T.secondary}>{subtitle}</Text> : null}
      </View>
      {right}
      {action ? (
        <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
      ) : (
        <Ionicons
          name={selected ? 'radio-button-on' : 'radio-button-off'}
          size={20}
          color={selected ? C.primary : C.borderStrong}
        />
      )}
    </Touchable>
  );
}

const st = StyleSheet.create({
  label: { fontFamily: F.medium, fontSize: 13.5, color: C.text },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: radius.md,
    backgroundColor: C.surface,
    paddingHorizontal: 14,
  },
  prefix: { fontFamily: F.medium, fontSize: 15, color: C.textSecondary, marginRight: 6 },
  input: { flex: 1, fontFamily: F.regular, fontSize: 15.5, color: C.text, paddingVertical: 12, outlineWidth: 0, ...noOutline },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: 15, color: C.text, height: '100%', outlineWidth: 0, ...noOutline },
  tabs: {
    flexDirection: 'row',
    backgroundColor: C.surfaceAlt,
    borderRadius: radius.pill,
    padding: 4,
  },
  tab: {
    flex: 1,
    minHeight: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  tabSoftOn: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  tabText: { fontFamily: F.medium, fontSize: 14, color: C.textSecondary },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontFamily: F.medium, fontSize: 13.5, color: C.text },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1.2,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  optionOn: { borderColor: C.primary, backgroundColor: C.primarySoft },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
