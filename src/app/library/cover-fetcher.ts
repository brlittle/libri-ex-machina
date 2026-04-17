/**
 * Cover image fetcher.
 *
 * Sources (all free, no API key required):
 *   Books      → Open Library Covers API      (covers.openlibrary.org)
 *   Music      → MusicBrainz + Cover Art Archive (musicbrainz.org / coverartarchive.org)
 *   Movies     → Wikipedia pageimages API      (en.wikipedia.org)
 *   Games      → Wikipedia pageimages API      (en.wikipedia.org)
 *   Audiobooks → Open Library Covers API
 *
 * Returns a direct image URL, or null if nothing is found.
 * The caller is responsible for the fallback UI.
 */

import type { LibraryItem } from "./types";

const UA = { "User-Agent": "Libri Ex Machina" };

// ── Book covers ───────────────────────────────────────────────────────────────

/** Fetch a book cover from Open Library by ISBN (fast path, direct URL). */
export function bookCoverByISBN(isbn: string): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

/** Search Open Library by title (+optional author) and return a cover URL. */
export async function fetchBookCover(
  title: string,
  creator?: string
): Promise<string | null> {
  try {
    const q = encodeURIComponent(creator ? `${title} ${creator}` : title);
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${q}&limit=1&fields=cover_i`,
      { signal: AbortSignal.timeout(6000), headers: UA }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const coverId = json.docs?.[0]?.cover_i;
    if (!coverId) return null;
    return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
  } catch {
    return null;
  }
}

// ── Music covers — MusicBrainz + Cover Art Archive ────────────────────────────

export async function fetchMusicCover(
  title: string,
  creator?: string
): Promise<string | null> {
  try {
    // 1. Find the best-matching release on MusicBrainz
    const query = creator
      ? `release:"${title}" AND artist:"${creator}"`
      : `release:"${title}"`;
    const searchRes = await fetch(
      `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&limit=1&fmt=json`,
      { signal: AbortSignal.timeout(7000), headers: UA }
    );
    if (!searchRes.ok) return null;
    const searchJson = await searchRes.json();
    const mbid: string | undefined = searchJson.releases?.[0]?.id;
    if (!mbid) return null;

    // 2. Fetch cover art metadata from Cover Art Archive
    const artRes = await fetch(
      `https://coverartarchive.org/release/${mbid}`,
      { signal: AbortSignal.timeout(7000), headers: UA }
    );
    if (!artRes.ok) return null;
    const artJson = await artRes.json();
    const imageUrl: string | undefined =
      artJson.images?.[0]?.thumbnails?.["500"] ??
      artJson.images?.[0]?.thumbnails?.large ??
      artJson.images?.[0]?.image;
    return imageUrl ?? null;
  } catch {
    return null;
  }
}

// ── Movie / game / audiobook covers — Wikipedia ───────────────────────────────

export async function fetchMovieCover(title: string): Promise<string | null> {
  return fetchWikipediaCover(title);
}

export async function fetchGameCover(title: string): Promise<string | null> {
  return fetchWikipediaCover(title);
}

export async function fetchAudiobookCover(
  title: string,
  creator?: string
): Promise<string | null> {
  return fetchBookCover(title, creator);
}

// ── Wikipedia cover ───────────────────────────────────────────────────────────

/** Returns true for Creative Commons, Public Domain, and GFDL licenses. */
function isFreeLicense(shortName: string, restrictions: string): boolean {
  if (!shortName) return false;
  if (restrictions !== "") return false;
  return /^(CC[ \-0]|CC0|Public[- ]domain|PD|GFDL)/i.test(shortName);
}

/**
 * Search Wikipedia for an article matching the title (+optional creator), fetch
 * the lead image via pageimages, then verify the image license via the imageinfo
 * extmetadata API. Returns a URL only for freely-licensed (CC / PD / GFDL) images.
 * Uses CORS-safe `origin=*` parameter — no API key required.
 */
export async function fetchWikipediaCover(
  title: string,
  creator?: string
): Promise<string | null> {
  try {
    // 1. Find the best-matching article title
    const term = creator ? `${title} ${creator}` : title;
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search` +
        `&srsearch=${encodeURIComponent(term)}&srlimit=1&format=json&origin=*`,
      { signal: AbortSignal.timeout(7000), headers: UA }
    );
    if (!searchRes.ok) return null;
    const searchJson = await searchRes.json();
    const pageTitle: string | undefined = searchJson.query?.search?.[0]?.title;
    if (!pageTitle) return null;

    // 2. Fetch the lead image thumbnail and filename for that article
    const imgRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query` +
        `&titles=${encodeURIComponent(pageTitle)}` +
        `&prop=pageimages&format=json&pithumbsize=600&origin=*`,
      { signal: AbortSignal.timeout(7000), headers: UA }
    );
    if (!imgRes.ok) return null;
    const imgJson = await imgRes.json();
    const pages = imgJson.query?.pages as Record<
      string,
      { thumbnail?: { source: string }; pageimage?: string }
    >;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    const thumbUrl = page?.thumbnail?.source;
    const imageFilename = page?.pageimage;
    if (!thumbUrl || !imageFilename) return null;

    // 3. Verify the image license via imageinfo extmetadata
    const metaRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query` +
        `&titles=${encodeURIComponent(`File:${imageFilename}`)}` +
        `&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`,
      { signal: AbortSignal.timeout(7000), headers: UA }
    );
    if (!metaRes.ok) return null;
    const metaJson = await metaRes.json();
    const metaPages = metaJson.query?.pages as Record<
      string,
      { imageinfo?: Array<{ extmetadata?: Record<string, { value: string }> }> }
    >;
    const extmeta = Object.values(metaPages ?? {})[0]?.imageinfo?.[0]?.extmetadata;
    const licenseShortName: string = extmeta?.LicenseShortName?.value ?? "";
    const restrictions: string = extmeta?.Restrictions?.value ?? "";

    return isFreeLicense(licenseShortName, restrictions) ? thumbUrl : null;
  } catch {
    return null;
  }
}

// ── Unified entry point ───────────────────────────────────────────────────────

export async function fetchCoverForItem(
  item: Pick<LibraryItem, "type" | "title" | "creator">
): Promise<string | null> {
  switch (item.type) {
    case "book":
      return fetchBookCover(item.title, item.creator);
    case "audiobook":
      return fetchAudiobookCover(item.title, item.creator);
    case "music":
      return fetchMusicCover(item.title, item.creator);
    case "movie":
      return fetchMovieCover(item.title);
    case "game":
      return fetchGameCover(item.title);
    default:
      return null;
  }
}
