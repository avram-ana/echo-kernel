import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const baseItems = [
  { to: "/app/home", label: "Home", icon: "⌂" },
  { to: "/app/log", label: "Log", icon: "✎" },
  { to: "/app/soundtrack", label: "Tracks", icon: "♪" },
  { to: "/app/rate", label: "Rate", icon: "★" },
  { to: "/app/analytics", label: "Stats", icon: "◎" },
  { to: "/app/gallery", label: "Gallery", icon: "✦" },
  { to: "/app/settings", label: "You", icon: "◉" },
] as const;

export function BottomNav() {
  const { user } = useAuth();
  const items =
    user?.role === "admin"
      ? [
          ...baseItems.slice(0, -1),
          { to: "/admin" as const, label: "Console", icon: "⧉" },
          baseItems[baseItems.length - 1]!,
        ]
      : [...baseItems];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto max-w-lg rounded-[2rem] glass-strong px-1.5 py-2 shadow-lg sm:px-2">
        <ul className="flex items-stretch justify-between gap-0.5 text-[10px] font-medium text-slate-800/80 sm:gap-1 sm:text-xs">
          {items.map((it) => (
            <li key={it.to} className="flex-1">
              <NavLink
                to={it.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 rounded-2xl py-2 transition ${
                    isActive
                      ? "bg-white/55 text-emerald-900 shadow-sm"
                      : "hover:bg-white/30"
                  }`
                }
              >
                <span className="text-lg leading-none">{it.icon}</span>
                <span>{it.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
