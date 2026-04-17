export type MediaType = "book" | "audiobook" | "movie" | "music" | "game";

export interface LendRecord {
  borrower: string;
  lentOn: string;
}

export interface LibraryItem {
  id: string;
  type: MediaType;
  title: string;
  creator: string;          // combined display name, always set
  creatorFirst?: string;    // given name (personal names only)
  creatorLast?: string;     // family name (personal names only)
  creatorIsGroup?: boolean; // true for bands, studios, corporate names
  year: number;
  genre: string;
  description: string;
  rating: number;
  coverColor: string;
  coverAccent: string;
  coverImageUrl?: string;
  tags: string[];
  language?: string;       // ISO 639-2/B three-letter code or plain name, e.g. "eng" / "English"
  lent?: LendRecord;

  // ── Bibliographic (shared) ────────────────────────────────
  isbn?: string;          // raw barcode / ISBN-10 / ISBN-13 / UPC
  publisher?: string;     // publisher or imprint (book, audiobook, game)
  series?: string;        // series name, e.g. "The Wheel of Time"
  seriesPosition?: string; // position within series, e.g. "Book 3" or "3"

  // ── Audiobook ─────────────────────────────────────────────
  asin?: string;            // Audible ASIN or publisher catalogue number
  narrator?: string;        // combined display string: "First Last, First Last"
  narrators?: Array<{ first: string; last: string }>; // structured narrator list
  audiobookFormat?: string; // retailer/platform: "Audible" | "Libro.fm" | …
  runtime?: string;         // duration in H:MM:SS or HH:MM:SS, e.g. "12:34:56"
  abridged?: string;        // "Unabridged" | "Abridged"
  drm?: string;             // "DRM-Locked" | "DRM-Free"

  // ── Movie ─────────────────────────────────────────────────
  studio?: string;
  mediaFormat?: string;     // "DVD" | "Blu-ray" | "4K UHD" | "Digital" | "Laserdisc" | "VHS"
  region?: string;          // "Region A" | "Region 1" | "Region 2" | "Region Free"
  aspectRatio?: string;     // free text: "2.39:1"
  certification?: string;   // "G" | "PG" | "PG-13" | "R" | "NC-17" | "NR" | "UR"
  audioFormat?: string;     // "Dolby Atmos" | "DTS-HD Master Audio" | "PCM Stereo" | …
  spineNumber?: string;     // label spine number, e.g. "42" (Criterion), "85" (Arrow)

  // ── Music ─────────────────────────────────────────────────
  label?: string;           // record label
  musicFormat?: string;     // "Vinyl" | "CD" | "Cassette" | "8-Track" | "Digital"
  catalogNumber?: string;   // free text: "CRE132"
  pressing?: string;        // "Original" | "Reissue" | "Remaster" | "Picture Disc" | …
  speed?: string;           // "33⅓ RPM" | "45 RPM" | "78 RPM" (vinyl only)
  mediaCondition?: string;    // Goldmine grade for the disc / media
  coverCondition?: string;    // Goldmine grade for the sleeve / cover / packaging
  countryOfPressing?: string; // country where this copy was pressed
  labelVariant?: string;      // label variant / pressing variation (e.g. "Monarch pressing", "promo copy")
  matrixInscription?: string; // hand-etched or stamped runout groove text

  // ── Game ──────────────────────────────────────────────────
  platform?: string;        // "PlayStation 5" | "Nintendo Switch" | "PC" | …
  ageRating?: string;       // "E" | "E10+" | "T" | "M" | "AO" | "PEGI 12" | …
  cib?: string;             // "Complete in Box" | "Cart/Disc Only" | "Box Only" | "Sealed" | "Loose"
  gameRegion?: string;      // "NTSC-U" | "NTSC-J" | "PAL" | "Region Free"
  gameVariant?: string;     // free text: revision number, print run, special edition label
  sealGrade?: string;       // "Factory Sealed" | "H-Seam Sealed/Resealed" | "Y-Fold Sealed"
  insertCompleteness?: string; // "Complete" | "Incomplete"
  insertNotes?: string;     // free text: notes about insert condition or missing pieces

  // ── Collector attributes (shared) ─────────────────────────
  autographed?: string;     // "Signed" | "Unsigned" | "Inscribed" | "Association Copy"
  firstEdition?: string;    // "First" | "Second" | … | "One Hundredth"
  firstPrinting?: string;   // "1st" | "2nd" | … | "100th"
  binding?: string;         // "Softcover" | "Hardcover" | "Leather" | "Wrapper"
  dustJacket?: string;      // "Present" | "Absent" | "Facsimile"
  condition?: string;       // "Fine" | "Near Fine" | "Very Good" | "Good" | "Fair" | "Poor"
  annotations?: string;     // "Pencil Annotations" | "Ink Annotations" | …
  annotator?: string;       // free text: "possibly in the hand of T.S. Eliot"
  copyQualifier?: string;   // "Ex-Library" | "Remainder" | "Book Club Edition"
  previousOwners?: string;  // free text: "Iris Murdoch; Blackwell's Oxford"
  provenanceNotes?: string; // free-form narrative: auction records, bookplates, chain of custody
}

/** All fields that can be set via the Collector's Notes modal. */
export type CollectorField =
  | "series" | "seriesPosition"
  | "autographed"
  | "firstEdition" | "firstPrinting"
  | "binding" | "dustJacket"
  | "condition"
  | "audiobookFormat" | "abridged"
  | "mediaFormat" | "region" | "aspectRatio" | "certification" | "audioFormat" | "spineNumber"
  | "label" | "musicFormat" | "catalogNumber" | "pressing" | "speed"
  | "countryOfPressing" | "labelVariant" | "matrixInscription"
  | "platform" | "ageRating" | "cib" | "gameRegion" | "gameVariant" | "sealGrade"
  | "insertCompleteness" | "insertNotes"
  | "annotations" | "annotator"
  | "copyQualifier"
  | "previousOwners" | "provenanceNotes";
