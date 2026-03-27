import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -left-20 top-20 h-64 w-64 rounded-full bg-lime-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-32 h-72 w-72 rounded-full bg-emerald-300/50 blur-3xl" />

      <div className="relative mx-auto max-w-lg pt-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-emerald-900/55">
          music diary · mood journal
        </p>
        <h1 className="mt-4 text-center font-[family-name:var(--font-display)] text-4xl font-extrabold leading-tight sm:text-5xl animate-hero-line">
          <span className="text-gradient">Echo Kernel</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-center text-base text-slate-800/85 animate-hero-line-delay">
          Log how you feel. Get three tracks: one that mirrors you, one that dares you, and one that learns
          what you love.
        </p>

        <div className="mt-10 space-y-4">
          <div className="glass-strong rounded-[2rem] p-6 animate-floaty">
            <p className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
              Your mood becomes a soundtrack.
            </p>
            <p className="mt-2 text-sm text-slate-800/80">
              Soft glass panels, neon-lime dreams, and a journal that remembers your taste.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/register"
            className="rounded-full bg-emerald-900 px-8 py-3 text-center text-sm font-bold text-lime-100 shadow-lg shadow-emerald-900/20"
          >
            Start journaling
          </Link>
          <Link
            to="/login"
            className="rounded-full glass px-8 py-3 text-center text-sm font-bold text-slate-900"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </div>
  );
}
