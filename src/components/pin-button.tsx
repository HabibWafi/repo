"use client";

import { Pin } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { togglePin } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function PinButton({
  id,
  initial,
  className,
}: {
  id: string;
  initial: boolean;
  className?: string;
}) {
  const [pinned, setPinned] = useState(initial);
  const [pending, startTransition] = useTransition();

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next = !pinned;
    setPinned(next);
    startTransition(async () => {
      await togglePin(id, next);
      toast.success(next ? "Pinned to top" : "Unpinned");
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={pinned ? "Unpin" : "Pin to top"}
      aria-pressed={pinned}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 backdrop-blur transition hover:scale-105 active:scale-95",
        className
      )}
    >
      <Pin
        className="h-[18px] w-[18px] transition"
        style={{
          fill: pinned ? "var(--accent)" : "transparent",
          color: pinned ? "var(--accent)" : "var(--muted)",
        }}
      />
    </button>
  );
}
