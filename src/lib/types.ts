import { z } from "zod";

/** The kinds of providers we can detect / archive. Open for extension. */
export const PROVIDERS = [
  "youtube",
  "tiktok",
  "instagram",
  "generic",
  "image",
] as const;
export type Provider = (typeof PROVIDERS)[number];

export type ItemType = "link" | "image";

/** A single archived asset (link or image). Mirrors the `items` table. */
export interface Item {
  id: string;
  user_id: string;
  type: ItemType;
  url: string | null;
  provider: Provider;
  title: string | null;
  description: string | null;
  notes: string | null;
  thumbnail_url: string | null;
  image_path: string | null;
  tags: string[];
  collection_id: string | null;
  is_favorite: boolean;
  is_pinned: boolean;
  embed_html: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** A collection (folder) from the catalog. */
export interface Collection {
  id: string;
  name: string;
  count?: number;
}

/** A tag from the catalog. */
export interface Tag {
  id: string;
  name: string;
  count?: number;
}

/** An item enriched for rendering: signed thumbnail + resolved collection name. */
export type ItemView = Item & {
  displayThumb: string | null;
  collection_name: string | null;
};

/** Normalized preview returned by /api/preview. */
export interface PreviewResult {
  provider: Provider;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  author: string | null;
  embedHtml: string | null;
}

// ---- Validation schemas ----

export const urlSchema = z.string().trim().url("Please enter a valid URL");

export const previewRequestSchema = z.object({
  url: urlSchema,
});

/** Tags arrive as a comma-separated string from the form; normalize them. */
export function parseTags(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

// Collection comes in as either an existing id or a new free-typed name.
const collectionRefSchema = {
  collection_id: z.string().uuid().optional().nullable().or(z.literal("")),
  new_collection: z.string().trim().max(120).optional().nullable(),
};

export const createLinkSchema = z.object({
  url: urlSchema,
  title: z.string().trim().max(300).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  thumbnail_url: z.string().trim().url().optional().nullable().or(z.literal("")),
  provider: z.enum(PROVIDERS).optional(),
  embed_html: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  ...collectionRefSchema,
});

export const updateItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().max(300).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  tags: z.array(z.string()).default([]),
  ...collectionRefSchema,
});

/** Normalize a free-typed name (tag or collection) for storage/matching. */
export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** Extract unique http(s) URLs from arbitrary pasted text (e.g. a WhatsApp export). */
export function extractUrls(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s<>"')]+/gi) ?? [];
  const cleaned = matches.map((u) => u.replace(/[.,;:]+$/, ""));
  return Array.from(new Set(cleaned));
}
