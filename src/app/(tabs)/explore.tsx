import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { TextInputInstance } from 'react-native';
import { View } from 'react-native';

import { DatePicker } from '@/components/DatePicker';
import { startingPrice, VendorCard } from '@/components/VendorCard';
import { Button, Chip, ChipRow, EmptyState, IconButton, PageTitle, Screen, SearchBar, T } from '@/components/ui';
import { vendorAvailableOn } from '@/lib/availability';
import { formatDate } from '@/lib/format';
import { useStore } from '@/lib/store';
import { C, CAT, S } from '@/lib/theme';
import type { Category, City } from '@/lib/types';

type Sort = 'rating' | 'price' | 'reliable';
const CATS: (Category | 'all')[] = ['all', 'venue', 'rental', 'decor', 'planner'];
const CITIES: (City | 'all')[] = ['all', 'Abuja', 'Lagos'];

export default function Explore() {
  const params = useLocalSearchParams<{ cat?: string; saved?: string; focus?: string }>();
  const { eventDate, setEventDate, bookings, saved, vendors } = useStore();
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [city, setCity] = useState<City | 'all'>('all');
  const [sort, setSort] = useState<Sort>('rating');
  const [onlyFree, setOnlyFree] = useState(true);
  const [onlySaved, setOnlySaved] = useState(false);
  const [q, setQ] = useState('');

  const searchRef = useRef<TextInputInstance>(null);

  // Shortcuts from other screens (a category, Saved, or the search bar) arrive as params.
  // Apply them, then clear them, so the same shortcut works again next time even though
  // this tab stays mounted.
  useEffect(() => {
    if (!params.cat && !params.saved && !params.focus) return;
    const map: Record<string, Category> = { venues: 'venue', rentals: 'rental', decor: 'decor', planners: 'planner' };
    if (params.cat && map[params.cat]) {
      setCat(map[params.cat]);
      setOnlySaved(false);
    }
    if (params.saved) setOnlySaved(true);
    if (params.focus) searchRef.current?.focus();
    router.setParams({ cat: undefined, saved: undefined, focus: undefined });
  }, [params.cat, params.saved, params.focus]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let l = vendors.filter(
      (v) =>
        (cat === 'all' || v.category === cat) &&
        (city === 'all' || v.city === city) &&
        (!onlySaved || saved.includes(v.id)) &&
        (!needle || [v.name, v.area, v.city, v.tagline, CAT[v.category].plural].join(' ').toLowerCase().includes(needle))
    );
    if (eventDate && onlyFree) l = l.filter((v) => vendorAvailableOn(v, eventDate, bookings));
    return [...l].sort((a, b) =>
      sort === 'rating'
        ? b.rating - a.rating
        : sort === 'price'
          ? startingPrice(a) - startingPrice(b)
          : b.reliability.onTimePct - a.reliability.onTimePct
    );
  }, [vendors, cat, city, sort, eventDate, onlyFree, onlySaved, saved, q, bookings]);

  const clearFilters = () => {
    setCat('all');
    setCity('all');
    setOnlyFree(false);
    setOnlySaved(false);
    setQ('');
  };

  return (
    <Screen safeTop bottom={80}>
      <PageTitle
        title={onlySaved ? 'Saved vendors' : 'Explore'}
        subtitle={`${list.length} ${list.length === 1 ? 'result' : 'results'}${eventDate ? ` · ${formatDate(eventDate)}` : ''}`}
        right={
          <IconButton
            icon={onlySaved ? 'heart' : 'heart-outline'}
            label="Show saved only"
            active={onlySaved}
            badge={onlySaved ? undefined : saved.length}
            onPress={() => setOnlySaved(!onlySaved)}
          />
        }
      />

      <SearchBar value={q} onChangeText={setQ} inputRef={searchRef} />

      <View style={{ height: S.lg }} />
      <ChipRow>
        {CATS.map((c) => (
          <Chip
            key={c}
            label={c === 'all' ? 'All' : CAT[c].plural}
            icon={c === 'all' ? 'apps-outline' : CAT[c].icon}
            active={cat === c}
            onPress={() => setCat(c)}
          />
        ))}
      </ChipRow>
      <View style={{ height: S.sm }} />
      <ChipRow>
        <Chip label="Top rated" icon="star-outline" active={sort === 'rating'} onPress={() => setSort('rating')} />
        <Chip label="Lowest price" icon="pricetag-outline" active={sort === 'price'} onPress={() => setSort('price')} />
        <Chip label="Most reliable" icon="time-outline" active={sort === 'reliable'} onPress={() => setSort('reliable')} />
        {CITIES.map((c) => (
          <Chip
            key={c}
            label={c === 'all' ? 'All cities' : c}
            icon={c === 'all' ? 'location-outline' : undefined}
            active={city === c}
            onPress={() => setCity(c)}
          />
        ))}
      </ChipRow>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: S.xl, marginBottom: S.xs }}>
        <T bold style={{ flex: 1 }}>
          Your date
        </T>
        {eventDate ? (
          <Chip
            label="Free on my date"
            icon={onlyFree ? 'checkmark-circle' : 'ellipse-outline'}
            active={onlyFree}
            onPress={() => setOnlyFree(!onlyFree)}
          />
        ) : (
          <T size={12} color={C.sub}>
            Pick one to see who is free
          </T>
        )}
      </View>
      <DatePicker value={eventDate} onChange={setEventDate} />
      <View style={{ height: S.lg }} />

      {list.length === 0 ? (
        <EmptyState
          icon={onlySaved ? 'heart-outline' : 'search-outline'}
          title={onlySaved && saved.length === 0 ? 'Nothing saved yet' : 'No vendors match'}
          body={
            onlySaved && saved.length === 0
              ? 'Tap the heart on any vendor to keep it here.'
              : 'Try another date, city or search term.'
          }
          action={
            onlySaved && saved.length === 0 ? (
              <Button label="Browse all vendors" compact onPress={() => setOnlySaved(false)} />
            ) : (
              <Button label="Clear filters" kind="secondary" compact onPress={clearFilters} />
            )
          }
        />
      ) : (
        list.map((v) => (
          <VendorCard key={v.id} vendor={v} dateOk={eventDate ? vendorAvailableOn(v, eventDate, bookings) : undefined} />
        ))
      )}
      {list.length > 1 && (
        <T size={12} color={C.faint} center>
          {"That's everyone for these filters."}
        </T>
      )}
    </Screen>
  );
}
