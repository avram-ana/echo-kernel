import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { PlaylistRow } from "../types";

export function SaveToPlaylist({ songRecommendationId }: { songRecommendationId: string }) {
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [choice, setChoice] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const pl = await api.playlists();
        setPlaylists(pl);
        if (pl[0]) setChoice(pl[0].id);
      } catch {
        setPlaylists([]);
      }
    })();
  }, []);

  async function add() {
    if (!choice) return;
    setLoading(true);
    setErr(null);
    setMsg(null);
    try {
      await api.addPlaylistItem(choice, songRecommendationId);
      setMsg("Saved");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save");
    } finally {
      setLoading(false);
    }
  }

  if (!playlists.length) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/30 pt-2">
      <select
        className="max-w-[min(100%,12rem)] rounded-full border border-white/50 bg-white/50 px-2 py-1 text-[10px] font-medium text-slate-800"
        value={choice}
        onChange={(e) => setChoice(e.target.value)}
      >
        {playlists.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={loading}
        onClick={() => void add()}
        className="rounded-full bg-emerald-900/85 px-2 py-1 text-[10px] font-bold text-lime-100 disabled:opacity-50"
      >
        {loading ? "…" : "Save to playlist"}
      </button>
      {msg && <span className="text-[10px] text-emerald-800">{msg}</span>}
      {err && <span className="text-[10px] text-rose-700">{err}</span>}
    </div>
  );
}
