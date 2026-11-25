import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dayStatus, monthGrid, type DayStatus } from '@/lib/availability';
import { parseISO } from '@/lib/format';
import { C, F, R, S } from '@/lib/theme';
import type { Booking, Vendor } from '@/lib/types';
import { T } from './ui';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
/** How far ahead hosts can look. */
const MONTHS_AHEAD = 6;

const LOOK: Record<DayStatus, { bg: string; fg: string; label: string }> = {
  free: { bg: C.card, fg: C.ink, label: 'free' },
  booked: { bg: '#F1EEE7', fg: C.faint, label: 'booked' },
  mine: { bg: C.goldSoft, fg: C.goldDark, label: 'your booking' },
  soon: { bg: 'transparent', fg: C.faint, label: 'needs 3 days notice' },
  past: { bg: 'transparent', fg: '#D5D0C6', label: 'past' },
};

/**
 * Month view of an event centre's diary. Free days can be picked; booked, past and
 * too-soon days can't. The host's own bookings show in gold.
 */
export function AvailabilityCalendar({
  vendor,
  bookings,
  value,
  onSelect,
}: {
  vendor: Vendor;
  bookings: Booking[];
  value: string | null;
  onSelect: (iso: string) => void;
}) {
  const now = new Date();
  const start = { y: now.getFullYear(), m: now.getMonth() };
  // Follow the selected date's month (it may arrive after first render, once saved state
  // loads) until the host pages through months themselves. With under a week of this month
  // left, open on next month instead.
  const [manual, setManual] = useState<number | null>(null);
  const daysLeft = new Date(start.y, start.m + 1, 0).getDate() - now.getDate();
  const target = value ? parseISO(value) : null;
  const auto = target ? (target.getFullYear() - start.y) * 12 + target.getMonth() - start.m : daysLeft < 7 ? 1 : 0;
  const offset = Math.min(MONTHS_AHEAD - 1, Math.max(0, manual ?? auto));
  const setOffset = (n: number) => setManual(n);
  const y = start.y + Math.floor((start.m + offset) / 12);
  const m = (start.m + offset) % 12;
  const cells = monthGrid(y, m);
  const statuses = cells.map((iso) => (iso ? dayStatus(vendor, iso, bookings, now) : null));
  const free = statuses.filter((s) => s === 'free').length;
  const booked = statuses.filter((s) => s === 'booked').length;

  const arrow = (dir: -1 | 1) => {
    const off = dir < 0 ? offset === 0 : offset === MONTHS_AHEAD - 1;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={dir < 0 ? 'Previous month' : 'Next month'}
        disabled={off}
        onPress={() => setOffset(offset + dir)}
        hitSlop={8}
        style={({ pressed }) => [styles.arrow, off && { opacity: 0.3 }, pressed && { opacity: 0.6 }]}>
        <Ionicons name={dir < 0 ? 'chevron-back' : 'chevron-forward'} size={18} color={C.ink} />
      </Pressable>
    );
  };

  return (
    <View>
      <View style={styles.header}>
        {arrow(-1)}
        <View style={{ alignItems: 'center' }}>
          <T size={16} bold>
            {MONTHS[m]} {y}
          </T>
          <T size={12} color={C.sub}>
            {free} free · {booked} booked
          </T>
        </View>
        {arrow(1)}
      </View>

      <View style={styles.row}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((iso, i) => {
          if (!iso) return <View key={`pad-${i}`} style={styles.cell} />;
          const st = statuses[i]!;
          const look = LOOK[st];
          const selected = iso === value && (st === 'free' || st === 'mine');
          const day = Number(iso.slice(8));
          const pickable = st === 'free';
          const date = parseISO(iso);
          return (
            <View key={iso} style={styles.cell}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${WEEKDAYS[(date.getDay() + 6) % 7]} ${day} ${MONTHS[m]}, ${look.label}`}
                accessibilityState={{ selected, disabled: !pickable }}
                disabled={!pickable}
                onPress={() => onSelect(iso)}
                style={({ pressed }) => [
                  styles.day,
                  { backgroundColor: look.bg },
                  st === 'free' && styles.dayFree,
                  selected && styles.daySelected,
                  pressed && { opacity: 0.8 },
                ]}>
                <Text
                  style={[
                    styles.dayText,
                    { color: selected ? '#fff' : look.fg },
                    st === 'booked' && { textDecorationLine: 'line-through' },
                    st === 'free' && { fontFamily: F.medium },
                  ]}>
                  {day}
                </Text>
                {st === 'mine' && <View style={styles.mineDot} />}
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.legend}>
        {(
          [
            ['free', 'Free'],
            ['booked', 'Booked'],
            ['mine', 'Yours'],
          ] as const
        ).map(([k, label]) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', marginRight: S.lg }}>
            <View style={[styles.swatch, { backgroundColor: LOOK[k].bg }, k === 'free' && styles.dayFree]} />
            <T size={12} color={C.sub}>
              {label}
            </T>
          </View>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={[styles.swatch, { backgroundColor: C.brand }]} />
          <T size={12} color={C.sub}>
            Selected
          </T>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.md },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.card,
  },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontFamily: F.medium, fontSize: 11, color: C.sub, marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  day: { flex: 1, borderRadius: R.sm, alignItems: 'center', justifyContent: 'center' },
  dayFree: { borderWidth: 1, borderColor: C.line },
  daySelected: { backgroundColor: C.brand, borderColor: C.brand },
  dayText: { fontFamily: F.regular, fontSize: 14 },
  mineDot: { position: 'absolute', bottom: 5, width: 4, height: 4, borderRadius: 2, backgroundColor: C.goldDark },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: S.md },
  swatch: { width: 14, height: 14, borderRadius: 4, marginRight: 6 },
});
