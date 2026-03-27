import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Mood } from "../types";
import { GlassCard } from "../components/GlassCard";
import { Spinner } from "../components/Spinner";
import { SaveToPlaylist } from "../components/SaveToPlaylist";

const typeLabel: Record<string, string> = {
  mood_match: "Mood match",
  dare: "Dare track",
  taste_based: "For you",
};

export function SoundtrackPage() {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      void (async () => {
        try {
          setLoading(true);
          const list = await api.moods(search.trim() || undefined);
          if (alive) {
            setMoods(list as Mood[]);
            setErr(null);
          }
        } catch (e) {
          if (alive) setErr(e instanceof Error ? e.message : "Failed to load");
        } finally {
          if (alive) setLoading(false);
        }
      })();
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [search]);

  return (
    <div className="space-y-4 pb-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
          Soundtrack
        </h1>
        <p className="mt-1 text-sm text-slate-800/80">Your moods, chronologically, with their three echoes.</p>
      </div>

      <input
        className="w-full rounded-full border border-white/50 bg-white/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400/60"
        placeholder="Search your journal…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}
      {err && <p className="text-sm text-rose-700">{err}</p>}

      {!loading && !moods.length && (
        <GlassCard>
          <p className="text-sm text-slate-800/85">
            Empty stage — log a mood and we’ll print three song cards beneath it.
          </p>
        </GlassCard>
      )}

      <div className="space-y-5">
        {moods.map((m) => (
          <GlassCard key={m.id} strong className="space-y-4">
            <div className="flex gap-3">
              <div
                className="h-16 w-16 shrink-0 rounded-2xl border border-white/50"
                style={{ background: m.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-xs text-slate-600">
                    {new Date(m.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-900/90">{m.description}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-900/70">Mood score {m.moodScore}/10</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[...m.recommendations]
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((r) => (
                  <div key={r.id} className="rounded-2xl bg-white/35 p-3 ring-1 ring-white/40">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-900/55">
                      {typeLabel[r.recommendationType] ?? r.recommendationType}
                    </p>
                    <p className="mt-1 text-xs italic text-slate-700/90">“{r.explanationLabel}”</p>
                    <p className="mt-2 font-[family-name:var(--font-display)] text-sm font-bold text-slate-900">
                      {r.title}
                    </p>
                    <p className="text-xs text-slate-700/90">{r.artist}</p>
                    {r.genre && <p className="mt-1 text-[10px] text-slate-600">{r.genre}</p>}
                    {r.externalUrl && (
                      <a
                        href={r.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs font-semibold text-emerald-900 underline"
                      >
                        Preview / search
                      </a>
                    )}
                    <SaveToPlaylist songRecommendationId={r.id} />
                  </div>
                ))}
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
