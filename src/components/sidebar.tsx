"use client";

import { LayoutGrid, Star, Folder, SlidersHorizontal } from "lucide-react";
import type { Collection } from "@/lib/types";
import { cn } from "@/lib/utils";

type RowProps = {
  active: boolean;
  Icon: typeof Folder;
  label: string;
  count?: number;
  onClick: () => void;
};

function Row({ active, Icon, label, count, onClick }: RowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition",
        active
          ? "bg-accent text-accent-foreground"
          : "text-foreground hover:bg-surface-muted"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate text-left">{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "text-xs",
            active ? "text-accent-foreground/80" : "text-muted"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function Sidebar({
  collections,
  activeCollection,
  favorites,
  onAll,
  onFavorites,
  onCollection,
  onManage,
}: {
  collections: Collection[];
  activeCollection: string | null;
  favorites: boolean;
  onAll: () => void;
  onFavorites: () => void;
  onCollection: (id: string) => void;
  onManage: () => void;
}) {
  return (
    <nav className="flex flex-col gap-1">
      <Row
        active={!favorites && !activeCollection}
        Icon={LayoutGrid}
        label="All items"
        onClick={onAll}
      />
      <Row
        active={favorites}
        Icon={Star}
        label="Favorites"
        onClick={onFavorites}
      />

      <div className="mb-1 mt-4 flex items-center justify-between px-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Collections
        </span>
        <button
          type="button"
          onClick={onManage}
          aria-label="Manage collections & tags"
          className="rounded-md p-1 text-muted transition hover:bg-surface-muted hover:text-foreground"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {collections.length === 0 ? (
        <p className="px-3 text-xs text-muted">
          No collections yet.{" "}
          <button
            type="button"
            onClick={onManage}
            className="font-medium text-accent"
          >
            Add some
          </button>
        </p>
      ) : (
        collections.map((c) => (
          <Row
            key={c.id}
            active={!favorites && activeCollection === c.id}
            Icon={Folder}
            label={c.name}
            count={c.count}
            onClick={() => onCollection(c.id)}
          />
        ))
      )}
    </nav>
  );
}
