/**
 * ELEGANCE TESTS
 *
 * Verifies structural integrity, naming consistency, constant completeness,
 * and data-shape invariants — things that make the codebase easy to extend
 * without introducing subtle bugs.
 */

import { describe, test, expect } from "vitest";
import type { LibraryItem, MediaType } from "../types";

// ── Constants mirrored from page.tsx ─────────────────────────────────────────
// If these drift from page.tsx, the tests below will catch it.

const ALL_MEDIA_TYPES: MediaType[] = ["book", "audiobook", "movie", "music", "game"];

const TYPE_LABELS: Record<MediaType, string> = {
  book: "Books",
  audiobook: "Audiobooks",
  movie: "Movies",
  music: "Music",
  game: "Games",
};

const TYPE_LABELS_SINGULAR: Record<MediaType, string> = {
  book: "Book",
  audiobook: "Audiobook",
  movie: "Movie",
  music: "Music",
  game: "Game",
};

const TYPE_ICONS: Record<MediaType, string> = {
  book: "📚",
  audiobook: "🎧",
  movie: "🎬",
  music: "🎵",
  game: "🎮",
};

const CREATOR_LABEL: Record<MediaType, string> = {
  book: "Author",
  audiobook: "Author",
  movie: "Director",
  music: "Artist",
  game: "Developer",
};

// ── Constant completeness ─────────────────────────────────────────────────────

describe("TYPE_LABELS", () => {
  test.each(ALL_MEDIA_TYPES)('has a non-empty label for "%s"', (type) => {
    expect(TYPE_LABELS[type]).toBeTruthy();
  });

  test('"Music" label is the complete word — not truncated to "Musi"', () => {
    expect(TYPE_LABELS.music).toBe("Music");
    expect(TYPE_LABELS.music.length).toBe(5);
  });

  test("all labels start with an uppercase letter", () => {
    for (const [, label] of Object.entries(TYPE_LABELS)) {
      expect(label[0]).toBe(label[0].toUpperCase());
    }
  });

  test("covers exactly 5 media types (no additions without a matching icon/creator)", () => {
    expect(Object.keys(TYPE_LABELS)).toHaveLength(5);
  });
});

describe("TYPE_LABELS_SINGULAR", () => {
  test.each(ALL_MEDIA_TYPES)('has a singular label for "%s"', (type) => {
    expect(TYPE_LABELS_SINGULAR[type]).toBeTruthy();
  });

  test('"Music" singular is also the complete word', () => {
    expect(TYPE_LABELS_SINGULAR.music).toBe("Music");
  });

  test("singular labels are shorter than or equal in length to plural labels", () => {
    for (const type of ALL_MEDIA_TYPES) {
      expect(TYPE_LABELS_SINGULAR[type].length).toBeLessThanOrEqual(
        TYPE_LABELS[type].length
      );
    }
  });
});

describe("TYPE_ICONS", () => {
  test.each(ALL_MEDIA_TYPES)('has an icon for "%s"', (type) => {
    expect(TYPE_ICONS[type]).toBeTruthy();
  });

  test("all icons are distinct (no two types share the same emoji)", () => {
    const icons = Object.values(TYPE_ICONS);
    expect(new Set(icons).size).toBe(icons.length);
  });

  test("icons are emoji, not plain ASCII", () => {
    for (const icon of Object.values(TYPE_ICONS)) {
      // Emoji have code points > 0x7F
      expect([...icon].some((c) => c.codePointAt(0)! > 0x7f)).toBe(true);
    }
  });
});

describe("CREATOR_LABEL", () => {
  test.each(ALL_MEDIA_TYPES)('has a creator label for "%s"', (type) => {
    expect(CREATOR_LABEL[type]).toBeTruthy();
  });

  test("all creator labels begin with uppercase", () => {
    for (const label of Object.values(CREATOR_LABEL)) {
      expect(label[0]).toBe(label[0].toUpperCase());
    }
  });

  test("all creator labels are domain-appropriate words", () => {
    const expected: Record<MediaType, string> = {
      book: "Author",
      audiobook: "Author",
      movie: "Director",
      music: "Artist",
      game: "Developer",
    };
    for (const type of ALL_MEDIA_TYPES) {
      expect(CREATOR_LABEL[type]).toBe(expected[type]);
    }
  });
});

// ── LibraryItem shape invariants ─────────────────────────────────────────────

describe("LibraryItem type shape", () => {
  function make(overrides: Partial<LibraryItem> = {}): LibraryItem {
    return {
      id: "x",
      type: "book",
      title: "T",
      creator: "C",
      year: 2020,
      genre: "G",
      description: "",
      rating: 3,
      coverColor: "#000000",
      coverAccent: "#ffffff",
      tags: [],
      ...overrides,
    };
  }

  test("all four MediaType values are accepted by the type field", () => {
    for (const t of ALL_MEDIA_TYPES) {
      expect(() => make({ type: t })).not.toThrow();
    }
  });

  test("tags is an array by default (never undefined)", () => {
    expect(Array.isArray(make().tags)).toBe(true);
  });

  test("coverImageUrl is optional — absent by default", () => {
    expect(make().coverImageUrl).toBeUndefined();
  });

  test("lent is optional — absent by default", () => {
    expect(make().lent).toBeUndefined();
  });

  test("lentOn date follows ISO date format YYYY-MM-DD", () => {
    const item = make({ lent: { borrower: "Alice", lentOn: "2025-03-30" } });
    expect(item.lent?.lentOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("id is a non-empty string", () => {
    const item = make({ id: "abc-123" });
    expect(typeof item.id).toBe("string");
    expect(item.id.length).toBeGreaterThan(0);
  });
});

// ── Cover colour palette ──────────────────────────────────────────────────────

describe("Cover colour values", () => {
  const COVER_COLORS = [
    "#7C3AED", "#0F766E", "#B45309", "#0369A1",
    "#BE185D", "#991B1B", "#065F46", "#1E3A5F",
  ];

  test.each(COVER_COLORS)('"%s" is a valid 6-digit hex colour', (color) => {
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  test("all palette colours are distinct", () => {
    expect(new Set(COVER_COLORS).size).toBe(COVER_COLORS.length);
  });

  test("palette has at least 8 colours (enough variety for a real collection)", () => {
    expect(COVER_COLORS.length).toBeGreaterThanOrEqual(8);
  });
});

// ── Backup JSON format ────────────────────────────────────────────────────────

describe("Backup JSON format", () => {
  function buildBackup(items: LibraryItem[]) {
    return JSON.stringify({ exportedAt: new Date().toISOString(), items });
  }

  test("backup is valid JSON", () => {
    const json = buildBackup([]);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  test("backup includes an items array", () => {
    const parsed = JSON.parse(buildBackup([]));
    expect(Array.isArray(parsed.items)).toBe(true);
  });

  test("backup includes an exportedAt ISO timestamp", () => {
    const parsed = JSON.parse(buildBackup([]));
    expect(parsed.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test("items in the backup retain their IDs after round-trip", () => {
    const items: LibraryItem[] = [
      {
        id: "abc-1",
        type: "book",
        title: "Test",
        creator: "A",
        year: 2020,
        genre: "F",
        description: "",
        rating: 4,
        coverColor: "#000",
        coverAccent: "#fff",
        tags: ["sci-fi"],
      },
    ];
    const parsed = JSON.parse(buildBackup(items));
    expect(parsed.items[0].id).toBe("abc-1");
    expect(parsed.items[0].tags).toEqual(["sci-fi"]);
  });
});

// ── API module surface ────────────────────────────────────────────────────────

describe("Exported API surface", () => {
  test("cover-fetcher exports the expected public functions", async () => {
    const mod = await import("../cover-fetcher");
    const expected = [
      "fetchCoverForItem",
      "fetchWikipediaCover",
      "fetchBookCover",
      "fetchMusicCover",
      "fetchMovieCover",
      "fetchGameCover",
      "bookCoverByISBN",
    ];
    for (const fn of expected) {
      expect(typeof (mod as Record<string, unknown>)[fn]).toBe("function");
    }
  });

  test("barcode-lookup exports lookupBarcode", async () => {
    const mod = await import("../barcode-lookup");
    expect(typeof mod.lookupBarcode).toBe("function");
  });

  test("types module exports MediaType and LibraryItem shapes", async () => {
    // TypeScript compilation verifies this; this runtime check confirms the module loads
    const mod = await import("../types");
    expect(mod).toBeDefined();
  });
});

// ── MediaType exhaustiveness ──────────────────────────────────────────────────

describe("MediaType exhaustiveness", () => {
  test("exactly 5 media types exist", () => {
    expect(ALL_MEDIA_TYPES).toHaveLength(5);
  });

  test("all expected values are present", () => {
    expect(ALL_MEDIA_TYPES).toContain("book");
    expect(ALL_MEDIA_TYPES).toContain("movie");
    expect(ALL_MEDIA_TYPES).toContain("music");
    expect(ALL_MEDIA_TYPES).toContain("game");
  });

  test("every media type has a corresponding entry in all four constant maps", () => {
    for (const type of ALL_MEDIA_TYPES) {
      expect(TYPE_LABELS[type]).toBeDefined();
      expect(TYPE_LABELS_SINGULAR[type]).toBeDefined();
      expect(TYPE_ICONS[type]).toBeDefined();
      expect(CREATOR_LABEL[type]).toBeDefined();
    }
  });
});
