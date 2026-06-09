"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Check,
  Download,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button, Input } from "./ui";
import { cn } from "@/lib/utils";
import {
  createCollection,
  renameCollection,
  deleteCollection,
  addStarterCollections,
  createTag,
  renameTag,
  deleteTag,
  type ActionState,
} from "@/lib/actions";
import type { Collection, Tag } from "@/lib/types";

export function ManageSheet({
  open,
  onClose,
  collections,
  tags,
}: {
  open: boolean;
  onClose: () => void;
  collections: Collection[];
  tags: Tag[];
}) {
  const [tab, setTab] = useState<"collections" | "tags">("collections");

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Manage</h2>
          <div className="flex items-center gap-1">
            <a
              href="/api/export"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-surface-muted"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Backup</span>
            </a>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-1.5 text-muted hover:bg-surface-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 px-5 pt-4">
          <Tab active={tab === "collections"} onClick={() => setTab("collections")}>
            Collections
          </Tab>
          <Tab active={tab === "tags"} onClick={() => setTab("tags")}>
            Tags
          </Tab>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {tab === "collections" ? (
            <CatalogList
              items={collections}
              noun="collection"
              addPlaceholder="New collection name"
              onAdd={(n) => createCollection(n)}
              onRename={(id, n) => renameCollection(id, n)}
              onDelete={(id) => deleteCollection(id)}
              showStarter={collections.length === 0}
            />
          ) : (
            <CatalogList
              items={tags}
              noun="tag"
              addPlaceholder="New tag name"
              onAdd={(n) => createTag(n)}
              onRename={(id, n) => renameTag(id, n)}
              onDelete={(id) => deleteTag(id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Tab({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl py-2.5 text-sm font-medium transition",
        active ? "bg-accent text-accent-foreground" : "bg-surface-muted text-muted"
      )}
    >
      {children}
    </button>
  );
}

function CatalogList({
  items,
  noun,
  addPlaceholder,
  onAdd,
  onRename,
  onDelete,
  showStarter = false,
}: {
  items: (Collection | Tag)[];
  noun: string;
  addPlaceholder: string;
  onAdd: (name: string) => Promise<ActionState>;
  onRename: (id: string, name: string) => Promise<ActionState>;
  onDelete: (id: string) => Promise<ActionState>;
  showStarter?: boolean;
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [pending, start] = useTransition();

  function run(fn: () => Promise<ActionState>, ok: string, after?: () => void) {
    start(async () => {
      const r = await fn();
      if (r?.error) toast.error(r.error);
      else {
        toast.success(ok);
        after?.();
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Add */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newName.trim()) run(() => onAdd(newName), `Added ${noun}`, () => setNewName(""));
        }}
        className="flex gap-2"
      >
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={addPlaceholder}
        />
        <Button type="submit" size="icon" disabled={pending || !newName.trim()} aria-label={`Add ${noun}`}>
          <Plus className="h-5 w-5" />
        </Button>
      </form>

      {showStarter && (
        <Button
          type="button"
          variant="secondary"
          onClick={() => run(() => addStarterCollections(), "Starter collections added")}
          disabled={pending}
        >
          <Sparkles className="h-4 w-4" /> Add starter collections
        </Button>
      )}

      {/* List */}
      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {items.length === 0 && !showStarter && (
          <li className="px-3 py-6 text-center text-sm text-muted">
            No {noun}s yet.
          </li>
        )}
        {items.map((it) => (
          <li key={it.id} className="flex items-center gap-2 px-3 py-2">
            {editingId === it.id ? (
              <>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-9"
                  autoFocus
                />
                <button
                  type="button"
                  aria-label="Save"
                  disabled={pending}
                  onClick={() =>
                    run(() => onRename(it.id, editName), `Renamed ${noun}`, () =>
                      setEditingId(null)
                    )
                  }
                  className="rounded-lg p-2 text-accent hover:bg-surface-muted"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  aria-label="Cancel"
                  onClick={() => setEditingId(null)}
                  className="rounded-lg p-2 text-muted hover:bg-surface-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 truncate text-sm">
                  {noun === "tag" ? `#${it.name}` : it.name}
                </span>
                {it.count !== undefined && (
                  <span className="text-xs text-muted">{it.count}</span>
                )}
                <button
                  type="button"
                  aria-label={`Rename ${noun}`}
                  onClick={() => {
                    setEditingId(it.id);
                    setEditName(it.name);
                  }}
                  className="rounded-lg p-2 text-muted hover:bg-surface-muted"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${noun}`}
                  onClick={() => {
                    if (confirm(`Delete ${noun} "${it.name}"?`))
                      run(() => onDelete(it.id), `Deleted ${noun}`);
                  }}
                  className="rounded-lg p-2 text-muted hover:bg-surface-muted hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
