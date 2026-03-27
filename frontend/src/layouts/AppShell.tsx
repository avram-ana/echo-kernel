import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import { UserAvatar } from "../components/UserAvatar";
import { useAuth } from "../context/AuthContext";

export function AppShell() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-30 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="mx-auto flex max-w-2xl items-center justify-between rounded-3xl glass px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar user={user ?? undefined} size="lg" className="ring-emerald-900/10" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-900/60">Echo Kernel</p>
              <p className="truncate font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
                Hi, {user?.displayName?.trim() || user?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/app/settings"
              className="rounded-full bg-white/45 px-3 py-1.5 text-xs font-semibold text-slate-800 ring-1 ring-white/50"
            >
              Settings
            </Link>
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="rounded-full bg-emerald-900/90 px-3 py-1.5 text-xs font-semibold text-lime-100 shadow"
              >
                Console
              </Link>
            )}
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-full bg-white/40 px-3 py-1.5 text-xs font-semibold text-slate-800"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 pt-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
