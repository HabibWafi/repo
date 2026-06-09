import type { PreviewResult } from "@/lib/types";

interface YouTubeOEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
}

/** Extract the 11-char video id from common YouTube URL shapes. */
function videoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1) || null;
    if (u.searchParams.get("v")) return u.searchParams.get("v");
    const m = u.pathname.match(/\/(shorts|embed|live)\/([\w-]{11})/);
    if (m) return m[2];
    return null;
  } catch {
    return null;
  }
}

/** YouTube has a reliable, keyless oEmbed endpoint. */
export async function fetchYouTube(
  url: string,
  signal: AbortSignal
): Promise<PreviewResult> {
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    url
  )}&format=json`;

  const res = await fetch(endpoint, { signal });
  if (!res.ok) throw new Error(`YouTube oEmbed ${res.status}`);
  const data = (await res.json()) as YouTubeOEmbed;

  // Prefer a high-res thumbnail derived from the id when available.
  const id = videoId(url);
  const thumb = id
    ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    : data.thumbnail_url ?? null;

  return {
    provider: "youtube",
    title: data.title ?? null,
    description: null,
    thumbnailUrl: thumb,
    author: data.author_name ?? null,
    embedHtml: data.html ?? null,
  };
}
