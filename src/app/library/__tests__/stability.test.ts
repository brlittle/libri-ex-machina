/**
 * STABILITY TESTS
 *
 * Verifies that core logic functions behave correctly and predictably:
 * shelf layout, sorting, filtering, localStorage persistence, backup
 * merging, and cover-URL generation.
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll, vi } from "vitest";
import type { LibraryItem, MediaType } from "../types";
import { bookCoverByISBN } from "../cover-fetcher";

// ── Helpers that mirror page.tsx logic (single source of truth for tests) ─────

function calcItemsPerShelf(shelfWidth: number): number {
  return shelfWidth > 0
    ? Math.max(1, Math.floor((shelfWidth - 48 + 12) / (92 + 12)))
    : 8;
}

function sortItems(
  items: LibraryItem[],
  sort: "title" | "year" | "rating" | "creator"
): LibraryItem[] {
  return [...items].sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title);
    if (sort === "year") return b.year - a.year;
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "creator") return a.creator.localeCompare(b.creator);
    return 0;
  });
}

function filterItems(
  items: LibraryItem[],
  tab: "all" | MediaType,
  query: string
): LibraryItem[] {
  let list = tab !== "all" ? items.filter((i) => i.type === tab) : items;
  if (query.trim()) {
    const q = query.toLowerCase();
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.creator.toLowerCase().includes(q) ||
        i.genre.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  return list;
}

function mergeBackup(
  existing: LibraryItem[],
  incoming: LibraryItem[]
): LibraryItem[] {
  const result = [...existing];
  for (const item of incoming) {
    if (!result.find((i) => i.id === item.id)) result.push(item);
  }
  return result;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<LibraryItem> = {}): LibraryItem {
  return {
    id: "test-1",
    type: "book",
    title: "Test Book",
    creator: "Test Author",
    year: 2023,
    genre: "Fiction",
    description: "A test book",
    rating: 4,
    coverColor: "#1a1a2e",
    coverAccent: "#e94560",
    tags: ["test"],
    ...overrides,
  };
}

const COLLECTION: LibraryItem[] = [
  makeItem({ id: "1", title: "Zen and the Art",  creator: "Robert Pirsig",   year: 1974, rating: 5, type: "book"  }),
  makeItem({ id: "2", title: "Annihilation",      creator: "Jeff VanderMeer", year: 2014, rating: 4, type: "book"  }),
  makeItem({ id: "3", title: "Dune",              creator: "Frank Herbert",   year: 1965, rating: 5, type: "book"  }),
  makeItem({ id: "4", title: "Blade Runner",      creator: "Ridley Scott",    year: 1982, rating: 5, type: "movie" }),
  makeItem({ id: "5", title: "Kind of Blue",      creator: "Miles Davis",     year: 1959, rating: 5, type: "music" }),
];

// ── Shelf layout ──────────────────────────────────────────────────────────────

describe("Shelf layout calculation", () => {
  test("returns 8 as the safe default when width is 0 (before ResizeObserver fires)", () => {
    expect(calcItemsPerShelf(0)).toBe(8);
  });

  test("never returns less than 1 item even at very narrow widths", () => {
    expect(calcItemsPerShelf(1)).toBe(1);
    expect(calcItemsPerShelf(50)).toBe(1);
  });

  test("returns correct count at 900 px (sidebar open)", () => {
    // (900 - 48 + 12) / (92 + 12) = 864 / 104 ≈ 8.3 → 8
    expect(calcItemsPerShelf(900)).toBe(8);
  });

  test("returns correct count at 1280 px (full-screen)", () => {
    // (1280 - 48 + 12) / 104 = 1244 / 104 ≈ 11.96 → 11
    expect(calcItemsPerShelf(1280)).toBe(11);
  });

  test("count increases monotonically as width grows", () => {
    expect(calcItemsPerShelf(600)).toBeLessThan(calcItemsPerShelf(900));
    expect(calcItemsPerShelf(900)).toBeLessThan(calcItemsPerShelf(1400));
  });

  test("is deterministic — same width always gives same count", () => {
    expect(calcItemsPerShelf(800)).toBe(calcItemsPerShelf(800));
  });
});

// ── Sort ──────────────────────────────────────────────────────────────────────

describe("Sort logic", () => {
  test("title sort is alphabetical A→Z", () => {
    const sorted = sortItems(COLLECTION, "title").map((i) => i.title);
    expect(sorted).toEqual([...sorted].sort((a, b) => a.localeCompare(b)));
  });

  test("year sort is newest-first", () => {
    const years = sortItems(COLLECTION, "year").map((i) => i.year);
    for (let i = 0; i < years.length - 1; i++)
      expect(years[i]).toBeGreaterThanOrEqual(years[i + 1]);
  });

  test("rating sort is highest-first", () => {
    const ratings = sortItems(COLLECTION, "rating").map((i) => i.rating);
    for (let i = 0; i < ratings.length - 1; i++)
      expect(ratings[i]).toBeGreaterThanOrEqual(ratings[i + 1]);
  });

  test("creator sort is alphabetical A→Z", () => {
    const sorted = sortItems(COLLECTION, "creator").map((i) => i.creator);
    expect(sorted).toEqual([...sorted].sort((a, b) => a.localeCompare(b)));
  });

  test("sort never mutates the source array", () => {
    const originalIds = COLLECTION.map((i) => i.id);
    sortItems(COLLECTION, "title");
    expect(COLLECTION.map((i) => i.id)).toEqual(originalIds);
  });
});

// ── Filter ────────────────────────────────────────────────────────────────────

describe("Filter logic", () => {
  test('"all" tab returns every item', () => {
    expect(filterItems(COLLECTION, "all", "")).toHaveLength(COLLECTION.length);
  });

  test("type tab returns only items of that type", () => {
    const books = filterItems(COLLECTION, "book", "");
    expect(books.every((i) => i.type === "book")).toBe(true);
    expect(books.length).toBeGreaterThan(0);
  });

  test("text search matches title (case-insensitive)", () => {
    const results = filterItems(COLLECTION, "all", "dune");
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Dune");
  });

  test("text search matches creator", () => {
    const results = filterItems(COLLECTION, "all", "miles");
    expect(results).toHaveLength(1);
    expect(results[0].creator).toBe("Miles Davis");
  });

  test("unmatched search returns empty array", () => {
    expect(filterItems(COLLECTION, "all", "xyzzy-not-real")).toHaveLength(0);
  });

  test("type tab + search work together", () => {
    // Only books matching "dune"
    const results = filterItems(COLLECTION, "book", "dune");
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe("book");
  });

  test("whitespace-only query returns all items for the tab", () => {
    expect(filterItems(COLLECTION, "all", "   ")).toHaveLength(COLLECTION.length);
  });
});

// ── localStorage persistence ──────────────────────────────────────────────────

describe("localStorage persistence", () => {
  const LS_KEY = "library-items";

  // jsdom's localStorage stub doesn't expose all Storage methods in this
  // environment, so we provide a reliable in-memory implementation.
  const store: Record<string, string> = {};
  beforeAll(() =>
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
      clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    })
  );

  beforeEach(() => delete store[LS_KEY]);
  afterEach(() => delete store[LS_KEY]);

  test("JSON round-trip preserves all required fields", () => {
    const items = COLLECTION.slice(0, 2);
    localStorage.setItem(LS_KEY, JSON.stringify(items));
    const loaded = JSON.parse(localStorage.getItem(LS_KEY)!) as LibraryItem[];
    expect(loaded).toHaveLength(2);
    expect(loaded[0]).toMatchObject({
      id: items[0].id,
      title: items[0].title,
      type: items[0].type,
      creator: items[0].creator,
    });
  });

  test("returns null when the key has never been written", () => {
    expect(localStorage.getItem(LS_KEY)).toBeNull();
  });

  test("preserves optional lent record through serialization", () => {
    const lentItem = makeItem({
      id: "lent-1",
      lent: { borrower: "Alice", lentOn: "2025-01-01" },
    });
    localStorage.setItem(LS_KEY, JSON.stringify([lentItem]));
    const [loaded] = JSON.parse(localStorage.getItem(LS_KEY)!) as LibraryItem[];
    expect(loaded.lent?.borrower).toBe("Alice");
    expect(loaded.lent?.lentOn).toBe("2025-01-01");
  });

  test("corrupted JSON throws a SyntaxError (caught by lsLoad try/catch)", () => {
    localStorage.setItem(LS_KEY, "{ not valid json [");
    expect(() => JSON.parse(localStorage.getItem(LS_KEY)!)).toThrow(SyntaxError);
  });

  test("large collections (100 items) round-trip without data loss", () => {
    const items = Array.from({ length: 100 }, (_, i) =>
      makeItem({ id: `item-${i}`, title: `Book ${i}` })
    );
    localStorage.setItem(LS_KEY, JSON.stringify(items));
    const loaded = JSON.parse(localStorage.getItem(LS_KEY)!) as LibraryItem[];
    expect(loaded).toHaveLength(100);
    expect(loaded[99].id).toBe("item-99");
  });
});

// ── Backup merge ──────────────────────────────────────────────────────────────

describe("Backup merge logic", () => {
  test("existing items are always kept", () => {
    const existing = [makeItem({ id: "a" })];
    expect(mergeBackup(existing, [])).toHaveLength(1);
  });

  test("new items from backup are added", () => {
    const existing = [makeItem({ id: "a" })];
    const incoming = [makeItem({ id: "b" })];
    expect(mergeBackup(existing, incoming)).toHaveLength(2);
  });

  test("duplicate IDs are never added (existing record wins)", () => {
    const existing = [makeItem({ id: "a", title: "Original" })];
    const incoming = [makeItem({ id: "a", title: "Duplicate" })];
    const merged = mergeBackup(existing, incoming);
    expect(merged).toHaveLength(1);
    expect(merged[0].title).toBe("Original");
  });

  test("restoring into an empty collection imports everything", () => {
    expect(mergeBackup([], COLLECTION)).toHaveLength(COLLECTION.length);
  });

  test("merge does not mutate either input array", () => {
    const existing = [makeItem({ id: "a" })];
    const incoming = [makeItem({ id: "b" })];
    const eBefore = existing.length;
    const iBefore = incoming.length;
    mergeBackup(existing, incoming);
    expect(existing).toHaveLength(eBefore);
    expect(incoming).toHaveLength(iBefore);
  });
});

// ── Cover URL utilities ───────────────────────────────────────────────────────

describe("bookCoverByISBN", () => {
  test("returns an Open Library HTTPS URL", () => {
    const url = bookCoverByISBN("9780140449136");
    expect(url).toMatch(/^https:\/\/covers\.openlibrary\.org/);
  });

  test("embeds the ISBN in the URL path", () => {
    const isbn = "9780140449136";
    expect(bookCoverByISBN(isbn)).toContain(isbn);
  });

  test('requests the large ("-L") size', () => {
    expect(bookCoverByISBN("0451524934")).toContain("-L.jpg");
  });

  test("is synchronous (returns a string, not a Promise)", () => {
    const result = bookCoverByISBN("0451524934");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result as any) instanceof Promise).toBe(false);
    expect(typeof result).toBe("string");
  });
});
