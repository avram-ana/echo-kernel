import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Greeting, TimeOfDay } from "../types";
import { GlassCard } from "../components/GlassCard";
import { ConfirmModal } from "../components/ConfirmModal";
import { Spinner } from "../components/Spinner";

const CATS: { id: TimeOfDay; label: string }[] = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "night", label: "Night" },
];

export function GalleryPage() {
  const [filter, setFilter] = useState<TimeOfDay | "all">("all");
  const [search, setSearch] = useState("");
  const [list, setList] = useState<Greeting[]>([]);
  const [content, setContent] = useState("");
  const [cat, setCat] = useState<TimeOfDay>("morning");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api.greetings({
        timeOfDay: filter === "all" ? undefined : filter,
        search: search.trim() || undefined,
      });
      setList(data as Greeting[]);
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => void load(), 200);
    return () => clearTimeout(t);
  }, [filter, search]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createGreeting({ content, timeOfDay: cat });
      setContent("");
      await load();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not add");
    }
  }

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
          Greeting gallery
        </h1>
        <p className="mt-1 text-sm text-slate-800/80">
          Phrases for each slice of the day — home rotates within the current window.
        </p>
      </div>

      <GlassCard strong>
        <form onSubmit={(e) => void add(e)} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">New greeting</label>
            <textarea
              className="mt-1 min-h-[72px] w-full rounded-2xl border border-white/50 bg-white/40 px-3 py-2 text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  cat === c.id ? "bg-emerald-900 text-lime-100" : "bg-white/40 text-slate-800"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-emerald-900 py-2.5 text-xs font-bold text-lime-100"
          >
            Add to gallery
          </button>
        </form>
      </GlassCard>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            filter === "all" ? "bg-white/70" : "bg-white/30"
          }`}
        >
          All
        </button>
        {CATS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === c.id ? "bg-white/70" : "bg-white/30"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <input
        className="w-full rounded-full border border-white/50 bg-white/40 px-4 py-3 text-sm"
        placeholder="Search greetings…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {err && <p className="text-sm text-rose-700">{err}</p>}
      {loading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      <div className="space-y-2">
        {!loading &&
          !list.length &&
          !err && (
            <GlassCard>
              <p className="text-sm text-slate-800/85">No greetings match — add your first line.</p>
            </GlassCard>
          )}
        {list.map((g) => (
          <GlassCard key={g.id} className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase text-emerald-900/50">{g.timeOfDay}</p>
              <p className="mt-1 text-sm text-slate-900/90">{g.content}</p>
            </div>
            <button
              type="button"
              onClick={() => setDelId(g.id)}
              className="shrink-0 rounded-full bg-white/50 px-3 py-1 text-xs font-semibold text-rose-800"
            >
              Remove
            </button>
          </GlassCard>
        ))}
      </div>

      <ConfirmModal
        open={!!delId}
        title="Remove this greeting?"
        onClose={() => setDelId(null)}
        onConfirm={() => delId && void api.deleteGreeting(delId).then(() => load())}
        danger
        confirmLabel="Remove"
      >
        This line won’t appear in your rotation anymore.
      </ConfirmModal>
    </div>
  );
}
