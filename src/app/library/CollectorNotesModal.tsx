"use client";

import { useState } from "react";
import type { LibraryItem, CollectorField } from "./types";
import {
  COLLECTOR_SECTIONS,
  type CollectorSectionDef,
} from "./media-config";

// ── CollectorSection sub-component ───────────────────────────────────────────

function CollectorSection({
  section,
  item,
  onSetCollectorField,
  isLast,
}: {
  section: CollectorSectionDef;
  item: LibraryItem;
  onSetCollectorField: (id: string, field: CollectorField, value: string | undefined) => void;
  isLast: boolean;
}) {
  const currentValue = (item[section.field as keyof LibraryItem] as string | undefined) ?? "";
  const description = section.dynamicDesc ? section.dynamicDesc(item) : section.description;

  // For select-other: determine if current value is a known option or a custom one
  const knownValues = (section.options ?? []).map((o) => o.value);
  const isCustomValue = section.type === "select-other" && !!currentValue && !knownValues.includes(currentValue);
  const [otherMode, setOtherMode] = useState(isCustomValue);
  const [otherText, setOtherText] = useState(isCustomValue ? currentValue : "");

  return (
    <div className={`px-6 pt-4 ${isLast ? "pb-4" : "pb-2 border-b border-indigo-900/30"}`}>
      <div className="flex items-start gap-4">
        <span className="text-xl mt-0.5 flex-shrink-0">{section.icon}</span>
        <div className="flex-1 min-w-0">
          {/* Label — with optional condition tooltip */}
          {section.conditionTooltip ? (
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-sm font-medium text-stone-300">{section.label}</p>
              <div className="relative group">
                <span className="text-xs text-indigo-300 border border-indigo-600/60 rounded-full w-4 h-4 flex items-center justify-center cursor-default select-none leading-none">
                  ?
                </span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-stone-900 border border-stone-700 rounded-lg shadow-xl p-3 text-xs text-stone-300 leading-relaxed hidden group-hover:block z-10 pointer-events-none">
                  <p className="font-semibold text-amber-300 mb-1.5">Condition Grades</p>
                  {(section.options ?? []).map((o) => (
                    <p key={o.value} className="mb-1.5 last:mb-0">
                      <span className="font-medium text-stone-100">{o.value}:</span>{" "}
                      {o.short ?? o.description}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium text-stone-300 mb-0.5">{section.label}</p>
          )}

          <p className="text-xs text-stone-400 mb-2.5">{description}</p>

          {section.type === "select" ? (
            <select
              value={currentValue}
              onChange={(e) =>
                onSetCollectorField(item.id, section.field, e.target.value || undefined)
              }
              className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
              style={{ colorScheme: "dark" }}
            >
              <option value="">— Not specified —</option>
              {(section.options ?? []).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value}
                </option>
              ))}
            </select>
          ) : section.type === "select-other" ? (
            otherMode ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && otherText.trim()) {
                      onSetCollectorField(item.id, section.field, otherText.trim());
                    }
                  }}
                  placeholder="e.g. 1.90:1"
                  autoFocus
                  className="flex-1 bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (otherText.trim()) onSetCollectorField(item.id, section.field, otherText.trim());
                    setOtherMode(false);
                  }}
                  disabled={!otherText.trim()}
                  className="px-3 py-2 bg-amber-700/70 hover:bg-amber-600/70 disabled:opacity-40 text-stone-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Set
                </button>
                <button
                  type="button"
                  onClick={() => { setOtherText(""); setOtherMode(false); onSetCollectorField(item.id, section.field, undefined); }}
                  className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded-lg text-sm transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <select
                value={currentValue}
                onChange={(e) => {
                  if (e.target.value === "__other__") {
                    setOtherMode(true);
                    setOtherText("");
                  } else {
                    onSetCollectorField(item.id, section.field, e.target.value || undefined);
                  }
                }}
                className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                style={{ colorScheme: "dark" }}
              >
                <option value="">— Not specified —</option>
                {(section.options ?? []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.value} — {o.description}
                  </option>
                ))}
                <option value="__other__">Other…</option>
              </select>
            )
          ) : section.type === "textarea" ? (
            <textarea
              value={currentValue}
              onChange={(e) =>
                onSetCollectorField(item.id, section.field, e.target.value || undefined)
              }
              placeholder={section.description}
              rows={4}
              className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 resize-y min-h-[80px]"
            />
          ) : (
            <input
              type="text"
              value={currentValue}
              onChange={(e) =>
                onSetCollectorField(item.id, section.field, e.target.value || undefined)
              }
              placeholder={section.description}
              className="w-full bg-stone-800 border border-stone-600 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500"
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── CollectorNotesModal ───────────────────────────────────────────────────────

export default function CollectorNotesModal({
  item,
  onSetCollectorField,
  onClose,
}: {
  item: LibraryItem;
  onSetCollectorField: (id: string, field: CollectorField, value: string | undefined) => void;
  onClose: () => void;
}) {
  const sections = COLLECTOR_SECTIONS[item.type].filter(
    (s) => !s.showWhen || s.showWhen(item)
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-xl shadow-2xl border border-indigo-800/60 overflow-hidden flex flex-col max-h-[90vh]"
        style={{ background: "linear-gradient(160deg, #0e0e2a 0%, #080818 100%)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-indigo-900/50 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-stone-100">
              Collector&apos;s Notes
            </h2>
            <p className="text-xs text-indigo-300/80 mt-0.5 leading-snug line-clamp-1">
              {item.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-200 text-xl leading-none mt-0.5 ml-4 flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          {sections.map((section, idx) => (
            <CollectorSection
              key={section.field}
              section={section}
              item={item}
              onSetCollectorField={onSetCollectorField}
              isLast={idx === sections.length - 1}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-indigo-900/50 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-900/60 hover:bg-indigo-800/60 border border-indigo-700/50 text-stone-200 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
