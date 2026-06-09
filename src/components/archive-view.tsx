"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Star, Link2, Image as ImageIcon, LayoutGrid } from "lucide-react";
import type { ItemView } from "@/lib/types";
import { ItemCard } from "./item-card";
import { AddSheet } from "./add-sheet";
import { Input } from "./ui";
import { cn } from "@/lib/utils";

type Filter = "all" | "link" | "image" | "favorites";

export function ArchiveView({
  items,
  userId,
}: {
  items: ItemView[];
  userId: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of items)
      for (const t of it.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (filter === "favorites" && !it.is_favorite) return false;
      if (filter === "link" && it.type !== "link") return false;
      if (filter === "image" && it.type !== "image") return false;
      if (activeTag && !it.tags.includes(activeTag)) return false;
      if (q) {
        const hay = [it.title, it.description, it.notes, it.url, ...it.tags]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, query, filter, activeTag]);

  const filterTabs: { key: Filter; label: string; Icon: typeof Star }[] = [
    { key: "all", label: "All", Icon: LayoutGrid },
    { key: "link", label: "Links", Icon: Link2 },
    { key: "image", label: "Images", Icon: ImageIcon },
    { key: "favorites", label: "Favorites", Icon: Star },
  ];

  return (
    <>
      {/* Sticky search + filters */}
      <div className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your archive…"
              className="pl-10"
              inputMode="search"
            />
          </div>

          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {filterTabs.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                  filter === key
                    ? "bg-accent text-accent-foreground"
                    : "bg-surface-muted text-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {allTags.length > 0 && (
            <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
              {activeTag && (
                <button
                  onClick={() => setActiveTag(null)}
                  className="shrink-0 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                >
                  clear ✕
                </button>
              )}
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTag(activeTag === t ? null : t)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition",
                    activeTag === t
                      ? "bg-foreground text-background"
                      : "bg-surface-muted text-muted"
                  )}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-5xl px-4 py-5 pb-28">
        {filtered.length === 0 ? (
          <EmptyState hasItems={items.length > 0} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((it) => (
              <ItemCard key={it.id} item={it} />
            ))}
          </div>
        )}
      </main>

      {/* Floating add button (thumb-reachable) */}
      <button
        onClick={() => setAddOpen(true)}
        aria-label="Add new item"
        className="fixed bottom-0 right-0 z-40 mr-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition hover:scale-105 active:scale-95"
        style={{ marginBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
      >
        <Plus className="h-7 w-7" />
      </button>

      <AddSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        userId={userId}
      />
    </>
  );
}

function EmptyState({ hasItems }: { hasItems: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
      <LayoutGrid className="h-10 w-10 text-muted" />
      <p className="text-sm font-medium text-foreground">
        {hasItems ? "No matches" : "Your archive is empty"}
      </p>
      <p className="max-w-xs text-sm text-muted">
        {hasItems
          ? "Try a different search or filter."
          : "Tap the + button to save your first link or screenshot."}
      </p>
    </div>
  );
}
