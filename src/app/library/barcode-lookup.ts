const UA = { "User-Agent": "Libri Ex Machina" };

/**
 * Barcode / UPC lookup utilities.
 *
 * Strategy:
 *   1. 10- or 13-digit codes starting with 978/979 are ISBNs → Open Library
 *   2. Everything else → UPC Item DB (free, no key, 100 req/day)
 *   3. If both fail we return null and let the user fill in the form.
 */

export interface LookupResult {
  type: "book" | "audiobook" | "movie" | "music" | "game" | "unknown";
  title: string;
  creator: string;
  year: number;
  genre: string;
  description: string;
  coverColor: string;
  coverAccent: string;
  coverImageUrl?: string;
  tags: string[];
}

// ── Colour palette ────────────────────────────────────────────────────────────

const COVER_PALETTES = [
  { bg: "#7C3AED", accent: "#DDD6FE" },
  { bg: "#0F766E", accent: "#CCFBF1" },
  { bg: "#B45309", accent: "#FEF3C7" },
  { bg: "#0369A1", accent: "#E0F2FE" },
  { bg: "#BE185D", accent: "#FCE7F3" },
  { bg: "#991B1B", accent: "#FEE2E2" },
  { bg: "#065F46", accent: "#D1FAE5" },
  { bg: "#1E3A5F", accent: "#BAE6FD" },
];

function pickPalette(seed: string) {
  let hash = 0;
  for (const c of seed) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  const p = COVER_PALETTES[hash % COVER_PALETTES.length];
  return { coverColor: p.bg, coverAccent: p.accent };
}

// ── ISBN / Open Library ───────────────────────────────────────────────────────

function isISBN(code: string) {
  const clean = code.replace(/[-\s]/g, "");
  return (
    clean.length === 10 ||
    (clean.length === 13 && (clean.startsWith("978") || clean.startsWith("979")))
  );
}

async function lookupISBN(code: string): Promise<LookupResult | null> {
  const clean = code.replace(/[-\s]/g, "");
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`;
  try {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) return null;
    const json = await res.json();
    const key = `ISBN:${clean}`;
    const book = json[key];
    if (!book) return null;

    const title: string = book.title ?? "Unknown Title";
    const author: string =
      book.authors?.[0]?.name ?? book.by_statement ?? "Unknown Author";
    const yearRaw: string | number =
      book.publish_date ?? book.first_publish_date ?? "0";
    const year = parseInt(String(yearRaw).replace(/\D/g, "").slice(-4)) || 0;
    const subjects: string[] = (book.subjects ?? [])
      .slice(0, 4)
      .map((s: { name?: string } | string) =>
        typeof s === "string" ? s : s.name ?? ""
      )
      .filter(Boolean);
    const genre =
      book.genres?.[0]?.name ??
      subjects[0] ??
      "Non-Fiction";
    const description =
      typeof book.notes === "string"
        ? book.notes
        : book.notes?.value ?? book.description?.value ?? book.description ?? "";

    const palette = pickPalette(title);
    return {
      type: "book",
      title,
      creator: author,
      year,
      genre,
      description: typeof description === "string" ? description : "",
      tags: subjects.slice(0, 4),
      coverImageUrl: `https://covers.openlibrary.org/b/isbn/${clean}-L.jpg`,
      ...palette,
    };
  } catch {
    return null;
  }
}

// ── UPC Item DB ───────────────────────────────────────────────────────────────

type UPCCategory =
  | "Music"
  | "Movies & TV"
  | "Video Games"
  | "Books"
  | string;

function mapCategory(cat: UPCCategory): LookupResult["type"] {
  const c = cat.toLowerCase();
  if (c.includes("music") || c.includes("cd") || c.includes("vinyl"))
    return "music";
  if (c.includes("movie") || c.includes("film") || c.includes("tv") || c.includes("blu") || c.includes("dvd"))
    return "movie";
  if (c.includes("game") || c.includes("gaming") || c.includes("software"))
    return "game";
  if (c.includes("audiobook") || c.includes("audio book")) return "audiobook";
  if (c.includes("book")) return "book";
  return "unknown";
}

async function lookupUPC(code: string): Promise<LookupResult | null> {
  const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(code)}`;
  try {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) return null;
    const json = await res.json();
    const item = json.items?.[0];
    if (!item) return null;

    const title: string = item.title ?? "Unknown";
    const brand: string = item.brand ?? item.manufacturer ?? "Unknown";
    const category: string = item.category ?? "";
    const description: string = item.description ?? "";
    const type = mapCategory(category);
    const palette = pickPalette(title);

    return {
      type: type === "unknown" ? "book" : type,
      title,
      creator: brand,
      year: 0, // UPC DB doesn't reliably return year
      genre: category,
      description,
      tags: [],
      ...palette,
    };
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function lookupBarcode(code: string): Promise<LookupResult | null> {
  if (isISBN(code)) {
    const result = await lookupISBN(code);
    if (result) return result;
  }
  return lookupUPC(code);
}
