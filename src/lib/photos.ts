/**
 * Builds a sized Unsplash CDN URL. Requesting roughly 2x the display size keeps photos
 * sharp on high-density screens without downloading the multi-megabyte original.
 */
export function photoUrl(id: string, width: number, height?: number) {
  const size = height ? `&w=${width}&h=${height}&fit=crop` : `&w=${width}`;
  return `https://images.unsplash.com/${id}?auto=format&q=70${size}`;
}
