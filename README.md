# Archive — Personal Asset Vault

A private, single-user web app to archive the links and screenshots you want to
keep — YouTube, TikTok, Instagram, articles, and images — instead of losing them
in your own WhatsApp chat. Built to be simple, elegant, mobile-first, and easy to
extend.

## Features

- 🔐 **Private** — email + password login, sign-ups disabled, optional owner-lock
- 🔗 **Auto previews** — paste a link and the title + thumbnail are fetched
  automatically (YouTube & TikTok reliably; Instagram degrades gracefully)
- 🖼️ **Image archive** — upload screenshots/photos to private storage
- 🏷️ **Organize** — tags, collections/folders, instant search, per-item notes, favorites
- 📥 **Bulk import** — paste a WhatsApp chat export (or any text) and every link is
  detected, previewed, and saved; duplicates are skipped
- 📱 **Mobile-first** — bottom-sheet add flow, thumb-reachable FAB, installable PWA
- 🌗 **Dark mode** — light / dark / system toggle, persisted, no flash on load
- 📤 **Share target** — share a link from the YouTube/TikTok/Instagram app straight
  into the archive
- 🧩 **Built to grow** — unified schema + provider dispatcher + `metadata` JSONB

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase
(Postgres + Storage + Auth) · deployed on Vercel.

## One-time setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) and copy the
   **Project URL** and **anon public key** (Settings → API).
2. Open the **SQL Editor** and run [`supabase/migrations/000_init.sql`](supabase/migrations/000_init.sql).
   This creates the `items` table, indexes, RLS policies, the private `archive`
   storage bucket, and its storage policies.
3. **Disable sign-ups:** Authentication → Sign In / Providers → turn **off**
   "Allow new users to sign up" (keep the Email provider enabled).
4. **Create your account:** Authentication → Users → **Add user** → set your
   email + password. Copy your user's **UUID**.

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OWNER_USER_ID=...   # your user UUID (optional but recommended)
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000> and sign in with the account you created.

## Deploy to Vercel

Finish the Supabase setup above first (you need the URL + anon key), then:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FHabibWafi%2Frepo&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,OWNER_USER_ID&envDescription=Supabase%20project%20URL%2C%20anon%20public%20key%2C%20and%20your%20user%20UUID&project-name=archive&repository-name=archive)

The button clones the repo, prompts for the three environment variables, and
deploys. Or do it manually:

1. **Import Project** in Vercel from this GitHub repo.
2. Add the env vars (all environments) in Project Settings → Environment Variables:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OWNER_USER_ID`.
3. In Supabase → Authentication → URL Configuration, add your Vercel
   production and preview URLs.
4. Deploy. (No extra build config needed — it's a standard Next.js app.)

> Note: deploying requires **your** Vercel + Supabase accounts, so this step is
> yours to click through — everything in the repo is already deploy-ready.

## Notes & limitations

- **Instagram** rich previews are not reliable — Meta retired the keyless
  oEmbed (Apr 2025) and blocks datacenter scraping. The app stores a clean
  title and lets you edit it or attach a screenshot.
- **TikTok** previews work but may occasionally rate-limit serverless IPs;
  failures fall back to an editable item.
- Images are stored in a **private** bucket and served via short-lived signed
  URLs, so they are never publicly accessible.
