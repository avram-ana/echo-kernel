# Echo Kernel

A full-stack **mood journal + music diary**: log how you feel, get **three** song suggestions per entry (mood match, dare track, taste-based), rate songs to teach your “for you” picks, and curate **time-of-day greetings** for the home hero.

**Stack:** React (Vite) · Tailwind CSS v4 · Node.js · Express · PostgreSQL · Prisma · JWT (httpOnly cookie)

## Project structure

```
echo-kernel/
├── backend/          # Express API + Prisma
│   ├── prisma/       # schema, migrations, seed
│   └── src/
├── frontend/         # Vite + React + React Router
└── README.md
```

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 14+ (local or Docker)

## 1. Database

Create a database:

```sql
CREATE DATABASE echo_kernel;
```

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET
npm install
npx prisma migrate deploy
# or during development:
# npx prisma migrate dev
npx prisma db seed
npm run dev
```

API runs at **http://localhost:4000** (configurable via `PORT`).

**Login problems after updating the repo:** Run `npx prisma migrate deploy` so the database matches the current Prisma schema, then `npx prisma db seed` so demo users get the latest password hashes (`Demo12345` / `Admin12345`). Skipping migrations can cause API errors or failed logins.

### Environment variables (`backend/.env`)

| Variable        | Description                          |
|----------------|--------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string         |
| `JWT_SECRET`   | Long random string for signing JWTs  |
| `PORT`         | API port (default `4000`)            |
| `CLIENT_ORIGIN`| CORS origin (default `http://localhost:5173`) |

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5173**. The Vite dev server **proxies** `/api` to the backend, so auth cookies work on the same host/port as the UI.

### Production API URL

If you build the frontend separately from the API, set:

```env
VITE_API_URL=https://your-api.example.com
```

See `frontend/.env.example`.

## 4. Run both (optional)

From repo root after installing root deps once:

```bash
npm install
npm run install:all
npm run dev
```

(Root `package.json` uses `concurrently` to run backend + frontend.)

## Demo accounts (after seed)

| Role  | Email                 | Password    |
|-------|------------------------|------------|
| User  | `demo@echokernel.app`  | `Demo12345` |
| Admin | `admin@echokernel.app` | `Admin12345` |

- **Admin** is redirected to **`/admin`** after login.
- **Users** use the main app under **`/app/*`** with bottom navigation.

## Features implemented

- **Auth:** sign up, login, logout, bcrypt password hashes, JWT in **httpOnly** cookie
- **Roles:** `user` / `admin` with protected API routes and UI gates
- **Mood log:** text, emoji, color, score 1–10 → persists **3** `song_recommendations` per mood
- **Recommendation engine:** seeded `songs` table + modular service (`recommendation.service.ts`) with comments for **Spotify / Last.fm / YouTube** integration later
- **Soundtrack:** chronological moods + three cards each (with explanation labels)
- **Rate:** pending + history; ratings influence **taste_based** picks
- **Analytics:** totals, averages, genre inference, mood bars, top emojis/colors
- **Greeting gallery:** CRUD by time-of-day; home picks a random greeting for the current window
- **Admin:** list/delete users, filter/search/delete greetings, per-user counts
- **UI:** glassmorphism, lime/pastel atmosphere, bottom nav, loading/empty states, delete confirmations

## API overview

| Method | Path | Notes |
|--------|------|--------|
| POST | `/api/auth/register` | Creates `user` role |
| POST | `/api/auth/login` | Sets cookie |
| POST | `/api/auth/logout` | Clears cookie |
| GET | `/api/auth/me` | Current user |
| GET | `/api/home/summary` | Greeting + dashboard stats |
| POST | `/api/moods` | Create mood + recommendations |
| GET | `/api/moods?search=` | Soundtrack list |
| GET | `/api/ratings/pending` | Unrated recommendations |
| GET | `/api/ratings/history` | Past ratings |
| POST | `/api/ratings` | Upsert rating |
| GET/POST/DELETE | `/api/greetings` | User greetings |
| GET | `/api/analytics` | User insights |
| GET/DELETE | `/api/admin/users` | Admin |
| GET/DELETE | `/api/admin/greetings` | Admin |

## Extending music sources

See **`backend/src/modules/recommendations/recommendation.service.ts`**: replace `loadSongs()` and selection helpers with API clients that map external results into the same shape (`title`, `artist`, `genre`, `energy`, tags, `externalUrl`).

## Name

**Echo Kernel** keeps the sci‑fi journal vibe; alternatives you might like: **Glasswave**, **Mood Orbit**, **Limestatic**.

## License

MIT (feel free to use for learning or shipping).
