# Smart Bookmark App

A real-time bookmark manager built with **Next.js (App Router)**, **Supabase** (Auth, Database, Realtime), and **Tailwind CSS**.

## Live Demo

🔗 [Live URL on Vercel](#) *(update after deployment)*

## Features

- **Google OAuth** — Sign up and log in with Google (no email/password)
- **Add Bookmarks** — Save any URL with a custom title
- **Private Bookmarks** — Each user can only see their own bookmarks (enforced by RLS)
- **Real-time Sync** — Bookmarks update instantly across tabs without page refresh
- **Delete Bookmarks** — Remove bookmarks you no longer need
- **Premium UI** — Dark theme with glassmorphism, gradient accents, and smooth animations

## Tech Stack

| Layer        | Technology                     |
| ------------ | ------------------------------ |
| Framework    | Next.js 15 (App Router)       |
| Auth         | Supabase Auth (Google OAuth)   |
| Database     | Supabase (PostgreSQL)          |
| Realtime     | Supabase Realtime              |
| Styling      | Tailwind CSS + custom CSS      |
| Deployment   | Vercel                         |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google Cloud](https://console.cloud.google.com) OAuth 2.0 Client ID

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd assignment2
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase-setup.sql`
3. Go to **Authentication → Providers → Google** and enable it:
   - Add your Google Client ID and Client Secret
   - Set the redirect URL to `https://<your-vercel-url>/auth/callback`

### 3. Configure environment variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push the repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
4. Deploy!
5. Update the **Google OAuth redirect URL** in both Google Cloud Console and Supabase to include your Vercel URL: `https://<your-vercel-domain>/auth/callback`

## Problems Encountered & Solutions

### 1. Supabase Auth cookies in Server Components
**Problem:** Supabase auth tokens need to be read/written via cookies in App Router server components, but the cookie API is async in Next.js 15.  
**Solution:** Used `@supabase/ssr` with the recommended cookie handler pattern, awaiting `cookies()` in the server client.

### 2. Real-time not updating after adding a bookmark
**Problem:** When adding a bookmark, the real-time subscription would sometimes create a duplicate entry.  
**Solution:** Implemented an optimistic update pattern — the bookmark is added to state immediately after the insert, and the real-time handler checks for duplicates before adding.

### 3. Middleware session refresh
**Problem:** Without middleware, the auth session could expire between page navigations, causing unexpected logouts.  
**Solution:** Implemented middleware that refreshes the Supabase session on every request, following the official Supabase + Next.js guide.

### 4. Row Level Security blocking inserts
**Problem:** Initial RLS policies didn't include `user_id` in the insert check, causing permission errors.  
**Solution:** Added a `WITH CHECK` clause to the insert policy that verifies `auth.uid() = user_id`.

## Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── callback/route.ts   # OAuth callback handler
│   │   └── signout/route.ts    # Sign-out handler
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard (server component)
│   ├── globals.css             # Theme & animations
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── components/
│   ├── BookmarkCard.tsx        # Single bookmark card
│   └── BookmarkDashboard.tsx   # Main dashboard (client component)
├── lib/
│   └── supabase/
│       ├── client.ts           # Browser Supabase client
│       └── server.ts           # Server Supabase client
└── middleware.ts               # Auth middleware
```
