import React, { useRef } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, Text } from 'react-native';

import { chipDate, upcomingDates } from '@/lib/format';
import { C, F, R, S, shadow } from '@/lib/theme';

const DATES = upcomingDates(45, 3);
/** Chip width plus its right margin. */
const CHIP = 66;

export function DatePicker({
  value,
  onChange,
  disabled,
  bleed = S.lg,
}: {
  value: string | null;
  onChange: (iso: string) => void;
  /** ISO dates to show as unavailable. */
  disabled?: (iso: string) => boolean;
  /** Horizontal padding of the parent, so the strip can scroll edge to edge. */
  bleed?: number;
}) {
  const ref = useRef<ScrollViewInstance>(null);
  const scrolled = useRef(false);
  // Bring a date chosen elsewhere (e.g. on a venue calendar) into view, once.
  const reveal = () => {
    const i = value ? DATES.indexOf(value) : -1;
    if (scrolled.current || i < 3) return;
    scrolled.current = true;
    ref.current?.scrollTo({ x: (i - 1) * CHIP, animated: false });
  };
  return (
    <ScrollView
      ref={ref}
      onLayout={reveal}
      onContentSizeChange={reveal}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -bleed }}
      contentContainerStyle={{ paddingVertical: 6, paddingHorizontal: bleed }}>
      {DATES.map((iso) => {
        const { dow, day, month } = chipDate(iso);
        const active = iso === value;
        const off = disabled?.(iso) ?? false;
        return (
          <Pressable
            key={iso}
            accessibilityRole="button"
            accessibilityLabel={`${dow} ${day} ${month}${off ? ', unavailable' : ''}`}
            accessibilityState={{ selected: active, disabled: off }}
            disabled={off}
            onPress={() => onChange(iso)}
            style={[
              {
                width: 58,
                paddingVertical: 10,
                marginRight: 8,
                borderRadius: R.md,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: active ? C.brand : C.line,
                backgroundColor: active ? C.brand : C.card,
                opacity: off ? 0.35 : 1,
              },
              active && shadow.brand,
            ]}>
            <Text style={{ fontSize: 11, fontFamily: F.medium, color: active ? 'rgba(255,255,255,0.85)' : C.sub }}>
              {dow.toUpperCase()}
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontFamily: F.semibold,
                color: active ? '#fff' : C.ink,
                marginVertical: 2,
                textDecorationLine: off ? 'line-through' : 'none',
              }}>
              {day}
            </Text>
            <Text style={{ fontSize: 11, fontFamily: F.regular, color: active ? 'rgba(255,255,255,0.85)' : C.sub }}>{month}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
