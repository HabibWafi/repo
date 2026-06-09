import { redirect } from "next/navigation";

/** Find the first http(s) URL across the shared fields. */
function extractUrl(parts: Array<string | undefined>): string | null {
  const re = /https?:\/\/[^\s]+/i;
  for (const p of parts) {
    if (!p) continue;
    const m = p.match(re);
    if (m) return m[0];
  }
  return null;
}

/**
 * PWA Web Share Target handler. The OS share sheet sends the shared content
 * here (title/text/url); we pull out the link and hand off to the add flow.
 */
export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; text?: string; url?: string }>;
}) {
  const { title, text, url } = await searchParams;
  const found = extractUrl([url, text, title]);
  redirect(found ? `/?add=${encodeURIComponent(found)}` : "/");
}
