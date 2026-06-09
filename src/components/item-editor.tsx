"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2, Check } from "lucide-react";
import {
  updateItem,
  deleteItem,
  type ActionState,
} from "@/lib/actions";
import type { Collection, ItemView, Tag } from "@/lib/types";
import { Button, Input, Label, Textarea } from "./ui";
import { CollectionCombo, TagCombo } from "./combobox";

const empty: ActionState = {};

export function ItemEditor({
  item,
  collections,
  tags,
}: {
  item: ItemView;
  collections: Collection[];
  tags: Tag[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateItem, empty);
  const [deleting, setDeleting] = useState(false);
  const saved = state.success === true;

  useEffect(() => {
    if (state.success) {
      toast.success("Changes saved");
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  async function onDelete() {
    if (!confirm("Delete this item permanently?")) return;
    setDeleting(true);
    const r = await deleteItem(item.id);
    if (r.error) {
      toast.error(r.error);
      setDeleting(false);
      return;
    }
    toast.success("Item deleted");
    router.push("/");
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={item.id} />

      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={item.title ?? ""} />
      </div>

      {item.type === "link" && (
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={item.description ?? ""}
          />
        </div>
      )}

      <TagCombo tags={tags} defaultTags={item.tags} />
      <CollectionCombo
        collections={collections}
        defaultName={item.collection_name ?? ""}
      />

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={item.notes ?? ""}
          placeholder="Why are you saving this?"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : null}
          {saved ? "Saved" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onDelete}
          disabled={deleting}
          className="text-danger"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Delete
        </Button>
      </div>
    </form>
  );
}
