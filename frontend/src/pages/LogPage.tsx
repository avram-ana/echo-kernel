import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { GlassCard } from "../components/GlassCard";

const EMOJI_PRESETS = [
  "🐦‍🔥",
  "🎸",
  "💫",
  "💢",
  "🥀",
  "💔",
  "💥",
  "🎧",
  "🪇",
  "🩷",
  "💅🏻",
  "🫏",
];

export function LogPage() {
  const nav = useNavigate();
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("🐦‍🔥");
  const [color, setColor] = useState("#bef264");
  const [moodScore, setMoodScore] = useState(6);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await api.createMood({ description, emoji, color, moodScore });
      nav("/app/soundtrack", { replace: false });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5 pb-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
          Mood log
        </h1>
        <p className="mt-1 text-sm text-slate-800/80">
          Be honest — we’ll mirror it, challenge it, and learn your taste.
        </p>
      </div>

      <GlassCard strong>
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-slate-700">How are you feeling?</label>
            <textarea
              className="mt-1 min-h-[100px] w-full resize-y rounded-2xl border border-white/50 bg-white/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400/60"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Soft, loud, scattered, glowing…"
              required
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-700">Emoji</p>
            <p className="mt-1 text-[11px] text-slate-600/90">
              Each emoji is part of your mood signal — together with your words, color, and energy, it steers the three
              picks on the next screen.
            </p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {EMOJI_PRESETS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setEmoji(em)}
                  className={`rounded-2xl px-3 py-2 text-xl ${
                    emoji === em ? "bg-white/70 ring-2 ring-emerald-500/50" : "bg-white/30"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
            <input
              className="mt-2 w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-2 text-sm"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={10}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="text-xs font-semibold text-slate-700">Mood color</p>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="mt-2 h-12 w-20 cursor-pointer rounded-xl border border-white/50 bg-transparent"
              />
            </div>
            <div className="min-w-[180px] flex-1">
              <p className="text-xs font-semibold text-slate-700">Energy / intensity (1–10)</p>
              <input
                type="range"
                min={1}
                max={10}
                value={moodScore}
                onChange={(e) => setMoodScore(Number(e.target.value))}
                className="mt-3 w-full accent-emerald-700"
              />
              <p className="text-center text-sm font-bold text-slate-900">{moodScore}</p>
            </div>
          </div>

          {err && <p className="text-sm text-rose-700">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-emerald-900 py-3 text-sm font-bold text-lime-100 disabled:opacity-60"
          >
            {loading ? "Saving & generating tracks…" : "Save mood & get 3 songs"}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}
