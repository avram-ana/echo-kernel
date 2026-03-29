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

### Environment variables (`backend/.env`)

| Variable        | Description                          |
|----------------|--------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string         |
| `JWT_SECRET`   | Long random string for signing JWTs  |
| `PORT`         | API port (default `4000`)            |
| `CLIENT_ORIGIN`| CORS origin (default `http://localhost:5173`) |

(Root `package.json` uses `concurrently` to run backend + frontend.)

## Features implemented

- **Auth:** sign up, login, logout, bcrypt password hashes, JWT in **httpOnly** cookie
- **Roles:** `user` / `admin` with protected API routes and UI gates
- **Mood log:** text, emoji, color, score 1–10 → persists **3** `song_recommendations` per mood
- **Soundtrack:** chronological moods + three cards each (with explanation labels)
- **Rate:** pending + history; ratings influence **taste_based** picks
- **Analytics:** totals, averages, genre inference, mood bars, top emojis/colors
- **Greeting gallery:** CRUD by time-of-day; home picks a random greeting for the current window
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
