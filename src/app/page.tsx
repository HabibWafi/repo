import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toItemViews, PAGE_SIZE } from "@/lib/items";
import { Header } from "@/components/header";
import { ArchiveView } from "@/components/archive-view";
import type { Collection, Tag } from "@/lib/types";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string }>;
}) {
  const { add } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // First page of items (pinned first, then newest).
  const { data: itemRows } = await supabase
    .from("items")
    .select("*, collection:collections(name)")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .range(0, PAGE_SIZE - 1);
  const initialItems = await toItemViews(supabase, itemRows ?? []);
  const initialHasMore = (itemRows?.length ?? 0) === PAGE_SIZE;

  // Catalogs + counts (light select of just the columns we tally).
  const [{ data: collectionRows }, { data: tagRows }, { data: countRows }] =
    await Promise.all([
      supabase.from("collections").select("id, name").order("name"),
      supabase.from("tags").select("id, name").order("name"),
      supabase.from("items").select("collection_id, tags"),
    ]);

  const collCount = new Map<string, number>();
  const tagCount = new Map<string, number>();
  for (const r of countRows ?? []) {
    if (r.collection_id)
      collCount.set(r.collection_id, (collCount.get(r.collection_id) ?? 0) + 1);
    for (const t of (r.tags as string[] | null) ?? [])
      tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  }

  const collections: Collection[] = (collectionRows ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    count: collCount.get(c.id as string) ?? 0,
  }));
  const tags: Tag[] = (tagRows ?? []).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    count: tagCount.get(t.name as string) ?? 0,
  }));

  return (
    <div className="min-h-full">
      <Header />
      <ArchiveView
        initialItems={initialItems}
        initialHasMore={initialHasMore}
        collections={collections}
        tags={tags}
        userId={user.id}
        initialUrl={add ?? null}
      />
    </div>
  );
}
