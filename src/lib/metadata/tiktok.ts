import type { PreviewResult } from "@/lib/types";

interface TikTokOEmbed {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  html?: string;
}

/**
 * TikTok exposes a keyless oEmbed endpoint. Note the returned
 * `thumbnail_url` has no file extension — render it as-is.
 */
export async function fetchTikTok(
  url: string,
  signal: AbortSignal
): Promise<PreviewResult> {
  const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(
    url
  )}`;

  const res = await fetch(endpoint, {
    signal,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    },
  });
  if (!res.ok) throw new Error(`TikTok oEmbed ${res.status}`);
  const data = (await res.json()) as TikTokOEmbed;

  return {
    provider: "tiktok",
    title: data.title ?? null,
    description: null,
    thumbnailUrl: data.thumbnail_url ?? null,
    author: data.author_name ?? null,
    embedHtml: data.html ?? null,
  };
}
