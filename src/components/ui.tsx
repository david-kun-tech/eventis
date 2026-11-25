import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, F, R, S, shadow } from '@/lib/theme';

type IconName = keyof typeof Ionicons.glyphMap;
const MAX_W = 720;

export function Screen({
  children,
  scroll = true,
  pad = true,
  bottom = 0,
  safeTop = false,
  footer,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  pad?: boolean;
  bottom?: number;
  /** Pad under the status bar (for screens without a navigation header). */
  safeTop?: boolean;
  /** Pinned action bar rendered under the scroll area. */
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const inner = [
    pad && { padding: S.lg },
    safeTop && { paddingTop: insets.top + S.md },
    { paddingBottom: S.xxl + bottom },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[{ maxWidth: MAX_W, width: '100%', alignSelf: 'center' }, ...inner]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, ...inner, { paddingBottom: insets.bottom }]}>{children}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, S.md) }]}>
          <View style={{ maxWidth: MAX_W, width: '100%', alignSelf: 'center' }}>{footer}</View>
        </View>
      ) : null}
    </View>
  );
}

export function T({
  children,
  style,
  size = 15,
  bold,
  semi,
  color = C.ink,
  lines,
  center,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  size?: number;
  bold?: boolean;
  semi?: boolean;
  color?: string;
  lines?: number;
  center?: boolean;
}) {
  return (
    <Text
      numberOfLines={lines}
      style={[
        {
          fontSize: size,
          color,
          fontFamily: bold ? F.semibold : semi ? F.medium : F.regular,
          lineHeight: Math.round(size * 1.42),
          letterSpacing: size >= 22 ? -0.4 : 0,
        },
        center && { textAlign: 'center' },
        style,
      ]}>
      {children}
    </Text>
  );
}

export function H({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <T size={18} bold style={[{ marginBottom: S.md }, style]}>
      {children}
    </T>
  );
}

/** Section title with an optional trailing link, as in "Top rated · See all". */
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
    <View style={[styles.sectionHeader, style]}>
      <T size={18} bold>
        {title}
      </T>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={8} accessibilityRole="link">
          <T size={13} semi color={C.goldDark}>
            {action}
          </T>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Big screen title for tabs without a navigation header. */
export function PageTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: S.lg }}>
      <View style={{ flex: 1 }}>
        <T size={26} bold>
          {title}
        </T>
        {subtitle ? (
          <T size={13} color={C.sub}>
            {subtitle}
          </T>
        ) : null}
      </View>
      {right ? <View style={{ flexDirection: 'row', gap: S.sm }}>{right}</View> : null}
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const base: StyleProp<ViewStyle> = [styles.card, style];
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [base, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={base}>{children}</View>;
}

export type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'brand';

const TONES: Record<Tone, [string, string]> = {
  neutral: ['#F1EEE7', C.sub],
  good: [C.greenSoft, C.green],
  warn: [C.amberSoft, C.amber],
  bad: [C.redSoft, C.red],
  brand: [C.brandSoft, C.brandDark],
};

export function Pill({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const [bg, fg] = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {icon && <Ionicons name={icon} size={12} color={fg} style={{ marginRight: 4 }} />}
      <Text style={{ color: fg, fontSize: 12, fontFamily: F.medium }}>{label}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  disabled,
  icon,
  compact,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  icon?: IconName;
  compact?: boolean;
}) {
  const look = {
    primary: { bg: C.brand, fg: '#fff', border: C.brand },
    secondary: { bg: C.brandSoft, fg: C.brandDark, border: C.brandSoft },
    danger: { bg: C.card, fg: C.red, border: '#F5C9C4' },
    ghost: { bg: 'transparent', fg: C.sub, border: 'transparent' },
  }[kind];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        compact && { minHeight: 42, paddingVertical: 10, paddingHorizontal: S.lg },
        { backgroundColor: look.bg, borderColor: look.border },
        kind === 'primary' && !disabled && shadow.brand,
        disabled && { opacity: 0.4 },
        pressed && styles.pressed,
      ]}>
      {icon && <Ionicons name={icon} size={18} color={look.fg} style={{ marginRight: 8 }} />}
      <Text style={{ color: look.fg, fontFamily: F.semibold, fontSize: compact ? 14 : 15 }}>{label}</Text>
    </Pressable>
  );
}

/** Round icon button, as used in headers and floating over covers. */
export function IconButton({
  icon,
  onPress,
  label,
  badge,
  active,
  glass,
  color,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  badge?: number;
  active?: boolean;
  /** Translucent white, for use on top of imagery. */
  glass?: boolean;
  color?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.iconBtn,
        glass ? { backgroundColor: 'rgba(255,255,255,0.92)' } : shadow.sm,
        active && { backgroundColor: C.goldSoft },
        pressed && styles.pressed,
      ]}>
      <Ionicons name={icon} size={20} color={color ?? (active ? C.goldDark : C.ink)} />
      {badge ? (
        <View style={styles.badge}>
          <Text style={{ color: C.ink, fontSize: 10, fontFamily: F.semibold }}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search vendors and categories',
  onPress,
  autoFocus,
}: {
  value?: string;
  onChangeText?: (s: string) => void;
  placeholder?: string;
  /** Makes the bar a button (e.g. to jump to Explore) instead of an input. */
  onPress?: () => void;
  autoFocus?: boolean;
}) {
  const inner = (
    <>
      <Ionicons name="search" size={18} color={C.faint} style={{ marginRight: S.sm }} />
      {onPress ? (
        <T size={14} color={C.faint} style={{ flex: 1 }}>
          {placeholder}
        </T>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.faint}
          autoFocus={autoFocus}
          returnKeyType="search"
          accessibilityLabel="Search vendors"
          style={[styles.searchInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as unknown as TextStyle)]}
        />
      )}
      {!onPress && value ? (
        <Pressable onPress={() => onChangeText?.('')} hitSlop={8} accessibilityLabel="Clear search">
          <Ionicons name="close-circle" size={18} color={C.faint} />
        </Pressable>
      ) : null}
    </>
  );
  if (onPress) {
    return (
      <Pressable accessibilityRole="search" onPress={onPress} style={({ pressed }) => [styles.search, pressed && styles.pressed]}>
        {inner}
      </Pressable>
    );
  }
  return <View style={styles.search}>{inner}</View>;
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }} accessibilityLabel={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={value >= i - 0.25 ? 'star' : value >= i - 0.75 ? 'star-half' : 'star-outline'}
          size={size}
          color={C.gold}
        />
      ))}
    </View>
  );
}

/** Compact "★ 4.8 (124)" rating. */
export function Rating({ value, count, size = 13 }: { value: number; count?: number; size?: number }) {
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center' }}
      accessibilityLabel={`Rated ${value.toFixed(1)} out of 5${count ? ` from ${count} reviews` : ''}`}>
      <Ionicons name="star" size={size} color={C.gold} style={{ marginRight: 3 }} />
      <T size={size} semi>
        {value.toFixed(1)}
      </T>
      {count !== undefined && (
        <T size={size} color={C.sub}>
          {' '}({count})
        </T>
      )}
    </View>
  );
}

export function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} onPress={() => onChange(i)} hitSlop={6} accessibilityLabel={`${i} stars`}>
          <Ionicons name={value >= i ? 'star' : 'star-outline'} size={30} color={C.gold} style={{ marginRight: 6 }} />
        </Pressable>
      ))}
    </View>
  );
}

export function Row({
  left,
  right,
  bold,
  color,
  sub,
}: {
  left: string;
  right: string;
  bold?: boolean;
  color?: string;
  sub?: string;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: S.md }}>
        <T size={14} bold={bold} color={color ?? (bold ? C.ink : C.sub)}>
          {left}
        </T>
        {sub ? (
          <T size={12} color={C.faint}>
            {sub}
          </T>
        ) : null}
      </View>
      <T size={14} bold={bold} semi={!bold} color={color}>
        {right}
      </T>
    </View>
  );
}

export function Divider({ dashed, style }: { dashed?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        { height: 0, borderTopWidth: 1, borderColor: C.line, marginVertical: S.sm },
        dashed && { borderStyle: 'dashed' },
        style,
      ]}
    />
  );
}

/**
 * A number you can type into. Typing is free-form; the value is cleaned up and clamped
 * to [min, max] when the field loses focus or the keyboard's Done is pressed.
 */
export function NumberInput({
  value,
  onCommit,
  min,
  max,
  label,
  style,
}: {
  value: number;
  onCommit: (n: number) => void;
  min: number;
  max: number;
  label: string;
  style?: StyleProp<TextStyle>;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const n = parseInt(draft, 10);
    setDraft(null);
    if (!Number.isNaN(n)) onCommit(Math.min(max, Math.max(min, n)));
  };
  return (
    <TextInput
      value={draft ?? String(value)}
      onChangeText={(t) => setDraft(t.replace(/[^0-9]/g, ''))}
      onFocus={() => setDraft(String(value))}
      onBlur={commit}
      onSubmitEditing={commit}
      keyboardType="number-pad"
      inputMode="numeric"
      returnKeyType="done"
      selectTextOnFocus
      maxLength={String(max).length}
      accessibilityLabel={label}
      accessibilityHint={`Type a number from ${min} to ${max}`}
      style={[
        { fontFamily: F.semibold, padding: 0, textAlign: 'center' },
        Platform.OS === 'web' && ({ outlineStyle: 'none' } as unknown as TextStyle),
        style,
      ]}
    />
  );
}

export function Stepper({
  value,
  max,
  onChange,
  label,
  light,
  step = 1,
  min = 0,
  editable,
  hideValue,
  suffix,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  label: string;
  /** White-on-colour variant for use on brand backgrounds. */
  light?: boolean;
  /** How far one tap on - or + moves. */
  step?: number;
  min?: number;
  /** Let the number in the middle be typed. */
  editable?: boolean;
  /** Buttons only, for when the value is shown elsewhere. */
  hideValue?: boolean;
  /** Unit shown after the value, e.g. "hrs". */
  suffix?: string;
}) {
  const btn = (name: 'add' | 'remove', next: number, off: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name === 'add' ? 'Increase' : 'Decrease'} ${label}`}
      disabled={off}
      onPress={() => onChange(next)}
      hitSlop={4}
      style={({ pressed }) => [
        styles.stepBtn,
        light
          ? { backgroundColor: 'rgba(255,255,255,0.2)' }
          : name === 'add'
            ? { backgroundColor: C.brand }
            : { backgroundColor: C.brandSoft },
        off && { opacity: 0.35 },
        pressed && styles.pressed,
      ]}>
      <Ionicons name={name} size={18} color={light || name === 'add' ? '#fff' : C.brandDark} />
    </Pressable>
  );
  const fg = light ? '#fff' : C.ink;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: hideValue ? S.sm : 0 }}>
      {btn('remove', Math.max(min, value - step), value <= min)}
      {hideValue ? null : editable ? (
        <NumberInput
          value={value}
          onCommit={onChange}
          min={min}
          max={max}
          label={label}
          style={[styles.stepInput, { color: fg, borderBottomColor: light ? 'rgba(255,255,255,0.4)' : C.line }]}
        />
      ) : (
        <Text style={{ minWidth: 46, textAlign: 'center', fontFamily: F.semibold, fontSize: 16, color: fg }}>
          {value}
          {suffix ? <Text style={{ fontFamily: F.regular, fontSize: 12, color: light ? '#fff' : C.sub }}> {suffix}</Text> : null}
        </Text>
      )}
      {btn('add', Math.min(max, value + step), value >= max)}
    </View>
  );
}

export function Notice({
  tone = 'brand',
  title,
  children,
}: {
  tone?: 'brand' | 'good' | 'warn' | 'bad';
  title: string;
  children?: React.ReactNode;
}) {
  const map = {
    brand: [C.brandTint, C.brandDark, 'shield-checkmark'],
    good: [C.greenSoft, C.green, 'checkmark-circle'],
    warn: [C.amberSoft, C.amber, 'alert-circle'],
    bad: [C.redSoft, C.red, 'warning'],
  } as const;
  const [bg, fg, icon] = map[tone];
  return (
    <View style={[styles.notice, { backgroundColor: bg }]}>
      <View style={styles.noticeIcon}>
        <Ionicons name={icon} size={16} color={fg} />
      </View>
      <View style={{ flex: 1 }}>
        <T size={14} bold color={fg}>
          {title}
        </T>
        {children ? (
          <T size={13} color={fg} style={{ marginTop: 2, opacity: 0.9 }}>
            {children}
          </T>
        ) : null}
      </View>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipOn, pressed && styles.pressed]}>
      {icon && <Ionicons name={icon} size={14} color={active ? '#fff' : C.sub} style={{ marginRight: 6 }} />}
      <Text style={{ color: active ? '#fff' : C.ink, fontFamily: F.medium, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

/** Horizontal chip strip that bleeds to the screen edge. */
export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -S.lg }}
      contentContainerStyle={{ paddingHorizontal: S.lg, paddingVertical: 2 }}>
      {children}
    </ScrollView>
  );
}

export function Dots({ count, active, light }: { count: number; active: number; light?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            height: 6,
            width: i === active ? 18 : 6,
            borderRadius: 3,
            backgroundColor: light
              ? i === active
                ? '#fff'
                : 'rgba(255,255,255,0.5)'
              : i === active
                ? C.brand
                : '#D9D3C4',
          }}
        />
      ))}
    </View>
  );
}

/** Small icon-in-a-circle used for list leading icons. */
export function IconBubble({
  icon,
  bg = C.goldSoft,
  color = C.goldDark,
  size = 40,
}: {
  icon: IconName;
  bg?: string;
  color?: string;
  size?: number;
}) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={size * 0.48} color={color} />
    </View>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: S.xxl, paddingHorizontal: S.xl }}>
      <View style={styles.emptyHalo}>
        <IconBubble icon={icon} size={72} />
      </View>
      <T size={18} bold center style={{ marginTop: S.lg }}>
        {title}
      </T>
      <T size={14} color={C.sub} center style={{ marginTop: S.xs, marginBottom: S.lg }}>
        {body}
      </T>
      {action}
    </View>
  );
}

/** Labelled text input with a hint or an error line under it. */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  keyboardType,
  maxLength,
  multiline,
  autoCapitalize,
  optional,
  secure,
  autoComplete,
  returnKeyType,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (s: string) => void;
  /** Password field with a show/hide toggle. */
  secure?: boolean;
  /** Lets browsers and password managers fill the field. */
  autoComplete?: 'name' | 'email' | 'tel' | 'password' | 'new-password' | 'off';
  returnKeyType?: 'next' | 'done' | 'go';
  onSubmitEditing?: () => void;
  placeholder?: string;
  hint?: string;
  /** Shown in red instead of the hint. */
  error?: string | false;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad' | 'email-address';
  maxLength?: number;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  optional?: boolean;
}) {
  const [shown, setShown] = useState(false);
  return (
    <View style={{ marginBottom: S.lg }}>
      <T size={13} semi style={{ marginBottom: 6 }}>
        {label}
        {optional ? (
          <T size={12} color={C.faint}>
            {'  '}Optional
          </T>
        ) : null}
      </T>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.faint}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        autoCapitalize={secure || autoComplete === 'email' ? 'none' : autoCapitalize}
        autoCorrect={secure || autoComplete === 'email' ? false : undefined}
        secureTextEntry={secure && !shown}
        autoComplete={autoComplete}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        accessibilityLabel={label}
        style={[
          styles.field,
          secure && { paddingRight: 48 },
          multiline && { height: 96, paddingTop: 12, textAlignVertical: 'top' },
          !!error && { borderColor: C.red },
          Platform.OS === 'web' && ({ outlineStyle: 'none' } as unknown as TextStyle),
        ]}
      />
      {secure ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={shown ? 'Hide password' : 'Show password'}
          onPress={() => setShown(!shown)}
          hitSlop={8}
          style={styles.eye}>
          <Ionicons name={shown ? 'eye-off-outline' : 'eye-outline'} size={20} color={C.sub} />
        </Pressable>
      ) : null}
      {error ? (
        <T size={12} color={C.red} style={{ marginTop: 4 }}>
          {error}
        </T>
      ) : hint ? (
        <T size={12} color={C.sub} style={{ marginTop: 4 }}>
          {hint}
        </T>
      ) : null}
    </View>
  );
}

export function CheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: S.sm }, pressed && { opacity: 0.8 }]}>
      <View style={[styles.checkbox, checked && { backgroundColor: C.brand, borderColor: C.brand }]}>
        {checked ? <Ionicons name="checkmark" size={14} color={C.gold} /> : null}
      </View>
      <T size={14} style={{ flex: 1, marginLeft: S.md }}>
        {label}
      </T>
    </Pressable>
  );
}

export const gap = (n = S.md) => <View style={{ height: n }} />;

const styles = StyleSheet.create({
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  card: {
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.lg,
    marginBottom: S.md,
    ...shadow.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: S.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: R.pill,
    marginRight: 6,
    marginBottom: 6,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: S.xl,
    borderRadius: R.pill,
    borderWidth: 1,
    minHeight: 52,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: C.gold,
    borderWidth: 2,
    borderColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: R.pill,
    paddingHorizontal: S.lg,
    height: 50,
    ...shadow.md,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: F.regular, color: C.ink, paddingVertical: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 5 },
  field: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: F.regular,
    fontSize: 15,
    color: C.ink,
  },
  eye: { position: 'absolute', right: 14, top: 24, height: 48, justifyContent: 'center' },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: C.faint,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepInput: {
    width: 58,
    marginHorizontal: 6,
    fontSize: 16,
    paddingVertical: 4,
    borderBottomWidth: 1.5,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: { flexDirection: 'row', padding: S.md, borderRadius: R.md, marginBottom: S.md },
  noticeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: S.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: R.pill,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.card,
    marginRight: 8,
  },
  chipOn: { backgroundColor: C.brand, borderColor: C.brand },
  emptyHalo: { padding: 14, borderRadius: 999, backgroundColor: '#FBF6EA' },
  footer: {
    backgroundColor: C.card,
    paddingHorizontal: S.lg,
    paddingTop: S.md,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    boxShadow: '0px -6px 24px rgba(20, 22, 40, 0.08)',
  },
});
