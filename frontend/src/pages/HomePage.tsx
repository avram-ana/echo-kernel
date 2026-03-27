import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { GlassCard } from "../components/GlassCard";
import { Spinner } from "../components/Spinner";

export function HomePage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.homeSummary>> | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const d = await api.homeSummary();
        if (alive) setData(d);
      } catch (e) {
        if (alive) setErr(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (err) {
    return <p className="text-sm text-rose-700">{err}</p>;
  }
  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const label =
    data.timeOfDay === "morning"
      ? "Morning"
      : data.timeOfDay === "afternoon"
        ? "Afternoon"
        : data.timeOfDay === "evening"
          ? "Evening"
          : "Night";

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] glass-strong px-6 py-8 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-900/55">{label}</p>
        <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-extrabold leading-tight text-slate-900">
          {data.greeting}
        </h2>
        <p className="mt-3 text-sm text-slate-800/80">
          Your greetings live in the{" "}
          <Link to="/app/gallery" className="font-semibold text-emerald-900 underline">
            Gallery
          </Link>
          . We pick one that matches this moment of day.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-900/50">Weekly vibe</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
            {data.weeklyAvgMoodScore != null ? data.weeklyAvgMoodScore.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-slate-700/80">Avg mood (7 days)</p>
        </GlassCard>
        <GlassCard>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-900/50">Soundtrack</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
            {data.soundtrackSongCount}
          </p>
          <p className="text-xs text-slate-700/80">Songs suggested</p>
        </GlassCard>
      </div>

      <GlassCard strong>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-900/50">
              Latest mood
            </p>
            {data.latestMood ? (
              <>
                <p className="mt-2 text-2xl">{data.latestMood.emoji}</p>
                <p className="mt-1 line-clamp-3 text-sm text-slate-800/90">{data.latestMood.description}</p>
                <p className="mt-2 text-xs text-slate-600">
                  Score {data.latestMood.moodScore}/10 ·{" "}
                  {new Date(data.latestMood.createdAt).toLocaleString()}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-700/90">
                No moods yet — your first entry unlocks three tracks tailored to you.
              </p>
            )}
          </div>
          <div
            className="h-14 w-14 shrink-0 rounded-2xl border border-white/50 shadow-inner"
            style={{ background: data.latestMood?.color || "#d9f99d" }}
            title="Mood color"
          />
        </div>
        <Link
          to="/app/log"
          className="mt-4 inline-flex rounded-full bg-emerald-900 px-5 py-2 text-xs font-bold text-lime-100"
        >
          Log how you feel
        </Link>
      </GlassCard>
    </div>
  );
}
