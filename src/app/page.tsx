import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/header";
import { ArchiveView } from "@/components/archive-view";
import type { Item, ItemView } from "@/lib/types";

const BUCKET = "archive";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false });

  const items = (data ?? []) as Item[];

  // Sign URLs for stored images so private files render in <img>.
  const imagePaths = items
    .filter((i) => i.type === "image" && i.image_path)
    .map((i) => i.image_path as string);

  const signedMap = new Map<string, string>();
  if (imagePaths.length) {
    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(imagePaths, 60 * 60);
    for (const s of signed ?? []) {
      if (s.signedUrl && s.path) signedMap.set(s.path, s.signedUrl);
    }
  }

  const views: ItemView[] = items.map((i) => ({
    ...i,
    displayThumb:
      i.type === "image" && i.image_path
        ? signedMap.get(i.image_path) ?? null
        : i.thumbnail_url,
  }));

  return (
    <div className="min-h-full">
      <Header />
      <ArchiveView items={views} userId={user.id} />
    </div>
  );
}
