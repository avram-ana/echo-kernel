import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { GlassCard } from "../components/GlassCard";
import { ConfirmModal } from "../components/ConfirmModal";
import { Spinner } from "../components/Spinner";
import type { TimeOfDay } from "../types";

type AdminUser = Awaited<ReturnType<typeof api.adminUsers>>[number];
type AdminGreeting = Awaited<ReturnType<typeof api.adminGreetings>>[number];

const CATS: (TimeOfDay | "all")[] = ["all", "morning", "afternoon", "evening", "night"];

export function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [greetings, setGreetings] = useState<AdminGreeting[]>([]);
  const [gCat, setGCat] = useState<(typeof CATS)[number]>("all");
  const [gUser, setGUser] = useState("");
  const [gSearch, setGSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [delUser, setDelUser] = useState<string | null>(null);
  const [delGreeting, setDelGreeting] = useState<string | null>(null);

  async function loadUsers() {
    const u = await api.adminUsers();
    setUsers(u);
  }

  async function loadGreetings() {
    const g = await api.adminGreetings({
      timeOfDay: gCat === "all" ? undefined : gCat,
      userId: gUser.trim() || undefined,
      search: gSearch.trim() || undefined,
    });
    setGreetings(g);
  }

  async function loadAll() {
    setLoading(true);
    try {
      await Promise.all([loadUsers(), loadGreetings()]);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadGreetings().catch((e) => setErr(e instanceof Error ? e.message : "Failed"));
    }, 250);
    return () => clearTimeout(t);
  }, [gCat, gUser, gSearch]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-dvh px-4 py-8 pb-16">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-900/55">Admin</p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
              Echo Kernel console
            </h1>
          </div>
          <Link
            to="/app/home"
            className="rounded-full bg-white/50 px-4 py-2 text-xs font-bold text-slate-900"
          >
            Open app
          </Link>
        </div>

        {err && <p className="text-sm text-rose-700">{err}</p>}

        <GlassCard strong>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Users</h2>
          <p className="mt-1 text-xs text-slate-700/85">Mood logs, ratings, and greetings per account.</p>
          <ul className="mt-4 space-y-2">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/35 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {u.username}{" "}
                    <span className="text-xs font-normal text-slate-600">({u.role})</span>
                  </p>
                  <p className="text-xs text-slate-600">{u.email}</p>
                  <p className="text-[10px] text-slate-500">
                    moods {u._count.moods} · rated {u._count.songRatings} · greetings{" "}
                    {u._count.greetings}
                  </p>
                </div>
                {u.role === "admin" ? (
                  <span className="rounded-full bg-slate-200/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    Protected
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDelUser(u.id)}
                    className="rounded-full bg-rose-500/90 px-3 py-1 text-xs font-bold text-white"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Greetings</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setGCat(c)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  gCat === c ? "bg-emerald-900 text-lime-100" : "bg-white/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <input
            className="mt-3 w-full rounded-2xl border border-white/50 bg-white/40 px-3 py-2 text-sm"
            placeholder="Filter by user id…"
            value={gUser}
            onChange={(e) => setGUser(e.target.value)}
          />
          <input
            className="mt-2 w-full rounded-2xl border border-white/50 bg-white/40 px-3 py-2 text-sm"
            placeholder="Search content…"
            value={gSearch}
            onChange={(e) => setGSearch(e.target.value)}
          />
          <ul className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
            {greetings.map((g) => (
              <li key={g.id} className="rounded-2xl bg-white/35 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-emerald-900/50">
                      {g.timeOfDay} · {g.user.username}
                    </p>
                    <p className="text-sm text-slate-900/90">{g.content}</p>
                    <p className="text-[10px] text-slate-500">{g.user.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDelGreeting(g.id)}
                    className="shrink-0 text-xs font-bold text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <ConfirmModal
        open={!!delUser}
        title="Delete user?"
        danger
        onClose={() => setDelUser(null)}
        onConfirm={() =>
          delUser &&
          void api.adminDeleteUser(delUser).then(() => {
            void loadUsers();
          })
        }
      >
        This removes their moods, ratings, and greetings.
      </ConfirmModal>

      <ConfirmModal
        open={!!delGreeting}
        title="Delete greeting?"
        danger
        onClose={() => setDelGreeting(null)}
        onConfirm={() =>
          delGreeting &&
          void api.adminDeleteGreeting(delGreeting).then(() => {
            void loadGreetings();
          })
        }
      />
    </div>
  );
}
