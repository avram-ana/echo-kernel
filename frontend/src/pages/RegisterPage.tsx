import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "../components/GlassCard";
import { Spinner } from "../components/Spinner";

export function RegisterPage() {
  const nav = useNavigate();
  const { user, loading: authLoading, setUser, refresh } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [genres, setGenres] = useState("");
  const [artists, setArtists] = useState("");
  const [intent, setIntent] = useState({
    comfort: false,
    energy: false,
    distraction: false,
  });

  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/app/home"} replace />;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (step === 1) {
      setStep(2);
      return;
    }
    setSubmitting(true);
    try {
      const fg = genres
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const fa = artists
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const { user: u } = await api.register({
        username,
        email,
        password,
        favoriteGenres: fg.length ? fg : undefined,
        favoriteArtists: fa.length ? fa : undefined,
        musicIntent: intent,
      });
      setUser(u);
      await refresh();
      nav("/app/home", { replace: true });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Could not register");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-dvh px-4 py-10 animate-auth-in">
      <div className="mx-auto max-w-md">
        <Link to="/" className="text-sm font-medium text-emerald-900/70 hover:underline">
          ← Back
        </Link>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-bold text-slate-900 animate-hero-line">
          Create your echo
        </h1>
        <p className="mt-2 text-sm text-slate-800/80 animate-hero-line-delay">
          A soft place to track moods and music.
        </p>

        <GlassCard className="mt-8" strong>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            {step === 1 && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Username</label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400/60"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    minLength={2}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Email</label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400/60"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Password (10+ chars, upper, lower, number)
                  </label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400/60"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={10}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-emerald-900 py-3 text-sm font-bold text-lime-100"
                >
                  Next: music taste
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm text-slate-800/90">Tell us what you love — you can change this later.</p>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Favorite genres (comma-separated)</label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-3 text-sm"
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    placeholder="indie, R&B, ambient…"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Favorite artists</label>
                  <input
                    className="mt-1 w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-3 text-sm"
                    value={artists}
                    onChange={(e) => setArtists(e.target.value)}
                    placeholder="names separated by commas"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">What do you want from music?</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">
                    {(
                      [
                        ["comfort", "Comfort"],
                        ["energy", "Energy"],
                        ["distraction", "Distraction"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={intent[key]}
                          onChange={(e) => setIntent((i) => ({ ...i, [key]: e.target.checked }))}
                          className="rounded border-slate-400"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-full glass py-3 text-sm font-bold text-slate-900"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-full bg-emerald-900 py-3 text-sm font-bold text-lime-100 disabled:opacity-60"
                  >
                    {submitting ? "Creating…" : "Create account"}
                  </button>
                </div>
              </>
            )}

            {err && <p className="text-sm text-rose-700">{err}</p>}
          </form>
        </GlassCard>

        <p className="mt-6 text-center text-sm text-slate-800/80">
          Already journaling?{" "}
          <Link className="font-semibold text-emerald-900 underline" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
