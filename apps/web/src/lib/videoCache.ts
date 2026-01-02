export const DC30_APP_VIDEO_PATHS = [
  '/videos/BenvenutoPreIscrizione.mp4',
  '/videos/BenvenutoPostiscrizione.mp4',
  '/videos/balletto.mp4',
] as const;

const CACHE_NAME = 'dc30-video-cache-v1';

function toAbsoluteUrl(url: string): string {
  if (typeof window === 'undefined') return url;
  return new URL(url, window.location.origin).toString();
}

async function fetchAndCache(url: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('caches' in window)) return;

  const absoluteUrl = toAbsoluteUrl(url);
  const cache = await caches.open(CACHE_NAME);
  const existing = await cache.match(absoluteUrl);
  if (existing) return;

  const res = await fetch(absoluteUrl, { cache: 'reload' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  await cache.put(absoluteUrl, res.clone());
}

/**
 * Scarica i video “core” all’avvio e li salva in Cache Storage.
 * Best-effort: non lancia errori verso l’esterno.
 */
export async function prefetchAppVideos(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('caches' in window)) return;

  await Promise.allSettled(DC30_APP_VIDEO_PATHS.map((p) => fetchAndCache(p)));
}

/**
 * Ritorna una `src` per <video> che usa la versione cached se disponibile.
 * Se è in cache, ritorna una blob URL + una funzione di cleanup (revoke).
 */
export async function getCachedVideoSrc(
  url: string
): Promise<{ src: string; revoke?: () => void }> {
  if (typeof window === 'undefined') return { src: url };
  if (!('caches' in window)) return { src: url };

  try {
    const absoluteUrl = toAbsoluteUrl(url);
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(absoluteUrl);
    if (!cached) {
      // Best-effort: prova a popolare la cache in background
      fetchAndCache(url).catch(() => {});
      return { src: url };
    }

    const blob = await cached.blob();
    const objectUrl = URL.createObjectURL(blob);
    return { src: objectUrl, revoke: () => URL.revokeObjectURL(objectUrl) };
  } catch {
    return { src: url };
  }
}

