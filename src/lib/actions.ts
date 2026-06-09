"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { toItemViews, BUCKET, PAGE_SIZE } from "@/lib/items";
import {
  createLinkSchema,
  extractUrls,
  normalizeName,
  parseTags,
  updateItemSchema,
  type ItemView,
  type Provider,
} from "@/lib/types";
import { fetchPreview } from "@/lib/metadata";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export type ActionState = { error?: string; success?: boolean };
export type ImportState = { error?: string; imported?: number; skipped?: number };

/** Resolve a collection reference (existing id or new typed name) to an id. */
async function resolveCollectionId(
  supabase: SupabaseClient,
  userId: string,
  collectionId: string | null | undefined,
  newCollection: string | null | undefined
): Promise<string | null> {
  const name = newCollection ? normalizeName(newCollection) : "";
  if (name) {
    const { data } = await supabase
      .from("collections")
      .upsert({ user_id: userId, name }, { onConflict: "user_id,name" })
      .select("id")
      .single();
    return data?.id ?? null;
  }
  return collectionId || null;
}

/** Ensure every used tag exists in the catalog (for the dropdown). */
async function syncTags(
  supabase: SupabaseClient,
  userId: string,
  tags: string[]
) {
  if (!tags.length) return;
  await supabase
    .from("tags")
    .upsert(
      tags.map((name) => ({ user_id: userId, name })),
      { onConflict: "user_id,name", ignoreDuplicates: true }
    );
}

// ---- Create ----------------------------------------------------------------

export async function createLink(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const parsed = createLinkSchema.safeParse({
    url: formData.get("url"),
    title: emptyToNull(formData.get("title")),
    description: emptyToNull(formData.get("description")),
    notes: emptyToNull(formData.get("notes")),
    thumbnail_url: emptyToNull(formData.get("thumbnail_url")),
    provider: (formData.get("provider") as Provider) || undefined,
    embed_html: emptyToNull(formData.get("embed_html")),
    tags: parseTags(formData.get("tags")),
    collection_id: emptyToNull(formData.get("collection_id")),
    new_collection: emptyToNull(formData.get("new_collection")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

  const collection_id = await resolveCollectionId(
    supabase,
    user.id,
    d.collection_id,
    d.new_collection
  );
  await syncTags(supabase, user.id, d.tags);

  const { error } = await supabase.from("items").insert({
    type: "link",
    url: d.url,
    provider: d.provider ?? "generic",
    title: d.title,
    description: d.description,
    notes: d.notes,
    thumbnail_url: d.thumbnail_url || null,
    embed_html: d.embed_html,
    tags: d.tags,
    collection_id,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function createImage(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const imagePath = formData.get("image_path");
  if (typeof imagePath !== "string" || !imagePath) {
    return { error: "Upload failed — no image path" };
  }

  const tags = parseTags(formData.get("tags"));
  const collection_id = await resolveCollectionId(
    supabase,
    user.id,
    emptyToNull(formData.get("collection_id")),
    emptyToNull(formData.get("new_collection"))
  );
  await syncTags(supabase, user.id, tags);

  const { error } = await supabase.from("items").insert({
    type: "image",
    provider: "image",
    image_path: imagePath,
    title: emptyToNull(formData.get("title")),
    notes: emptyToNull(formData.get("notes")),
    tags,
    collection_id,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function updateItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase, user } = await requireUser();

  const parsed = updateItemSchema.safeParse({
    id: formData.get("id"),
    title: emptyToNull(formData.get("title")),
    description: emptyToNull(formData.get("description")),
    notes: emptyToNull(formData.get("notes")),
    tags: parseTags(formData.get("tags")),
    collection_id: emptyToNull(formData.get("collection_id")),
    new_collection: emptyToNull(formData.get("new_collection")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, collection_id, new_collection, ...fields } = parsed.data;

  const resolved = await resolveCollectionId(
    supabase,
    user.id,
    collection_id,
    new_collection
  );
  await syncTags(supabase, user.id, fields.tags);

  const { error } = await supabase
    .from("items")
    .update({
      ...fields,
      collection_id: resolved,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath(`/item/${id}`);
  return { success: true };
}

const IMPORT_CAP = 40;

export async function importLinks(
  _prev: ImportState,
  formData: FormData
): Promise<ImportState> {
  const { supabase, user } = await requireUser();

  const text = formData.get("text");
  if (typeof text !== "string" || !text.trim()) {
    return { error: "Paste some text containing links" };
  }

  const collection_id = await resolveCollectionId(
    supabase,
    user.id,
    emptyToNull(formData.get("collection_id")),
    emptyToNull(formData.get("new_collection"))
  );

  const urls = extractUrls(text);
  if (urls.length === 0) return { error: "No links found in the text" };

  const { data: existing } = await supabase
    .from("items")
    .select("url")
    .in("url", urls);
  const have = new Set((existing ?? []).map((r) => r.url));
  const fresh = urls.filter((u) => !have.has(u)).slice(0, IMPORT_CAP);
  const skipped = urls.length - fresh.length;
  if (fresh.length === 0) return { imported: 0, skipped };

  const rows = await Promise.all(
    fresh.map(async (url) => {
      const p = await fetchPreview(url);
      return {
        type: "link" as const,
        url,
        provider: p.provider,
        title: p.title,
        description: p.description,
        thumbnail_url: p.thumbnailUrl,
        embed_html: p.embedHtml,
        collection_id,
      };
    })
  );

  const { error } = await supabase.from("items").insert(rows);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { imported: rows.length, skipped };
}

// ---- Query (server-side pagination + filtering) ----------------------------

export type QueryFilters = {
  collectionId?: string | null;
  tag?: string | null;
  q?: string;
  favorites?: boolean;
  type?: "all" | "link" | "image";
  page?: number;
};

export async function queryItems(
  filters: QueryFilters
): Promise<{ items: ItemView[]; hasMore: boolean }> {
  const { supabase } = await requireUser();
  const { collectionId, tag, q, favorites, type = "all", page = 0 } = filters;

  let query = supabase.from("items").select("*, collection:collections(name)");

  if (collectionId) query = query.eq("collection_id", collectionId);
  if (tag) query = query.contains("tags", [tag]);
  if (favorites) query = query.eq("is_favorite", true);
  if (type !== "all") query = query.eq("type", type);
  if (q && q.trim()) {
    // Strip characters that would break PostgREST or() syntax.
    const safe = q.trim().replace(/[,()*]/g, " ");
    const like = `%${safe}%`;
    query = query.or(
      `title.ilike.${like},description.ilike.${like},notes.ilike.${like},url.ilike.${like}`
    );
  }

  const from = page * PAGE_SIZE;
  query = query
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const { data, error } = await query;
  if (error) return { items: [], hasMore: false };
  const rows = data ?? [];
  const items = await toItemViews(supabase, rows);
  return { items, hasMore: rows.length === PAGE_SIZE };
}

// ---- Per-item toggles ------------------------------------------------------

export async function toggleFavorite(id: string, value: boolean) {
  const { supabase } = await requireUser();
  await supabase.from("items").update({ is_favorite: value }).eq("id", id);
  revalidatePath(`/item/${id}`);
}

export async function togglePin(id: string, value: boolean) {
  const { supabase } = await requireUser();
  await supabase.from("items").update({ is_pinned: value }).eq("id", id);
  revalidatePath(`/item/${id}`);
}

// ---- Delete ----------------------------------------------------------------

async function removeImages(supabase: SupabaseClient, ids: string[]) {
  const { data } = await supabase
    .from("items")
    .select("image_path")
    .in("id", ids);
  const paths = (data ?? [])
    .map((r) => r.image_path as string | null)
    .filter((p): p is string => Boolean(p));
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}

export async function deleteItem(id: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  await removeImages(supabase, [id]);
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function deleteItems(ids: string[]): Promise<ActionState> {
  if (!ids.length) return { success: true };
  const { supabase } = await requireUser();
  await removeImages(supabase, ids);
  const { error } = await supabase.from("items").delete().in("id", ids);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function moveItemsToCollection(
  ids: string[],
  collectionId: string | null
): Promise<ActionState> {
  if (!ids.length) return { success: true };
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("items")
    .update({ collection_id: collectionId })
    .in("id", ids);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

// ---- Collections catalog ---------------------------------------------------

const STARTER_COLLECTIONS = [
  "kantor",
  "coding",
  "claude",
  "web dev",
  "skill",
  "finance",
  "food",
  "house",
  "cooking",
  "holiday",
];

export async function createCollection(name: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const clean = normalizeName(name);
  if (!clean) return { error: "Name required" };
  const { error } = await supabase
    .from("collections")
    .insert({ user_id: user.id, name: clean });
  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function renameCollection(
  id: string,
  name: string
): Promise<ActionState> {
  const { supabase } = await requireUser();
  const clean = normalizeName(name);
  if (!clean) return { error: "Name required" };
  const { error } = await supabase
    .from("collections")
    .update({ name: clean })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function deleteCollection(id: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  // FK `on delete set null` clears it off any items automatically.
  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function addStarterCollections(): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("collections")
    .upsert(
      STARTER_COLLECTIONS.map((name) => ({ user_id: user.id, name })),
      { onConflict: "user_id,name", ignoreDuplicates: true }
    );
  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

// ---- Tags catalog ----------------------------------------------------------

export async function createTag(name: string): Promise<ActionState> {
  const { supabase, user } = await requireUser();
  const clean = normalizeName(name).toLowerCase();
  if (!clean) return { error: "Name required" };
  const { error } = await supabase
    .from("tags")
    .insert({ user_id: user.id, name: clean });
  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function renameTag(id: string, name: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const next = normalizeName(name).toLowerCase();
  if (!next) return { error: "Name required" };

  const { data: row } = await supabase
    .from("tags")
    .select("name")
    .eq("id", id)
    .single();
  const old = row?.name as string | undefined;

  const { error } = await supabase
    .from("tags")
    .update({ name: next })
    .eq("id", id);
  if (error) return { error: error.message };

  if (old && old !== next) {
    const { data: items } = await supabase
      .from("items")
      .select("id, tags")
      .contains("tags", [old]);
    for (const it of items ?? []) {
      const tags = Array.from(
        new Set((it.tags as string[]).map((t) => (t === old ? next : t)))
      );
      await supabase.from("items").update({ tags }).eq("id", it.id);
    }
  }
  revalidatePath("/");
  return { success: true };
}

export async function deleteTag(id: string): Promise<ActionState> {
  const { supabase } = await requireUser();
  const { data: row } = await supabase
    .from("tags")
    .select("name")
    .eq("id", id)
    .single();
  const name = row?.name as string | undefined;

  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) return { error: error.message };

  if (name) {
    const { data: items } = await supabase
      .from("items")
      .select("id, tags")
      .contains("tags", [name]);
    for (const it of items ?? []) {
      const tags = (it.tags as string[]).filter((t) => t !== name);
      await supabase.from("items").update({ tags }).eq("id", it.id);
    }
  }
  revalidatePath("/");
  return { success: true };
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}
