import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { GlassCard } from "../components/GlassCard";
import { Spinner } from "../components/Spinner";

export function AnalyticsPage() {
  const [d, setD] = useState<Awaited<ReturnType<typeof api.analytics>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setD(await api.analytics());
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed");
      }
    })();
  }, []);

  if (err) return <p className="text-sm text-rose-700">{err}</p>;
  if (!d) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const maxTrend = Math.max(1, ...d.moodTrend.map((t) => t.score));

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-800/80">Soft data, loud feelings.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <GlassCard>
          <p className="text-[10px] font-bold uppercase text-emerald-900/50">Moods</p>
          <p className="mt-1 text-2xl font-bold">{d.totalMoods}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-[10px] font-bold uppercase text-emerald-900/50">Rated songs</p>
          <p className="mt-1 text-2xl font-bold">{d.totalSongsRated}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-[10px] font-bold uppercase text-emerald-900/50">Avg mood</p>
          <p className="mt-1 text-2xl font-bold">
            {d.averageMoodScore != null ? d.averageMoodScore.toFixed(1) : "—"}
          </p>
        </GlassCard>
      </div>

      <GlassCard strong>
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-900/55">Favorite genres</p>
        <p className="mt-1 text-xs text-slate-700/85">Inferred from what you rate highly.</p>
        <ul className="mt-3 space-y-2">
          {d.favoriteGenres.length === 0 && (
            <li className="text-sm text-slate-700/85">Rate a few songs to see this bloom.</li>
          )}
          {d.favoriteGenres.map((g) => (
            <li key={g.genre} className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-900">{g.genre}</span>
              <span className="text-xs text-slate-600">
                avg {g.avgRating.toFixed(1)} · {g.count}×
              </span>
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard>
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-900/55">Mood trend</p>
        <div className="mt-4 flex h-32 items-end gap-1">
          {d.moodTrend.slice(-24).map((t, i) => (
            <div
              key={`${t.date}-${i}`}
              className="flex-1 rounded-t-md bg-emerald-600/70"
              style={{ height: `${(t.score / maxTrend) * 100}%`, minHeight: "4px" }}
              title={`${new Date(t.date).toLocaleDateString()}: ${t.score}`}
            />
          ))}
        </div>
        {d.moodTrend.length === 0 && (
          <p className="mt-3 text-sm text-slate-700/85">Log moods to see the skyline grow.</p>
        )}
      </GlassCard>

      <div className="grid gap-3 sm:grid-cols-2">
        <GlassCard>
          <p className="text-xs font-bold uppercase text-emerald-900/55">Top emojis</p>
          <ul className="mt-2 space-y-1 text-sm">
            {d.topEmojis.map((x) => (
              <li key={x.emoji} className="flex justify-between">
                <span>{x.emoji}</span>
                <span className="text-slate-600">{x.count}</span>
              </li>
            ))}
            {!d.topEmojis.length && <li className="text-slate-600">—</li>}
          </ul>
        </GlassCard>
        <GlassCard>
          <p className="text-xs font-bold uppercase text-emerald-900/55">Mood colors</p>
          <ul className="mt-2 space-y-2 text-sm">
            {d.topColors.map((x) => (
              <li key={x.color} className="flex items-center justify-between gap-2">
                <span
                  className="h-6 w-6 rounded-lg border border-white/50"
                  style={{ background: x.color }}
                />
                <span className="flex-1 truncate font-mono text-xs">{x.color}</span>
                <span className="text-slate-600">{x.count}</span>
              </li>
            ))}
            {!d.topColors.length && <li className="text-slate-600">—</li>}
          </ul>
        </GlassCard>
      </div>
    </div>
  );
}
