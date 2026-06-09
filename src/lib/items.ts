import type { SupabaseClient } from "@supabase/supabase-js";
import type { Item, ItemView } from "@/lib/types";

export const BUCKET = "archive";
export const PAGE_SIZE = 30;

/** A row from `select("*, collection:collections(name)")`. */
type ItemRow = Item & { collection?: { name: string } | null };

/**
 * Enrich item rows for rendering: sign Storage image URLs (so private files
 * display) and flatten the embedded collection name. Shared by the page and
 * the query action so they never drift.
 */
export async function toItemViews(
  supabase: SupabaseClient,
  rows: ItemRow[]
): Promise<ItemView[]> {
  const imagePaths = rows
    .filter((r) => r.type === "image" && r.image_path)
    .map((r) => r.image_path as string);

  const signed = new Map<string, string>();
  if (imagePaths.length) {
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(imagePaths, 60 * 60);
    for (const s of data ?? []) {
      if (s.signedUrl && s.path) signed.set(s.path, s.signedUrl);
    }
  }

  return rows.map(({ collection, ...item }) => ({
    ...(item as Item),
    collection_name: collection?.name ?? null,
    displayThumb:
      item.type === "image" && item.image_path
        ? signed.get(item.image_path) ?? null
        : item.thumbnail_url,
  }));
}
