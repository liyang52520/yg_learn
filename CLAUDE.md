# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm run dev` (localhost:3000)
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Prisma generate:** `npx prisma generate` (after schema changes)
- **Prisma push schema:** `npx prisma db push` (dev DB)
- **Seed DB:** `npx tsx prisma/seed.ts`
- **Docker:** `docker compose -f docker/docker-compose.yml up -d`
- **Type check:** rely on `tsc` via `npm run build`

## Architecture

### Stack
- **Next.js 16** App Router with TypeScript, styled via Tailwind CSS
- **SQLite** database, Prisma ORM with LibSQL adapter
- **NextAuth v5** with credentials provider (email/password), bcryptjs hashing, JWT sessions
- **TipTap** rich text editor (admin article/question content), Markdown-style tables allowed
- **Recharts** for stats charts, **highlight.js/lowlight** for code highlighting in articles
- **Adm-Zip** for backup/export system, **DOMpurify** for XSS sanitization in quiz answer display

### Prisma client
- Generated to `src/generated/prisma/` (not `node_modules/.prisma` configured via `prisma.config.ts`)
- Import with `@/generated/prisma/client`
- Singleton pattern in `src/lib/prisma.ts`

### Route structure (Next.js App Router)

| Route Group | Pages |
|-------------|-------|
| `(auth)` | `/login`, `/register` |
| `(main)` | `/learn`, `/quiz`, `/stats`, `/profile` — shared Navbar layout |
| `admin` | `/admin/articles`, `/admin/questions`, `/admin/backup`, `/admin/users` |
| `api` | All API routes, guarded by middleware authentication |

- `(main)` routes require login (enforced in `src/middleware.ts`)
- Auth pages redirect to `/` if already logged in
- Admin routes require `role === "ADMIN"`

### Layout hierarchy
- **Root** (`app/layout.tsx`) — Geist font, `<AuthProvider>` wrapping
- **Main** (`(main)/layout.tsx`) — Navbar, flex column
- **Learn** (`(main)/learn/layout.tsx`) — Sidebar with article categories + scrollable content
- **Quiz** (`(main)/quiz/layout.tsx`) — Sidebar with quiz navigation + scrollable content

### Features

**Learning (articles):** Browse article categories, read content with scroll-progress bar, text selection highlighting with notes, image lightbox, table of contents sidebar, code copy buttons, font size controls.

**Quiz (spaced repetition):** SM-2 algorithm (`src/lib/sm2.ts`) tracks ease factor, interval, and next review date per question per user. Questions are self-graded on a 0-5 scale. New questions are picked daily up to user's configurable limit (default 5). Rate-limited to one submission per question per day (429 response). Bookmark and add notes to questions.

**Stats:** Daily calendar heatmap, memory curve chart (shows review distribution vs predicted forgetting), aggregate stats cards (total learned, streak, accuracy). Daily records tracked via `api/daily-record`.

**Admin:** Full CRUD for articles, questions, and categories via TipTap editor. ZIP-based backup/restore that includes uploaded images. User management (enable/disable, change daily limit).

### Key API patterns
- All API routes check `auth()` from `@/lib/auth`, return 401 if unauthorized
- User ID is `Number(session.user.id)` since SQLite uses Int IDs
- Paginated admin endpoints use `page`, `pageSize` query params
- Prisma is imported as singleton from `@/lib/prisma`

### Database models
- **User** — email/password (bcrypt), role (USER/ADMIN), daily limit
- **Question/Article** — rich HTML content/answer, status (draft/published), category FK
- **UserQuestionProgress** — SM-2 fields (ease, interval, repetitions, nextReviewDate), unique per user+question, rate-limited per day
- **ArticleHighlight** — text selection offsets per article per user, with optional note
- **DailyRecord** — per-user per-day aggregate (learned, reviewed, correct counts)
- **Bookmark/QuestionNote** — user-scoped favorites and notes on questions
