"use client";

import Link from "next/link";
import { ExternalLink, Folder } from "lucide-react";
import type { ItemView } from "@/lib/types";
import { PROVIDER_META } from "@/lib/providers";
import { FavoriteButton } from "./favorite-button";
import { Badge } from "./ui";
import { hostnameOf } from "@/lib/utils";

export function ItemCard({ item }: { item: ItemView }) {
  const meta = PROVIDER_META[item.provider];
  const { Icon } = meta;
  const title =
    item.title || (item.url ? hostnameOf(item.url) : "Untitled");

  return (
    <Link
      href={`/item/${item.id}`}
      className="group relative flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      {/* Thumbnail */}
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

        {/* Provider chip */}
        <span
          className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1 text-xs font-medium backdrop-blur"
          style={{ color: "var(--foreground)" }}
        >
          <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
          {meta.label}
        </span>

        <FavoriteButton
          id={item.id}
          initial={item.is_favorite}
          className="absolute right-2 top-2"
        />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {title}
        </h3>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {item.url && (
            <span className="inline-flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              <span className="truncate">{hostnameOf(item.url)}</span>
            </span>
          )}
          {item.collection && (
            <span className="inline-flex items-center gap-1">
              <Folder className="h-3 w-3" />
              <span className="truncate">{item.collection}</span>
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
    </Link>
  );
}
