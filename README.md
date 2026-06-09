<div align="center">

# 🗂️ Archive — Personal Knowledge & Asset Vault

**Stop losing the good stuff in your own chat.** Archive is a private, single-user
web app to capture links and screenshots from YouTube, TikTok, Instagram, articles —
anything worth keeping — and organize them into collections so they stay **saved,
searchable, and easy to revisit**. A calm home for the knowledge you collect.

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres_·_Storage_·_Auth-3FCF8E?logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

</div>

---

## 💡 The problem

We all hoard links — a tutorial here, a recipe there, an inspiring reel — by sending
them to our own WhatsApp or letting browser tabs pile up. They’re *saved*, but never
**organized**, so when you actually need one, it’s gone. Archive turns that scattered
stream into a tidy, private knowledge base: capture fast, file it into a collection,
find it instantly later.

## ✨ Features

- 🔐 **Private by design** — email + password login, public sign-ups disabled, optional owner-lock
- 🔗 **Automatic previews** — paste a link and the title + thumbnail are fetched for you
  (YouTube & TikTok reliably; graceful fallback elsewhere)
- 🖼️ **Image archive** — upload screenshots/photos to private, signed-URL storage
- 🗂️ **Collections (folders)** — the primary way to organize; browse from a sidebar with live counts
- 🏷️ **Tags, search & favorites** — fast filtering, full-text-ish search, star what matters
- 📌 **Pin to top** — keep important items front and center
- ✅ **Bulk actions** — multi-select to delete or move items between collections
- 📥 **Bulk import** — paste a WhatsApp chat export (or any text); every link is detected,
  previewed, and saved, skipping duplicates
- 💾 **Export / backup** — download your whole archive as JSON anytime
- 🌗 **Dark mode** — light/dark toggle, persisted, no flash on load
- 📤 **Share target** — share a link from the YouTube/TikTok/Instagram app straight into Archive
- 📱 **Mobile-first PWA** — installable, thumb-friendly, bottom-sheet add flow
- 🔔 **Inline toasts** — clear feedback on every save, delete, and update

## 🧰 Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router, Server Actions) |
| Language | **TypeScript** (strict) |
| UI | **Tailwind CSS v4**, hand-built components, **lucide-react**, **sonner** toasts |
| Backend | **Supabase** — Postgres + Storage + Auth |
| Auth | `@supabase/ssr` (cookie-based SSR sessions) |
| Validation | **zod** |
| Hosting | **Vercel** |

## 🏗️ Architecture

- **Auth gate** via the Next.js `proxy` convention + Supabase SSR; every table is protected
  by **Row-Level Security** keyed to `auth.uid()` (defense in depth for a single-user app).
- **Server Actions** for all mutations (create/update/delete, pin/favorite, catalog CRUD),
  with **server-side pagination** (`range`) so the grid scales to thousands of items.
- **Per-provider preview dispatcher** (`src/lib/metadata/*`) — keyless oEmbed for YouTube /
  TikTok, Open Graph scraping fallback, never blocks saving.
- **Direct browser → Storage uploads** (bypassing Vercel’s 4.5 MB body limit); private files
  render via short-lived **signed URLs**.
- **Unified `items` table** with `collections`/`tags` catalogs + a `metadata` JSONB column,
  so new asset types slot in without migrations.

## 🖼️ Screenshots

> _Add your own captures here once deployed:_
>
> | Archive (light) | Collection view | Dark mode |
> |---|---|---|
> | `docs/light.png` | `docs/collection.png` | `docs/dark.png` |

## 🚀 Getting started

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com); copy the **Project URL** and
   **anon/publishable key** (Settings → API).
2. In the **SQL Editor**, run both migrations in order:
   [`supabase/migrations/000_init.sql`](supabase/migrations/000_init.sql) then
   [`supabase/migrations/001_collections_tags_pins.sql`](supabase/migrations/001_collections_tags_pins.sql).
3. **Authentication → disable “Allow new users to sign up.”**
4. **Authentication → Users → Add user** (your email + password, auto-confirm); copy its UUID.

### 2. Environment variables

Copy `.env.example` → `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OWNER_USER_ID=...        # your user UUID (optional owner-lock)
```

### 3. Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

## ☁️ Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FHabibWafi%2Frepo&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,OWNER_USER_ID&envDescription=Supabase%20project%20URL%2C%20anon%20public%20key%2C%20and%20your%20user%20UUID&project-name=archive&repository-name=archive)

Import the repo into Vercel, add the three environment variables, and deploy. Run the SQL
migrations on your Supabase project first (or right after). It’s a standard Next.js app —
no extra build config needed.

## ⚠️ Limitations & roadmap

- **Instagram** rich previews aren’t reliable — Meta retired keyless oEmbed and blocks
  datacenter scraping; Archive falls back to an editable title + optional screenshot.
- **TikTok** previews can occasionally rate-limit serverless IPs → soft-fails to an editable item.
- Roadmap ideas: drag-reorder, browser extension capture, full-text Postgres search, and
  optional multi-user mode (the schema already carries `user_id` everywhere).

## 📄 License

[MIT](LICENSE) — built as a personal project & portfolio piece.
