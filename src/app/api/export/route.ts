import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Download the full archive (items + catalogs) as a JSON backup. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: items }, { data: collections }, { data: tags }] =
    await Promise.all([
      supabase
        .from("items")
        .select("*, collection:collections(name)")
        .order("created_at", { ascending: false }),
      supabase.from("collections").select("name, created_at").order("name"),
      supabase.from("tags").select("name").order("name"),
    ]);

  const payload = {
    app: "Archive",
    exported_at: new Date().toISOString(),
    counts: {
      items: items?.length ?? 0,
      collections: collections?.length ?? 0,
      tags: tags?.length ?? 0,
    },
    collections: collections ?? [],
    tags: tags ?? [],
    items: items ?? [],
  };

  const filename = `archive-backup-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
