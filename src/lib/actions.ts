"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  createLinkSchema,
  parseTags,
  updateItemSchema,
  type Provider,
} from "@/lib/types";

const BUCKET = "archive";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export type ActionState = { error?: string; success?: boolean };

/** Create a link item from the add form (preview fields included). */
export async function createLink(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase } = await requireUser();

  const parsed = createLinkSchema.safeParse({
    url: formData.get("url"),
    title: emptyToNull(formData.get("title")),
    description: emptyToNull(formData.get("description")),
    notes: emptyToNull(formData.get("notes")),
    thumbnail_url: emptyToNull(formData.get("thumbnail_url")),
    provider: (formData.get("provider") as Provider) || undefined,
    embed_html: emptyToNull(formData.get("embed_html")),
    tags: parseTags(formData.get("tags")),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const d = parsed.data;

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
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

/** Create an image item after a direct-to-Storage upload has completed. */
export async function createImage(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase } = await requireUser();

  const imagePath = formData.get("image_path");
  if (typeof imagePath !== "string" || !imagePath) {
    return { error: "Upload failed — no image path" };
  }

  const { error } = await supabase.from("items").insert({
    type: "image",
    provider: "image",
    image_path: imagePath,
    title: emptyToNull(formData.get("title")),
    notes: emptyToNull(formData.get("notes")),
    tags: parseTags(formData.get("tags")),
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  return { success: true };
}

export async function updateItem(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const { supabase } = await requireUser();

  const parsed = updateItemSchema.safeParse({
    id: formData.get("id"),
    title: emptyToNull(formData.get("title")),
    description: emptyToNull(formData.get("description")),
    notes: emptyToNull(formData.get("notes")),
    tags: parseTags(formData.get("tags")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, ...fields } = parsed.data;

  const { error } = await supabase
    .from("items")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath(`/item/${id}`);
  return { success: true };
}

export async function toggleFavorite(id: string, value: boolean) {
  const { supabase } = await requireUser();
  await supabase.from("items").update({ is_favorite: value }).eq("id", id);
  revalidatePath("/");
  revalidatePath(`/item/${id}`);
}

export async function deleteItem(id: string) {
  const { supabase } = await requireUser();

  // Remove the stored image file too, if any.
  const { data: item } = await supabase
    .from("items")
    .select("image_path")
    .eq("id", id)
    .single();
  if (item?.image_path) {
    await supabase.storage.from(BUCKET).remove([item.image_path]);
  }

  await supabase.from("items").delete().eq("id", id);
  revalidatePath("/");
  redirect("/");
}

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}
