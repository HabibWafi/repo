import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchPreview } from "@/lib/metadata";
import { previewRequestSchema } from "@/lib/types";

// Scraping + HTML parsing needs the Node.js runtime, not Edge.
export const runtime = "nodejs";

export async function POST(request: Request) {
  // Require an authenticated user — this is a private app.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = previewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid URL" },
      { status: 400 }
    );
  }

  const preview = await fetchPreview(parsed.data.url);
  return NextResponse.json(preview);
}
