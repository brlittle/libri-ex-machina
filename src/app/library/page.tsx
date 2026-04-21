"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { lookupBarcode, type LookupResult } from "./barcode-lookup";
import { fetchCoverForItem, fetchWikipediaCover } from "./cover-fetcher";
import type { MediaType, LibraryItem, CollectorField } from "./types";
import { PRESERVED_FIELDS, COUNTRY_OPTIONS, LANGUAGE_OPTIONS, ASPECT_RATIO_OPTIONS, AUDIOBOOK_FORMAT_OPTIONS, MEDIA_FORMAT_OPTIONS, AUDIO_FORMAT_OPTIONS, REGION_OPTIONS, CERTIFICATION_OPTIONS, MUSIC_FORMAT_OPTIONS, PRESSING_OPTIONS, SPEED_OPTIONS, RECORD_CONDITION_OPTIONS, PLATFORM_OPTIONS, AGE_RATING_OPTIONS, CIB_OPTIONS, GAME_REGION_OPTIONS, SEAL_GRADE_OPTIONS, wordOrdinal, numOrdinal} from "./media-config";
import DetailPanel from "./DetailPanel";

const BarcodeScanner = dynamic(() => import("./BarcodeScanner"), { ssr: false });

// ── Sample Data ──────────────────────────────────────────────────────────────

const SAMPLE_ITEMS: LibraryItem[] = [
  {
    id: "1",
    type: "book",
    title: "The Name of the Wind",
    creator: "Patrick Rothfuss",
    year: 2007,
    genre: "Fantasy",
    description:
      "The tale of Kvothe — magician, musician, and notorious figure — told in his own words. A beautifully written epic of adventure and coming-of-age.",
    rating: 5,
    coverColor: "#7C3AED",
    coverAccent: "#DDD6FE",
    tags: ["Epic Fantasy", "Magic", "Coming-of-Age"],
  },
  {
    id: "2",
    type: "book",
    title: "Project Hail Mary",
    creator: "Andy Weir",
    year: 2021,
    genre: "Sci-Fi",
    description:
      "A lone astronaut must save Earth from disaster. Ryland Grace wakes up millions of miles from home with no memory of how he got there.",
    rating: 5,
    coverColor: "#0F766E",
    coverAccent: "#CCFBF1",
    tags: ["Hard Sci-Fi", "Space", "First Contact"],
  },
  {
    id: "3",
    type: "book",
    title: "Dune",
    creator: "Frank Herbert",
    year: 1965,
    genre: "Sci-Fi",
    description:
      "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides and the saga of a world where the most precious substance in the universe is the spice.",
    rating: 5,
    coverColor: "#B45309",
    coverAccent: "#FEF3C7",
    tags: ["Space Opera", "Politics", "Religion"],
  },
  {
    id: "4",
    type: "book",
    title: "Piranesi",
    creator: "Susanna Clarke",
    year: 2020,
    genre: "Fantasy",
    description:
      "Piranesi lives in a mysterious house with infinite halls and tidal seas. He knows little about himself or the world he inhabits.",
    rating: 4,
    coverColor: "#0369A1",
    coverAccent: "#E0F2FE",
    tags: ["Mystery", "Magical Realism", "Surreal"],
  },
  {
    id: "5",
    type: "movie",
    title: "Arrival",
    creator: "Denis Villeneuve",
    year: 2016,
    genre: "Sci-Fi",
    description:
      "A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.",
    rating: 5,
    coverColor: "#1E3A5F",
    coverAccent: "#BAE6FD",
    tags: ["Linguistics", "Time", "First Contact"],
  },
  {
    id: "6",
    type: "movie",
    title: "Everything Everywhere All at Once",
    creator: "Daniels",
    year: 2022,
    genre: "Action / Drama",
    description:
      "A middle-aged Chinese immigrant is swept up in an insane adventure in which she alone can save existence by exploring other universes.",
    rating: 5,
    coverColor: "#BE185D",
    coverAccent: "#FCE7F3",
    tags: ["Multiverse", "Family", "Absurdist"],
  },
  {
    id: "7",
    type: "movie",
    title: "Blade Runner 2049",
    creator: "Denis Villeneuve",
    year: 2017,
    genre: "Sci-Fi",
    description:
      "A young blade runner's discovery of a long-buried secret leads him to track down former blade runner Rick Deckard.",
    rating: 4,
    coverColor: "#374151",
    coverAccent: "#F9A8D4",
    tags: ["Neo-Noir", "AI", "Identity"],
    lent: { borrower: "Alex Chen", lentOn: "2026-02-14" },
  },
  {
    id: "8",
    type: "music",
    title: "In Rainbows",
    creator: "Radiohead",
    year: 2007,
    genre: "Alternative Rock",
    description:
      "Radiohead's seventh studio album, released as a pay-what-you-want download. A landmark in digital music distribution and a masterpiece.",
    rating: 5,
    coverColor: "#991B1B",
    coverAccent: "#FEE2E2",
    tags: ["Experimental", "Electronic", "Art Rock"],
  },
  {
    id: "9",
    type: "music",
    title: "Blonde",
    creator: "Frank Ocean",
    year: 2016,
    genre: "R&B / Soul",
    description:
      "Frank Ocean's second studio album — a deeply personal and genre-defying exploration of love, loss, and identity.",
    rating: 5,
    coverColor: "#D97706",
    coverAccent: "#FEF9C3",
    tags: ["Neo-Soul", "Experimental", "Introspective"],
  },
  {
    id: "10",
    type: "music",
    title: "Random Access Memories",
    creator: "Daft Punk",
    year: 2013,
    genre: "Electronic / Disco",
    description:
      "A love letter to analogue music production. Daft Punk's fourth studio album features live musicians and is a celebration of disco and funk.",
    rating: 4,
    coverColor: "#B45309",
    coverAccent: "#FEF3C7",
    tags: ["Disco", "Funk", "Analogue"],
    lent: { borrower: "Jordan Lee", lentOn: "2026-01-20" },
  },
  {
    id: "11",
    type: "game",
    title: "Disco Elysium",
    creator: "ZA/UM",
    year: 2019,
    genre: "RPG",
    description:
      "A groundbreaking RPG where you play a detective with a unique skill system. The writing is extraordinary and the world is deeply realized.",
    rating: 5,
    coverColor: "#4C1D95",
    coverAccent: "#EDE9FE",
    tags: ["Detective", "Narrative", "Existential"],
  },
  {
    id: "12",
    type: "game",
    title: "Hollow Knight",
    creator: "Team Cherry",
    year: 2017,
    genre: "Metroidvania",
    description:
      "A challenging action-adventure through a vast ruined kingdom of insects and heroes. Beautiful hand-drawn art and atmospheric world-building.",
    rating: 5,
    coverColor: "#1C1C2E",
    coverAccent: "#A5B4FC",
    tags: ["Exploration", "Challenging", "Atmospheric"],
  },
  {
    id: "13",
    type: "game",
    title: "Hades",
    creator: "Supergiant Games",
    year: 2020,
    genre: "Roguelite",
    description:
      "Defy the god of the dead in this rogue-like dungeon crawler from the creators of Bastion and Transistor. Exceptional writing and replayability.",
    rating: 5,
    coverColor: "#7F1D1D",
    coverAccent: "#FCA5A5",
    tags: ["Action", "Greek Mythology", "Story-Rich"],
  },
  {
    id: "14",
    type: "book",
    title: "Flowers for Algernon",
    creator: "Daniel Keyes",
    year: 1966,
    genre: "Sci-Fi",
    description:
      "The story of Charlie Gordon, a man with an intellectual disability who undergoes an experimental surgery to increase his intelligence.",
    rating: 4,
    coverColor: "#065F46",
    coverAccent: "#D1FAE5",
    tags: ["Emotional", "Intelligence", "Identity"],
  },
  {
    id: "15",
    type: "movie",
    title: "The Grand Budapest Hotel",
    creator: "Wes Anderson",
    year: 2014,
    genre: "Comedy / Drama",
    description:
      "The adventures of Gustave H, a legendary concierge at a famous European hotel between the wars, and Zero Moustafa, the lobby boy.",
    rating: 4,
    coverColor: "#9F1239",
    coverAccent: "#FCE7F3",
    tags: ["Quirky", "Visual Style", "Caper"],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Genre lists (per media type) ─────────────────────────────────────────────

// Top 5 shown by default in the picker
const TOP5_GENRES: Record<MediaType, string[]> = {
  book:      ["Fantasy", "Science Fiction", "Mystery", "Historical Fiction", "Literary Fiction"],
  audiobook: ["Science Fiction", "Mystery", "Biography", "Thriller", "Self-Help"],
  movie:     ["Drama", "Comedy", "Thriller", "Science Fiction", "Action"],
  music:     ["Rock", "Pop", "Hip-Hop / Rap", "Electronic / Dance", "Classical"],
  game:      ["RPG", "Action", "Adventure", "Strategy", "Puzzle"],
};

// Full genre lists used in the "Other / search" panel
const GENRES: Record<MediaType, string[]> = {
  audiobook: [
    "Biography", "Business", "Children's", "Classic Literature", "Crime",
    "Fantasy", "Fiction", "Historical Fiction", "Horror", "Humor",
    "Literary Fiction", "Memoir / Autobiography", "Mystery", "Non-Fiction",
    "Philosophy", "Romance", "Science", "Science Fiction", "Self-Help",
    "Short Stories", "Thriller", "True Crime", "Young Adult",
  ],
  book: [
    "Biography", "Children's", "Classic Literature", "Comics / Graphic Novel",
    "Crime", "Essays", "Fantasy", "Fiction", "Historical Fiction",
    "Horror", "Humor", "Literary Fiction", "Memoir / Autobiography",
    "Mystery", "Non-Fiction", "Philosophy", "Poetry", "Reference",
    "Romance", "Science", "Science Fiction", "Self-Help", "Short Stories",
    "Thriller", "True Crime", "Young Adult",
  ],
  movie: [
    "Action", "Adventure", "Animation", "Biography / Documentary",
    "Comedy", "Crime", "Drama", "Fantasy", "Foreign Language",
    "Historical", "Horror", "Musical", "Mystery", "Romance",
    "Science Fiction", "Silent", "Sport", "Thriller", "War", "Western",
  ],
  music: [
    "Ambient", "Alternative", "Blues", "Classical", "Country",
    "Electronic / Dance", "Experimental", "Folk", "Gospel",
    "Hip-Hop / Rap", "Indie", "Jazz", "Latin", "Metal",
    "New Age", "Pop", "Punk", "R&B / Soul", "Reggae",
    "Rock", "Soundtrack", "World",
  ],
  game: [
    "Action", "Adventure", "Fighting", "Horror", "Indie",
    "MMO / Online", "Platformer", "Puzzle", "Racing", "RPG",
    "Shooter", "Simulation", "Sports", "Strategy", "Visual Novel",
  ],
};

const LS_CUSTOM_GENRES = "library-custom-genres";
type CustomGenreMap = Record<MediaType, string[]>;
const EMPTY_CUSTOM: CustomGenreMap = { book: [], audiobook: [], movie: [], music: [], game: [] };

function loadCustomGenres(): CustomGenreMap {
  try {
    const raw = localStorage.getItem(LS_CUSTOM_GENRES);
    if (!raw) return EMPTY_CUSTOM;
    const parsed = JSON.parse(raw) as Partial<CustomGenreMap>;
    return {
      book:      parsed.book      ?? [],
      audiobook: parsed.audiobook ?? [],
      movie:     parsed.movie     ?? [],
      music:     parsed.music     ?? [],
      game:      parsed.game      ?? [],
    };
  } catch { return EMPTY_CUSTOM; }
}

function saveCustomGenres(cg: CustomGenreMap) {
  try { localStorage.setItem(LS_CUSTOM_GENRES, JSON.stringify(cg)); } catch {}
}

// ── Retailer/Platform select (audiobook) ─────────────────────────────────────

const LS_CUSTOM_RETAILERS = "library-custom-retailers";

function loadCustomRetailers(): string[] {
  try {
    const raw = localStorage.getItem(LS_CUSTOM_RETAILERS);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

function saveCustomRetailers(list: string[]) {
  try { localStorage.setItem(LS_CUSTOM_RETAILERS, JSON.stringify(list)); } catch {}
}

function CountrySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query
    ? COUNTRY_OPTIONS.filter((c) => c.toLowerCase().includes(query.toLowerCase()))
    : COUNTRY_OPTIONS;
  const isCustom = !!query && !COUNTRY_OPTIONS.includes(query);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search countries…"
        className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-stone-900 border border-stone-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          {filtered.map((country) => (
            <button
              key={country}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(country); setQuery(country); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-stone-200 hover:bg-stone-700 transition-colors"
            >
              {country}
            </button>
          ))}
          {isCustom && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-amber-400 hover:bg-stone-700 italic border-t border-stone-700 transition-colors"
            >
              Use &ldquo;{query}&rdquo;
            </button>
          )}
          {filtered.length === 0 && !isCustom && (
            <p className="px-3 py-2 text-sm text-stone-500 italic">No matches</p>
          )}
        </div>
      )}
    </div>
  );
}

function RetailerSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [customRetailers, setCustomRetailers] = useState<string[]>([]);
  const [otherMode, setOtherMode] = useState(false);
  const [otherText, setOtherText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setCustomRetailers(loadCustomRetailers()); }, []);
  useEffect(() => { if (otherMode) setTimeout(() => inputRef.current?.focus(), 0); }, [otherMode]);

  // If the current value isn't in the base list, we're in "other" territory
  const baseValues = AUDIOBOOK_FORMAT_OPTIONS.map((o) => o.value);
  const allOptions = [...AUDIOBOOK_FORMAT_OPTIONS, ...customRetailers.filter((r) => !baseValues.includes(r)).map((r) => ({ value: r, description: "Custom retailer / platform" }))];

  function confirmOther() {
    const val = otherText.trim();
    if (!val) return;
    if (!allOptions.find((o) => o.value === val)) {
      const updated = [...customRetailers, val];
      setCustomRetailers(updated);
      saveCustomRetailers(updated);
    }
    onChange(val);
    setOtherMode(false);
    setOtherText("");
  }

  if (otherMode) {
    return (
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); confirmOther(); }
            if (e.key === "Escape") { setOtherMode(false); setOtherText(""); }
          }}
          placeholder="Type retailer or platform name…"
          className="flex-1 bg-stone-800 border border-amber-500 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none placeholder:text-stone-500"
        />
        <button
          type="button"
          onClick={confirmOther}
          className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors flex-shrink-0"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => { setOtherMode(false); setOtherText(""); }}
          className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg text-sm transition-colors flex-shrink-0"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === "__other__") { setOtherMode(true); }
        else onChange(e.target.value);
      }}
      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
      style={{ colorScheme: "dark" }}
    >
      <option value="">— Not specified —</option>
      {allOptions.map((o) => (
        <option key={o.value} value={o.value}>{o.value}</option>
      ))}
      <option value="__other__">Other…</option>
    </select>
  );
}

// ── GenreSelect ───────────────────────────────────────────────────────────────

function GenreSelect({
  value,
  onChange,
  mediaType,
}: {
  value: string;
  onChange: (v: string) => void;
  mediaType: MediaType;
}) {
  const [open, setOpen] = useState(false);
  // "top5" shows the short default list; "other" shows the full searchable list
  const [mode, setMode] = useState<"top5" | "other">("top5");
  const [query, setQuery] = useState("");
  const [customGenres, setCustomGenres] = useState<CustomGenreMap>(EMPTY_CUSTOM);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load custom genres from localStorage on mount
  useEffect(() => { setCustomGenres(loadCustomGenres()); }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Reset to top5 mode and clear query when closed
  useEffect(() => {
    if (!open) { setMode("top5"); setQuery(""); }
  }, [open]);

  // Focus search input when entering "other" mode
  useEffect(() => {
    if (mode === "other") setTimeout(() => inputRef.current?.focus(), 0);
  }, [mode]);

  const custom = customGenres[mediaType];
  // Default list: top5 + any custom genres added for this type (deduplicated)
  const defaultList = [...TOP5_GENRES[mediaType], ...custom.filter((c) => !TOP5_GENRES[mediaType].includes(c))];
  // Full list for search: standard + custom (deduplicated)
  const fullList = [...new Set([...GENRES[mediaType], ...custom])];
  const q = query.trim().toLowerCase();
  const filtered = q ? fullList.filter((g) => g.toLowerCase().includes(q)) : fullList;
  const isExact = fullList.some((g) => g.toLowerCase() === q);
  const showAdd = q.length > 0 && !isExact;

  function select(genre: string) {
    onChange(genre);
    setOpen(false);
  }

  function addCustom() {
    const genre = query.trim();
    if (!genre) return;
    const updated = { ...customGenres, [mediaType]: [...custom, genre] };
    setCustomGenres(updated);
    saveCustomGenres(updated);
    select(genre);
  }

  const itemClass = (genre: string) =>
    `w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between ${
      genre === value
        ? "bg-amber-600/20 text-amber-300"
        : "text-stone-300 hover:bg-stone-800 hover:text-stone-100"
    }`;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-left flex items-center justify-between focus:outline-none focus:border-amber-500 hover:border-stone-500 transition-colors"
      >
        <span className={value ? "text-stone-100" : "text-stone-500"}>
          {value || "Select a genre…"}
        </span>
        <svg
          className={`w-4 h-4 text-stone-500 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-[80] left-0 right-0 mt-1 bg-stone-900 border border-stone-700 rounded-lg shadow-2xl overflow-hidden">
          {mode === "top5" ? (
            /* ── Top-5 view ── */
            <div>
              {defaultList.map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => select(genre)}
                  className={itemClass(genre)}
                >
                  {genre}
                  {genre === value && (
                    <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
              {/* Other button */}
              <button
                type="button"
                onClick={() => setMode("other")}
                className="w-full text-left px-3 py-2 text-sm text-stone-400 hover:bg-stone-800 hover:text-stone-200 transition-colors border-t border-stone-800 flex items-center gap-2"
              >
                <span className="text-stone-500">⋯</span> Other…
              </button>
            </div>
          ) : (
            /* ── Other / search view ── */
            <div>
              {/* Back + search input */}
              <div className="flex items-center gap-1.5 p-2 border-b border-stone-800">
                <button
                  type="button"
                  onClick={() => setMode("top5")}
                  className="flex-shrink-0 text-stone-400 hover:text-stone-200 transition-colors px-1"
                  title="Back"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setMode("top5"); return; }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (showAdd) addCustom();
                      else if (filtered[0]) select(filtered[0]);
                    }
                  }}
                  placeholder="Search or enter a new genre…"
                  className="flex-1 bg-stone-800 border border-stone-700 rounded px-2.5 py-1.5 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              {/* Results list */}
              <div className="max-h-52 overflow-y-auto">
                {showAdd && (
                  <button
                    type="button"
                    onClick={addCustom}
                    className="w-full text-left px-3 py-2 text-sm text-amber-400 hover:bg-stone-800 transition-colors flex items-center gap-2 border-b border-stone-800"
                  >
                    <span className="text-stone-500 font-bold">+</span>
                    Add &ldquo;{query.trim()}&rdquo; to list
                  </button>
                )}
                {filtered.length > 0 ? (
                  filtered.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => select(genre)}
                      className={itemClass(genre)}
                    >
                      {genre}
                      {genre === value && (
                        <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-3 text-sm text-stone-500 text-center">
                    No matches — press Enter to add
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange?: (v: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={`text-xl leading-none transition-transform ${onChange ? "cursor-pointer hover:scale-125" : "cursor-default"} ${n <= value ? "text-amber-400" : "text-stone-600"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function CoverArt({
  item,
  size = "md",
}: {
  item: LibraryItem;
  size?: "sm" | "md" | "lg";
}) {
  const square = item.type === "audiobook" || item.type === "music";
  const dims = square
    ? { sm: "w-16 h-16", md: "w-[129px] h-[129px]", lg: "w-[202px] h-[202px]" }
    : { sm: "w-12 h-16", md: "w-[92px] h-[129px]", lg: "w-[147px] h-[202px]" };
  const textSize = { sm: "text-xs", md: "text-sm", lg: "text-base" };
  const iconSize = { sm: "text-2xl", md: "text-4xl", lg: "text-6xl" };
  const [imgOk, setImgOk] = useState(!!item.coverImageUrl);

  // Reset when cover URL changes
  useEffect(() => {
    setImgOk(!!item.coverImageUrl);
  }, [item.coverImageUrl]);

  return (
    <div
      className={`${dims[size]} rounded-sm shadow-lg relative flex-shrink-0 overflow-hidden`}
      style={
        !imgOk
          ? {
              background: `linear-gradient(135deg, ${item.coverColor} 0%, color-mix(in srgb, ${item.coverColor} 80%, black) 100%)`,
            }
          : undefined
      }
    >
      {/* Real cover image */}
      {item.coverImageUrl && imgOk && (
        <img
          src={item.coverImageUrl}
          alt={item.title}
          className="w-full h-full object-cover"
          onError={() => setImgOk(false)}
        />
      )}

      {/* Colored fallback */}
      {!imgOk && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20" />
          <div className="absolute inset-0 flex flex-col items-center justify-between p-1.5">
            <span className={iconSize[size]}>
              {TYPE_ICONS[item.type]}
            </span>
            <p
              className={`${textSize[size]} font-bold text-center leading-tight`}
              style={{ color: item.coverAccent }}
            >
              {item.title}
            </p>
          </div>
        </>
      )}

      {/* Spine gloss overlay on real images */}
      {imgOk && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/10" />
      )}

      {item.lent && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full border-2 border-stone-900 text-[8px] flex items-center justify-center font-bold text-white z-10">
          L
        </div>
      )}
    </div>
  );
}

// ── Add Item Form ─────────────────────────────────────────────────────────────

const COLORS = [
  { bg: "#7C3AED", accent: "#DDD6FE" },
  { bg: "#0F766E", accent: "#CCFBF1" },
  { bg: "#B45309", accent: "#FEF3C7" },
  { bg: "#0369A1", accent: "#E0F2FE" },
  { bg: "#BE185D", accent: "#FCE7F3" },
  { bg: "#991B1B", accent: "#FEE2E2" },
  { bg: "#065F46", accent: "#D1FAE5" },
  { bg: "#1E3A5F", accent: "#BAE6FD" },
];

function AddItemModal({
  onAdd,
  onSave,
  onClose,
  initialItem,
}: {
  onAdd?: (item: LibraryItem) => void;
  onSave?: (item: LibraryItem) => void;
  onClose: () => void;
  initialItem?: LibraryItem;
}) {
  const editMode = !!initialItem;

  const [form, setForm] = useState(() => {
    if (initialItem) {
      const colorIdx = COLORS.findIndex((c) => c.bg === initialItem.coverColor);
      return {
        type: initialItem.type,
        title: initialItem.title,
        creator: initialItem.creator,
        creatorFirst: initialItem.creatorFirst ?? "",
        creatorLast: initialItem.creatorLast ?? "",
        creatorIsGroup: initialItem.creatorIsGroup ?? false,
        year: initialItem.year,
        genre: initialItem.genre,
        description: initialItem.description,
        rating: initialItem.rating,
        colorIdx: colorIdx >= 0 ? colorIdx : 0,
        isbn: initialItem.isbn ?? "",
        asin: initialItem.asin ?? "",
        audiobookFormat: initialItem.audiobookFormat ?? "",
        musicFormat: initialItem.musicFormat ?? "",
        mediaCondition: initialItem.mediaCondition ?? "",
        coverCondition: initialItem.coverCondition ?? "",
        publisher: initialItem.publisher ?? "",
        series: initialItem.series ?? "",
        seriesPosition: initialItem.seriesPosition ?? "",
        narrator: initialItem.narrator ?? "",
        narratorList: initialItem.narrators?.length
          ? initialItem.narrators
          : (initialItem.narrator ? [{ first: initialItem.narrator, last: "" }] : [{ first: "", last: "" }]),
        duration: initialItem.runtime ?? "",
        drm: initialItem.drm ?? "",
        studio: initialItem.studio ?? "",
        aspectRatio: initialItem.aspectRatio ?? "",
        movieEdition: initialItem.firstEdition ?? "",
        moviePressing: initialItem.firstPrinting ?? "",
        movieMediaFormat: initialItem.mediaFormat ?? "",
        movieAudioFormat: initialItem.audioFormat ?? "",
        movieSpineNumber: initialItem.spineNumber ?? "",
        movieCertification: initialItem.certification ?? "",
        movieRegion: initialItem.region ?? "",
        musicPressing: initialItem.pressing ?? "",
        musicCatalogNumber: initialItem.catalogNumber ?? "",
        musicSpeed: initialItem.speed ?? "",
        musicCountry: initialItem.countryOfPressing ?? "",
        musicLabelVariant: initialItem.labelVariant ?? "",
        musicMatrix: initialItem.matrixInscription ?? "",
        gamePlatform: initialItem.platform ?? "",
        gameAgeRating: initialItem.ageRating ?? "",
        gameCib: initialItem.cib ?? "",
        gameRegionCode: initialItem.gameRegion ?? "",
        gameVariant: initialItem.gameVariant ?? "",
        gameSealGrade: initialItem.sealGrade ?? "",
        gameInsertCompleteness: initialItem.insertCompleteness ?? "",
        gameInsertNotes: initialItem.insertNotes ?? "",
        label: initialItem.label ?? "",
        language: initialItem.language ?? "",
      };
    }
    return {
      type: "book" as MediaType,
      title: "",
      creator: "",
      creatorFirst: "",
      creatorLast: "",
      creatorIsGroup: false,
      year: new Date().getFullYear(),
      genre: "",
      description: "",
      rating: 3,
      colorIdx: 0,
      isbn: "",
      asin: "",
      audiobookFormat: "",
      musicFormat: "",
      mediaCondition: "",
      coverCondition: "",
      publisher: "",
      series: "",
      seriesPosition: "",
      narrator: "",
      narratorList: [{ first: "", last: "" }] as Array<{ first: string; last: string }>,
      duration: "",
      drm: "",
      studio: "",
      aspectRatio: "",
      movieEdition: "",
      moviePressing: "",
      movieMediaFormat: "",
      movieAudioFormat: "",
      movieSpineNumber: "",
      movieCertification: "",
      movieRegion: "",
      musicPressing: "",
      musicCatalogNumber: "",
      musicSpeed: "",
      musicCountry: "",
      musicLabelVariant: "",
      musicMatrix: "",
      gamePlatform: "",
      gameAgeRating: "",
      gameCib: "",
      gameRegionCode: "",
      gameVariant: "",
      gameSealGrade: "",
      gameInsertCompleteness: "",
      gameInsertNotes: "",
      label: "",
      language: "",
    };
  });
  const [scanning, setScanning] = useState(false);
  const [lookupState, setLookupState] = useState<
    "idle" | "loading" | "found" | "not_found"
  >("idle");
  const [lastCode, setLastCode] = useState("");
  const [scannedCoverUrl, setScannedCoverUrl] = useState<string | undefined>();
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState<string | undefined>(
    initialItem?.coverImageUrl
  );
  const [modalWikiSearching, setModalWikiSearching] = useState(false);
  const [modalWikiFailed, setModalWikiFailed] = useState(false);

  function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedCoverUrl(ev.target?.result as string);
      setModalWikiFailed(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleModalWikiSearch() {
    if (!form.title.trim()) return;
    setModalWikiSearching(true);
    setModalWikiFailed(false);
    try {
      const url = await fetchWikipediaCover(form.title, form.creator);
      if (url) setUploadedCoverUrl(url);
      else setModalWikiFailed(true);
    } catch {
      setModalWikiFailed(true);
    } finally {
      setModalWikiSearching(false);
    }
  }

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  function applyLookup(result: LookupResult, code: string) {
    setScannedCoverUrl(result.coverImageUrl);
    const paletteIdx = COLORS.findIndex((c) => c.bg === result.coverColor);
    setForm((f) => ({
      ...f,
      type: result.type === "unknown" ? f.type : (result.type as MediaType),
      title: result.title || f.title,
      creator: result.creator || f.creator,
      year: result.year || f.year,
      genre: result.genre || f.genre,
      description: result.description || f.description,
      colorIdx: paletteIdx >= 0 ? paletteIdx : f.colorIdx,
    }));
    setLastCode(code);
    setLookupState("found");
  }

  async function handleScanned(code: string) {
    setScanning(false);
    setLookupState("loading");
    setLastCode(code);
    set("isbn", code);
    try {
      const result = await lookupBarcode(code);
      if (result) {
        applyLookup(result, code);
      } else {
        setLookupState("not_found");
      }
    } catch {
      setLookupState("not_found");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const color = COLORS[form.colorIdx];
    const built: LibraryItem = {
      id: initialItem?.id ?? Date.now().toString(),
      type: form.type,
      title: form.title.trim(),
      creator: form.creatorIsGroup
        ? (form.creator.trim() || "Unknown")
        : ([form.creatorFirst.trim(), form.creatorLast.trim()].filter(Boolean).join(" ") || form.creator.trim() || "Unknown"),
      creatorFirst: !form.creatorIsGroup ? (form.creatorFirst.trim() || undefined) : undefined,
      creatorLast: !form.creatorIsGroup ? (form.creatorLast.trim() || undefined) : undefined,
      creatorIsGroup: form.creatorIsGroup || undefined,
      year: form.year,
      genre: form.genre.trim() || "Uncategorized",
      description: form.description.trim(),
      rating: form.rating,
      coverColor: color.bg,
      coverAccent: color.accent,
      coverImageUrl: uploadedCoverUrl ?? scannedCoverUrl,
      tags: initialItem?.tags ?? [],
      isbn: form.type !== "audiobook" ? (form.isbn.trim() || undefined) : undefined,
      asin: form.type === "audiobook" ? (form.asin.trim() || undefined) : undefined,
      publisher: form.publisher.trim() || undefined,
      series: form.series.trim() || undefined,
      seriesPosition: form.seriesPosition.trim() || undefined,
      narrator: form.narratorList
        .filter((n) => n.first.trim() || n.last.trim())
        .map((n) => [n.first.trim(), n.last.trim()].filter(Boolean).join(" "))
        .join(", ") || undefined,
      narrators: form.narratorList.filter((n) => n.first.trim() || n.last.trim()).length
        ? form.narratorList.filter((n) => n.first.trim() || n.last.trim())
        : undefined,
      runtime: form.type === "audiobook" ? (form.duration.trim() || undefined) : undefined,
      drm: form.type === "audiobook" ? (form.drm || undefined) : undefined,
      studio: form.studio.trim() || undefined,
      aspectRatio: form.type === "movie" ? ((form.aspectRatio && form.aspectRatio !== "__other__") ? form.aspectRatio : undefined) : undefined,
      label: form.label.trim() || undefined,
      language: (form.language && form.language !== "__other__") ? form.language.trim() : undefined,
      // Preserve all collector / type-specific fields from the original item
      ...Object.fromEntries(
        PRESERVED_FIELDS
          .filter((k) => initialItem && initialItem[k] !== undefined)
          .map((k) => [k, initialItem![k]])
      ),
      // Form-level format / condition fields take priority over preserved values
      ...(form.type === "audiobook" ? { audiobookFormat: form.audiobookFormat || undefined } : {}),
      ...(form.type === "music" ? {
        musicFormat:    form.musicFormat    || undefined,
        mediaCondition: form.mediaCondition || undefined,
        coverCondition: form.coverCondition || undefined,
      } : {}),
      ...(form.type === "movie" ? {
        firstEdition:  (form.movieEdition  && form.movieEdition  !== "__other__") ? form.movieEdition  : undefined,
        firstPrinting: form.moviePressing || undefined,
        mediaFormat:   form.movieMediaFormat   || undefined,
        audioFormat:   (form.movieAudioFormat && form.movieAudioFormat !== "__other__") ? form.movieAudioFormat : undefined,
        spineNumber:   form.movieSpineNumber.trim() || undefined,
        certification: form.movieCertification || undefined,
        region:        form.movieRegion        || undefined,
      } : {}),
      ...(form.type === "music" ? {
        pressing:          form.musicPressing      || undefined,
        catalogNumber:     form.musicCatalogNumber || undefined,
        speed:             form.musicSpeed         || undefined,
        countryOfPressing: form.musicCountry       || undefined,
        labelVariant:      form.musicLabelVariant  || undefined,
        matrixInscription: form.musicMatrix        || undefined,
      } : {}),
      ...(form.type === "game" ? {
        platform:   form.gamePlatform   || undefined,
        ageRating:  form.gameAgeRating  || undefined,
        cib:        form.gameCib        || undefined,
        gameRegion: form.gameRegionCode || undefined,
        gameVariant: form.gameVariant || undefined,
        sealGrade:          form.gameSealGrade || undefined,
        insertCompleteness: form.gameInsertCompleteness || undefined,
        insertNotes:        form.gameInsertNotes || undefined,
      } : {}),
    };
    if (editMode) onSave?.(built);
    else onAdd?.(built);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-stone-900 border border-stone-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-700">
            <h2 className="text-lg font-semibold text-stone-100">
              {editMode ? "Edit Item" : "Add to Collection"}
            </h2>
            <div className="flex items-center gap-2">
              {!editMode && (
                <button
                  type="button"
                  onClick={() => setScanning(true)}
                  title="Scan a barcode with your camera"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg text-xs font-medium transition-colors"
                >
                  <span>📷</span> Scan Barcode
                </button>
              )}
              <button
                onClick={onClose}
                className="text-stone-400 hover:text-stone-100 text-xl leading-none ml-1"
              >
                ×
              </button>
            </div>
          </div>

          {/* Lookup status banner */}
          {lookupState === "loading" && (
            <div className="flex items-center gap-3 px-6 py-3 bg-stone-800 border-b border-stone-700">
              <div className="w-4 h-4 border-2 border-stone-600 border-t-amber-400 rounded-full animate-spin flex-shrink-0" />
              <p className="text-sm text-stone-300">
                Looking up <span className="font-mono text-amber-400">{lastCode}</span>…
              </p>
            </div>
          )}
          {lookupState === "found" && (
            <div className="flex items-center gap-2 px-6 py-3 bg-emerald-950/60 border-b border-emerald-800/50">
              <span className="text-emerald-400 text-sm">✓</span>
              <p className="text-sm text-emerald-300">
                Found! Fields pre-filled — review and confirm below.
              </p>
              <button
                onClick={() => setScanning(true)}
                className="ml-auto text-xs text-emerald-600 hover:text-emerald-400"
              >
                Scan again
              </button>
            </div>
          )}
          {lookupState === "not_found" && (
            <div className="flex items-center gap-2 px-6 py-3 bg-amber-950/60 border-b border-amber-800/50">
              <span className="text-amber-400 text-sm">⚠</span>
              <p className="text-sm text-amber-300">
                No match for <span className="font-mono text-amber-400">{lastCode}</span> — fill in manually.
              </p>
              <button
                onClick={() => setScanning(true)}
                className="ml-auto text-xs text-amber-600 hover:text-amber-400"
              >
                Try again
              </button>
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Type selector */}
            <div className="flex flex-wrap gap-2">
              {(["book", "audiobook", "movie", "music", "game"] as MediaType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("type", t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.type === t ? "bg-amber-600 text-white" : "bg-stone-800 text-stone-400 hover:text-stone-200"}`}
                >
                  {TYPE_ICONS[t]} {TYPE_LABELS_SINGULAR[t]}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-stone-400 mb-1">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                  placeholder={`${form.type === "book" ? "Book" : form.type === "audiobook" ? "Audiobook" : form.type === "movie" ? "Movie" : form.type === "music" ? "Album" : "Game"} title...`}
                />
              </div>
              <div className={form.creatorIsGroup ? "" : "col-span-2"}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-stone-400">{CREATOR_LABEL[form.type]}</label>
                  <button
                    type="button"
                    onClick={() => set("creatorIsGroup", !form.creatorIsGroup)}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                      form.creatorIsGroup
                        ? "bg-amber-600/20 border-amber-600/40 text-amber-400"
                        : "bg-stone-800 border-stone-600 text-stone-500 hover:text-stone-300"
                    }`}
                  >
                    {form.creatorIsGroup ? "Group / Org" : "Personal name"}
                  </button>
                </div>
                {form.creatorIsGroup ? (
                  <input
                    value={form.creator}
                    onChange={(e) => set("creator", e.target.value)}
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                    placeholder="Band, studio, or organization name…"
                  />
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={form.creatorFirst}
                      onChange={(e) => set("creatorFirst", e.target.value)}
                      className="flex-1 bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                      placeholder="First name"
                    />
                    <input
                      value={form.creatorLast}
                      onChange={(e) => set("creatorLast", e.target.value)}
                      className="flex-1 bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                      placeholder="Last name"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">
                  {form.type === "audiobook" ? "Recording Year" : "Year"}
                </label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => set("year", Number(e.target.value))}
                  className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              {form.type !== "audiobook" ? (
                <div className="col-span-2">
                  <label className="block text-xs text-stone-400 mb-1">ISBN / Barcode</label>
                  <div className="flex gap-2">
                    <input
                      value={form.isbn}
                      onChange={(e) => set("isbn", e.target.value)}
                      className="flex-1 bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal"
                      placeholder="e.g. 978-0-06-112008-4"
                      spellCheck={false}
                    />
                    <button
                      type="button"
                      onClick={() => setScanning(true)}
                      title="Scan barcode with camera"
                      className="flex items-center gap-1.5 px-3 py-2 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <rect x="2" y="4" width="2" height="12" rx="0.5"/>
                        <rect x="5" y="4" width="1" height="12" rx="0.5"/>
                        <rect x="7" y="4" width="2" height="12" rx="0.5"/>
                        <rect x="10" y="4" width="1" height="12" rx="0.5"/>
                        <rect x="12" y="4" width="3" height="12" rx="0.5"/>
                        <rect x="16" y="4" width="2" height="12" rx="0.5"/>
                      </svg>
                      Scan
                    </button>
                  </div>
                  {form.isbn && (
                    <p className="text-xs text-stone-500 mt-1">
                      {/^97[89]\d{10}$/.test(form.isbn.replace(/[-\s]/g, ""))
                        ? "ISBN-13 detected"
                        : /^\d{10}$/.test(form.isbn.replace(/[-\s]/g, ""))
                        ? "ISBN-10 detected"
                        : /^\d{12}$/.test(form.isbn.replace(/[-\s]/g, ""))
                        ? "UPC-A detected"
                        : "Barcode / identifier"}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">ASIN / PubCat</label>
                    <input
                      type="text"
                      value={form.asin}
                      onChange={(e) => set("asin", e.target.value)}
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal"
                      placeholder="e.g. B002V5GK0I"
                      spellCheck={false}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Retailer / Platform</label>
                    <RetailerSelect
                      value={form.audiobookFormat}
                      onChange={(v) => set("audiobookFormat", v)}
                    />
                  </div>
                  {/* Run Time — H:MM:SS structured input */}
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Run Time</label>
                    <div className="flex items-center gap-1.5">
                      {(["h", "mm", "ss"] as const).map((part, idx) => {
                        const parts = form.duration ? form.duration.split(":") : ["", "", ""];
                        const val = parts[idx] ?? "";
                        const rtCls = "w-12 bg-stone-800 border border-stone-600 rounded-lg px-2 py-2 text-stone-100 text-sm text-center focus:outline-none focus:border-amber-500 font-mono placeholder:font-sans placeholder:text-stone-500";
                        return (
                          <span key={part} className="flex items-center gap-1.5">
                            {idx > 0 && <span className="text-stone-500 text-sm font-mono select-none">:</span>}
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={idx === 0 ? 3 : 2}
                              value={val}
                              placeholder={part}
                              className={rtCls}
                              onChange={(e) => {
                                const cleaned = e.target.value.replace(/\D/g, "");
                                const p = form.duration ? form.duration.split(":") : ["", "", ""];
                                p[idx] = cleaned;
                                const [h, m, s] = p;
                                set("duration", (h || m || s) ? `${h || "0"}:${(m || "0").padStart(2, "0")}:${(s || "0").padStart(2, "0")}` : "");
                              }}
                              onBlur={(e) => {
                                const v = e.target.value.replace(/\D/g, "");
                                if (v && idx > 0) {
                                  const p = form.duration ? form.duration.split(":") : ["0", "00", "00"];
                                  p[idx] = v.padStart(2, "0");
                                  set("duration", `${p[0] || "0"}:${p[1].padStart(2,"0")}:${p[2].padStart(2,"0")}`);
                                }
                              }}
                            />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  {/* DRM toggle */}
                  <div className="col-span-2">
                    <label className="block text-xs text-stone-400 mb-1.5">DRM</label>
                    <div className="flex gap-2">
                      {(["DRM-Free", "DRM-Locked"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => set("drm", form.drm === opt ? "" : opt)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            form.drm === opt
                              ? opt === "DRM-Free"
                                ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-300"
                                : "bg-red-600/20 border-red-500/50 text-red-300"
                              : "bg-stone-800 border-stone-600 text-stone-400 hover:text-stone-200"
                          }`}
                        >
                          {opt === "DRM-Free" ? "✓ DRM-Free" : "🔒 DRM-Locked"}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {/* Publisher / Label — label changes by type */}
              {(form.type === "book" || form.type === "audiobook" || form.type === "game") && (
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Publisher / Imprint</label>
                  <input
                    type="text"
                    value={form.publisher}
                    onChange={(e) => set("publisher", e.target.value)}
                    placeholder="e.g. Tor Books, DAW, Nintendo"
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                  />
                </div>
              )}
              {form.type === "music" && (
                <>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Record Label</label>
                    <input
                      type="text"
                      value={form.label}
                      onChange={(e) => set("label", e.target.value)}
                      placeholder="e.g. Blue Note, Sub Pop, Def Jam"
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Format</label>
                    <select
                      value={form.musicFormat}
                      onChange={(e) => set("musicFormat", e.target.value)}
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">— Not specified —</option>
                      {MUSIC_FORMAT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Media Condition</label>
                    <select
                      value={form.mediaCondition}
                      onChange={(e) => set("mediaCondition", e.target.value)}
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">— Not graded —</option>
                      {RECORD_CONDITION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Cover Condition</label>
                    <select
                      value={form.coverCondition}
                      onChange={(e) => set("coverCondition", e.target.value)}
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">— Not graded —</option>
                      {RECORD_CONDITION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Pressing</label>
                    <select
                      value={form.musicPressing}
                      onChange={(e) => set("musicPressing", e.target.value)}
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">— Not specified —</option>
                      {PRESSING_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Catalog #</label>
                    <input
                      type="text"
                      value={form.musicCatalogNumber}
                      onChange={(e) => set("musicCatalogNumber", e.target.value)}
                      placeholder="e.g. BN 4003, CRE132"
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm font-mono focus:outline-none focus:border-amber-500 placeholder:font-sans placeholder:text-stone-500"
                      spellCheck={false}
                    />
                  </div>
                  {form.musicFormat === "Vinyl" && (
                    <div>
                      <label className="block text-xs text-stone-400 mb-1">Speed</label>
                      <select
                        value={form.musicSpeed}
                        onChange={(e) => set("musicSpeed", e.target.value)}
                        className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                        style={{ colorScheme: "dark" }}
                      >
                        <option value="">— Not specified —</option>
                        {SPEED_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.value}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="block text-xs text-stone-400 mb-1">Country of Pressing</label>
                    <CountrySelect
                      value={form.musicCountry}
                      onChange={(v) => set("musicCountry", v)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-stone-400 mb-1">Label Variant</label>
                    <input
                      type="text"
                      value={form.musicLabelVariant}
                      onChange={(e) => set("musicLabelVariant", e.target.value)}
                      placeholder="e.g. Monarch pressing, red/maroon label, promo copy"
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-stone-400 mb-1">Matrix / Runout</label>
                    <input
                      type="text"
                      value={form.musicMatrix}
                      onChange={(e) => set("musicMatrix", e.target.value)}
                      placeholder="e.g. A1/B1, MONARCH-A △"
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm font-mono focus:outline-none focus:border-amber-500 placeholder:font-sans placeholder:text-stone-500"
                      spellCheck={false}
                    />
                  </div>
                </>
              )}
              {form.type === "game" && (
                <>
                  <div className="col-span-2">
                    <label className="block text-xs text-stone-400 mb-1">Platform</label>
                    <select
                      value={form.gamePlatform}
                      onChange={(e) => set("gamePlatform", e.target.value)}
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">— Not specified —</option>
                      {PLATFORM_OPTIONS.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Completeness</label>
                    <select
                      value={form.gameCib}
                      onChange={(e) => set("gameCib", e.target.value)}
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">— Not specified —</option>
                      {CIB_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.value}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Age Rating</label>
                    <select
                      value={form.gameAgeRating}
                      onChange={(e) => set("gameAgeRating", e.target.value)}
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">— Not specified —</option>
                      {AGE_RATING_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.value} — {o.description}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">Region</label>
                    <select
                      value={form.gameRegionCode}
                      onChange={(e) => set("gameRegionCode", e.target.value)}
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">— Not specified —</option>
                      {GAME_REGION_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.value} — {o.description}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-stone-400 mb-1">Variant / Revision</label>
                    <input
                      type="text"
                      value={form.gameVariant}
                      onChange={(e) => set("gameVariant", e.target.value)}
                      placeholder="e.g. Rev A, v1.1, Player's Choice, Greatest Hits"
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-stone-400 mb-1">Seal Grade</label>
                    <select
                      value={form.gameSealGrade}
                      onChange={(e) => set("gameSealGrade", e.target.value)}
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">— Not specified —</option>
                      {SEAL_GRADE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.value}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-stone-400 mb-1.5">Insert Completeness</label>
                    <div className="flex gap-2">
                      {(["Complete", "Incomplete"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => set("gameInsertCompleteness", form.gameInsertCompleteness === opt ? "" : opt)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            form.gameInsertCompleteness === opt
                              ? opt === "Complete"
                                ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-300"
                                : "bg-amber-600/20 border-amber-500/50 text-amber-300"
                              : "bg-stone-800 border-stone-600 text-stone-400 hover:text-stone-200"
                          }`}
                        >
                          {opt === "Complete" ? "✓ Complete" : "✗ Incomplete"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-stone-400 mb-1">Insert Notes</label>
                    <textarea
                      value={form.gameInsertNotes}
                      onChange={(e) => set("gameInsertNotes", e.target.value)}
                      placeholder="e.g. Missing registration card, manual has spine crease"
                      rows={2}
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                </>
              )}
              {form.type === "movie" && (
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Studio</label>
                  <input
                    type="text"
                    value={form.studio}
                    onChange={(e) => set("studio", e.target.value)}
                    placeholder="e.g. A24, Criterion Collection"
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                  />
                </div>
              )}
              {form.type === "movie" && (
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Format</label>
                  <select
                    value={form.movieMediaFormat}
                    onChange={(e) => set("movieMediaFormat", e.target.value)}
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="">— Not specified —</option>
                    {MEDIA_FORMAT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.value}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.type === "movie" && (
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Audio Format</label>
                  {(form.movieAudioFormat === "__other__" || (form.movieAudioFormat && !AUDIO_FORMAT_OPTIONS.find((o) => o.value === form.movieAudioFormat))) ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.movieAudioFormat === "__other__" ? "" : form.movieAudioFormat}
                        onChange={(e) => set("movieAudioFormat", e.target.value || "__other__")}
                        placeholder="e.g. SDDS, Sony 360 Reality Audio"
                        autoFocus
                        className="flex-1 bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                      />
                      <button
                        type="button"
                        onClick={() => set("movieAudioFormat", "")}
                        className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg text-sm transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <select
                      value={form.movieAudioFormat}
                      onChange={(e) => set("movieAudioFormat", e.target.value)}
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">— Not specified —</option>
                      {AUDIO_FORMAT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.value} — {o.description}</option>
                      ))}
                      <option value="__other__">Other…</option>
                    </select>
                  )}
                </div>
              )}
              {form.type === "movie" && (
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Certificate</label>
                  <select
                    value={form.movieCertification}
                    onChange={(e) => set("movieCertification", e.target.value)}
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="">— Not specified —</option>
                    {CERTIFICATION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.value} — {o.description}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.type === "movie" && (
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Region</label>
                  <select
                    value={form.movieRegion}
                    onChange={(e) => set("movieRegion", e.target.value)}
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="">— Not specified —</option>
                    {REGION_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.value} — {o.description}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.type === "movie" && (
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Aspect Ratio</label>
                  {(form.aspectRatio === "__other__" || (form.aspectRatio && !ASPECT_RATIO_OPTIONS.find((o) => o.value === form.aspectRatio))) ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.aspectRatio === "__other__" ? "" : form.aspectRatio}
                        onChange={(e) => set("aspectRatio", e.target.value || "__other__")}
                        placeholder="e.g. 1.90:1"
                        autoFocus
                        className="flex-1 bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                      />
                      <button
                        type="button"
                        onClick={() => set("aspectRatio", "")}
                        className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg text-sm transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <select
                      value={form.aspectRatio}
                      onChange={(e) => set("aspectRatio", e.target.value)}
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">— Not specified —</option>
                      {ASPECT_RATIO_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.value} — {o.description}
                        </option>
                      ))}
                      <option value="__other__">Other…</option>
                    </select>
                  )}
                </div>
              )}
              {form.type === "movie" && (
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Edition</label>
                  {(form.movieEdition === "__other__" || (form.movieEdition && !Array.from({ length: 10 }, (_, i) => wordOrdinal(i + 1)).includes(form.movieEdition))) ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={form.movieEdition === "__other__" ? "" : form.movieEdition}
                        onChange={(e) => set("movieEdition", e.target.value || "__other__")}
                        placeholder="e.g. Criterion Collection"
                        autoFocus
                        className="flex-1 bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                      />
                      <button
                        type="button"
                        onClick={() => set("movieEdition", "")}
                        className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg text-sm transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <select
                      value={form.movieEdition}
                      onChange={(e) => set("movieEdition", e.target.value)}
                      className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="">— Not specified —</option>
                      {Array.from({ length: 10 }, (_, i) => wordOrdinal(i + 1)).map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                      <option value="__other__">Other…</option>
                    </select>
                  )}
                </div>
              )}
              {form.type === "movie" && (
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Pressing</label>
                  <select
                    value={form.moviePressing}
                    onChange={(e) => set("moviePressing", e.target.value)}
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="">— Not specified —</option>
                    {Array.from({ length: 10 }, (_, i) => numOrdinal(i + 1)).map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.type === "movie" && (
                <div>
                  <label className="block text-xs text-stone-400 mb-1">Spine #</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.movieSpineNumber}
                    onChange={(e) => set("movieSpineNumber", e.target.value.replace(/\D/g, ""))}
                    placeholder="e.g. 42"
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm font-mono focus:outline-none focus:border-amber-500 placeholder:font-sans placeholder:text-stone-500"
                  />
                </div>
              )}
              {/* Audiobook-specific: narrator(s) */}
              {form.type === "audiobook" && (
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-stone-400">Narrator(s)</label>
                    <button
                      type="button"
                      onClick={() => set("narratorList", [...form.narratorList, { first: "", last: "" }])}
                      className="text-[10px] px-1.5 py-0.5 rounded border bg-stone-800 border-stone-600 text-stone-400 hover:text-stone-200 transition-colors"
                    >
                      + Add narrator
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.narratorList.map((n, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <input
                          value={n.first}
                          onChange={(e) => {
                            const updated = form.narratorList.map((x, j) => j === i ? { ...x, first: e.target.value } : x);
                            set("narratorList", updated);
                          }}
                          placeholder="First name"
                          className="flex-1 bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                        />
                        <input
                          value={n.last}
                          onChange={(e) => {
                            const updated = form.narratorList.map((x, j) => j === i ? { ...x, last: e.target.value } : x);
                            set("narratorList", updated);
                          }}
                          placeholder="Last name"
                          className="flex-1 bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                        />
                        {form.narratorList.length > 1 && (
                          <button
                            type="button"
                            onClick={() => set("narratorList", form.narratorList.filter((_, j) => j !== i))}
                            className="flex-shrink-0 w-8 h-9 flex items-center justify-center text-stone-500 hover:text-red-400 transition-colors"
                            title="Remove narrator"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Series / Position */}
              <div className="col-span-2 flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-stone-400 mb-1">Series</label>
                  <input
                    type="text"
                    value={form.series}
                    onChange={(e) => set("series", e.target.value)}
                    placeholder="e.g. The Wheel of Time"
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                  />
                </div>
                <div className="w-24 flex-shrink-0">
                  <label className="block text-xs text-stone-400 mb-1">Position</label>
                  <input
                    type="text"
                    value={form.seriesPosition}
                    onChange={(e) => set("seriesPosition", e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-stone-400 mb-1">Genre</label>
                <GenreSelect
                  value={form.genre}
                  onChange={(v) => set("genre", v)}
                  mediaType={form.type}
                />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Language</label>
                {(form.language === "__other__" || (form.language && !LANGUAGE_OPTIONS.includes(form.language))) ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.language === "__other__" ? "" : form.language}
                      onChange={(e) => set("language", e.target.value || "__other__")}
                      placeholder="Language name"
                      autoFocus
                      className="flex-1 bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 placeholder:text-stone-500"
                    />
                    <button
                      type="button"
                      onClick={() => set("language", "")}
                      className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg text-sm transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <select
                    value={form.language}
                    onChange={(e) => set("language", e.target.value)}
                    className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="">— Not specified —</option>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                    <option value="__other__">Other…</option>
                  </select>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-stone-400 mb-1">Notes</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={5}
                  className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500 resize-y min-h-[80px]"
                  placeholder="Add a note or description..."
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-xs text-stone-400 mb-1">
                Your Rating
              </label>
              <StarRating value={form.rating} onChange={(v) => set("rating", v)} />
            </div>

            {/* Cover art upload */}
            <div>
              <label className="block text-xs text-stone-400 mb-2">
                Cover Art
              </label>
              <div className="flex items-center gap-3">
                {(uploadedCoverUrl || scannedCoverUrl) && (
                  <img
                    src={uploadedCoverUrl || scannedCoverUrl}
                    alt="Cover preview"
                    className={`${form.type === "audiobook" || form.type === "music" ? "w-16 h-16" : "w-12 h-16"} object-cover rounded shadow flex-shrink-0`}
                  />
                )}
                <div className="flex flex-col gap-1.5 flex-1">
                  {/* Upload + Wikipedia row */}
                  <div className="flex gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg text-xs font-medium transition-colors">
                      📁 {uploadedCoverUrl ? "Replace" : "Upload"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={handleCoverUpload}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleModalWikiSearch}
                      disabled={modalWikiSearching || !form.title.trim()}
                      title={!form.title.trim() ? "Enter a title first" : "Wikipedia-sourced image may be subject to copyright restrictions. The user is responsible for ensuring that the use of such images is lawful."}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                    >
                      {modalWikiSearching ? (
                        <>
                          <span className="inline-block w-3 h-3 border border-stone-500 border-t-amber-400 rounded-full animate-spin" />
                          Searching…
                        </>
                      ) : (
                        <>🌐 Wikipedia</>
                      )}
                    </button>
                  </div>
                  {modalWikiFailed && (
                    <p className="text-xs text-amber-600">No image found on Wikipedia.</p>
                  )}
                  <p className="text-xs text-stone-500">
                    {form.type === "music" || form.type === "audiobook"
                      ? "Ideal: 500 × 500 px (square)"
                      : "Ideal: 400 × 600 px (2 : 3)"}
                    {" · "}JPEG, PNG, or WebP
                  </p>
                  {uploadedCoverUrl && uploadedCoverUrl !== initialItem?.coverImageUrl && (
                    <button
                      type="button"
                      onClick={() => { setUploadedCoverUrl(initialItem?.coverImageUrl); setModalWikiFailed(false); }}
                      className="text-xs text-stone-500 hover:text-red-400 text-left"
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cover color */}
            <div>
              <label className="block text-xs text-stone-400 mb-2">
                Cover Color
              </label>
              <div className="flex gap-2">
                {COLORS.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => set("colorIdx", i)}
                    className={`w-7 h-7 rounded-full transition-transform ${form.colorIdx === i ? "scale-125 ring-2 ring-amber-400 ring-offset-2 ring-offset-stone-900" : "hover:scale-110"}`}
                    style={{ backgroundColor: c.bg }}
                  />
                ))}
              </div>
            </div>

            </div>{/* end scrollable body */}

            {/* Sticky footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-stone-700 flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-stone-400 hover:text-stone-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {editMode ? "Save Changes" : "Add to Library"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Barcode scanner overlay — rendered above the modal */}
      {scanning && (
        <BarcodeScanner
          onDetected={handleScanned}
          onClose={() => setScanning(false)}
        />
      )}
    </>
  );
}

// ── Lend Modal ────────────────────────────────────────────────────────────────

function LendModal({
  item,
  onLend,
  onReturn,
  onClose,
}: {
  item: LibraryItem;
  onLend: (borrower: string) => void;
  onReturn: () => void;
  onClose: () => void;
}) {
  const [borrower, setBorrower] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-stone-900 border border-stone-700 rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-semibold text-stone-100 mb-1">
          {item.lent ? "Lending Record" : "Lend Item"}
        </h2>
        <p className="text-stone-400 text-sm mb-4">{item.title}</p>

        {item.lent ? (
          <div className="space-y-4">
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4">
              <p className="text-amber-300 text-sm font-medium">
                Lent to {item.lent.borrower}
              </p>
              <p className="text-amber-500 text-xs mt-1">
                Since {new Date(item.lent.lentOn).toLocaleDateString()}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-stone-400 hover:text-stone-200"
              >
                Close
              </button>
              <button
                onClick={onReturn}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium"
              >
                Mark Returned
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-stone-400 mb-1">
                Borrower Name
              </label>
              <input
                autoFocus
                value={borrower}
                onChange={(e) => setBorrower(e.target.value)}
                className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-stone-100 text-sm focus:outline-none focus:border-amber-500"
                placeholder="Who are you lending this to?"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-stone-400 hover:text-stone-200"
              >
                Cancel
              </button>
              <button
                onClick={() => borrower.trim() && onLend(borrower.trim())}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium"
              >
                Record Lend
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


// ── Shelf Row ─────────────────────────────────────────────────────────────────

function ShelfRow({
  items,
  onSelect,
  selectedId,
}: {
  items: LibraryItem[];
  onSelect: (item: LibraryItem) => void;
  selectedId: string | null;
}) {
  return (
    <div className="relative">
      {/* Shelf plank */}
      <div
        className="flex items-end gap-3 px-6 pb-0 pt-4 min-h-44"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(4,4,18,0.25) 100%)",
        }}
      >
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className={`relative group transition-all duration-150 focus:outline-none ${selectedId === item.id ? "-translate-y-3" : "hover:-translate-y-2"}`}
          >
            <CoverArt item={item} size="md" />
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 whitespace-nowrap shadow-xl max-w-48 text-center">
                <p className="font-medium truncate">{item.title}</p>
                <p className="text-stone-400 truncate">{item.creator}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      {/* Wood shelf surface */}
      <div
        className="h-4 w-full rounded-b-sm"
        style={{
          background:
            "linear-gradient(to bottom, #6B4C2A 0%, #4A3520 40%, #3A2818 100%)",
          boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
        }}
      />
      {/* Shelf shadow */}
      <div
        className="h-2 w-full"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

// ── Faceted search panel ──────────────────────────────────────────────────────

function FacetRow({
  label, count, checked, onChange,
}: { label: string; count: number; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-3 h-3 rounded cursor-pointer accent-amber-500 flex-shrink-0"
      />
      <span
        className={`flex-1 text-xs truncate transition-colors ${
          checked ? "text-amber-300" : "text-stone-400 group-hover:text-stone-200"
        }`}
      >
        {label}
      </span>
      <span className="text-[10px] text-stone-600 tabular-nums">{count}</span>
    </label>
  );
}

function FacetSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 border-b border-indigo-900/30">
      <p className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-2">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

type FacetCounts = {
  genres: Map<string, number>;
  tags: Map<string, number>;
  ratings: Map<number, number>;
  platforms: Map<string, number>;
  formats: Map<string, number>;
  onLoanCount: number;
};

function FacetPanel({
  counts,
  filters,
  setFilters,
}: {
  counts: FacetCounts;
  filters: FacetFilters;
  setFilters: React.Dispatch<React.SetStateAction<FacetFilters>>;
}) {
  function toggleStr(key: "genres" | "tags" | "platforms" | "formats", value: string) {
    setFilters((f) => {
      const arr = f[key];
      return { ...f, [key]: arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value] };
    });
  }
  function toggleRating(r: number) {
    setFilters((f) => ({
      ...f,
      ratings: f.ratings.includes(r) ? f.ratings.filter((v) => v !== r) : [...f.ratings, r],
    }));
  }

  const hasAny =
    filters.genres.length > 0 ||
    filters.tags.length > 0 ||
    filters.ratings.length > 0 ||
    filters.onLoan !== null ||
    filters.platforms.length > 0 ||
    filters.formats.length > 0;

  const sortedGenres = [...counts.genres.entries()].sort(([a], [b]) => a.localeCompare(b));
  const sortedTags = [...counts.tags.entries()].sort(([, a], [, b]) => b - a).slice(0, 12);
  const sortedPlatforms = [...counts.platforms.entries()].sort(([, a], [, b]) => b - a);
  const sortedFormats = [...counts.formats.entries()].sort(([, a], [, b]) => b - a);

  return (
    <aside
      className="w-48 flex-shrink-0 border-r border-indigo-900/50 overflow-y-auto flex flex-col"
      style={{ background: "linear-gradient(to bottom, #06061a 0%, #080820 100%)" }}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-indigo-900/50 flex-shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Filters</span>
        {hasAny && (
          <button
            onClick={() => setFilters(EMPTY_FACETS)}
            className="text-[11px] text-amber-500 hover:text-amber-400 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Genre */}
      {sortedGenres.length > 0 && (
        <FacetSection title="Genre">
          {sortedGenres.map(([genre, count]) => (
            <FacetRow
              key={genre}
              label={genre}
              count={count}
              checked={filters.genres.includes(genre)}
              onChange={() => toggleStr("genres", genre)}
            />
          ))}
        </FacetSection>
      )}

      {/* Rating */}
      {counts.ratings.size > 0 && (
        <FacetSection title="Rating">
          {[5, 4, 3, 2, 1]
            .filter((r) => counts.ratings.has(r))
            .map((r) => (
              <FacetRow
                key={r}
                label={"★".repeat(r) + "☆".repeat(5 - r)}
                count={counts.ratings.get(r)!}
                checked={filters.ratings.includes(r)}
                onChange={() => toggleRating(r)}
              />
            ))}
        </FacetSection>
      )}

      {/* Tags */}
      {sortedTags.length > 0 && (
        <FacetSection title="Tags">
          {sortedTags.map(([tag, count]) => (
            <FacetRow
              key={tag}
              label={tag}
              count={count}
              checked={filters.tags.includes(tag)}
              onChange={() => toggleStr("tags", tag)}
            />
          ))}
        </FacetSection>
      )}

      {/* On Loan */}
      {counts.onLoanCount > 0 && (
        <FacetSection title="Status">
          <FacetRow
            label="On Loan"
            count={counts.onLoanCount}
            checked={filters.onLoan === true}
            onChange={() =>
              setFilters((f) => ({ ...f, onLoan: f.onLoan === true ? null : true }))
            }
          />
        </FacetSection>
      )}

      {/* Platform */}
      {sortedPlatforms.length > 0 && (
        <FacetSection title="Platform">
          {sortedPlatforms.map(([p, count]) => (
            <FacetRow
              key={p}
              label={p}
              count={count}
              checked={filters.platforms.includes(p)}
              onChange={() => toggleStr("platforms", p)}
            />
          ))}
        </FacetSection>
      )}

      {/* Format */}
      {sortedFormats.length > 0 && (
        <FacetSection title="Format">
          {sortedFormats.map(([fmt, count]) => (
            <FacetRow
              key={fmt}
              label={fmt}
              count={count}
              checked={filters.formats.includes(fmt)}
              onChange={() => toggleStr("formats", fmt)}
            />
          ))}
        </FacetSection>
      )}
    </aside>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type FilterTab = "all" | MediaType;
type SortKey = "title" | "year" | "rating" | "creator";

type FacetFilters = {
  genres: string[];
  tags: string[];
  ratings: number[];
  onLoan: boolean | null;
  platforms: string[];
  formats: string[];
};
const EMPTY_FACETS: FacetFilters = {
  genres: [], tags: [], ratings: [], onLoan: null, platforms: [], formats: [],
};

const LS_KEY = "library-items";

function lsLoad(): LibraryItem[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as LibraryItem[]) : null;
  } catch {
    return null;
  }
}

function lsSave(items: LibraryItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {}
}

async function apiLoad(): Promise<LibraryItem[] | null> {
  try {
    const res = await fetch("/api/library", {
      headers: { "x-csrf-token": "fetch" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.items as LibraryItem[];
  } catch {
    return null;
  }
}

async function apiSave(items: LibraryItem[]): Promise<boolean> {
  try {
    const res = await fetch("/api/library", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-csrf-token": "fetch" },
      body: JSON.stringify({ items }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>(SAMPLE_ITEMS);
  const [storageMode, setStorageMode] = useState<"db" | "local" | "loading">("loading");
  const isFirstLoad = useRef(true);

  // On mount: try DB first, fall back to localStorage
  useEffect(() => {
    apiLoad().then((dbItems) => {
      if (dbItems !== null) {
        // Authenticated — merge any local items that aren't in DB yet
        const localItems = lsLoad() ?? [];
        const merged = [...dbItems];
        for (const li of localItems) {
          if (!merged.find((i) => i.id === li.id)) merged.push(li);
        }
        setItems(merged.length > 0 ? merged : SAMPLE_ITEMS);
        setStorageMode("db");
      } else {
        // Anonymous — use localStorage
        const local = lsLoad();
        setItems(local ?? SAMPLE_ITEMS);
        setStorageMode("local");
      }
      isFirstLoad.current = false;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change (skip the initial population)
  useEffect(() => {
    if (storageMode === "loading" || isFirstLoad.current) return;
    if (storageMode === "db") {
      apiSave(items).then((ok) => {
        if (!ok) lsSave(items); // fallback to local if DB write fails
      });
    } else {
      lsSave(items);
    }
  }, [items, storageMode]);

  // Auto-fetch cover art for items that don't have a cover URL.
  // Runs once after the library finishes loading from storage.
  useEffect(() => {
    if (storageMode === "loading") return;
    const needsCovers = items.filter((i) => !i.coverImageUrl);
    if (needsCovers.length === 0) return;

    needsCovers.forEach(async (item) => {
      try {
        const url = await fetchCoverForItem(item);
        if (!url) return;
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, coverImageUrl: url } : i))
        );
      } catch {
        // network failure — silently skip
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageMode]);

  const [selected, setSelected] = useState<LibraryItem | null>(null);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [sort, setSort] = useState<SortKey>("title");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<LibraryItem | null>(null);
  const [lendTarget, setLendTarget] = useState<LibraryItem | null>(null);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [facetFilters, setFacetFilters] = useState<FacetFilters>(EMPTY_FACETS);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const csvImportRef = useRef<HTMLInputElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  function exportBackup() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      itemCount: items.length,
      items,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `library-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg(`Exported ${items.length} item${items.length !== 1 ? "s" : ""}`);
    setTimeout(() => setBackupMsg(null), 3000);
  }

  function importBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        const incoming: LibraryItem[] = Array.isArray(json)
          ? json
          : Array.isArray(json.items)
          ? json.items
          : [];
        if (incoming.length === 0) throw new Error("No items found");
        // Merge: keep existing items, add any that aren't already present
        setItems((prev) => {
          const merged = [...prev];
          let added = 0;
          for (const item of incoming) {
            if (!merged.find((i) => i.id === item.id)) {
              merged.push(item);
              added++;
            }
          }
          setBackupMsg(
            added > 0
              ? `Imported ${added} new item${added !== 1 ? "s" : ""}`
              : "All items already in collection"
          );
          setTimeout(() => setBackupMsg(null), 4000);
          return merged;
        });
      } catch {
        setBackupMsg("Invalid backup file");
        setTimeout(() => setBackupMsg(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function downloadSampleCsv() {
    const a = document.createElement("a");
    a.href = "/library-sample.csv";
    a.download = "library-sample.csv";
    a.click();
  }

  function exportDublinCore() {
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const DC_TYPE: Record<MediaType, string> = {
      book: "Text", audiobook: "Sound", movie: "MovingImage", music: "Sound", game: "InteractiveResource",
    };
    const records = items.map((item) => {
      const lang = item.language?.trim() || "English";
      const lines = [
        `  <record>`,
        `    <dc:title>${esc(item.title)}</dc:title>`,
        `    <dc:creator>${esc(item.creator)}</dc:creator>`,
        `    <dc:date>${item.year}</dc:date>`,
        `    <dc:type>${DC_TYPE[item.type]}</dc:type>`,
        `    <dc:language>${esc(lang)}</dc:language>`,
        `    <dc:subject>${esc(item.genre)}</dc:subject>`,
        ...item.tags.map((t) => `    <dc:subject>${esc(t)}</dc:subject>`),
        item.description ? `    <dc:description>${esc(item.description)}</dc:description>` : null,
        item.publisher ? `    <dc:publisher>${esc(item.publisher)}</dc:publisher>` : null,
        item.isbn ? `    <dc:identifier>ISBN:${esc(item.isbn)}</dc:identifier>` : null,
        item.asin ? `    <dc:identifier>ASIN:${esc(item.asin)}</dc:identifier>` : null,
        item.series
          ? `    <dc:relation>${esc(item.series)}${item.seriesPosition ? `, ${esc(item.seriesPosition)}` : ""}</dc:relation>`
          : null,
        item.mediaFormat || item.audiobookFormat || item.musicFormat
          ? `    <dc:format>${esc(item.mediaFormat ?? item.audiobookFormat ?? item.musicFormat ?? "")}</dc:format>`
          : null,
        `  </record>`,
      ].filter(Boolean) as string[];
      return lines.join("\n");
    });
    const xml = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<collection`,
      `  xmlns:dc="http://purl.org/dc/elements/1.1/"`,
      `  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`,
      `  xsi:schemaLocation="http://purl.org/dc/elements/1.1/ http://dublincore.org/schemas/xmls/qdc/dc.xsd">`,
      records.join("\n"),
      `</collection>`,
    ].join("\n");
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `library-dublin-core-${new Date().toISOString().slice(0, 10)}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportMarc() {
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    // MARC 21 record type code (LDR/06) per media type
    const MARC_TYPE: Record<MediaType, string> = {
      book: "a", audiobook: "i", movie: "g", music: "j", game: "m",
    };

    // Resolve language to 3-letter ISO 639-2/B code, defaulting to "eng"
    function langCode(raw?: string): string {
      if (!raw) return "eng";
      const t = raw.trim().toLowerCase();
      if (t.length === 3 && /^[a-z]{3}$/.test(t)) return t;
      const map: Record<string, string> = {
        english: "eng", french: "fre", german: "ger", spanish: "spa",
        italian: "ita", japanese: "jpn", chinese: "chi", russian: "rus",
        arabic: "ara", portuguese: "por", dutch: "dut", korean: "kor",
      };
      return map[t] ?? "   ";
    }

    // Produce "Last, First" for MARC 100/700.
    // Uses stored split fields when available; falls back to heuristic inversion.
    function invertName(name: string, first?: string, last?: string): string {
      if (last) return first ? `${last}, ${first}` : last;
      const parts = name.trim().split(/\s+/);
      if (parts.length < 2) return name;
      const l = parts[parts.length - 1];
      const f = parts.slice(0, -1).join(" ");
      return `${l}, ${f}`;
    }

    // Build type-aware MARC 008 fixed-length field (exactly 40 chars)
    function build008(item: LibraryItem): string {
      const t = new Date();
      const entered = `${String(t.getFullYear()).slice(2).padStart(2, "0")}${String(t.getMonth() + 1).padStart(2, "0")}${String(t.getDate()).padStart(2, "0")}`;
      const yr = String(item.year).slice(0, 4).padEnd(4, " ");
      const lc = langCode(item.language);
      // pos 00-05=entered, 06=type-of-date, 07-10=year, 11-14=date2, 15-17=place
      const prefix = `${entered}s${yr}       `;  // 17 chars (06-17 = 1+4+4+3 but we use 3 spaces for place)
      // pos 18-34 (17 chars) are type-specific; pos 35-37=lang, 38=modified, 39=source
      const suffix = `${lc} d`;
      switch (item.type) {
        case "book":
        case "audiobook":
          // BK: illus(4) audience(1) form(1) contents(4) govpub(1) conf(1) fest(1) index(1) undef(1) litform(1) bio(1)
          return `${prefix}    |         0 ${suffix}`;
        case "music":
          // MU: composition(2) format(1) parts(1) audience(1) form(1) accomp(6) littext(2) undef(1) transpos(1) undef(1)
          return `${prefix}uu n          ${suffix}`;
        case "movie":
          // VM: runtime(3) undef(1) audience(1) undef(5) govpub(1) form(1) undef(3) type(1) technique(1)
          return `${prefix}       vu${suffix}`;
        case "game":
          // CF: undef(4) audience(1) form(1) undef(2) type(1=g:game) undef(1) govpub(1) undef(6)
          return `${prefix}     g        ${suffix}`;
      }
    }

    const field = (tag: string, ind1: string, ind2: string, subfields: [string, string][]) => {
      const subs = subfields
        .map(([code, val]) => `      <marc:subfield code="${code}">${esc(val)}</marc:subfield>`)
        .join("\n");
      return `    <marc:datafield tag="${tag}" ind1="${ind1}" ind2="${ind2}">\n${subs}\n    </marc:datafield>`;
    };

    const records = items.map((item, idx) => {
      const lc = langCode(item.language);
      const fields: string[] = [
        `    <marc:leader>00000${MARC_TYPE[item.type]}am a22000004a 4500</marc:leader>`,
        `    <marc:controlfield tag="001">${esc(item.id)}</marc:controlfield>`,
        `    <marc:controlfield tag="003">Libri Ex Machina</marc:controlfield>`,
        `    <marc:controlfield tag="008">${build008(item)}</marc:controlfield>`,
      ];
      // 040 — cataloging source (required; was missing before)
      fields.push(field("040", " ", " ", [["a", "Libri Ex Machina"], ["b", "eng"], ["e", "rda"]]));
      if (item.isbn) fields.push(field("020", " ", " ", [["a", item.isbn]]));
      if (item.asin) fields.push(field("024", "7", " ", [["a", item.asin], ["2", "asin"]]));
      // 041 — language if non-English
      if (lc !== "eng") fields.push(field("041", "0", " ", [["a", lc]]));
      // 100 (personal name) or 110 (corporate/group name) — main entry
      if (item.creatorIsGroup) {
        fields.push(field("110", "2", " ", [["a", item.creator]]));
      } else {
        fields.push(field("100", "1", " ", [["a", invertName(item.creator, item.creatorFirst, item.creatorLast)]]));
      }
      fields.push(field("245", "1", "0", [["a", item.title]]));
      const pubSubs: [string, string][] = [];
      if (item.publisher) pubSubs.push(["b", item.publisher]);
      pubSubs.push(["c", String(item.year)]);
      fields.push(field("264", " ", "1", pubSubs));
      if (item.series) {
        const serSubs: [string, string][] = [["a", item.series]];
        if (item.seriesPosition) serSubs.push(["v", item.seriesPosition]);
        fields.push(field("490", "1", " ", serSubs));
      }
      if (item.description) fields.push(field("520", " ", " ", [["a", item.description]]));
      // 650 ind2="4" — subject, source not specified (not LCSH)
      fields.push(field("650", " ", "4", [["a", item.genre]]));
      item.tags.forEach((t) => fields.push(field("653", " ", " ", [["a", t]])));
      if (item.narrator) fields.push(field("700", "1", " ", [["a", invertName(item.narrator)], ["e", "narrator"]]));
      if (item.platform) fields.push(field("753", " ", " ", [["a", item.platform]]));
      return [
        `  <marc:record xmlns:marc="http://www.loc.gov/MARC21/slim" id="${idx + 1}">`,
        ...fields,
        `  </marc:record>`,
      ].join("\n");
    });

    const xml = [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<marc:collection xmlns:marc="http://www.loc.gov/MARC21/slim"`,
      `  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`,
      `  xsi:schemaLocation="http://www.loc.gov/MARC21/slim http://www.loc.gov/standards/marcxml/schema/MARC21slim.xsd">`,
      records.join("\n"),
      `</marc:collection>`,
    ].join("\n");
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `library-marcxml-${new Date().toISOString().slice(0, 10)}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;
    const src = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      if (inQuotes) {
        if (ch === '"' && src[i + 1] === '"') { field += '"'; i++; }
        else if (ch === '"') { inQuotes = false; }
        else { field += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { row.push(field); field = ""; }
        else if (ch === '\n') {
          row.push(field); field = "";
          if (row.some((c) => c.trim())) rows.push(row);
          row = [];
        } else { field += ch; }
      }
    }
    row.push(field);
    if (row.some((c) => c.trim())) rows.push(row);
    return rows;
  }

  function importCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCsv(ev.target?.result as string);
        if (rows.length < 2) throw new Error("No data rows");
        const [headerRow, ...dataRows] = rows;
        const headers = headerRow.map((h) => h.trim().toLowerCase());
        const col = (row: string[], name: string) => {
          const i = headers.indexOf(name);
          return i >= 0 ? row[i]?.trim() || undefined : undefined;
        };
        const validTypes = new Set<string>(["book", "audiobook", "movie", "music", "game"]);
        const incoming: LibraryItem[] = dataRows
          .filter((row) => row.some((c) => c.trim()))
          .map((row) => {
            const rawType = col(row, "type")?.toLowerCase() ?? "book";
            const type = validTypes.has(rawType) ? (rawType as MediaType) : "book";
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            const rating = Math.min(5, Math.max(1, parseInt(col(row, "rating") ?? "3") || 3));
            const year = parseInt(col(row, "year") ?? "") || new Date().getFullYear();
            const tags = (col(row, "tags") ?? "").split(";").map((t) => t.trim()).filter(Boolean);
            return {
              id: `csv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              type,
              title:       col(row, "title")        ?? "Untitled",
              creator:     col(row, "creator")       ?? "Unknown",
              year,
              genre:       col(row, "genre")         ?? "Uncategorized",
              description: col(row, "description")   ?? "",
              rating,
              coverColor:  color.bg,
              coverAccent: color.accent,
              tags,
              isbn:            col(row, "isbn"),
              publisher:       col(row, "publisher"),
              series:          col(row, "series"),
              seriesPosition:  col(row, "seriesposition"),
              narrator:        col(row, "narrator"),
              audiobookFormat: col(row, "audiobookformat"),
              asin:            col(row, "asin"),
              studio:          col(row, "studio"),
              mediaFormat:     col(row, "mediaformat"),
              region:          col(row, "region"),
              label:           col(row, "label"),
              musicFormat:     col(row, "musicformat"),
              catalogNumber:   col(row, "catalognumber"),
              mediaCondition:  col(row, "mediacondition"),
              coverCondition:  col(row, "covercondition"),
              platform:        col(row, "platform"),
              condition:       col(row, "condition"),
              autographed:     col(row, "autographed"),
            };
          });
        if (incoming.length === 0) throw new Error("No valid rows");
        setItems((prev) => {
          const merged = [...prev];
          let added = 0;
          for (const item of incoming) {
            const isDupe = merged.some(
              (i) =>
                i.type === item.type &&
                i.title.toLowerCase() === item.title.toLowerCase() &&
                i.creator.toLowerCase() === item.creator.toLowerCase()
            );
            if (!isDupe) { merged.push(item); added++; }
          }
          setBackupMsg(
            added > 0
              ? `Imported ${added} item${added !== 1 ? "s" : ""} from CSV`
              : "All items already in collection"
          );
          setTimeout(() => setBackupMsg(null), 4000);
          return merged;
        });
      } catch {
        setBackupMsg("Could not parse CSV — check format");
        setTimeout(() => setBackupMsg(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const counts = useMemo(
    () => ({
      all: items.length,
      book: items.filter((i) => i.type === "book").length,
      audiobook: items.filter((i) => i.type === "audiobook").length,
      movie: items.filter((i) => i.type === "movie").length,
      music: items.filter((i) => i.type === "music").length,
      game: items.filter((i) => i.type === "game").length,
    }),
    [items]
  );

  // Base pool: tab + text search only — used for facet counts
  const facetBase = useMemo(() => {
    let list = items;
    if (activeTab !== "all") list = list.filter((i) => i.type === activeTab);
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
  }, [items, activeTab, query]);

  // Facet counts derived from the unfiltered base
  const facetCounts = useMemo((): FacetCounts => {
    const genres = new Map<string, number>();
    const tags = new Map<string, number>();
    const ratings = new Map<number, number>();
    const platforms = new Map<string, number>();
    const formats = new Map<string, number>();
    let onLoanCount = 0;
    for (const item of facetBase) {
      if (item.genre) genres.set(item.genre, (genres.get(item.genre) ?? 0) + 1);
      for (const tag of item.tags) tags.set(tag, (tags.get(tag) ?? 0) + 1);
      if (item.rating > 0) ratings.set(item.rating, (ratings.get(item.rating) ?? 0) + 1);
      if (item.lent) onLoanCount++;
      if (item.platform) platforms.set(item.platform, (platforms.get(item.platform) ?? 0) + 1);
      const fmt = item.musicFormat ?? item.mediaFormat;
      if (fmt) formats.set(fmt, (formats.get(fmt) ?? 0) + 1);
    }
    return { genres, tags, ratings, platforms, formats, onLoanCount };
  }, [facetBase]);

  const activeFacetCount =
    facetFilters.genres.length +
    facetFilters.tags.length +
    facetFilters.ratings.length +
    (facetFilters.onLoan !== null ? 1 : 0) +
    facetFilters.platforms.length +
    facetFilters.formats.length;

  const filtered = useMemo(() => {
    let list = facetBase;
    const f = facetFilters;
    if (f.genres.length) list = list.filter((i) => f.genres.includes(i.genre));
    if (f.tags.length) list = list.filter((i) => f.tags.some((t) => i.tags.includes(t)));
    if (f.ratings.length) list = list.filter((i) => f.ratings.includes(i.rating));
    if (f.onLoan !== null) list = list.filter((i) => !!i.lent === f.onLoan);
    if (f.platforms.length) list = list.filter((i) => !!i.platform && f.platforms.includes(i.platform));
    if (f.formats.length) list = list.filter((i) => {
      const fmt = i.musicFormat ?? i.mediaFormat;
      return !!fmt && f.formats.includes(fmt);
    });
    return [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "year") return b.year - a.year;
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "creator") return a.creator.localeCompare(b.creator);
      return 0;
    });
  }, [facetBase, facetFilters, sort]);

  // Measure shelf container width so items reflow as the window resizes
  const shelfContainerRef = useRef<HTMLElement>(null);
  const [shelfWidth, setShelfWidth] = useState(0);

  useEffect(() => {
    const el = shelfContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setShelfWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!toolsOpen) return;
    function handler(e: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node))
        setToolsOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [toolsOpen]);

  // gap: 12px (gap-3), shelf padding: 48px (px-6 × 2)
  // audiobook/music covers are square at book height (129px wide); all others are 92px wide
  const ITEM_GAP = 12;
  const SHELF_PAD = 48;
  const itemDisplayWidth = (item: LibraryItem) =>
    item.type === "audiobook" || item.type === "music" ? 129 : 92;

  // Greedily pack items into rows based on each item's actual width
  const usableWidth = shelfWidth > 0 ? shelfWidth - SHELF_PAD : Infinity;
  const shelves: LibraryItem[][] = [];
  {
    let row: LibraryItem[] = [];
    let rowW = 0;
    for (const item of filtered) {
      const w = itemDisplayWidth(item);
      const needed = row.length === 0 ? w : ITEM_GAP + w;
      if (row.length > 0 && rowW + needed > usableWidth) {
        shelves.push(row);
        row = [item];
        rowW = w;
      } else {
        row.push(item);
        rowW += needed;
      }
    }
    if (row.length > 0) shelves.push(row);
  }

  const lentCount = items.filter((i) => i.lent).length;

  function handleAdd(item: LibraryItem) {
    setItems((prev) => [...prev, item]);
  }

  function handleEdit(item: LibraryItem) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));
    setSelected(item);
    setEditTarget(null);
  }

  function handleCoverFetched(id: string, url: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, coverImageUrl: url } : i))
    );
    setSelected((prev) =>
      prev?.id === id ? { ...prev, coverImageUrl: url } : prev
    );
  }

  function handleSetCollectorField(
    id: string,
    field: CollectorField,
    value: string | undefined
  ) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
    setSelected((prev) =>
      prev?.id === id ? { ...prev, [field]: value } : prev
    );
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  function handleLend(borrower: string) {
    if (!lendTarget) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === lendTarget.id
          ? {
              ...i,
              lent: {
                borrower,
                lentOn: new Date().toISOString().slice(0, 10),
              },
            }
          : i
      )
    );
    // Update selected if it's the same item
    if (selected?.id === lendTarget.id) {
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              lent: {
                borrower,
                lentOn: new Date().toISOString().slice(0, 10),
              },
            }
          : null
      );
    }
    setLendTarget(null);
  }

  function handleReturn() {
    if (!lendTarget) return;
    setItems((prev) =>
      prev.map((i) => (i.id === lendTarget.id ? { ...i, lent: undefined } : i))
    );
    if (selected?.id === lendTarget.id) {
      setSelected((prev) => (prev ? { ...prev, lent: undefined } : null));
    }
    setLendTarget(null);
  }

  return (
    <div className="min-h-screen flex flex-col text-stone-100" style={{ background: "transparent" }}>
      {/* ── Fixed backdrop: deep indigo wall + upward key lights ── */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: "#07071a",
          backgroundImage: [
            /* five upward-facing soft key lights from floor level */
            "radial-gradient(ellipse 180px 580px at  9% 100%, rgba(228,222,255,0.18) 0%, rgba(180,168,255,0.07) 40%, transparent 68%)",
            "radial-gradient(ellipse 150px 480px at 27% 100%, rgba(228,222,255,0.13) 0%, rgba(180,168,255,0.05) 40%, transparent 68%)",
            "radial-gradient(ellipse 210px 640px at 50% 100%, rgba(228,222,255,0.20) 0%, rgba(180,168,255,0.08) 40%, transparent 68%)",
            "radial-gradient(ellipse 150px 480px at 73% 100%, rgba(228,222,255,0.13) 0%, rgba(180,168,255,0.05) 40%, transparent 68%)",
            "radial-gradient(ellipse 180px 580px at 91% 100%, rgba(228,222,255,0.18) 0%, rgba(180,168,255,0.07) 40%, transparent 68%)",
            /* subtle ambient fill so the very top of the wall isn't pure black */
            "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(20,16,60,0.80) 0%, transparent 100%)",
          ].join(","),
        }}
      />
      {/* ── Header ── */}
      <header
        className="flex-shrink-0 border-b border-indigo-900/60"
        style={{
          background: "linear-gradient(to bottom, #06061a 0%, #0a0a22 100%)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.7)",
        }}
      >
        <div className="max-w-screen-xl mx-auto px-6">
          <div className="flex items-center justify-between py-4 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3.5 flex-shrink-0">
              {/* Mark */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(145deg, #0f0f2e 0%, #09091c 100%)",
                  border: "1px solid rgba(180,83,9,0.40)",
                  boxShadow: "0 0 14px rgba(180,83,9,0.18), inset 0 1px 0 rgba(253,230,138,0.07)",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="logoLeft" x1="5" y1="8" x2="19" y2="30" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#D97706" />
                      <stop offset="100%" stopColor="#78350F" />
                    </linearGradient>
                    <linearGradient id="logoRight" x1="33" y1="8" x2="19" y2="30" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#B45309" />
                      <stop offset="100%" stopColor="#92400E" />
                    </linearGradient>
                  </defs>
                  {/* Left cover */}
                  <path d="M19 8 L5 12 L5 30 L19 28 Z" fill="url(#logoLeft)" />
                  {/* Right cover */}
                  <path d="M19 8 L33 12 L33 30 L19 28 Z" fill="url(#logoRight)" />
                  {/* Spine */}
                  <rect x="17.5" y="8" width="3" height="20" rx="0.5" fill="#FDE68A" opacity="0.85" />
                  {/* Page lines — left */}
                  <line x1="8" y1="17" x2="16.5" y2="16.2" stroke="#FDE68A" strokeWidth="0.75" opacity="0.28" />
                  <line x1="8" y1="20.5" x2="16.5" y2="19.7" stroke="#FDE68A" strokeWidth="0.75" opacity="0.28" />
                  <line x1="8" y1="24" x2="16.5" y2="23.2" stroke="#FDE68A" strokeWidth="0.75" opacity="0.28" />
                  {/* Page lines — right */}
                  <line x1="21.5" y1="16.2" x2="30" y2="17" stroke="#FDE68A" strokeWidth="0.75" opacity="0.28" />
                  <line x1="21.5" y1="19.7" x2="30" y2="20.5" stroke="#FDE68A" strokeWidth="0.75" opacity="0.28" />
                  <line x1="21.5" y1="23.2" x2="30" y2="24" stroke="#FDE68A" strokeWidth="0.75" opacity="0.28" />
                </svg>
              </div>

              {/* Wordmark */}
              <div className="leading-none">
                <h1
                  className="text-[17px] font-light tracking-[0.18em] uppercase leading-none"
                  style={{
                    background: "linear-gradient(to right, #e7e5e4, #fde68a)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Libri Ex Machina
                </h1>
                <div className="flex items-center gap-1.5 mt-[5px]">
                  <div className="h-px w-full" style={{ background: "linear-gradient(to right, rgba(180,83,9,0.5), transparent)" }} />
                  <p className="text-[7.5px] tracking-[0.22em] uppercase text-amber-700/70 leading-none whitespace-nowrap">
                    Personal Collection
                  </p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-sm relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-sm">
                🔍
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, creator, genre, tag…"
                className="w-full bg-stone-800/70 border border-stone-700 rounded-lg pl-9 pr-4 py-2 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600 transition-colors"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                >
                  ×
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-stone-500">Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="bg-stone-800 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-300 focus:outline-none focus:border-amber-600"
              >
                <option value="title">Title</option>
                <option value="creator">Creator</option>
                <option value="year">Year</option>
                <option value="rating">Rating</option>
              </select>
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setFiltersOpen((o) => !o)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-medium transition-colors ${
                filtersOpen || activeFacetCount > 0
                  ? "bg-amber-900/30 border-amber-700/50 text-amber-400"
                  : "bg-stone-800 border-stone-700 text-stone-400 hover:text-stone-200"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 3h14v1.5L9 10v5l-2-1V10L1 4.5V3z"/>
              </svg>
              Filters
              {activeFacetCount > 0 && (
                <span className="bg-amber-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {activeFacetCount}
                </span>
              )}
            </button>

            {/* On loan badge */}
            {lentCount > 0 && (
              <div className="flex-shrink-0 flex items-center gap-1.5 bg-amber-900/40 border border-amber-700/50 rounded-lg px-3 py-1.5">
                <span className="text-amber-400 text-xs font-medium">
                  🤝 {lentCount} on loan
                </span>
              </div>
            )}

            {/* Tools dropdown */}
            <div ref={toolsRef} className="relative flex-shrink-0">
              {backupMsg && (
                <span className="absolute -top-9 right-0 text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 rounded px-2 py-1 whitespace-nowrap shadow-lg">
                  {backupMsg}
                </span>
              )}
              <button
                onClick={() => setToolsOpen((o) => !o)}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 rounded-lg text-xs font-medium transition-colors"
              >
                Tools
                <svg className={`w-3 h-3 transition-transform ${toolsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {toolsOpen && (
                <div
                  className="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-stone-700 shadow-2xl overflow-hidden z-50"
                  style={{ background: "rgba(18,18,36,0.97)", backdropFilter: "blur(8px)" }}
                >
                  <div className="px-3 pt-2.5 pb-1">
                    <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">JSON Backup</p>
                  </div>
                  <button
                    onClick={() => { exportBackup(); setToolsOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 transition-colors text-left"
                  >
                    <span>⬇</span> Export Backup
                  </button>
                  <label className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 transition-colors cursor-pointer">
                    <span>⬆</span> Restore from Backup
                    <input
                      ref={restoreInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(e) => { importBackup(e); setToolsOpen(false); }}
                    />
                  </label>

                  <div className="mx-3 my-1.5 h-px bg-stone-700/60" />

                  <div className="px-3 pt-1 pb-1">
                    <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">CSV Import</p>
                  </div>
                  <label className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 transition-colors cursor-pointer">
                    <span>⬆</span> Import CSV
                    <input
                      ref={csvImportRef}
                      type="file"
                      accept="text/csv,.csv"
                      className="hidden"
                      onChange={(e) => { importCsv(e); setToolsOpen(false); }}
                    />
                  </label>
                  <button
                    onClick={() => { downloadSampleCsv(); setToolsOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 transition-colors text-left"
                  >
                    <span>⬇</span> Sample CSV
                  </button>

                  <div className="mx-3 my-1.5 h-px bg-stone-700/60" />

                  <div className="px-3 pt-1 pb-1">
                    <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">Catalog Export</p>
                  </div>
                  <button
                    onClick={() => { exportDublinCore(); setToolsOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 transition-colors text-left"
                  >
                    <span>⬇</span> Dublin Core XML
                  </button>
                  <button
                    onClick={() => { exportMarc(); setToolsOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-stone-300 hover:bg-stone-800 transition-colors text-left"
                  >
                    <span>⬇</span> MARC XML
                  </button>

                  {storageMode === "db" && (
                    <>
                      <div className="mx-3 my-1.5 h-px bg-stone-700/60" />
                      <p className="px-3 py-2 text-xs text-stone-500">🗄 Saved to database</p>
                    </>
                  )}
                  <div className="h-1.5" />
                </div>
              )}
            </div>

            {/* Add button */}
            <button
              onClick={() => setShowAdd(true)}
              className="flex-shrink-0 flex items-center gap-2 bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md"
            >
              <span className="text-base leading-none">+</span> Add Item
            </button>
          </div>

          {/* Type tabs */}
          <div className="flex gap-1 pb-0 -mb-px">
            {(
              [
                "all",
                "book",
                "audiobook",
                "movie",
                "music",
                "game",
              ] as FilterTab[]
            ).map((tab) => {
              const label =
                tab === "all" ? "All" : TYPE_LABELS[tab as MediaType];
              const icon = tab === "all" ? "🗃️" : TYPE_ICONS[tab as MediaType];
              const count = counts[tab];
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-lg border-t border-l border-r transition-colors ${active ? "border-indigo-800/70 text-amber-400" : "border-transparent text-stone-500 hover:text-stone-300"}`}
                  style={
                    active
                      ? { background: "linear-gradient(to bottom, #0e0e28, #0a0a20)" }
                      : undefined
                  }
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${active ? "bg-amber-900/50 text-amber-400" : "bg-indigo-950/60 text-stone-500"}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Facet sidebar */}
        {filtersOpen && (
          <FacetPanel
            counts={facetCounts}
            filters={facetFilters}
            setFilters={setFacetFilters}
          />
        )}

        {/* Shelves area */}
        <main ref={shelfContainerRef} className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-500">
              <span className="text-5xl mb-4">📭</span>
              <p className="text-lg font-medium">No items found</p>
              <p className="text-sm mt-1">
                {query || activeFacetCount > 0 ? "Try adjusting your search or filters" : "Add something to your collection"}
              </p>
            </div>
          ) : (
            <div className="py-8 px-2">
              {shelves.map((shelf, idx) => (
                <ShelfRow
                  key={idx}
                  items={shelf}
                  onSelect={(item) =>
                    setSelected(selected?.id === item.id ? null : item)
                  }
                  selectedId={selected?.id ?? null}
                />
              ))}
              {/* Floor */}
              <div className="mt-2 mx-4 h-1 rounded-full bg-stone-800/50" />
              <p className="text-center text-xs text-stone-700 mt-4">
                {filtered.length} item{filtered.length !== 1 ? "s" : ""} in
                collection
              </p>
            </div>
          )}
        </main>

        {/* Detail panel */}
        {selected && (
          <DetailPanel
            item={selected}
            onClose={() => setSelected(null)}
            onEdit={() => setEditTarget(selected)}
            onLend={() => setLendTarget(selected)}
            onDelete={() => handleDelete(selected.id)}
            onCoverFetched={handleCoverFetched}
            onSetCollectorField={handleSetCollectorField}
          />
        )}
      </div>

      {/* ── Modals ── */}
      {showAdd && (
        <AddItemModal onAdd={handleAdd} onClose={() => setShowAdd(false)} />
      )}
      {editTarget && (
        <AddItemModal
          initialItem={editTarget}
          onSave={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}
      {lendTarget && (
        <LendModal
          item={lendTarget}
          onLend={handleLend}
          onReturn={handleReturn}
          onClose={() => setLendTarget(null)}
        />
      )}
    </div>
  );
}
