import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { Cover } from '@/components/Cover';
import { startingPrice } from '@/components/VendorCard';
import { Button, Card, EmptyState, IconBubble, IconButton, Notice, Pill, Rating, Screen, SectionHeader, Stars, T } from '@/components/ui';
import { getVendor, MARKET_AVG } from '@/data/vendors';
import { dayStatus, unitsLeft } from '@/lib/availability';
import { chipDate, formatDate, naira } from '@/lib/format';
import { POLICIES } from '@/lib/policies';
import { useStore } from '@/lib/store';
import { C, CAT, R, S, shadow } from '@/lib/theme';

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ marginBottom: S.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <T size={13} color={C.sub}>
          {label}
        </T>
        <T size={13} bold>
          {value.toFixed(1)}
        </T>
      </View>
      <View style={{ height: 8, backgroundColor: C.goldSoft, borderRadius: 4 }}>
        <View style={{ height: 8, width: `${(value / 5) * 100}%`, backgroundColor: C.gold, borderRadius: 4 }} />
      </View>
    </View>
  );
}

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={18} color={C.goldDark} />
      <T size={16} bold style={{ marginTop: 4 }}>
        {value}
      </T>
      <T size={11} color={C.sub} center>
        {label}
      </T>
    </View>
  );
}

export default function VendorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { eventDate, setEventDate, bookings, toggleSaved, saved } = useStore();
  const v = getVendor(id);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!v)
    return (
      <Screen safeTop>
        <EmptyState
          icon="help-circle-outline"
          title="Vendor not found"
          body="This vendor may have been removed."
          action={<Button label="Back to explore" onPress={() => router.replace('/explore')} />}
        />
      </Screen>
    );

  const policy = POLICIES[v.policy];
  const r = v.reliability;
  const cat = CAT[v.category];
  const isSaved = saved.includes(v.id);
  const isVenue = v.category === 'venue';
  const picked = eventDate ? dayStatus(v, eventDate, bookings) : null;
  const short = eventDate ? chipDate(eventDate) : null;
  const bookLabel = isVenue && short && picked === 'free' ? `Book ${short.day} ${short.month}` : 'Book now';

  return (
    <Screen
      pad={false}
      footer={
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <T size={12} color={C.sub}>
              Starting from
            </T>
            <T size={20} bold color={C.brand}>
              {naira(startingPrice(v))}
            </T>
          </View>
          <View style={{ flex: 1.3 }}>
            <Button label={bookLabel} icon="calendar" onPress={() => router.push(`/book/${v.id}`)} />
          </View>
        </View>
      }>
      <Cover category={v.category} seed={v.id} photo={v.photo} height={300 + insets.top}>
        <View style={[styles.topBar, { paddingTop: insets.top + S.sm }]}>
          <IconButton icon="chevron-back" label="Back" glass onPress={back} />
          <IconButton
            icon={isSaved ? 'heart' : 'heart-outline'}
            label={isSaved ? 'Remove from saved' : 'Save vendor'}
            glass
            color={isSaved ? C.gold : C.ink}
            onPress={() => toggleSaved(v.id)}
          />
        </View>
      </Cover>

      <View style={styles.sheet}>
        <View style={{ flexDirection: 'row', marginBottom: S.sm }}>
          <Pill label={cat.label} icon={cat.icon} tone="brand" />
          <Pill label="Verified" icon="shield-checkmark" tone="good" />
          {v.outdoor ? <Pill label="Outdoor" icon="sunny-outline" /> : null}
        </View>
        <T size={26} bold>
          {v.name}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Ionicons name="location" size={14} color={C.goldDark} />
          <T size={14} color={C.sub} style={{ marginLeft: 4, flex: 1 }}>
            {v.area}, {v.city}
            {v.capacity ? ` · Up to ${v.capacity} guests` : ''}
          </T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: S.sm }}>
          <Rating value={v.rating} size={15} />
          <T size={13} color={C.sub} style={{ marginLeft: 6 }}>
            {v.ratingCount} verified reviews
          </T>
        </View>

        <View style={styles.verified}>
          <Ionicons name="shield-checkmark" size={16} color={C.green} />
          <T size={12} color={C.green} style={{ flex: 1, marginLeft: 6 }}>
            ID, business registration and payout account checked. {cat.plural === 'Venues' ? 'Venue' : 'Stock'} inspected in
            person.
          </T>
        </View>

        <View style={styles.stats}>
          <Stat icon="time-outline" value={`${r.onTimePct}%`} label="On time" />
          <Stat icon="checkmark-done-outline" value={String(r.completed)} label="Jobs done" />
          <Stat icon="chatbubble-ellipses-outline" value={`${r.responseMins}m`} label="Reply time" />
          <Stat icon="close-circle-outline" value={`${r.cancelledPct}%`} label="Cancelled" />
        </View>

        <SectionHeader title="About" />
        <T size={14} color={C.sub} style={{ marginBottom: S.sm }}>
          {v.tagline}
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: S.xl }}>
          <Ionicons name="car-outline" size={16} color={C.sub} style={{ marginTop: 2, marginRight: 6 }} />
          <T size={13} color={C.sub} style={{ flex: 1 }}>
            {v.arrival}
          </T>
        </View>

        {isVenue && (
          <>
            <SectionHeader title="Availability" />
            <Card>
              <AvailabilityCalendar vendor={v} bookings={bookings} value={eventDate} onSelect={setEventDate} />
              {eventDate && picked && picked !== 'free' ? (
                <View style={styles.dateNote}>
                  <Ionicons
                    name={picked === 'mine' ? 'checkmark-circle' : 'alert-circle'}
                    size={16}
                    color={picked === 'mine' ? C.goldDark : C.red}
                  />
                  <T size={12} color={picked === 'mine' ? C.goldDark : C.red} style={{ flex: 1, marginLeft: 6 }}>
                    {picked === 'mine'
                      ? `You already have this venue on ${formatDate(eventDate)}.`
                      : `Your saved date, ${formatDate(eventDate)}, is ${picked === 'booked' ? 'already booked here' : 'too soon to book'}. Pick a free day.`}
                  </T>
                </View>
              ) : eventDate ? (
                <View style={styles.dateNote}>
                  <Ionicons name="checkmark-circle" size={16} color={C.green} />
                  <T size={12} color={C.green} style={{ flex: 1, marginLeft: 6 }}>
                    {formatDate(eventDate)} is free. Tap Book to hold it.
                  </T>
                </View>
              ) : null}
            </Card>
          </>
        )}

        <SectionHeader title="What you can book" style={isVenue ? { marginTop: S.lg } : undefined} />
        {eventDate ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: S.md, marginTop: -S.xs }}>
            <Ionicons name="calendar-outline" size={14} color={C.sub} />
            <T size={13} color={C.sub} style={{ marginLeft: 6 }}>
              Availability for {formatDate(eventDate)}
            </T>
          </View>
        ) : (
          <Notice tone="warn" title="Pick a date on Home or Explore to see stock left." />
        )}
        {v.items.map((i) => {
          const left = eventDate ? unitsLeft(v, i, eventDate, bookings) : null;
          const avg = MARKET_AVG[i.kind];
          const diff = avg ? Math.round(((i.price - avg) / avg) * 100) : null;
          return (
            <Card key={i.id} style={{ padding: S.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: S.md }}>
                  <T semi>{i.name}</T>
                  <T size={12} color={C.sub}>
                    per {i.unit}
                  </T>
                </View>
                <T size={16} bold color={C.brandDark}>
                  {naira(i.price)}
                </T>
              </View>
              {(left !== null || diff !== null || i.returnable) && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: S.sm }}>
                  {left !== null && (
                    <Pill
                      label={left === 0 ? 'Fully booked' : `${left} left`}
                      tone={left === 0 ? 'bad' : left < i.stock * 0.2 ? 'warn' : 'good'}
                      icon={left === 0 ? 'close-circle-outline' : 'cube-outline'}
                    />
                  )}
                  {diff !== null && (
                    <Pill
                      label={diff === 0 ? 'At average price' : `${Math.abs(diff)}% ${diff > 0 ? 'above' : 'below'} avg`}
                      tone={diff > 10 ? 'warn' : diff < -10 ? 'good' : 'neutral'}
                      icon="pricetag-outline"
                    />
                  )}
                  {i.returnable && <Pill label="Return check" icon="checkbox-outline" />}
                </View>
              )}
            </Card>
          );
        })}

        <SectionHeader title="Ratings breakdown" style={{ marginTop: S.lg }} />
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: S.lg }}>
            <T size={40} bold style={{ lineHeight: 46 }}>
              {v.rating.toFixed(1)}
            </T>
            <View style={{ marginLeft: S.md }}>
              <Stars value={v.rating} size={16} />
              <T size={12} color={C.sub}>
                {v.ratingCount} verified reviews
              </T>
            </View>
          </View>
          <Bar label="Punctuality" value={v.sub.punctuality} />
          <Bar label="As described" value={v.sub.asDescribed} />
          <Bar label="Value for money" value={v.sub.value} />
          <Bar label="Communication" value={v.sub.communication} />
        </Card>

        <SectionHeader title="Policies" style={{ marginTop: S.lg }} />
        <Card style={{ flexDirection: 'row' }}>
          <IconBubble icon="shield-checkmark" size={40} />
          <View style={{ flex: 1, marginLeft: S.md }}>
            <T bold>{policy.label} cancellation</T>
            <T size={13} color={C.sub} style={{ marginTop: 2 }}>
              {policy.summary}
            </T>
            <T size={13} color={C.sub} style={{ marginTop: 4 }}>
              Deposit to confirm: <T size={13} bold>{policy.depositPct}%</T>. Vendor no-shows are always refunded in full.
            </T>
          </View>
        </Card>

        {v.power && (
          <Card style={{ flexDirection: 'row' }}>
            <IconBubble icon="flash" size={40} bg={C.goldSoft} color={C.amber} />
            <View style={{ flex: 1, marginLeft: S.md }}>
              <T bold>Power</T>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: S.sm }}>
                <Pill label={`${v.power.kva} kVA generator`} icon="flash-outline" />
                <Pill
                  label={v.power.autoChangeover ? 'Auto changeover' : 'Manual changeover'}
                  tone={v.power.autoChangeover ? 'good' : 'warn'}
                />
                <Pill
                  label={v.power.fuelIncluded ? 'Fuel included' : `Fuel ${naira(v.power.fuelFee ?? 0)}`}
                  tone={v.power.fuelIncluded ? 'good' : 'warn'}
                />
              </View>
              {v.capacity ? (
                <T size={13} color={C.sub}>
                  Seats up to {v.capacity} guests.{v.outdoor ? ' Outdoor: rain cover advised.' : ''}
                </T>
              ) : null}
            </View>
          </Card>
        )}

        <SectionHeader title={`Reviews (${v.reviews.length})`} style={{ marginTop: S.lg }} />
        {v.reviews.map((rev) => (
          <Card key={rev.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.avatar}>
                <T bold color={C.goldDark}>
                  {rev.author.charAt(0).toUpperCase()}
                </T>
              </View>
              <View style={{ flex: 1, marginLeft: S.md }}>
                <T semi>{rev.author}</T>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={12} color={C.green} />
                  <T size={12} color={C.green} style={{ marginLeft: 3 }}>
                    Verified booking
                  </T>
                </View>
              </View>
              <Stars value={rev.stars} size={13} />
            </View>
            <T size={14} color={C.ink} style={{ marginTop: S.md }}>
              {rev.text}
            </T>
          </Card>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: S.lg,
  },
  sheet: {
    marginTop: -R.xl,
    backgroundColor: C.bg,
    borderTopLeftRadius: R.xl,
    borderTopRightRadius: R.xl,
    padding: S.lg,
    paddingTop: S.xl,
  },
  dateNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: S.md,
    paddingTop: S.md,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  verified: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.greenSoft,
    borderRadius: R.md,
    padding: S.sm,
    paddingHorizontal: S.md,
    marginTop: S.md,
  },
  stats: {
    flexDirection: 'row',
    gap: S.sm,
    marginTop: S.lg,
    marginBottom: S.xl,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: S.md,
    paddingHorizontal: 4,
    backgroundColor: C.card,
    borderRadius: R.md,
    ...shadow.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
