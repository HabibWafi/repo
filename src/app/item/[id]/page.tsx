import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ItemEditor } from "@/components/item-editor";
import { FavoriteButton } from "@/components/favorite-button";
import { PROVIDER_META } from "@/lib/providers";
import { formatDate, hostnameOf } from "@/lib/utils";
import type { Item, ItemView } from "@/lib/types";

const BUCKET = "archive";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();
  if (!data) notFound();

  const item = data as Item;
  let displayThumb: string | null = item.thumbnail_url;
  if (item.type === "image" && item.image_path) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(item.image_path, 60 * 60);
    displayThumb = signed?.signedUrl ?? null;
  }
  const view: ItemView = { ...item, displayThumb };
  const meta = PROVIDER_META[item.provider];

  return (
    <div className="mx-auto min-h-full max-w-2xl px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <FavoriteButton id={item.id} initial={item.is_favorite} />
      </div>

      {/* Media */}
      <div className="relative mb-5 overflow-hidden rounded-card border border-border bg-surface-muted">
        <div className="relative aspect-video w-full">
          {view.displayThumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={view.displayThumb}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <meta.Icon className="h-12 w-12" style={{ color: "var(--muted)" }} />
            </div>
          )}
        </div>
        <span
          className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-medium backdrop-blur"
        >
          <meta.Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
          {meta.label}
        </span>
      </div>

      <div className="mb-5 flex flex-col gap-2">
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-surface-muted px-3 py-2 text-sm font-medium text-accent transition hover:opacity-80"
          >
            <ExternalLink className="h-4 w-4" />
            Open on {meta.label}
            <span className="text-muted">· {hostnameOf(item.url)}</span>
          </a>
        )}
        <p className="text-xs text-muted">Saved {formatDate(item.created_at)}</p>
      </div>

      <ItemEditor item={view} />
    </div>
  );
}
