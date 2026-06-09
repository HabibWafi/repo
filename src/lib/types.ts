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
  is_favorite: boolean;
  embed_html: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** An item enriched with a ready-to-render thumbnail URL (signed for images). */
export type ItemView = Item & { displayThumb: string | null };

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

export const createLinkSchema = z.object({
  url: urlSchema,
  title: z.string().trim().max(300).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  thumbnail_url: z.string().trim().url().optional().nullable().or(z.literal("")),
  provider: z.enum(PROVIDERS).optional(),
  embed_html: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
});

export const updateItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().max(300).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  notes: z.string().trim().max(5000).optional().nullable(),
  tags: z.array(z.string()).default([]),
});
