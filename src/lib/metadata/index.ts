import type { PreviewResult, Provider } from "@/lib/types";
import { hostnameOf } from "@/lib/utils";
import { fetchYouTube } from "./youtube";
import { fetchTikTok } from "./tiktok";
import { fetchInstagram } from "./instagram";
import { fetchGeneric } from "./generic";

/** Detect the provider from a URL's hostname. */
export function detectProvider(url: string): Provider {
  const host = hostnameOf(url).toLowerCase();
  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be")
    return "youtube";
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "tiktok";
  if (host === "instagram.com" || host.endsWith(".instagram.com"))
    return "instagram";
  return "generic";
}

/**
 * Fetch a normalized preview for any URL. A provider failure NEVER throws —
 * it always returns a partial, editable result so item creation can proceed.
 */
export async function fetchPreview(url: string): Promise<PreviewResult> {
  const provider = detectProvider(url);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    switch (provider) {
      case "youtube":
        return await fetchYouTube(url, controller.signal);
      case "tiktok":
        return await fetchTikTok(url, controller.signal);
      case "instagram":
        return await fetchInstagram(url, controller.signal);
      default:
        return await fetchGeneric(url, controller.signal);
    }
  } catch {
    // Soft failure: return a minimal editable preview.
    return {
      provider,
      title: hostnameOf(url),
      description: null,
      thumbnailUrl: null,
      author: null,
      embedHtml: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}
