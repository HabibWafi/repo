import { parse } from "node-html-parser";
import type { PreviewResult, Provider } from "@/lib/types";
import { hostnameOf } from "@/lib/utils";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/**
 * Best-effort Open Graph scraper. Works for most blogs/news/articles;
 * gracefully degrades to a hostname title for JS-only or bot-blocked sites.
 */
export async function fetchGeneric(
  url: string,
  signal: AbortSignal,
  provider: Provider = "generic"
): Promise<PreviewResult> {
  const fallback: PreviewResult = {
    provider,
    title: hostnameOf(url),
    description: null,
    thumbnailUrl: null,
    author: null,
    embedHtml: null,
  };

  try {
    const res = await fetch(url, {
      signal,
      redirect: "follow",
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
    });
    if (!res.ok) return fallback;

    const html = await res.text();
    const root = parse(html);

    const meta = (key: string, attr: "property" | "name" = "property") =>
      root
        .querySelector(`meta[${attr}="${key}"]`)
        ?.getAttribute("content")
        ?.trim() || null;

    const title =
      meta("og:title") ||
      meta("twitter:title", "name") ||
      root.querySelector("title")?.text?.trim() ||
      hostnameOf(url);

    const description =
      meta("og:description") || meta("description", "name") || null;

    const thumbnailUrl =
      meta("og:image") ||
      meta("og:image:url") ||
      meta("twitter:image", "name") ||
      null;

    return {
      provider,
      title,
      description,
      thumbnailUrl: thumbnailUrl ? absolutize(thumbnailUrl, url) : null,
      author: meta("og:site_name") || null,
      embedHtml: null,
    };
  } catch {
    return fallback;
  }
}

/** Resolve protocol-relative or root-relative image URLs against the page. */
function absolutize(src: string, base: string): string {
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
}
