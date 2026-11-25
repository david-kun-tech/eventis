import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { photoUrl } from '@/lib/photos';
import { CAT } from '@/lib/theme';
import type { Category } from '@/lib/types';

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * A photo laid over the illustrated art. The art stays underneath as the loading
 * placeholder and as the fallback when the photo cannot load (offline, blocked CDN).
 */
function Photo({ id, width, height }: { id: string; width: number; height?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Image
      source={{ uri: photoUrl(id, width, height) }}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      transition={250}
      cachePolicy="memory-disk"
      onError={() => setFailed(true)}
      accessible={false}
    />
  );
}

/**
 * Vendor cover: the vendor's photo when it has one, over a soft category-coloured
 * illustration that varies with the vendor id.
 */
export function Cover({
  category,
  seed,
  height,
  radius = 0,
  children,
  style,
  photo,
}: {
  category: Category;
  seed: string;
  height: number;
  photo?: string;
  radius?: number;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const c = CAT[category];
  const h = hash(seed);
  const flip = h % 2 === 0;
  const big = height * 1.15;
  const emblem = Math.min(96, Math.max(52, height * 0.38));
  const confetti = [0, 1, 2, 3, 4].map((i) => {
    const k = hash(seed + i);
    return { left: `${8 + (k % 84)}%`, top: `${10 + ((k >> 3) % 75)}%`, size: 5 + (k % 7), ring: k % 3 === 0 } as const;
  });

  return (
    <View style={[{ height, borderRadius: radius, overflow: 'hidden', backgroundColor: c.bg }, style]}>
      <View
        style={{
          position: 'absolute',
          width: big,
          height: big,
          borderRadius: big / 2,
          backgroundColor: c.deep,
          top: -big * 0.35,
          ...(flip ? { right: -big * 0.25 } : { left: -big * 0.25 }),
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: big * 0.6,
          height: big * 0.6,
          borderRadius: big,
          borderWidth: 14,
          borderColor: 'rgba(255,255,255,0.45)',
          bottom: -big * 0.28,
          ...(flip ? { left: -big * 0.1 } : { right: -big * 0.1 }),
        }}
      />
      {confetti.map((d, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: d.left,
            top: d.top,
            width: d.size,
            height: d.size,
            borderRadius: d.size,
            backgroundColor: d.ring ? 'transparent' : c.fg,
            borderWidth: d.ring ? 2 : 0,
            borderColor: c.fg,
            opacity: 0.35,
          }}
        />
      ))}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: emblem,
            height: emblem,
            borderRadius: emblem / 2,
            backgroundColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0px 10px 24px rgba(20, 22, 40, 0.12)',
          }}>
          <Ionicons name={c.icon} size={emblem * 0.44} color={c.fg} />
        </View>
      </View>
      {photo ? (
        <>
          <Photo id={photo} width={1000} />
          {/* Light scrim so white chips and buttons stay legible on bright photos. */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 18, 34, 0.08)' }]} />
        </>
      ) : null}
      {children ? <View style={StyleSheet.absoluteFill}>{children}</View> : null}
    </View>
  );
}

/** Square thumbnail version for list rows. */
export function Thumb({
  category,
  size = 56,
  radius = 16,
  photo,
}: {
  category: Category;
  size?: number;
  radius?: number;
  photo?: string;
}) {
  const c = CAT[category];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: c.bg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size,
          backgroundColor: c.deep,
          top: -size * 0.45,
          right: -size * 0.35,
        }}
      />
      <Ionicons name={c.icon} size={size * 0.42} color={c.fg} />
      {photo ? <Photo id={photo} width={size * 3} height={size * 3} /> : null}
    </View>
  );
}
