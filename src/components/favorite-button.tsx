"use client";

import { Star } from "lucide-react";
import { useTransition, useState } from "react";
import { toggleFavorite } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  id,
  initial,
  className,
}: {
  id: string;
  initial: boolean;
  className?: string;
}) {
  const [fav, setFav] = useState(initial);
  const [pending, startTransition] = useTransition();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !fav;
    setFav(next); // optimistic
    startTransition(() => toggleFavorite(id, next));
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={fav ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={fav}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 backdrop-blur transition hover:scale-105 active:scale-95",
        className
      )}
    >
      <Star
        className="h-5 w-5 transition"
        style={{
          fill: fav ? "var(--star)" : "transparent",
          color: fav ? "var(--star)" : "var(--muted)",
        }}
      />
    </button>
  );
}
