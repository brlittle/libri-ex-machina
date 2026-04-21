"use client";

import { useState, useEffect, useRef } from "react";
import type { LibraryItem, CollectorField } from "./types";
import { fetchCoverForItem, fetchWikipediaCover } from "./cover-fetcher";
import {
  DETAIL_FIELDS,
  COLLECTOR_BADGE_DEFS,
  ALL_COLLECTOR_FIELDS,
} from "./media-config";
import CollectorNotesModal from "./CollectorNotesModal";

// These constants are duplicated here to avoid a circular import with page.tsx.
// They match the values in page.tsx exactly.
const TYPE_ICONS: Record<string, string> = {
  book: "📚", audiobook: "🎧", movie: "🎬", music: "🎵", game: "🎮",
};
const TYPE_LABELS_SINGULAR: Record<string, string> = {
  book: "Book", audiobook: "Audiobook", movie: "Movie", music: "Music", game: "Game",
};
const CREATOR_LABEL: Record<string, string> = {
  book: "Author", audiobook: "Author", movie: "Director", music: "Artist", game: "Developer",
};

// ── StarRating (read-only display) ────────────────────────────────────────────

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`text-sm ${n <= value ? "text-amber-400" : "text-stone-700"}`}>
          ★
        </span>
      ))}
    </div>
  );
}

// ── CoverArt (lg size) ────────────────────────────────────────────────────────

function CoverArt({ item }: { item: LibraryItem }) {
  if (item.coverImageUrl) {
    return (
      <img
        src={item.coverImageUrl}
        alt={item.title}
        className="w-40 h-56 object-cover rounded-lg shadow-xl"
      />
    );
  }
  return (
    <div
      className="w-40 h-56 rounded-lg shadow-xl flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${item.coverColor}, ${item.coverAccent}20)`, border: `1px solid ${item.coverAccent}30` }}
    >
      <span className="text-5xl opacity-60">{TYPE_ICONS[item.type]}</span>
    </div>
  );
}

// ── DetailPanel ───────────────────────────────────────────────────────────────

export default function DetailPanel({
  item,
  onClose,
  onEdit,
  onLend,
  onDelete,
  onCoverFetched,
  onSetCollectorField,
}: {
  item: LibraryItem;
  onClose: () => void;
  onEdit: () => void;
  onLend: () => void;
  onDelete: () => void;
  onCoverFetched: (id: string, url: string) => void;
  onSetCollectorField: (id: string, field: CollectorField, value: string | undefined) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fetchingCover, setFetchingCover] = useState(false);
  const [coverFailed, setCoverFailed] = useState(false);
  const [wikiSearching, setWikiSearching] = useState(false);
  const [wikiFailed, setWikiFailed] = useState(false);
  const [showCollectorNotes, setShowCollectorNotes] = useState(false);
  const coverUploadRef = useRef<HTMLInputElement>(null);

  function handleDetailCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      onCoverFetched(item.id, url);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleWikiSearch() {
    setWikiSearching(true);
    setWikiFailed(false);
    try {
      const url = await fetchWikipediaCover(item.title, item.creator);
      if (url) onCoverFetched(item.id, url);
      else setWikiFailed(true);
    } catch {
      setWikiFailed(true);
    } finally {
      setWikiSearching(false);
    }
  }

  useEffect(() => {
    setConfirmDelete(false);
    setCoverFailed(false);
    setWikiFailed(false);
    setShowCollectorNotes(false);
  }, [item.id]);

  useEffect(() => {
    if (item.coverImageUrl || coverFailed) return;
    setFetchingCover(true);
    fetchCoverForItem(item)
      .then((url) => {
        if (url) onCoverFetched(item.id, url);
        else setCoverFailed(true);
      })
      .catch(() => setCoverFailed(true))
      .finally(() => setFetchingCover(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const hasNotes = ALL_COLLECTOR_FIELDS.some(
    (f) => !!item[f as keyof LibraryItem]
  );

  // Active collector badges — only show fields relevant to this type;
  // skipStandalone fields (e.g. annotator) are folded into their parent badge.
  const activeBadges = COLLECTOR_BADGE_DEFS.filter(
    (b) => !b.skipStandalone && !!item[b.field as keyof LibraryItem]
  );

  // Per-type detail rows
  const detailRows = DETAIL_FIELDS[item.type];

  // Cover size hint
  const coverHint =
    item.type === "music"
      ? "Ideal: 500 × 500 px (square)"
      : "Ideal: 400 × 600 px (2 : 3)";

  return (
    <aside
      className="w-80 flex-shrink-0 border-l border-indigo-900/50 flex flex-col overflow-y-auto"
      style={{ background: "rgba(8,8,28,0.92)", backdropFilter: "blur(8px)" }}
    >
      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-indigo-900/50"
        style={{ background: "rgba(8,8,28,0.97)" }}
      >
        <span className="text-xs font-medium text-indigo-300/70 uppercase tracking-wider">
          {TYPE_ICONS[item.type]} {TYPE_LABELS_SINGULAR[item.type]}
        </span>
        <button
          onClick={onClose}
          className="text-stone-500 hover:text-stone-200 text-xl leading-none"
        >
          ×
        </button>
      </div>

      {/* Cover */}
      <div
        className="flex flex-col items-center pt-8 pb-4 px-8 gap-3"
        style={{
          background: `radial-gradient(ellipse at center, color-mix(in srgb, ${item.coverColor} 40%, transparent) 0%, transparent 70%)`,
        }}
      >
        <CoverArt item={item} />
        {fetchingCover && (
          <p className="text-xs text-stone-500 flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 border border-stone-600 border-t-amber-500 rounded-full animate-spin" />
            Fetching cover…
          </p>
        )}
        {coverFailed && !item.coverImageUrl && (
          <button
            onClick={() => {
              setCoverFailed(false);
              setFetchingCover(true);
              fetchCoverForItem(item)
                .then((url) => {
                  if (url) onCoverFetched(item.id, url);
                  else setCoverFailed(true);
                })
                .catch(() => setCoverFailed(true))
                .finally(() => setFetchingCover(false));
            }}
            className="text-xs text-stone-500 hover:text-stone-300 underline"
          >
            No cover found — retry
          </button>
        )}

        {/* Cover action buttons */}
        <div className="flex flex-col items-center gap-2 w-full px-4">
          <div className="flex gap-2 w-full">
            <label className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 rounded-lg text-xs font-medium transition-colors">
              📁 {item.coverImageUrl ? "Replace" : "Upload"}
              <input
                ref={coverUploadRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleDetailCoverUpload}
              />
            </label>
            <button
              onClick={handleWikiSearch}
              disabled={wikiSearching}
              title="Wikipedia-sourced image may be subject to copyright restrictions. The user is responsible for ensuring that the use of such images is lawful."
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-stone-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              {wikiSearching ? (
                <>
                  <span className="inline-block w-3 h-3 border border-stone-500 border-t-amber-400 rounded-full animate-spin" />
                  Searching…
                </>
              ) : (
                <>🌐 Wikipedia</>
              )}
            </button>
          </div>
          {wikiFailed && (
            <p className="text-xs text-amber-600 text-center">
              No image found on Wikipedia for this title.
            </p>
          )}
          <p className="text-xs text-stone-500">{coverHint}</p>
        </div>
      </div>

      {/* Metadata */}
      <div className="px-5 pb-5 space-y-4 flex-1">
        <div>
          <h2 className="text-xl font-bold text-stone-100 leading-tight">
            {item.title}
          </h2>
          <p className="text-stone-400 text-sm mt-1">
            {CREATOR_LABEL[item.type]}: {item.creator}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StarRating value={item.rating} />
          <span className="text-stone-500 text-xs">{item.year}</span>
        </div>

        {/* Genre + tags */}
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 bg-stone-700 text-stone-300 rounded text-xs">
            {item.genre}
          </span>
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-stone-800 text-stone-400 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Per-type detail rows */}
        {detailRows.some(({ key }) => !!item[key as keyof LibraryItem]) && (
          <div className="space-y-1">
            {detailRows.map(({ key, label, mono }) => {
              const val = item[key as keyof LibraryItem];
              if (!val) return null;
              return (
                <p key={key} className="text-sm text-stone-500">
                  <span className="text-stone-500">{label}: </span>
                  <span className={mono ? "font-mono tracking-wide text-xs" : ""}>
                    {String(val)}
                  </span>
                </p>
              );
            })}
          </div>
        )}

        {/* Description */}
        {item.description && (
          <p className="text-stone-400 text-sm leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Active collector badges */}
        {activeBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeBadges.map((b) => {
              const val = item[b.field as keyof LibraryItem] as string;
              return (
                <span
                  key={b.field}
                  className="px-2 py-0.5 bg-amber-900/40 border border-amber-700/50 text-amber-300 rounded text-xs"
                >
                  {b.icon} {b.format(val, item)}
                </span>
              );
            })}
          </div>
        )}

        {/* Lending status */}
        {item.lent && (
          <div
            className="rounded-lg p-3 border"
            style={{ borderColor: "#92400e50", backgroundColor: "#78350f30" }}
          >
            <p className="text-amber-300 text-xs font-semibold uppercase tracking-wide mb-0.5">
              On Loan
            </p>
            <p className="text-amber-200 text-sm">Lent to {item.lent.borrower}</p>
            <p className="text-amber-600 text-xs mt-0.5">
              Since {new Date(item.lent.lentOn).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={onEdit}
            className="w-full py-2 rounded-lg text-sm font-medium bg-stone-700 hover:bg-stone-600 text-stone-200 transition-colors"
          >
            ✏️ Edit Item
          </button>
          <button
            onClick={() => setShowCollectorNotes(true)}
            className="relative w-full py-2 rounded-lg text-sm font-medium bg-stone-700 hover:bg-stone-600 text-stone-200 transition-colors"
          >
            📓 Collector&apos;s Notes
            {hasNotes && (
              <span className="absolute top-1.5 right-2.5 w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
          <button
            onClick={onLend}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
              item.lent
                ? "bg-emerald-800 hover:bg-emerald-700 text-emerald-200"
                : "bg-stone-700 hover:bg-stone-600 text-stone-200"
            }`}
          >
            {item.lent ? "📋 View Lending Record" : "🤝 Lend This Item"}
          </button>
          {confirmDelete ? (
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2 rounded-lg text-sm text-stone-400 hover:text-stone-200 bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-800 hover:bg-red-700 text-red-100 transition-colors"
              >
                Confirm Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full py-2 rounded-lg text-sm text-stone-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
            >
              Remove from Library
            </button>
          )}
        </div>
      </div>

      {/* Collector's Notes modal */}
      {showCollectorNotes && (
        <CollectorNotesModal
          item={item}
          onSetCollectorField={onSetCollectorField}
          onClose={() => setShowCollectorNotes(false)}
        />
      )}
    </aside>
  );
}
