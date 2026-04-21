/**
 * USABILITY TESTS
 *
 * Verifies that the cover-fetcher routes requests to the correct APIs,
 * handles failures gracefully without crashing, and that the Wikipedia
 * fallback path works end-to-end.
 *
 * Also tests the shelf calculation under realistic viewport scenarios so
 * that items always land on a shelf (never off-screen).
 */

import { describe, test, expect, vi, afterEach } from "vitest";
import {
  fetchCoverForItem,
  fetchBookCover,
  fetchMusicCover,
  fetchMovieCover,
  fetchGameCover,
  fetchWikipediaCover,
  bookCoverByISBN,
} from "../cover-fetcher";
import { lookupBarcode } from "../barcode-lookup";

// Stub global fetch so no real network calls are made
const mockFetch = vi.fn();
global.fetch = mockFetch;

afterEach(() => vi.clearAllMocks());

// ── Helper responses ──────────────────────────────────────────────────────────

const openLibraryHit = { docs: [{ cover_i: 12345 }] };
const openLibraryMiss = { docs: [] };

const musicBrainzHit = { releases: [{ id: "abc-123-mbid" }] };
const musicBrainzMiss = { releases: [] };
const coverArtHit = { images: [{ thumbnails: { "500": "https://coverartarchive.org/img/abc.jpg" }, image: "https://coverartarchive.org/img/abc.jpg" }] };

const wikiSearchHit = { query: { search: [{ title: "Blade Runner" }] } };
const wikiSearchMiss = { query: { search: [] } };
const wikiImageHit = { query: { pages: { "1": { thumbnail: { source: "https://upload.wikimedia.org/test.jpg" }, pageimage: "Test.jpg" } } } };
const wikiImageMiss = { query: { pages: { "1": {} } } };
const wikiMetaFree = { query: { pages: { "-1": { imageinfo: [{ extmetadata: { LicenseShortName: { value: "CC BY-SA 4.0" }, Restrictions: { value: "" } } }] } } } };
const wikiMetaNonFree = { query: { pages: { "-1": { imageinfo: [{ extmetadata: { LicenseShortName: { value: "Fair use" }, Restrictions: { value: "reuse" } } }] } } } };
const wikiMetaPublicDomain = { query: { pages: { "-1": { imageinfo: [{ extmetadata: { LicenseShortName: { value: "Public domain" }, Restrictions: { value: "" } } }] } } } };

function okJson(body: unknown) {
  return Promise.resolve({ ok: true, json: async () => body });
}

function failResponse() {
  return Promise.resolve({ ok: false, json: async () => ({}) });
}

// ── Cover fetcher — correct API routing ──────────────────────────────────────

describe("fetchCoverForItem — correct source routing per media type", () => {
  test("books are looked up on Open Library", async () => {
    mockFetch.mockReturnValue(okJson(openLibraryHit));
    await fetchCoverForItem({ type: "book", title: "Dune", creator: "Frank Herbert" });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("openlibrary.org"),
      expect.anything()
    );
  });

  test("music is looked up on MusicBrainz", async () => {
    mockFetch
      .mockReturnValueOnce(okJson(musicBrainzHit))
      .mockReturnValueOnce(okJson(coverArtHit));
    await fetchCoverForItem({ type: "music", title: "Kind of Blue", creator: "Miles Davis" });
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("musicbrainz.org");
  });

  test("music cover art is fetched from Cover Art Archive", async () => {
    mockFetch
      .mockReturnValueOnce(okJson(musicBrainzHit))
      .mockReturnValueOnce(okJson(coverArtHit));
    await fetchCoverForItem({ type: "music", title: "Kind of Blue", creator: "Miles Davis" });
    const url: string = mockFetch.mock.calls[1][0];
    expect(url).toContain("coverartarchive.org");
  });

  test("movies are looked up on Wikipedia", async () => {
    mockFetch
      .mockReturnValueOnce(okJson(wikiSearchHit))
      .mockReturnValueOnce(okJson(wikiImageHit))
      .mockReturnValueOnce(okJson(wikiMetaFree));
    await fetchCoverForItem({ type: "movie", title: "Blade Runner", creator: "Ridley Scott" });
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("wikipedia.org");
  });

  test("games are looked up on Wikipedia", async () => {
    mockFetch
      .mockReturnValueOnce(okJson(wikiSearchHit))
      .mockReturnValueOnce(okJson(wikiImageHit))
      .mockReturnValueOnce(okJson(wikiMetaFree));
    await fetchCoverForItem({ type: "game", title: "Zelda", creator: "Nintendo" });
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("wikipedia.org");
  });

  test("audiobooks are looked up on Open Library", async () => {
    mockFetch.mockReturnValue(okJson(openLibraryHit));
    await fetchCoverForItem({ type: "audiobook", title: "Dune", creator: "Frank Herbert" });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("openlibrary.org"),
      expect.anything()
    );
  });
});

// ── Cover fetcher — graceful failure ─────────────────────────────────────────

describe("fetchCoverForItem — graceful error handling", () => {
  test("returns null on network timeout without throwing", async () => {
    mockFetch.mockRejectedValue(new DOMException("Aborted", "AbortError"));
    await expect(
      fetchCoverForItem({ type: "book", title: "Test", creator: "Author" })
    ).resolves.toBeNull();
  });

  test("returns null when the API returns a non-OK status", async () => {
    mockFetch.mockReturnValue(failResponse());
    await expect(
      fetchCoverForItem({ type: "music", title: "Test", creator: "Artist" })
    ).resolves.toBeNull();
  });

  test("returns null when the API response has no results", async () => {
    mockFetch.mockReturnValue(okJson(openLibraryMiss));
    await expect(
      fetchCoverForItem({ type: "book", title: "Nonexistent Book", creator: "Nobody" })
    ).resolves.toBeNull();
  });

  test("returns null for every media type on network failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    for (const type of ["book", "movie", "music", "game"] as const) {
      await expect(
        fetchCoverForItem({ type, title: "Test", creator: "Test" })
      ).resolves.toBeNull();
    }
  });
});

// ── MusicBrainz + Cover Art Archive ──────────────────────────────────────────

describe("fetchMusicCover — MusicBrainz + Cover Art Archive", () => {
  test("returns cover URL when both APIs respond successfully", async () => {
    mockFetch
      .mockReturnValueOnce(okJson(musicBrainzHit))
      .mockReturnValueOnce(okJson(coverArtHit));
    const url = await fetchMusicCover("Kind of Blue", "Miles Davis");
    expect(url).toContain("coverartarchive.org");
  });

  test("returns null when MusicBrainz finds no release", async () => {
    mockFetch.mockReturnValueOnce(okJson(musicBrainzMiss));
    await expect(fetchMusicCover("Unknown Album")).resolves.toBeNull();
  });

  test("returns null when Cover Art Archive has no images", async () => {
    mockFetch
      .mockReturnValueOnce(okJson(musicBrainzHit))
      .mockReturnValueOnce(okJson({ images: [] }));
    await expect(fetchMusicCover("No Art Album")).resolves.toBeNull();
  });

  test("includes title and artist in MusicBrainz query", async () => {
    mockFetch.mockReturnValue(okJson(musicBrainzMiss));
    await fetchMusicCover("Kind of Blue", "Miles Davis");
    const url: string = mockFetch.mock.calls[0][0];
    expect(decodeURIComponent(url)).toContain("Kind of Blue");
    expect(decodeURIComponent(url)).toContain("Miles Davis");
  });
});

// ── Wikipedia cover fetcher ───────────────────────────────────────────────────

describe("fetchWikipediaCover", () => {
  test("returns null when Wikipedia search finds no article", async () => {
    mockFetch.mockReturnValue(okJson(wikiSearchMiss));
    await expect(fetchWikipediaCover("Nonexistent Title XXXZZZ")).resolves.toBeNull();
  });

  test("returns null when the first fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("timeout"));
    await expect(fetchWikipediaCover("Test")).resolves.toBeNull();
  });

  test("returns the thumbnail URL when image has a free license (CC)", async () => {
    const thumbUrl = "https://upload.wikimedia.org/wikipedia/en/thumb/test.jpg/600px-test.jpg";
    mockFetch
      .mockReturnValueOnce(okJson({ query: { search: [{ title: "Dune (novel)" }] } }))
      .mockReturnValueOnce(
        okJson({ query: { pages: { "12345": { thumbnail: { source: thumbUrl }, pageimage: "Test.jpg" } } } })
      )
      .mockReturnValueOnce(okJson(wikiMetaFree));
    const url = await fetchWikipediaCover("Dune", "Frank Herbert");
    expect(url).toBe(thumbUrl);
  });

  test("returns null when the image license is non-free (Fair Use)", async () => {
    mockFetch
      .mockReturnValueOnce(okJson(wikiSearchHit))
      .mockReturnValueOnce(okJson(wikiImageHit))
      .mockReturnValueOnce(okJson(wikiMetaNonFree));
    await expect(fetchWikipediaCover("Blade Runner")).resolves.toBeNull();
  });

  test("returns the thumbnail URL when image is Public Domain", async () => {
    mockFetch
      .mockReturnValueOnce(okJson(wikiSearchHit))
      .mockReturnValueOnce(okJson(wikiImageHit))
      .mockReturnValueOnce(okJson(wikiMetaPublicDomain));
    const url = await fetchWikipediaCover("Blade Runner");
    expect(url).toContain("upload.wikimedia.org");
  });

  test("returns null when the imageinfo call fails", async () => {
    mockFetch
      .mockReturnValueOnce(okJson(wikiSearchHit))
      .mockReturnValueOnce(okJson(wikiImageHit))
      .mockReturnValueOnce(failResponse());
    await expect(fetchWikipediaCover("Blade Runner")).resolves.toBeNull();
  });

  test("returns null when the article exists but has no image", async () => {
    mockFetch
      .mockReturnValueOnce(okJson({ query: { search: [{ title: "Some Article" }] } }))
      .mockReturnValueOnce(okJson({ query: { pages: { "1": {} } } }));
    await expect(fetchWikipediaCover("Some obscure thing")).resolves.toBeNull();
  });

  test("includes origin=* in all three API calls (CORS compliance)", async () => {
    mockFetch
      .mockReturnValueOnce(okJson(wikiSearchHit))
      .mockReturnValueOnce(okJson(wikiImageHit))
      .mockReturnValueOnce(okJson(wikiMetaFree));
    await fetchWikipediaCover("Blade Runner");
    for (const call of mockFetch.mock.calls) {
      expect(call[0]).toContain("origin=*");
    }
  });

  test("includes the title and creator in the search query", async () => {
    mockFetch.mockReturnValue(okJson({ query: { search: [] } }));
    await fetchWikipediaCover("Dune", "Frank Herbert");
    const url: string = mockFetch.mock.calls[0][0];
    expect(decodeURIComponent(url)).toContain("Dune");
    expect(decodeURIComponent(url)).toContain("Frank Herbert");
  });

  test("makes exactly three API calls for a successful lookup", async () => {
    mockFetch
      .mockReturnValueOnce(okJson(wikiSearchHit))
      .mockReturnValueOnce(okJson(wikiImageHit))
      .mockReturnValueOnce(okJson(wikiMetaFree));
    await fetchWikipediaCover("Blade Runner");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});

// ── fetchBookCover ────────────────────────────────────────────────────────────

describe("fetchBookCover", () => {
  test("returns a cover URL when Open Library has the book", async () => {
    mockFetch.mockReturnValue(okJson(openLibraryHit));
    const url = await fetchBookCover("Dune", "Frank Herbert");
    expect(url).toMatch(/^https:\/\/covers\.openlibrary\.org/);
    expect(url).toContain("12345");
  });

  test("includes both title and creator in the search query", async () => {
    mockFetch.mockReturnValue(okJson(openLibraryMiss));
    await fetchBookCover("Dune", "Frank Herbert");
    const url: string = mockFetch.mock.calls[0][0];
    expect(decodeURIComponent(url)).toContain("Dune");
    expect(decodeURIComponent(url)).toContain("Frank Herbert");
  });

  test("works with title only (no creator)", async () => {
    mockFetch.mockReturnValue(okJson(openLibraryMiss));
    await expect(fetchBookCover("Dune")).resolves.toBeNull();
    expect(mockFetch).toHaveBeenCalledOnce();
  });
});

// ── bookCoverByISBN ───────────────────────────────────────────────────────────

describe("bookCoverByISBN", () => {
  test("returns a direct Open Library cover URL", () => {
    const url = bookCoverByISBN("9780451524935");
    expect(url).toContain("covers.openlibrary.org");
    expect(url).toContain("9780451524935");
  });
});

// ── Shelf layout — usability scenarios ───────────────────────────────────────

describe("Shelf layout — real-world viewport scenarios", () => {
  // Mirror the formula from page.tsx
  function calcItemsPerShelf(w: number) {
    return w > 0 ? Math.max(1, Math.floor((w - 48 + 12) / (92 + 12))) : 8;
  }

  const SCENARIOS = [
    { label: "laptop (1280px, no panel)", width: 1280, min: 10 },
    { label: "laptop + detail panel (1280 - 320px = 960px)", width: 960, min: 7 },
    { label: "iMac 27″ (2560px)", width: 2560, min: 20 },
    { label: "iPad landscape (1024px)", width: 1024, min: 8 },
    { label: "very narrow (300px)", width: 300, min: 1 },
  ];

  test.each(SCENARIOS)(
    "$label — at least $min items fit per shelf",
    ({ width, min }) => {
      expect(calcItemsPerShelf(width)).toBeGreaterThanOrEqual(min);
    }
  );

  test("items always fit — count is never 0 for any positive width", () => {
    for (let w = 1; w <= 3000; w += 50) {
      expect(calcItemsPerShelf(w)).toBeGreaterThanOrEqual(1);
    }
  });
});

// ── Barcode lookup — ISBN detection ──────────────────────────────────────────

describe("lookupBarcode — ISBN detection and routing", () => {
  test("a 13-digit ISBN (978-prefix) routes to Open Library", async () => {
    mockFetch.mockReturnValue(okJson({}));
    await lookupBarcode("9780451524935");
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("openlibrary.org");
  });

  test("a 10-digit ISBN routes to Open Library", async () => {
    mockFetch.mockReturnValue(okJson({}));
    await lookupBarcode("0451524934");
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("openlibrary.org");
  });

  test("a 12-digit UPC (non-ISBN) routes to UPC Item DB", async () => {
    mockFetch.mockReturnValue(okJson({ items: [] }));
    await lookupBarcode("012345678901");
    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain("upcitemdb.com");
  });

  test("returns null when both lookups find nothing", async () => {
    mockFetch.mockReturnValue(okJson({ items: [] }));
    await expect(lookupBarcode("012345678901")).resolves.toBeNull();
  });

  test("returns null on network failure without throwing", async () => {
    mockFetch.mockRejectedValue(new Error("offline"));
    await expect(lookupBarcode("9780451524935")).resolves.toBeNull();
  });
});
