/**
 * Per-media-type configuration for the Detail Panel and Collector's Notes modal.
 * All option arrays, field definitions, and ordinal helpers live here.
 */

import type { LibraryItem, MediaType, CollectorField } from "./types";

// ── Ordinal helpers ───────────────────────────────────────────────────────────

export function wordOrdinal(n: number): string {
  const ones = ["","First","Second","Third","Fourth","Fifth","Sixth","Seventh","Eighth","Ninth",
    "Tenth","Eleventh","Twelfth","Thirteenth","Fourteenth","Fifteenth","Sixteenth","Seventeenth","Eighteenth","Nineteenth"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const tensOrd = ["","","Twentieth","Thirtieth","Fortieth","Fiftieth","Sixtieth","Seventieth","Eightieth","Ninetieth"];
  if (n === 100) return "One Hundredth";
  if (n < 20) return ones[n];
  if (n % 10 === 0) return tensOrd[Math.floor(n / 10)];
  return tens[Math.floor(n / 10)] + "-" + ones[n % 10].toLowerCase();
}

export function numOrdinal(n: number): string {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ── Option arrays ─────────────────────────────────────────────────────────────

export const AUTOGRAPHED_OPTIONS = [
  { value: "Signed",           description: "Bears the signature of the author, artist, or director" },
  { value: "Unsigned",         description: "Confirmed to bear no signature" },
  { value: "Inscribed",        description: "Signed with a personal dedication to a named recipient" },
  { value: "Association Copy", description: "Owned or annotated by someone connected to the work or author" },
];

export const EDITION_OPTIONS = Array.from({ length: 100 }, (_, i) => wordOrdinal(i + 1));
export const PRINTING_OPTIONS = Array.from({ length: 100 }, (_, i) => numOrdinal(i + 1));

export const BINDING_OPTIONS = [
  { value: "Hardcover", description: "Rigid boards with cloth, paper, or decorative covering" },
  { value: "Softcover", description: "Flexible paper or card cover, also called paperback" },
  { value: "Leather",   description: "Bound in leather — full, half, or quarter binding" },
  { value: "Wrapper",   description: "Original paper wrappers, typical of 19th-century periodicals and pamphlets" },
];

export const DUST_JACKET_OPTIONS = [
  { value: "Present",   description: "Original dust jacket is present with the volume" },
  { value: "Absent",    description: "No dust jacket — common for older or well-read copies" },
  { value: "Facsimile", description: "A reproduction dust jacket, not the original" },
];

export const CONDITION_OPTIONS = [
  {
    value: "Fine",
    short: "As near-perfect as possible; no defects, no signs of use",
    detail: "Fine (F): The item is as close to perfect as possible. No foxing, no soiling, no tears, no fading, no bumping. Spine tight and square. May be unread.",
  },
  {
    value: "Near Fine",
    short: "Almost perfect; only the slightest signs of handling",
    detail: "Near Fine (NF): Falls just short of Fine. May show the slightest sign of handling — a barely perceptible lean, a faint crease at a corner — but approaches Fine in every other respect.",
  },
  {
    value: "Very Good",
    short: "Shows minor signs of wear but no tears; fully intact",
    detail: "Very Good (VG): Shows some small signs of wear and handling — slight lean, minor rubbing to extremities — but no tears. All pages and illustrations present. Interior clean.",
  },
  {
    value: "Good",
    short: "Average used copy; all text present; may have defects",
    detail: "Good (G): Average worn and used copy. All text pages present. May have underlining, marginal notes, spine fading, or bumped corners. Fully legible and complete.",
  },
  {
    value: "Fair",
    short: "Well-worn and soiled but complete and intact",
    detail: "Fair: Heavily worn but all pages present. May have heavy soiling, writing throughout, loose hinges, or a chipped spine. Readable but clearly a reader's copy.",
  },
  {
    value: "Poor",
    short: "Severely damaged; may be incomplete; reading copy only",
    detail: "Poor: Badly damaged — broken spine, missing pages, water damage, or heavy repairs. Collectible only as a placeholder or for reading. Not suitable for display.",
  },
];

export const COPY_QUALIFIER_OPTIONS = [
  {
    value: "Ex-Library",
    description: "Former lending-library copy; typically bears stamps, spine label, and card pocket",
  },
  {
    value: "Remainder",
    description: "Remaindered by the publisher; usually marked with a spray, stamp, or diagonal cut to the page edges",
  },
  {
    value: "Book Club Edition",
    description: "Book club printing; typically printed on inferior paper, blind-stamped on rear board, no price on jacket",
  },
  {
    value: "Ex-Rental",
    description: "Former rental copy (common for games and films); may bear stickers, markings, or security labels",
  },
];

export const ANNOTATIONS_OPTIONS = [
  { value: "Pencil Annotations",  description: "Pencil marks, underlines, or marginalia — potentially erasable" },
  { value: "Ink Annotations",     description: "Pen or ink marginalia — permanent" },
  { value: "Highlighting",        description: "Fluorescent or color marking throughout" },
  { value: "Interleaved Notes",   description: "Loose or tipped-in manuscript notes" },
  { value: "Extensive Marginalia",description: "Heavy scholarly or critical annotation throughout" },
];

// 100 most populous countries, alphabetical
export const COUNTRY_OPTIONS = [
  "Afghanistan", "Algeria", "Angola", "Argentina", "Australia",
  "Austria", "Azerbaijan", "Bangladesh", "Belgium", "Bolivia",
  "Brazil", "Burkina Faso", "Cambodia", "Cameroon", "Canada",
  "Chile", "China", "Colombia", "Côte d'Ivoire", "Cuba",
  "Czech Republic", "DR Congo", "Denmark", "Dominican Republic", "Ecuador",
  "Egypt", "Ethiopia", "France", "Germany", "Ghana",
  "Greece", "Guatemala", "Guinea", "Haiti", "Honduras",
  "Hungary", "India", "Indonesia", "Iran", "Iraq",
  "Israel", "Italy", "Japan", "Jordan", "Kazakhstan",
  "Kenya", "Laos", "Madagascar", "Malawi", "Malaysia",
  "Mali", "Mexico", "Morocco", "Mozambique", "Myanmar",
  "Nepal", "Netherlands", "Niger", "Nigeria", "North Korea",
  "Pakistan", "Papua New Guinea", "Peru", "Philippines", "Poland",
  "Portugal", "Romania", "Russia", "Rwanda", "Saudi Arabia",
  "Senegal", "Serbia", "Sierra Leone", "Somalia", "South Africa",
  "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan",
  "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Tunisia", "Turkey", "Uganda",
  "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uzbekistan",
  "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

// English first, then the remaining 24 most widely spoken languages alphabetically
export const LANGUAGE_OPTIONS = [
  "English",
  "Arabic",
  "Bengali",
  "Chinese (Mandarin)",
  "Dutch",
  "French",
  "German",
  "Greek",
  "Hindi",
  "Indonesian",
  "Italian",
  "Japanese",
  "Korean",
  "Malay",
  "Persian",
  "Polish",
  "Portuguese",
  "Russian",
  "Spanish",
  "Swahili",
  "Tamil",
  "Turkish",
  "Ukrainian",
  "Urdu",
  "Vietnamese",
];

export const AUDIOBOOK_FORMAT_OPTIONS = [
  { value: "Audible",          description: "Audible digital audiobook (streaming or download)" },
  { value: "Libro.fm",         description: "Libro.fm DRM-free download; supports independent bookshops" },
  { value: "Downpour",         description: "Downpour DRM-free rental or purchase" },
  { value: "CD",               description: "Standard audio compact disc" },
  { value: "MP3 CD",           description: "Data disc with MP3 files; plays in compatible drives" },
  { value: "Digital Download", description: "Downloaded audio file (MP3, AAC, etc.) from another source" },
  { value: "Cassette",         description: "Audio cassette tape" },
];

export const ABRIDGED_OPTIONS = [
  { value: "Unabridged", description: "Full, uncut reading of the complete text" },
  { value: "Abridged",   description: "Shortened version; some content omitted" },
];

export const AUDIOBOOK_CONDITION_OPTIONS = [
  {
    value: "Sealed",
    short: "Factory sealed; never opened",
    detail: "Sealed: Original shrink-wrap or seal intact. Never opened or played.",
  },
  {
    value: "Near Mint",
    short: "Nearly perfect; minimal signs of handling",
    detail: "Near Mint: Essentially perfect. Case and media show only the most minor trace of handling. All inserts and booklet present and pristine.",
  },
  {
    value: "Very Good Plus",
    short: "Slight signs of use; plays without issue",
    detail: "Very Good Plus (VG+): Light signs of use. Minor scuffs or light marks on case. Media plays cleanly with no issues. All inserts present.",
  },
  {
    value: "Very Good",
    short: "Minor marks or scuffs; fully playable",
    detail: "Very Good (VG): Noticeable signs of use. Some scuffs or light scratches on case or discs. Plays through completely without skipping. Booklet and inserts may show light wear.",
  },
  {
    value: "Good",
    short: "Significant wear; readable/playable with care",
    detail: "Good (G): Heavy use evident. Case may be cracked or taped. Discs or tapes show significant wear. May have writing on case or discs. Playable but not guaranteed skip-free.",
  },
  {
    value: "Poor",
    short: "Severely worn or damaged; may not play",
    detail: "Poor: Badly worn or damaged. Case broken or missing. Discs or tapes may be scratched, delaminated, or warped. Functional status uncertain.",
  },
];

export const ASPECT_RATIO_OPTIONS = [
  { value: "1.33:1", description: "Academy Standard / Full Frame (4:3)" },
  { value: "1.37:1", description: "Academy Ratio — classic 35 mm theatrical standard" },
  { value: "1.66:1", description: "European Flat — common in European cinema" },
  { value: "1.78:1", description: "HD Widescreen (16:9) — standard for Blu-ray and streaming" },
  { value: "1.85:1", description: "American Flat — dominant US theatrical widescreen" },
  { value: "2.20:1", description: "70 mm — Todd-AO, used in Ben-Hur, Lawrence of Arabia" },
  { value: "2.35:1", description: "CinemaScope — original anamorphic widescreen standard" },
  { value: "2.39:1", description: "Anamorphic Scope — modern widescreen standard (sometimes cited as 2.40)" },
  { value: "2.76:1", description: "Ultra Panavision 70 — ultra-wide, used in The Hateful Eight" },
];

export const MEDIA_FORMAT_OPTIONS = [
  { value: "4K UHD",    description: "Ultra HD Blu-ray disc" },
  { value: "Blu-ray",   description: "Standard Blu-ray disc" },
  { value: "DVD",        description: "Standard DVD disc" },
  { value: "Digital",   description: "Digital purchase or streaming license" },
  { value: "Laserdisc", description: "Analogue optical disc format (1978–2001)" },
  { value: "VHS",        description: "VHS cassette tape" },
];

export const REGION_OPTIONS = [
  { value: "Region Free", description: "Plays on any player worldwide" },
  { value: "Region A / 1", description: "Americas, East Asia, Southeast Asia" },
  { value: "Region B / 2", description: "Europe, Middle East, Africa, Australia" },
  { value: "Region C / 3", description: "Central and South Asia, mainland China" },
];

export const CERTIFICATION_OPTIONS = [
  { value: "G",     description: "General audiences — all ages admitted" },
  { value: "PG",    description: "Parental guidance suggested" },
  { value: "PG-13", description: "Parents strongly cautioned; may be inappropriate under 13" },
  { value: "R",     description: "Restricted; under 17 requires accompanying adult" },
  { value: "NC-17", description: "No one 17 and under admitted" },
  { value: "NR",    description: "Not rated" },
  { value: "UR",    description: "Unrated — original cut, not submitted for classification" },
  { value: "U",     description: "BBFC: Universal — suitable for all" },
  { value: "12A",   description: "BBFC: Suitable for 12 and over; younger with adult" },
  { value: "15",    description: "BBFC: Suitable only for 15 and over" },
  { value: "18",    description: "BBFC: Suitable only for adults" },
];

export const AUDIO_FORMAT_OPTIONS = [
  { value: "Dolby Atmos",              description: "Object-based surround — lossless overhead audio (TrueHD core)" },
  { value: "Dolby TrueHD",            description: "Lossless Dolby surround, common on Blu-ray" },
  { value: "Dolby Digital Plus (DD+)", description: "Enhanced lossy Dolby surround (E-AC-3)" },
  { value: "Dolby Digital (DD)",       description: "Standard lossy Dolby 5.1 (AC-3)" },
  { value: "Dolby Surround",           description: "Matrix-encoded surround, pre-digital era" },
  { value: "DTS:X",                    description: "Object-based DTS surround sound" },
  { value: "DTS-HD Master Audio",      description: "Lossless DTS surround, Blu-ray standard" },
  { value: "DTS-HD High Resolution",   description: "Lossy high-bitrate DTS extension" },
  { value: "DTS Digital Surround",     description: "Standard lossy DTS 5.1" },
  { value: "PCM Stereo",               description: "Uncompressed two-channel audio" },
  { value: "PCM Multichannel",         description: "Uncompressed 5.1 or 7.1 PCM" },
  { value: "LPCM",                     description: "Linear PCM — lossless, common on Blu-ray and LaserDisc" },
  { value: "AAC Stereo",               description: "Advanced Audio Coding — common on digital downloads" },
  { value: "Stereo",                   description: "Two-channel audio (format unspecified)" },
  { value: "Mono",                     description: "Single-channel audio" },
];

export const MUSIC_FORMAT_OPTIONS = [
  { value: "Vinyl",      description: "Vinyl LP or single" },
  { value: "CD",         description: "Compact disc" },
  { value: "Cassette",   description: "Audio cassette tape" },
  { value: "8-Track",    description: "8-track cartridge" },
  { value: "Reel-to-Reel", description: "Open-reel tape" },
  { value: "Digital",    description: "Digital download or streaming" },
];

export const PRESSING_OPTIONS = [
  { value: "Original",       description: "First pressing from the original release" },
  { value: "Reissue",        description: "Later pressing of the same release" },
  { value: "Remaster",       description: "Reissue with audio remastered from original tapes" },
  { value: "Picture Disc",   description: "Vinyl disc with artwork printed on the playing surface" },
  { value: "Colored Vinyl",  description: "Non-black vinyl pressing" },
  { value: "Promo",          description: "Promotional copy; not for commercial sale" },
  { value: "Test Pressing",  description: "Pre-release pressing for quality approval" },
];

export const SPEED_OPTIONS = [
  { value: "33⅓ RPM", description: "Standard LP speed" },
  { value: "45 RPM",  description: "Standard single speed" },
  { value: "78 RPM",  description: "Shellac 78 — pre-vinyl format" },
];

// Goldmine standard grading scale, used for both media and cover/sleeve
export const RECORD_CONDITION_OPTIONS = [
  { value: "Mint",           description: "Perfect in every way; never played" },
  { value: "Near Mint",      description: "Nearly perfect; minimal signs of handling" },
  { value: "Very Good Plus", description: "Shows some signs of play; plays perfectly" },
  { value: "Very Good",      description: "Groove wear evident; some surface noise" },
  { value: "Good Plus",      description: "Heavy wear; plays through with significant noise" },
  { value: "Good",           description: "Very heavy wear; plays with constant noise" },
  { value: "Fair",           description: "Well-worn; may skip" },
  { value: "Poor",           description: "Barely playable" },
  { value: "Missing",        description: "Not present" },
];

export const PLATFORM_OPTIONS = [
  "PlayStation 5", "PlayStation 4", "PlayStation 3",
  "Xbox Series X/S", "Xbox One", "Xbox 360",
  "Nintendo Switch", "Nintendo 3DS", "Wii U", "Wii",
  "Steam", "Steam Deck", "PC (GOG)", "PC (Epic)", "PC (Other)",
  "macOS", "iOS / iPadOS", "Android",
  "Atari 2600", "Sega Genesis", "SNES", "NES",
  "Game Boy / GBA", "Nintendo DS",
  "Arcade",
];

export const AGE_RATING_OPTIONS = [
  { value: "E",       description: "ESRB: Everyone — content suitable for all ages" },
  { value: "E10+",    description: "ESRB: Everyone 10+ — may contain mild content" },
  { value: "T",       description: "ESRB: Teen — may contain content unsuitable for under 13" },
  { value: "M",       description: "ESRB: Mature — content suitable for 17+" },
  { value: "AO",      description: "ESRB: Adults Only — content suitable for 18+" },
  { value: "PEGI 3",  description: "PEGI: Suitable for ages 3 and over" },
  { value: "PEGI 7",  description: "PEGI: Suitable for ages 7 and over" },
  { value: "PEGI 12", description: "PEGI: Suitable for ages 12 and over" },
  { value: "PEGI 16", description: "PEGI: Suitable for ages 16 and over" },
  { value: "PEGI 18", description: "PEGI: Suitable for adults only" },
];

export const CIB_OPTIONS = [
  { value: "Complete in Box", description: "All original components present: disc/cart, box, manual, inserts" },
  { value: "Sealed",          description: "Factory sealed; never opened" },
  { value: "Cart/Disc Only",  description: "Physical media only; no box or manual" },
  { value: "Box Only",        description: "Box and manual only; no cartridge or disc" },
  { value: "Loose",           description: "Disc or cartridge without original packaging" },
];

export const SEAL_GRADE_OPTIONS = [
  { value: "Factory Sealed",       description: "Original factory shrink-wrap intact; never opened or resealed" },
  { value: "H-Seam Sealed/Resealed", description: "H-seam or heat-seam wrap; may be original or professionally resealed" },
  { value: "Y-Fold Sealed",        description: "Y-fold shrink-wrap style, common on older cartridge games" },
];

export const GAME_REGION_OPTIONS = [
  { value: "NTSC-U/C",    description: "USA and Canada" },
  { value: "NTSC-J",      description: "Japan and Asia" },
  { value: "PAL",         description: "Europe, Australia, and most of the world" },
  { value: "Region Free", description: "Plays on any hardware regardless of region" },
];

// ── Detail panel field definitions ───────────────────────────────────────────

export interface DetailFieldDef {
  key: keyof LibraryItem;
  label: string;
  mono?: boolean;
}

export const DETAIL_FIELDS: Record<MediaType, DetailFieldDef[]> = {
  book: [
    { key: "publisher",      label: "Publisher" },
    { key: "series",         label: "Series" },
    { key: "seriesPosition", label: "Position" },
    { key: "isbn",           label: "ISBN", mono: true },
  ],
  audiobook: [
    { key: "publisher",       label: "Publisher" },
    { key: "narrator",        label: "Narrator" },
    { key: "audiobookFormat", label: "Retailer / Platform" },
    { key: "drm",             label: "DRM" },
    { key: "runtime",         label: "Duration" },
    { key: "abridged",        label: "Abridged" },
    { key: "series",          label: "Series" },
    { key: "seriesPosition",  label: "Position" },
    { key: "asin",            label: "ASIN/PubCat", mono: true },
  ],
  movie: [
    { key: "studio",        label: "Studio" },
    { key: "series",         label: "Series" },
    { key: "seriesPosition", label: "Position" },
    { key: "mediaFormat",   label: "Format" },
    { key: "audioFormat",   label: "Audio" },
    { key: "certification", label: "Certificate" },
    { key: "region",        label: "Region" },
    { key: "aspectRatio",   label: "Aspect Ratio" },
    { key: "firstEdition",  label: "Edition" },
    { key: "firstPrinting", label: "Pressing" },
    { key: "spineNumber",   label: "Spine #", mono: true },
  ],
  music: [
    { key: "label",              label: "Label" },
    { key: "series",             label: "Series" },
    { key: "seriesPosition",     label: "Position" },
    { key: "musicFormat",        label: "Format" },
    { key: "pressing",           label: "Pressing" },
    { key: "speed",              label: "Speed" },
    { key: "catalogNumber",      label: "Catalog #", mono: true },
    { key: "countryOfPressing",  label: "Country" },
    { key: "labelVariant",       label: "Label Variant" },
    { key: "mediaCondition",     label: "Media" },
    { key: "coverCondition",     label: "Cover" },
  ],
  game: [
    { key: "publisher",   label: "Publisher" },
    { key: "series",         label: "Series" },
    { key: "seriesPosition", label: "Position" },
    { key: "platform",    label: "Platform" },
    { key: "ageRating",   label: "Age Rating" },
    { key: "cib",         label: "Completeness" },
    { key: "gameRegion",  label: "Region" },
    { key: "gameVariant", label: "Variant/Rev." },
    { key: "sealGrade",         label: "Seal Grade" },
    { key: "insertCompleteness", label: "Inserts" },
    { key: "insertNotes",        label: "Insert Notes" },
  ],
};

// ── Collector badge definitions ───────────────────────────────────────────────

export interface CollectorBadgeDef {
  field: CollectorField;
  icon: string;
  format: (value: string, item: LibraryItem) => string;
  /** If true, this field is folded into another badge and not shown standalone. */
  skipStandalone?: boolean;
}

export const COLLECTOR_BADGE_DEFS: CollectorBadgeDef[] = [
  { field: "autographed",    icon: "✍️", format: (v) => v },
  { field: "firstEdition",   icon: "①", format: (v) => `${v} Edition` },
  { field: "firstPrinting",  icon: "⑴", format: (v) => `${v} Printing` },
  { field: "binding",        icon: "📖", format: (v) => v },
  { field: "dustJacket",     icon: "🏷️", format: (v) => `DJ: ${v}` },
  { field: "condition",      icon: "🔍", format: (v) => v },
  // annotations: fold annotator attribution into the badge when present
  { field: "copyQualifier",  icon: "🏛️", format: (v) => v },
  { field: "previousOwners", icon: "👤", format: (v) => v },
  { field: "provenanceNotes",icon: "📜", format: (v) => v.length > 40 ? v.slice(0, 40) + "…" : v },
  { field: "annotations",    icon: "✏️", format: (v, item) => item.annotator ? `${v} — ${item.annotator}` : v },
  { field: "annotator",      icon: "✏️", format: (v) => v, skipStandalone: true },
  { field: "audiobookFormat",icon: "💿", format: (v) => v },
  { field: "abridged",       icon: "✂️", format: (v) => v },
  { field: "mediaFormat",    icon: "💿", format: (v) => v },
  { field: "region",         icon: "🌍", format: (v) => v },
  { field: "aspectRatio",    icon: "📐", format: (v) => v },
  { field: "certification",  icon: "🔞", format: (v) => v },
  { field: "label",          icon: "🏷️", format: (v) => v },
  { field: "musicFormat",    icon: "🎵", format: (v) => v },
  { field: "pressing",       icon: "🗜️", format: (v) => v },
  { field: "speed",          icon: "⏩", format: (v) => v },
  { field: "catalogNumber",  icon: "🔢", format: (v) => v },
  { field: "platform",       icon: "🕹️", format: (v) => v },
  { field: "ageRating",      icon: "🔞", format: (v) => v },
  { field: "cib",            icon: "📦", format: (v) => v },
  { field: "gameRegion",     icon: "🌍", format: (v) => v },
];

// ── Collector's Notes section definitions ─────────────────────────────────────

export interface CollectorSectionDef {
  field: CollectorField;
  icon: string;
  label: string;
  description: string;
  type: "select" | "select-other" | "text" | "textarea";
  options?: { value: string; description?: string; short?: string; detail?: string }[];
  dynamicDesc?: (item: LibraryItem) => string;
  showWhen?: (item: LibraryItem) => boolean;
  conditionTooltip?: boolean; // show the condition grade tooltip
}

const seriesSection: CollectorSectionDef = {
  field: "series",
  icon: "📚",
  label: "Series",
  description: "The series or sequence this work belongs to",
  type: "text",
};

const seriesPositionSection: CollectorSectionDef = {
  field: "seriesPosition",
  icon: "#️⃣",
  label: "Position in Series",
  description: "Entry number or volume within the series",
  type: "text",
  showWhen: (item) => !!item.series,
};

const autographedSection: CollectorSectionDef = {
  field: "autographed",
  icon: "✍️",
  label: "Signature Status",
  description: "Not specified",
  type: "select",
  options: AUTOGRAPHED_OPTIONS,
  dynamicDesc: (item) =>
    AUTOGRAPHED_OPTIONS.find((o) => o.value === item.autographed)?.description ?? "Not specified",
};

const conditionSection: CollectorSectionDef = {
  field: "condition",
  icon: "🔍",
  label: "Condition",
  description: "Overall physical state of this copy",
  type: "select",
  options: CONDITION_OPTIONS,
  dynamicDesc: (item) =>
    CONDITION_OPTIONS.find((o) => o.value === item.condition)?.detail ?? "Overall physical state of this copy",
  conditionTooltip: true,
};

const audiobookConditionSection: CollectorSectionDef = {
  field: "condition",
  icon: "🔍",
  label: "Condition",
  description: "Physical state of the case, discs, tapes, and inserts",
  type: "select",
  options: AUDIOBOOK_CONDITION_OPTIONS,
  dynamicDesc: (item) =>
    AUDIOBOOK_CONDITION_OPTIONS.find((o) => o.value === item.condition)?.detail ?? "Physical state of the case, discs, tapes, and inserts",
  conditionTooltip: true,
};

export const COLLECTOR_SECTIONS: Record<MediaType, CollectorSectionDef[]> = {
  book: [
    seriesSection,
    seriesPositionSection,
    autographedSection,
    {
      field: "firstEdition",
      icon: "①",
      label: "Edition",
      description: "The specific edition of this work",
      type: "select",
      options: EDITION_OPTIONS.map((v) => ({ value: v })),
      dynamicDesc: (item) =>
        item.firstEdition ? `${item.firstEdition} edition of this work` : "The specific edition of this work",
    },
    {
      field: "firstPrinting",
      icon: "⑴",
      label: "Printing",
      description: "The specific print run of this edition",
      type: "select",
      options: PRINTING_OPTIONS.map((v) => ({ value: v })),
      dynamicDesc: (item) =>
        item.firstPrinting ? `${item.firstPrinting} printing of this edition` : "The specific print run of this edition",
    },
    {
      field: "binding",
      icon: "📖",
      label: "Binding",
      description: "The physical construction of the cover",
      type: "select",
      options: BINDING_OPTIONS,
      dynamicDesc: (item) =>
        BINDING_OPTIONS.find((o) => o.value === item.binding)?.description ?? "The physical construction of the cover",
    },
    {
      field: "dustJacket",
      icon: "🏷️",
      label: "Dust Jacket",
      description: "Whether a dust jacket accompanies this copy",
      type: "select",
      options: DUST_JACKET_OPTIONS,
      dynamicDesc: (item) =>
        DUST_JACKET_OPTIONS.find((o) => o.value === item.dustJacket)?.description ?? "Whether a dust jacket accompanies this copy",
    },
    conditionSection,
    {
      field: "copyQualifier",
      icon: "🏛️",
      label: "Copy Qualifier",
      description: "Special status that affects collectibility",
      type: "select",
      options: COPY_QUALIFIER_OPTIONS,
      dynamicDesc: (item) =>
        COPY_QUALIFIER_OPTIONS.find((o) => o.value === item.copyQualifier)?.description ?? "Special status that affects collectibility",
    },
    {
      field: "annotations",
      icon: "✏️",
      label: "Annotations / Marginalia",
      description: "Nature of any annotations or marginalia in this copy",
      type: "select",
      options: ANNOTATIONS_OPTIONS,
      dynamicDesc: (item) =>
        ANNOTATIONS_OPTIONS.find((o) => o.value === item.annotations)?.description ?? "Nature of any annotations or marginalia in this copy",
    },
    {
      field: "annotator",
      icon: "🖊️",
      label: "Annotator (if known)",
      description: "e.g. possibly in the hand of T.S. Eliot",
      type: "text",
      showWhen: (item) => !!item.annotations,
    },
    {
      field: "previousOwners",
      icon: "👤",
      label: "Previous Owners",
      description: "Names or institutions in order of ownership, separated by semicolons",
      type: "text",
    },
    {
      field: "provenanceNotes",
      icon: "📜",
      label: "Provenance Notes",
      description: "Auction records, bookplates, inscriptions, sale catalogues, chain of custody",
      type: "textarea",
    },
  ],

  audiobook: [
    seriesSection,
    seriesPositionSection,
    {
      field: "audiobookFormat",
      icon: "🏪",
      label: "Retailer / Platform",
      description: "Where this audiobook was purchased or is hosted",
      type: "select",
      options: AUDIOBOOK_FORMAT_OPTIONS,
      dynamicDesc: (item) =>
        AUDIOBOOK_FORMAT_OPTIONS.find((o) => o.value === item.audiobookFormat)?.description ?? "Where this audiobook was purchased or is hosted",
    },
    {
      field: "abridged",
      icon: "✂️",
      label: "Abridged",
      description: "Whether the recording is the full text or a shortened version",
      type: "select",
      options: ABRIDGED_OPTIONS,
      dynamicDesc: (item) =>
        ABRIDGED_OPTIONS.find((o) => o.value === item.abridged)?.description ?? "Whether the recording is the full text or a shortened version",
    },
    audiobookConditionSection,
    autographedSection,
  ],

  movie: [
    seriesSection,
    seriesPositionSection,
    autographedSection,
    {
      field: "mediaFormat",
      icon: "💿",
      label: "Media Format",
      description: "The physical or digital format of this release",
      type: "select",
      options: MEDIA_FORMAT_OPTIONS,
      dynamicDesc: (item) =>
        MEDIA_FORMAT_OPTIONS.find((o) => o.value === item.mediaFormat)?.description ?? "The physical or digital format of this release",
    },
    {
      field: "audioFormat",
      icon: "🔊",
      label: "Audio Format",
      description: "Primary audio track format on this release",
      type: "select-other",
      options: AUDIO_FORMAT_OPTIONS,
      dynamicDesc: (item) =>
        AUDIO_FORMAT_OPTIONS.find((o) => o.value === item.audioFormat)?.description ?? "Primary audio track format on this release",
    },
    {
      field: "region",
      icon: "🌍",
      label: "Region",
      description: "The disc region encoding of this copy",
      type: "select",
      options: REGION_OPTIONS,
      dynamicDesc: (item) =>
        REGION_OPTIONS.find((o) => o.value === item.region)?.description ?? "The disc region encoding of this copy",
    },
    {
      field: "aspectRatio",
      icon: "📐",
      label: "Aspect Ratio",
      description: "The framing ratio of the picture as presented on this release",
      type: "select-other",
      options: ASPECT_RATIO_OPTIONS,
      dynamicDesc: (item) =>
        ASPECT_RATIO_OPTIONS.find((o) => o.value === item.aspectRatio)?.description ?? "The framing ratio of the picture as presented on this release",
    },
    {
      field: "certification",
      icon: "🔞",
      label: "Certificate",
      description: "Theatrical or home-video classification",
      type: "select",
      options: CERTIFICATION_OPTIONS,
      dynamicDesc: (item) =>
        CERTIFICATION_OPTIONS.find((o) => o.value === item.certification)?.description ?? "Theatrical or home-video classification",
    },
    {
      field: "firstEdition",
      icon: "①",
      label: "Edition",
      description: "Which edition of this release",
      type: "select-other",
      options: Array.from({ length: 10 }, (_, i) => ({ value: wordOrdinal(i + 1) })),
      dynamicDesc: (item) =>
        item.firstEdition ? `${item.firstEdition} edition of this release` : "Which edition of this release",
    },
    {
      field: "firstPrinting",
      icon: "⑴",
      label: "Pressing",
      description: "Which pressing of this release",
      type: "select",
      options: Array.from({ length: 10 }, (_, i) => ({ value: numOrdinal(i + 1) })),
      dynamicDesc: (item) =>
        item.firstPrinting ? `${item.firstPrinting} pressing of this release` : "Which pressing of this release",
    },
    conditionSection,
    {
      field: "spineNumber",
      icon: "🔢",
      label: "Spine Number",
      description: "Label spine number (e.g. Criterion #42, Arrow #85)",
      type: "text",
    },
  ],

  music: [
    seriesSection,
    seriesPositionSection,
    autographedSection,
    {
      field: "musicFormat",
      icon: "🎵",
      label: "Format",
      description: "The physical or digital format of this release",
      type: "select",
      options: MUSIC_FORMAT_OPTIONS,
      dynamicDesc: (item) =>
        MUSIC_FORMAT_OPTIONS.find((o) => o.value === item.musicFormat)?.description ?? "The physical or digital format of this release",
    },
    {
      field: "pressing",
      icon: "🗜️",
      label: "Pressing",
      description: "Original pressing or a later reissue",
      type: "select",
      options: PRESSING_OPTIONS,
      dynamicDesc: (item) =>
        PRESSING_OPTIONS.find((o) => o.value === item.pressing)?.description ?? "Original pressing or a later reissue",
    },
    {
      field: "speed",
      icon: "⏩",
      label: "Speed",
      description: "Playback speed (vinyl records only)",
      type: "select",
      options: SPEED_OPTIONS,
      dynamicDesc: (item) =>
        SPEED_OPTIONS.find((o) => o.value === item.speed)?.description ?? "Playback speed",
      showWhen: (item) => item.musicFormat === "Vinyl",
    },
    {
      field: "catalogNumber",
      icon: "🔢",
      label: "Catalog Number",
      description: "Label catalog or matrix number (e.g. BN 4003, CRE132)",
      type: "text",
    },
    {
      field: "countryOfPressing",
      icon: "🌐",
      label: "Country of Pressing",
      description: "Country where this copy was manufactured",
      type: "select-other",
      options: COUNTRY_OPTIONS.map((v) => ({ value: v })),
      dynamicDesc: (item) =>
        item.countryOfPressing ? `Pressed in ${item.countryOfPressing}` : "Country where this copy was manufactured",
    },
    {
      field: "labelVariant",
      icon: "🏷️",
      label: "Label Variant",
      description: "Label variation or pressing note (e.g. Monarch pressing, Specialty pressing, promo copy)",
      type: "text",
    },
    {
      field: "matrixInscription",
      icon: "✍️",
      label: "Matrix / Runout",
      description: "Hand-etched or stamped text in the runout groove",
      type: "text",
    },
    conditionSection,
  ],

  game: [
    seriesSection,
    seriesPositionSection,
    autographedSection,
    {
      field: "platform",
      icon: "🕹️",
      label: "Platform",
      description: "The hardware platform this copy runs on",
      type: "select",
      options: PLATFORM_OPTIONS.map((v) => ({ value: v })),
      dynamicDesc: (item) =>
        item.platform ? `Runs on ${item.platform}` : "The hardware platform this copy runs on",
    },
    {
      field: "cib",
      icon: "📦",
      label: "Completeness",
      description: "Whether original box, manual, and inserts are present",
      type: "select",
      options: CIB_OPTIONS,
      dynamicDesc: (item) =>
        CIB_OPTIONS.find((o) => o.value === item.cib)?.description ?? "Whether original box, manual, and inserts are present",
    },
    {
      field: "ageRating",
      icon: "🔞",
      label: "Age Rating",
      description: "ESRB or PEGI classification",
      type: "select",
      options: AGE_RATING_OPTIONS,
      dynamicDesc: (item) =>
        AGE_RATING_OPTIONS.find((o) => o.value === item.ageRating)?.description ?? "ESRB or PEGI classification",
    },
    {
      field: "gameRegion",
      icon: "🌍",
      label: "Region",
      description: "Regional encoding of this cartridge or disc",
      type: "select",
      options: GAME_REGION_OPTIONS,
      dynamicDesc: (item) =>
        GAME_REGION_OPTIONS.find((o) => o.value === item.gameRegion)?.description ?? "Regional encoding of this cartridge or disc",
    },
    {
      field: "gameVariant",
      icon: "🔀",
      label: "Variant / Revision",
      description: "Specific revision, print run, or variant (e.g. Rev A, v1.1, Player's Choice)",
      type: "text",
    },
    conditionSection,
    {
      field: "sealGrade",
      icon: "🔒",
      label: "Seal Grade",
      description: "Type of factory or reseal wrap on this copy",
      type: "select",
      options: SEAL_GRADE_OPTIONS,
      dynamicDesc: (item) =>
        SEAL_GRADE_OPTIONS.find((o) => o.value === item.sealGrade)?.description ?? "Type of factory or reseal wrap on this copy",
    },
    {
      field: "insertCompleteness",
      icon: "📄",
      label: "Insert Completeness",
      description: "Whether all original inserts, manuals, and paperwork are present",
      type: "select",
      options: [
        { value: "Complete",   description: "All original inserts, manuals, and paperwork are present" },
        { value: "Incomplete", description: "One or more inserts, manuals, or paperwork items are missing" },
      ],
      dynamicDesc: (item) =>
        item.insertCompleteness === "Complete"
          ? "All original inserts, manuals, and paperwork are present"
          : item.insertCompleteness === "Incomplete"
          ? "One or more inserts, manuals, or paperwork items are missing"
          : "Whether all original inserts, manuals, and paperwork are present",
    },
    {
      field: "insertNotes",
      icon: "📝",
      label: "Insert Notes",
      description: "Notes on insert condition or which pieces are present or missing",
      type: "textarea",
    },
    {
      field: "copyQualifier",
      icon: "🏛️",
      label: "Copy Qualifier",
      description: "Special status that affects collectibility",
      type: "select",
      options: COPY_QUALIFIER_OPTIONS,
      dynamicDesc: (item) =>
        COPY_QUALIFIER_OPTIONS.find((o) => o.value === item.copyQualifier)?.description ?? "Special status that affects collectibility",
    },
  ],
};

// ── All collector fields (for "has notes" dot check) ──────────────────────────

export const ALL_COLLECTOR_FIELDS: CollectorField[] = [
  "series", "seriesPosition",
  "autographed", "firstEdition", "firstPrinting", "binding", "dustJacket", "condition",
  "annotations", "annotator", "copyQualifier",
  "previousOwners", "provenanceNotes",
  "audiobookFormat", "abridged",
  "mediaFormat", "audioFormat", "region", "aspectRatio", "certification", "spineNumber",
  "label", "musicFormat", "catalogNumber", "pressing", "speed",
  "countryOfPressing", "labelVariant", "matrixInscription",
  "platform", "ageRating", "cib", "gameRegion", "gameVariant", "sealGrade",
  "insertCompleteness", "insertNotes",
];

// ── Fields preserved when editing an item ────────────────────────────────────

export const PRESERVED_FIELDS: (keyof LibraryItem)[] = [
  "tags", "lent", "language", "creatorFirst", "creatorLast", "creatorIsGroup",
  "autographed", "firstEdition", "firstPrinting", "binding", "dustJacket", "condition",
  "annotations", "annotator", "copyQualifier",
  "series", "seriesPosition",
  "previousOwners", "provenanceNotes",
  "narrator", "narrators", "audiobookFormat", "runtime", "abridged", "drm",
  "studio", "mediaFormat", "audioFormat", "spineNumber", "region", "aspectRatio", "certification",
  "label", "musicFormat", "catalogNumber", "pressing", "speed", "mediaCondition", "coverCondition",
  "countryOfPressing", "labelVariant", "matrixInscription",
  "platform", "ageRating", "cib", "gameRegion", "gameVariant", "sealGrade",
  "insertCompleteness", "insertNotes",
];
