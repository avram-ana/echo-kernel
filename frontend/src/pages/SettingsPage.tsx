import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api, type ProfilePatch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { GlassCard } from "../components/GlassCard";
import { UserAvatar } from "../components/UserAvatar";
import type { PlaylistRow, User } from "../types";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-900/55">{children}</h2>
  );
}

export function SettingsPage() {
  const { user, refresh, logout } = useAuth();
  const [profile, setProfile] = useState<User | null>(user);
  const [loading, setLoading] = useState(true);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [genres, setGenres] = useState("");
  const [artists, setArtists] = useState("");
  const [intent, setIntent] = useState({
    comfort: false,
    energy: false,
    distraction: false,
  });
  const [privacy, setPrivacy] = useState({
    profilePublic: false,
    analyticsOptIn: true,
  });

  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePass, setDeletePass] = useState("");
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);

  /** Browsers often autofill these with email/username; keep readonly until focus so autofill does not run. */
  const [genresEditable, setGenresEditable] = useState(false);
  const [artistsEditable, setArtistsEditable] = useState(false);
  const sanitizeRan = useRef(false);

  useEffect(() => {
    void (async () => {
      try {
        const [{ user: u }, pl] = await Promise.all([api.me(), api.playlists()]);
        setProfile(u);
        setDisplayName(u.displayName ?? "");
        setAvatarUrl(u.avatarUrl ?? "");
        const fg = Array.isArray(u.favoriteGenres) ? (u.favoriteGenres as string[]) : [];
        const fa = Array.isArray(u.favoriteArtists) ? (u.favoriteArtists as string[]) : [];
        setGenres(fg.join(", "));
        setArtists(fa.join(", "));
        setGenresEditable(fg.length > 0);
        setArtistsEditable(fa.length > 0);
        sanitizeRan.current = false;
        const mi = u.musicIntent ?? {};
        setIntent({
          comfort: !!mi.comfort,
          energy: !!mi.energy,
          distraction: !!mi.distraction,
        });
        setPrivacy({
          profilePublic: u.profilePublic ?? false,
          analyticsOptIn: u.analyticsOptIn ?? true,
        });
        setPlaylists(pl);

        const emailL = u.email?.trim().toLowerCase() ?? "";
        const userL = u.username?.trim().toLowerCase() ?? "";
        const stripAutofillNoise = (raw: string, hadSavedList: boolean) => {
          if (hadSavedList) return raw;
          const t = raw.trim().toLowerCase();
          if (t === emailL || t === userL) return "";
          return raw;
        };
        queueMicrotask(() => {
          setTimeout(() => {
            if (sanitizeRan.current) return;
            sanitizeRan.current = true;
            setGenres((prev) => stripAutofillNoise(prev, fg.length > 0));
            setArtists((prev) => stripAutofillNoise(prev, fa.length > 0));
          }, 50);
        });
      } catch {
        setProfile(user);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function saveProfile() {
    setProfileErr(null);
    setProfileMsg(null);
    setProfileSaving(true);
    try {
      const patch: ProfilePatch = {
        displayName: displayName.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        favoriteGenres: genres
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        favoriteArtists: artists
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        musicIntent: intent,
        ...privacy,
      };
      const { user: u } = await api.updateProfile(patch);
      setProfile(u);
      await refresh();
      setProfileMsg("Profile saved.");
    } catch (e) {
      setProfileErr(e instanceof Error ? e.message : "Could not save");
    } finally {
      setProfileSaving(false);
    }
  }

  async function changePassword() {
    setPwErr(null);
    setPwMsg(null);
    setPwSaving(true);
    try {
      await api.changePassword({
        currentPassword: pwCurrent,
        newPassword: pwNew,
        confirmPassword: pwConfirm,
      });
      setPwMsg("Password updated.");
      setPwCurrent("");
      setPwNew("");
      setPwConfirm("");
      await refresh();
    } catch (e) {
      setPwErr(e instanceof Error ? e.message : "Could not change password");
    } finally {
      setPwSaving(false);
    }
  }

  async function confirmDelete() {
    setDeleteErr(null);
    setDeleting(true);
    try {
      await api.deleteAccount(deletePass);
      await logout();
    } catch (e) {
      setDeleteErr(e instanceof Error ? e.message : "Could not delete account");
    } finally {
      setDeleting(false);
    }
  }

  if (loading && !profile) {
    return <p className="text-sm text-slate-600">Loading…</p>;
  }

  return (
    <div className="animate-settings-in space-y-6 pb-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
          Account & settings
        </h1>
        <p className="mt-1 text-sm text-slate-800/80">Profile, security, playlists, and privacy.</p>
      </div>

      {user?.role === "admin" && (
        <GlassCard strong className="border border-emerald-200/60 bg-emerald-50/35">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-900/70">Admin</p>
          <p className="mt-1 text-sm text-slate-800">
            Open the Echo Kernel console to manage users and greetings.
          </p>
          <Link
            to="/admin"
            className="mt-3 inline-flex rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-bold text-lime-100 shadow"
          >
            Open console
          </Link>
        </GlassCard>
      )}

      <section className="space-y-3">
        <SectionTitle>Profile</SectionTitle>
        <GlassCard strong className="space-y-3">
          <div className="flex items-center gap-4 border-b border-white/40 pb-4">
            <UserAvatar
              user={
                profile
                  ? {
                      username: profile.username,
                      displayName: displayName.trim() || profile.displayName,
                      avatarUrl: avatarUrl.trim() || profile.avatarUrl,
                    }
                  : undefined
              }
              size="lg"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-600">Preview</p>
              <p className="truncate font-[family-name:var(--font-display)] text-base font-bold text-slate-900">
                {displayName.trim() || profile?.username}
              </p>
              <p className="truncate text-xs text-slate-600">Shown in the app header</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700" htmlFor="ek-settings-display-name">
              Display name
            </label>
            <input
              id="ek-settings-display-name"
              name="nickname"
              autoComplete="nickname"
              className="mt-1 w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400/60"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={profile?.username ?? "Your name"}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700" htmlFor="ek-settings-avatar-url">
              Avatar image URL
            </label>
            <input
              id="ek-settings-avatar-url"
              name="ek-settings-avatar-url"
              autoComplete="off"
              inputMode="url"
              className="mt-1 w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400/60"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://…"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700" htmlFor="ek-settings-favorite-genres">
              Favorite genres (comma-separated)
            </label>
            <input
              id="ek-settings-favorite-genres"
              name="ek-settings-favorite-genres"
              autoComplete="off"
              readOnly={!genresEditable}
              onFocus={() => setGenresEditable(true)}
              className="mt-1 w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400/60 read-only:bg-white/30"
              value={genres}
              onChange={(e) => setGenres(e.target.value)}
              placeholder="dream pop, shoegaze, …"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700" htmlFor="ek-settings-favorite-artists">
              Favorite artists (comma-separated)
            </label>
            <input
              id="ek-settings-favorite-artists"
              name="ek-settings-favorite-artists"
              autoComplete="off"
              readOnly={!artistsEditable}
              onFocus={() => setArtistsEditable(true)}
              className="mt-1 w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-400/60 read-only:bg-white/30"
              value={artists}
              onChange={(e) => setArtists(e.target.value)}
              placeholder="Add artists when you’re ready"
              data-1p-ignore
              data-lpignore="true"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-700">What you want from music</p>
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
          {profileMsg && <p className="text-sm text-emerald-800">{profileMsg}</p>}
          {profileErr && <p className="text-sm text-rose-700">{profileErr}</p>}
          <button
            type="button"
            disabled={profileSaving}
            onClick={() => void saveProfile()}
            className="rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-bold text-lime-100 disabled:opacity-50"
          >
            {profileSaving ? "Saving…" : "Save profile"}
          </button>
        </GlassCard>
      </section>

      <section className="space-y-3">
        <SectionTitle>Privacy</SectionTitle>
        <GlassCard className="space-y-3">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Public profile</span>
            <input
              type="checkbox"
              checked={privacy.profilePublic}
              onChange={(e) => setPrivacy((p) => ({ ...p, profilePublic: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Share analytics with Echo Kernel (improves insights)</span>
            <input
              type="checkbox"
              checked={privacy.analyticsOptIn}
              onChange={(e) => setPrivacy((p) => ({ ...p, analyticsOptIn: e.target.checked }))}
              className="h-4 w-4 rounded"
            />
          </label>
          <button
            type="button"
            disabled={profileSaving}
            onClick={() => void saveProfile()}
            className="rounded-full bg-white/50 px-4 py-2 text-xs font-bold text-slate-900 ring-1 ring-white/60"
          >
            Save privacy settings
          </button>
        </GlassCard>
      </section>

      <section className="space-y-3">
        <SectionTitle>Security</SectionTitle>
        <GlassCard strong className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">Current password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-2.5 text-sm"
              value={pwCurrent}
              onChange={(e) => setPwCurrent(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">New password (10+ chars, upper, lower, number)</label>
            <input
              type="password"
              className="mt-1 w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-2.5 text-sm"
              value={pwNew}
              onChange={(e) => setPwNew(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Confirm new password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-2xl border border-white/50 bg-white/40 px-4 py-2.5 text-sm"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {pwMsg && <p className="text-sm text-emerald-800">{pwMsg}</p>}
          {pwErr && <p className="text-sm text-rose-700">{pwErr}</p>}
          <button
            type="button"
            disabled={pwSaving}
            onClick={() => void changePassword()}
            className="rounded-full bg-emerald-900 px-5 py-2.5 text-sm font-bold text-lime-100 disabled:opacity-50"
          >
            {pwSaving ? "Updating…" : "Change password"}
          </button>
        </GlassCard>
      </section>

      <section className="space-y-3">
        <SectionTitle>Your playlists</SectionTitle>
        <p className="text-sm text-slate-700">
          Default lists were created for you. Add tracks from Soundtrack or Rate using “Save to playlist”.
        </p>
        <div className="space-y-2">
          {playlists.map((pl) => (
            <GlassCard key={pl.id} className="text-sm">
              <p className="font-[family-name:var(--font-display)] font-bold text-slate-900">{pl.name}</p>
              <p className="text-xs text-slate-600">{pl.items.length} tracks saved</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {user?.role !== "admin" && (
        <>
          <section className="space-y-3">
            <SectionTitle>Danger zone</SectionTitle>
            <GlassCard className="border border-rose-200/60 bg-rose-50/30">
              <p className="text-sm text-slate-800">Delete your account and all moods, ratings, and playlists.</p>
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(true);
                  setDeletePass("");
                  setDeleteErr(null);
                }}
                className="mt-3 rounded-full bg-rose-700 px-4 py-2 text-xs font-bold text-white"
              >
                Delete account…
              </button>
            </GlassCard>
          </section>

          {deleteOpen && (
            <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
              <button
                type="button"
                className="absolute inset-0 bg-slate-900/25 backdrop-blur-sm"
                aria-label="Close"
                onClick={() => setDeleteOpen(false)}
              />
              <div className="relative z-10 w-full max-w-md rounded-3xl glass-strong p-6 shadow-xl">
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-900">
                  Delete account?
                </h3>
                <p className="mt-2 text-sm text-slate-700/90">This cannot be undone. Enter your password.</p>
                <input
                  type="password"
                  className="mt-3 w-full rounded-xl border border-white/50 bg-white/50 px-3 py-2 text-sm"
                  placeholder="Password"
                  value={deletePass}
                  onChange={(e) => setDeletePass(e.target.value)}
                />
                {deleteErr && <p className="mt-2 text-sm text-rose-700">{deleteErr}</p>}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(false)}
                    className="rounded-full px-4 py-2 text-sm font-medium text-slate-800 hover:bg-white/40"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => void confirmDelete()}
                    className="rounded-full bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-rose-700 disabled:opacity-50"
                  >
                    {deleting ? "Deleting…" : "Delete forever"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
