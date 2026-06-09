"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  X,
  Link2,
  ImagePlus,
  RefreshCw,
  ListPlus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  createLink,
  createImage,
  importLinks,
  type ActionState,
  type ImportState,
} from "@/lib/actions";
import type { PreviewResult } from "@/lib/types";
import { PROVIDER_META } from "@/lib/providers";
import { Button, Input, Label, Textarea } from "./ui";
import { cn } from "@/lib/utils";

const empty: ActionState = {};
const emptyImport: ImportState = {};
const COLLECTIONS_LIST_ID = "collection-suggestions";

/** Shared collection input with autocomplete from existing collections. */
function CollectionField({
  id,
  defaultValue = "",
}: {
  id: string;
  defaultValue?: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>Collection (optional)</Label>
      <Input
        id={id}
        name="collection"
        list={COLLECTIONS_LIST_ID}
        placeholder="e.g. Web dev, Recipes, Inspiration"
        defaultValue={defaultValue}
      />
    </div>
  );
}

export function AddSheet({
  open,
  onClose,
  userId,
  initialUrl = null,
  collections = [],
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  initialUrl?: string | null;
  collections?: string[];
}) {
  const [tab, setTab] = useState<"link" | "image" | "import">("link");

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Add to archive</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted hover:bg-surface-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-5 pt-4">
          <TabButton active={tab === "link"} onClick={() => setTab("link")}>
            <Link2 className="h-4 w-4" /> Link
          </TabButton>
          <TabButton active={tab === "image"} onClick={() => setTab("image")}>
            <ImagePlus className="h-4 w-4" /> Image
          </TabButton>
          <TabButton active={tab === "import"} onClick={() => setTab("import")}>
            <ListPlus className="h-4 w-4" /> Import
          </TabButton>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {tab === "link" && <LinkForm onDone={onClose} initialUrl={initialUrl} />}
          {tab === "image" && <ImageForm onDone={onClose} userId={userId} />}
          {tab === "import" && <ImportForm />}
        </div>
      </div>

      {/* Shared autocomplete source for collection fields. */}
      <datalist id={COLLECTIONS_LIST_ID}>
        {collections.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </div>
  );
}

function TabButton({
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
        "inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition",
        active
          ? "bg-accent text-accent-foreground"
          : "bg-surface-muted text-muted"
      )}
    >
      {children}
    </button>
  );
}

// ---- Link form ----

function LinkForm({
  onDone,
  initialUrl = null,
}: {
  onDone: () => void;
  initialUrl?: string | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createLink, empty);
  const [url, setUrl] = useState(initialUrl ?? "");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [fetching, setFetching] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onDone();
    }
  }, [state.success, router, onDone]);

  const loadPreview = useCallback(async (value: string) => {
    const u = value.trim();
    if (!u) return;
    setFetching(true);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      if (res.ok) {
        const data: PreviewResult = await res.json();
        setPreview(data);
        setTitle(data.title ?? "");
      }
    } finally {
      setFetching(false);
    }
  }, []);

  // When opened via a share/?add= link, fetch the preview automatically.
  // Deferred so the network kickoff isn't a synchronous effect side effect.
  useEffect(() => {
    if (!initialUrl) return;
    const t = setTimeout(() => loadPreview(initialUrl), 0);
    return () => clearTimeout(t);
  }, [initialUrl, loadPreview]);

  const meta = preview ? PROVIDER_META[preview.provider] : null;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="url">URL</Label>
        <div className="flex gap-2">
          <Input
            id="url"
            name="url"
            type="url"
            inputMode="url"
            placeholder="Paste a YouTube, TikTok, Instagram or any link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => loadPreview(url)}
            required
            autoFocus
          />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => loadPreview(url)}
            disabled={fetching || !url.trim()}
            aria-label="Fetch preview"
          >
            {fetching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {preview && (
        <div className="flex gap-3 rounded-xl border border-border bg-surface-muted p-3">
          <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-border">
            {preview.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.thumbnailUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : meta ? (
              <div className="flex h-full w-full items-center justify-center">
                <meta.Icon
                  className="h-6 w-6"
                  style={{ color: meta.color }}
                />
              </div>
            ) : null}
          </div>
          <div className="min-w-0 text-xs text-muted">
            <span className="font-medium" style={{ color: meta?.color }}>
              {meta?.label}
            </span>
            {preview.author && <p className="truncate">{preview.author}</p>}
            {preview.provider === "instagram" && !preview.thumbnailUrl && (
              <p className="mt-1 text-[11px] leading-snug">
                Instagram previews are limited — edit the title or add a
                screenshot.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hidden fields carry the fetched preview into the action. */}
      <input type="hidden" name="provider" value={preview?.provider ?? ""} />
      <input
        type="hidden"
        name="thumbnail_url"
        value={preview?.thumbnailUrl ?? ""}
      />
      <input
        type="hidden"
        name="description"
        value={preview?.description ?? ""}
      />
      <input type="hidden" name="embed_html" value={preview?.embedHtml ?? ""} />

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="Give it a name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input id="tags" name="tags" placeholder="learning, design, coding" />
      </div>

      <CollectionField id="collection" />

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Why are you saving this?"
        />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save link
      </Button>
    </form>
  );
}

// ---- Image form ----

function ImageForm({
  onDone,
  userId,
}: {
  onDone: () => void;
  userId: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("Choose an image first");
      return;
    }
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("archive")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (upErr) {
      setError(upErr.message);
      setBusy(false);
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.set("image_path", path);
    const result = await createImage({}, fd);

    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <Label>Screenshot or photo</Label>
        <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-border bg-surface-muted text-muted transition hover:border-accent">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-contain"
            />
          ) : (
            <>
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm">Tap to choose an image</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPick}
          />
        </label>
      </div>

      <div>
        <Label htmlFor="img-title">Title</Label>
        <Input id="img-title" name="title" placeholder="Give it a name" />
      </div>

      <div>
        <Label htmlFor="img-tags">Tags (comma separated)</Label>
        <Input id="img-tags" name="tags" placeholder="reference, ui, idea" />
      </div>

      <CollectionField id="img-collection" />

      <div>
        <Label htmlFor="img-notes">Notes</Label>
        <Textarea
          id="img-notes"
          name="notes"
          rows={3}
          placeholder="Add a note"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        Save image
      </Button>
    </form>
  );
}

// ---- Import form (bulk paste, e.g. a WhatsApp export) ----

function ImportForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(importLinks, emptyImport);

  useEffect(() => {
    if (state.imported && state.imported > 0) router.refresh();
  }, [state.imported, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Paste any text containing links — for example, export a WhatsApp chat
        (⋮ → More → Export chat → Without media) and paste it here. Every link
        is detected, previewed, and saved. Duplicates are skipped.
      </p>

      <div>
        <Label htmlFor="import-text">Text with links</Label>
        <Textarea
          id="import-text"
          name="text"
          rows={7}
          placeholder="Paste your chat export or a list of links…"
          required
          autoFocus
        />
      </div>

      <CollectionField id="import-collection" />

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.imported !== undefined && !state.error && (
        <p className="text-sm" style={{ color: "var(--accent)" }}>
          Imported {state.imported} link{state.imported === 1 ? "" : "s"}
          {state.skipped ? ` · skipped ${state.skipped} duplicate(s)` : ""}.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? "Importing…" : "Import links"}
      </Button>
    </form>
  );
}
