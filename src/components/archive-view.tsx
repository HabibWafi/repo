"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Menu,
  X,
  Loader2,
  CheckSquare,
  Trash2,
  Link2,
  Image as ImageIcon,
  LayoutGrid,
} from "lucide-react";
import { toast } from "sonner";
import type { Collection, ItemView, Tag } from "@/lib/types";
import {
  queryItems,
  deleteItems,
  moveItemsToCollection,
  type QueryFilters,
} from "@/lib/actions";
import { ItemCard } from "./item-card";
import { AddSheet } from "./add-sheet";
import { ManageSheet } from "./manage-sheet";
import { Sidebar } from "./sidebar";
import { Button, Input } from "./ui";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | "link" | "image";

export function ArchiveView({
  initialItems,
  initialHasMore,
  collections,
  tags,
  userId,
  initialUrl = null,
}: {
  initialItems: ItemView[];
  initialHasMore: boolean;
  collections: Collection[];
  tags: Tag[];
  userId: string;
  initialUrl?: string | null;
}) {
  const router = useRouter();

  // Filters
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [favorites, setFavorites] = useState(false);

  // Data
  const [items, setItems] = useState<ItemView[]>(initialItems);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  // UI
  const [addOpen, setAddOpen] = useState(Boolean(initialUrl));
  const [manageOpen, setManageOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const firstRender = useRef(true);

  const filters = useMemo<QueryFilters>(
    () => ({
      collectionId: activeCollection,
      favorites,
      type,
      q: debounced,
    }),
    [activeCollection, favorites, type, debounced]
  );

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Strip the ?add= share param after opening.
  useEffect(() => {
    if (initialUrl) router.replace("/");
  }, [initialUrl, router]);

  // Re-query whenever a filter changes (skip the very first mount — the server
  // already provided page 0 of the default view).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    queryItems({ ...filters, page: 0 }).then((res) => {
      if (cancelled) return;
      setItems(res.items);
      setHasMore(res.hasMore);
      setPage(0);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await queryItems({ ...filters, page: 0 });
    setItems(res.items);
    setHasMore(res.hasMore);
    setPage(0);
    setLoading(false);
  }, [filters]);

  async function loadMore() {
    const next = page + 1;
    setLoading(true);
    const res = await queryItems({ ...filters, page: next });
    setItems((prev) => [...prev, ...res.items]);
    setHasMore(res.hasMore);
    setPage(next);
    setLoading(false);
  }

  // Selection helpers
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function exitSelect() {
    setSelecting(false);
    setSelected(new Set());
  }

  async function bulkDelete() {
    const ids = [...selected];
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} item(s)? This cannot be undone.`)) return;
    setLoading(true);
    const r = await deleteItems(ids);
    if (r.error) toast.error(r.error);
    else toast.success(`Deleted ${ids.length} item(s)`);
    exitSelect();
    await reload();
  }

  async function bulkMove(collectionId: string | null) {
    const ids = [...selected];
    if (!ids.length) return;
    setLoading(true);
    const r = await moveItemsToCollection(ids, collectionId);
    if (r.error) toast.error(r.error);
    else toast.success(`Moved ${ids.length} item(s)`);
    exitSelect();
    await reload();
  }

  function selectAll(fn: () => void) {
    fn();
    setDrawerOpen(false);
    exitSelect();
  }

  const typeTabs: { key: TypeFilter; label: string; Icon: typeof LayoutGrid }[] = [
    { key: "all", label: "All", Icon: LayoutGrid },
    { key: "link", label: "Links", Icon: Link2 },
    { key: "image", label: "Images", Icon: ImageIcon },
  ];

  const heading = favorites
    ? "Favorites"
    : activeCollection
    ? collections.find((c) => c.id === activeCollection)?.name ?? "Collection"
    : "All items";

  const sidebar = (
    <Sidebar
      collections={collections}
      activeCollection={activeCollection}
      favorites={favorites}
      onAll={() => selectAll(() => { setActiveCollection(null); setFavorites(false); })}
      onFavorites={() => selectAll(() => { setFavorites(true); setActiveCollection(null); })}
      onCollection={(id) =>
        selectAll(() => { setActiveCollection(id); setFavorites(false); })
      }
      onManage={() => {
        setDrawerOpen(false);
        setManageOpen(true);
      }}
    />
  );

  return (
    <div className="mx-auto flex max-w-6xl">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 overflow-y-auto border-r border-border p-4 lg:block">
        {sidebar}
      </aside>

      {/* Main column */}
      <div className="min-w-0 flex-1">
        {/* Toolbar */}
        <div className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
          <div className="flex items-center gap-2 px-4 py-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open collections"
              className="rounded-lg p-2 text-muted hover:bg-surface-muted lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your archive…"
                className="pl-10"
                inputMode="search"
              />
            </div>
            <button
              type="button"
              onClick={() => (selecting ? exitSelect() : setSelecting(true))}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                selecting
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:bg-surface-muted"
              )}
            >
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{selecting ? "Cancel" : "Select"}</span>
            </button>
          </div>

          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4 pb-3">
            {typeTabs.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setType(key)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition",
                  type === key
                    ? "bg-foreground text-background"
                    : "bg-surface-muted text-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <main className="px-4 py-5 pb-28">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold tracking-tight">{heading}</h1>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
          </div>

          {items.length === 0 && !loading ? (
            <EmptyState onAdd={() => setAddOpen(true)} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((it) => (
                  <ItemCard
                    key={it.id}
                    item={it}
                    selectable={selecting}
                    selected={selected.has(it.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <Button variant="secondary" onClick={loadMore} disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Load more
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[80%] overflow-y-auto border-r border-border bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-base font-semibold">Browse</span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted hover:bg-surface-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}

      {/* FAB (hidden in selection mode) */}
      {!selecting && (
        <button
          onClick={() => setAddOpen(true)}
          aria-label="Add new item"
          className="fixed bottom-0 right-0 z-40 mr-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition hover:scale-105 active:scale-95"
          style={{ marginBottom: "calc(env(safe-area-inset-bottom) + 1.25rem)" }}
        >
          <Plus className="h-7 w-7" />
        </button>
      )}

      {/* Selection action bar */}
      {selecting && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
            <span className="text-sm font-medium">{selected.size} selected</span>
            <div className="flex-1" />
            <select
              aria-label="Move to collection"
              defaultValue=""
              disabled={selected.size === 0 || loading}
              onChange={(e) => {
                const v = e.target.value;
                e.target.value = "";
                if (v === "__none") bulkMove(null);
                else if (v) bulkMove(v);
              }}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm"
            >
              <option value="" disabled>
                Move to…
              </option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="__none">— Remove from collection</option>
            </select>
            <Button
              variant="danger"
              size="sm"
              onClick={bulkDelete}
              disabled={selected.size === 0 || loading}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      )}

      <AddSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        userId={userId}
        initialUrl={initialUrl}
        collections={collections}
        tags={tags}
        onSaved={() => {
          router.refresh();
          reload();
        }}
      />

      <ManageSheet
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        collections={collections}
        tags={tags}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <LayoutGrid className="h-10 w-10 text-muted" />
      <p className="text-sm font-medium text-foreground">Nothing here yet</p>
      <p className="max-w-xs text-sm text-muted">
        Save your first link or screenshot — it’ll show up here newest-first.
      </p>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4" /> Add item
      </Button>
    </div>
  );
}
