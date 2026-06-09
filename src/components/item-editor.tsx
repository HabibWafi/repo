"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Check } from "lucide-react";
import { updateItem, deleteItem, type ActionState } from "@/lib/actions";
import type { ItemView } from "@/lib/types";
import { Button, Input, Label, Textarea } from "./ui";

const empty: ActionState = {};

export function ItemEditor({ item }: { item: ItemView }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateItem, empty);
  const [deleting, setDeleting] = useState(false);
  const saved = state.success === true;

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  async function onDelete() {
    if (!confirm("Delete this item permanently?")) return;
    setDeleting(true);
    await deleteItem(item.id);
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

      <div>
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={item.tags.join(", ")}
          placeholder="learning, design"
        />
      </div>

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

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

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
