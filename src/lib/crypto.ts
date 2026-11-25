import * as Crypto from 'expo-crypto';

import type { Hasher } from './auth';

/** SHA-256 hex digest via expo-crypto (works on iOS, Android and web). */
export const sha256: Hasher = (data) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data);

/** Random hex string from a cryptographically secure source. */
export function randomHex(bytes = 16) {
  return Array.from(Crypto.getRandomBytes(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}

export const newId = () => Crypto.randomUUID();
