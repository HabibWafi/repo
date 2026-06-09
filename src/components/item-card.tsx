"use client";

import Link from "next/link";
import { ExternalLink, Folder, Pencil, Check } from "lucide-react";
import type { ItemView } from "@/lib/types";
import { PROVIDER_META } from "@/lib/providers";
import { FavoriteButton } from "./favorite-button";
import { PinButton } from "./pin-button";
import { Badge } from "./ui";
import { cn, hostnameOf } from "@/lib/utils";

export function ItemCard({
  item,
  selectable = false,
  selected = false,
  onToggleSelect,
}: {
  item: ItemView;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const meta = PROVIDER_META[item.provider];
  const { Icon } = meta;
  const title = item.title || (item.url ? hostnameOf(item.url) : "Untitled");
  const isLink = item.type === "link" && !!item.url;
  const detailHref = `/item/${item.id}`;

  const media = (
    <div className="relative aspect-video w-full overflow-hidden bg-surface-muted">
      {item.displayThumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.displayThumb}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Icon className="h-10 w-10" style={{ color: "var(--muted)" }} />
        </div>
      )}

      <span
        className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1 text-xs font-medium backdrop-blur"
        style={{ color: "var(--foreground)" }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
        {meta.label}
      </span>

      {!selectable && (
        <div className="absolute right-2 top-2 flex gap-1.5">
          <PinButton id={item.id} initial={item.is_pinned} />
          <FavoriteButton id={item.id} initial={item.is_favorite} />
        </div>
      )}

      {selectable && (
        <span
          className={cn(
            "absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 transition",
            selected
              ? "border-accent bg-accent text-accent-foreground"
              : "border-white/80 bg-surface/70 backdrop-blur"
          )}
        >
          {selected && <Check className="h-4 w-4" />}
        </span>
      )}
    </div>
  );

  const body = (
    <div className="flex flex-1 flex-col gap-2 p-3">
      <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
        {title}
      </h3>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        {item.url && (
          <span className="inline-flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{hostnameOf(item.url)}</span>
          </span>
        )}
        {item.collection_name && (
          <span className="inline-flex items-center gap-1">
            <Folder className="h-3 w-3" />
            <span className="truncate">{item.collection_name}</span>
          </span>
        )}
      </div>
      {item.tags.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {item.tags.slice(0, 3).map((t) => (
            <Badge key={t}>#{t}</Badge>
          ))}
          {item.tags.length > 3 && <Badge>+{item.tags.length - 3}</Badge>}
        </div>
      )}
    </div>
  );

  const cardClass = cn(
    "group relative flex flex-col overflow-hidden rounded-card border bg-surface shadow-sm transition",
    selected ? "border-accent ring-2 ring-accent/40" : "border-border",
    item.is_pinned && !selected && "ring-1 ring-accent/30"
  );

  // Selection mode: the whole card toggles selection, no navigation.
  if (selectable) {
    return (
      <button
        type="button"
        onClick={() => onToggleSelect?.(item.id)}
        className={cn(cardClass, "text-left")}
      >
        {media}
        {body}
      </button>
    );
  }

  return (
    <div className={cn(cardClass, "hover:shadow-md")}>
      {isLink ? (
        <a
          href={item.url!}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 flex-col focus-visible:outline-none"
        >
          {media}
          {body}
        </a>
      ) : (
        <Link href={detailHref} className="flex flex-1 flex-col">
          {media}
          {body}
        </Link>
      )}

      {/* Quick actions */}
      <div className="flex border-t border-border text-sm">
        {isLink && (
          <a
            href={item.url!}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 py-2.5 font-medium text-accent transition hover:bg-surface-muted"
          >
            <ExternalLink className="h-4 w-4" /> Open
          </a>
        )}
        <Link
          href={detailHref}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2.5 font-medium text-muted transition hover:bg-surface-muted",
            isLink && "border-l border-border"
          )}
        >
          <Pencil className="h-4 w-4" /> Edit
        </Link>
      </div>
    </div>
  );
}
