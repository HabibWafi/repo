"use client";

import { useState } from "react";
import { X, ChevronDown, Plus } from "lucide-react";
import type { Collection, Tag } from "@/lib/types";
import { Input, Label } from "./ui";
import { cn } from "@/lib/utils";

/**
 * Single-select collection picker with inline create. Submits the chosen or
 * typed name in a hidden `new_collection` field; the server action upserts it
 * (so existing names resolve to their id, new names are created).
 */
export function CollectionCombo({
  collections,
  defaultName = "",
}: {
  collections: Collection[];
  defaultName?: string;
}) {
  const [value, setValue] = useState(defaultName);
  const [open, setOpen] = useState(false);

  const needle = value.trim().toLowerCase();
  const filtered = collections.filter((c) =>
    c.name.toLowerCase().includes(needle)
  );
  const exact = collections.some((c) => c.name.toLowerCase() === needle);

  return (
    <div className="relative">
      <Label htmlFor="collection-combo">Collection</Label>
      <input type="hidden" name="new_collection" value={value} />
      <div className="relative">
        <Input
          id="collection-combo"
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder="Choose or create a collection…"
          className="pr-9"
        />
        {value ? (
          <button
            type="button"
            onClick={() => setValue("")}
            aria-label="Clear collection"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-surface-muted"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        )}
      </div>

      {open && (filtered.length > 0 || (needle && !exact)) && (
        <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-lg">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setValue(c.name);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-muted"
              >
                <span>{c.name}</span>
                {c.count !== undefined && (
                  <span className="text-xs text-muted">{c.count}</span>
                )}
              </button>
            </li>
          ))}
          {needle && !exact && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-accent hover:bg-surface-muted"
              >
                <Plus className="h-4 w-4" /> Create &ldquo;{value.trim()}&rdquo;
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/**
 * Multi-select tag picker with inline create. Submits a comma-separated
 * `tags` field (server uses parseTags()).
 */
export function TagCombo({
  tags,
  defaultTags = [],
}: {
  tags: Tag[];
  defaultTags?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(defaultTags);
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);

  function add(name: string) {
    const v = name.trim().toLowerCase();
    if (v && !selected.includes(v)) setSelected([...selected, v]);
    setText("");
  }
  function remove(name: string) {
    setSelected(selected.filter((t) => t !== name));
  }

  const needle = text.trim().toLowerCase();
  const suggestions = tags.filter(
    (t) => !selected.includes(t.name) && t.name.includes(needle)
  );
  const canCreate = needle && !tags.some((t) => t.name === needle) && !selected.includes(needle);

  return (
    <div className="relative">
      <Label htmlFor="tag-combo">Tags</Label>
      <input type="hidden" name="tags" value={selected.join(",")} />
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-surface px-2 py-2">
        {selected.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground"
          >
            #{t}
            <button
              type="button"
              onClick={() => remove(t)}
              aria-label={`Remove ${t}`}
              className="text-muted hover:text-danger"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id="tag-combo"
          autoComplete="off"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (needle) add(text);
            } else if (e.key === "Backspace" && !text && selected.length) {
              remove(selected[selected.length - 1]);
            }
          }}
          placeholder={selected.length ? "" : "Add tags…"}
          className="h-7 min-w-[6rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </div>

      {open && (suggestions.length > 0 || canCreate) && (
        <ul className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-border bg-surface p-1 shadow-lg">
          {suggestions.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(t.name);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-muted"
                )}
              >
                <span>#{t.name}</span>
                {t.count !== undefined && (
                  <span className="text-xs text-muted">{t.count}</span>
                )}
              </button>
            </li>
          ))}
          {canCreate && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(text);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-accent hover:bg-surface-muted"
              >
                <Plus className="h-4 w-4" /> Create #{needle}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
