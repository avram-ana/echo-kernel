import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "../components/GlassCard";
import { Spinner } from "../components/Spinner";

export function LoginPage() {
  const nav = useNavigate();
  const { user, loading: authLoading, setUser, refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    setSubmitting(true);
    try {
      const { user: u } = await api.login({ email, password });
      setUser(u);
      await refresh();
      nav(u.role === "admin" ? "/admin" : "/app/home", { replace: true });
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Login failed");
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
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-slate-800/80 animate-hero-line-delay">
          Your mood becomes a soundtrack — pick up where you left off.
        </p>

        <GlassCard className="mt-8" strong>
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
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
              <label className="text-xs font-semibold text-slate-700">Password</label>
              <input
                className="mt-1 w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-400/60"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {err && <p className="text-sm text-rose-700">{err}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-emerald-900 py-3 text-sm font-bold text-lime-100 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </GlassCard>

        <p className="mt-6 text-center text-sm text-slate-800/80">
          New here?{" "}
          <Link className="font-semibold text-emerald-900 underline" to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
