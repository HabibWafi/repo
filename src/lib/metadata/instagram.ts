import type { PreviewResult } from "@/lib/types";
import { fetchGeneric } from "./generic";

/**
 * Instagram rich previews are NOT reliable: Meta retired the keyless
 * oEmbed (Apr 2025) and datacenter Open Graph scraping is usually blocked
 * by a login wall. We try generic OG anyway, then degrade to a clean
 * URL-derived title so the user can edit it / attach a screenshot.
 */
export async function fetchInstagram(
  url: string,
  signal: AbortSignal
): Promise<PreviewResult> {
  const result = await fetchGeneric(url, signal, "instagram");

  // If scraping yielded nothing useful, build a friendly fallback title.
  if (!result.thumbnailUrl && (!result.title || result.title.includes("/"))) {
    return {
      provider: "instagram",
      title: deriveTitle(url),
      description: null,
      thumbnailUrl: null,
      author: handleFrom(url),
      embedHtml: null,
    };
  }

  return { ...result, provider: "instagram" };
}

function handleFrom(url: string): string | null {
  try {
    const seg = new URL(url).pathname.split("/").filter(Boolean);
    // /<handle>/... but skip content types like reel/p/tv
    if (seg.length && !["reel", "p", "tv", "reels"].includes(seg[0])) {
      return `@${seg[0]}`;
    }
    return null;
  } catch {
    return null;
  }
}

function deriveTitle(url: string): string {
  const handle = handleFrom(url);
  if (handle) return `Instagram post by ${handle}`;
  return "Instagram post";
}
