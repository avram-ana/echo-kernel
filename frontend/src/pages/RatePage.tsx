import { useEffect, useLayoutEffect, useRef, useState, type TransitionEvent } from "react";
import { api } from "../lib/api";
import { GlassCard } from "../components/GlassCard";
import { StarInput } from "../components/StarInput";
import { Spinner } from "../components/Spinner";
import { SaveToPlaylist } from "../components/SaveToPlaylist";

type Pending = Awaited<ReturnType<typeof api.pendingRatings>>[number];
type Hist = Awaited<ReturnType<typeof api.ratingHistory>>[number];

type DriftState = {
  rec: Pending;
  rating: number;
  left: number;
  top: number;
  width: number;
  deltaY: number;
  started: boolean;
};

const MIN_SAVING_MS = 1000;
const DRIFT_MS = 900;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function RatePage() {
  const [pending, setPending] = useState<Pending[]>([]);
  const [history, setHistory] = useState<Hist[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [stars, setStars] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [historySaving, setHistorySaving] = useState<string | null>(null);
  const [driftAnim, setDriftAnim] = useState<DriftState | null>(null);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pastHeadingRef = useRef<HTMLHeadingElement | null>(null);

  async function load(opts?: { silent?: boolean }) {
    const silent = opts?.silent === true;
    if (!silent) setLoading(true);
    try {
      const [p, h] = await Promise.all([api.pendingRatings(), api.ratingHistory()]);
      setPending(p);
      setHistory(h);
      const st: Record<string, number> = {};
      for (const x of p) st[x.id] = 0;
      setStars((prev) => ({ ...st, ...prev }));
      // #region agent log
      fetch("http://127.0.0.1:7896/ingest/a1dc9076-9451-41ba-866e-6f3b6df12a5f", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "461ef4" },
        body: JSON.stringify({
          sessionId: "461ef4",
          runId: "rate-stars",
          hypothesisId: "H1",
          location: "RatePage.tsx:load",
          message: "pending ratings init star defaults",
          data: { count: p.length, sampleIds: p.slice(0, 3).map((x) => x.id), defaultStar: 0 },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      setErr(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useLayoutEffect(() => {
    if (!driftAnim || driftAnim.started) return;
    const raf = requestAnimationFrame(() => {
      setDriftAnim((d) => (d && !d.started ? { ...d, started: true } : d));
    });
    return () => cancelAnimationFrame(raf);
  }, [driftAnim]);

  async function saveRating(rec: Pending, rating: number) {
    if (rating < 1 || rating > 5) return;
    const recId = rec.id;
    setSaving(recId);
    const saveStarted = Date.now();
    // #region agent log
    fetch("http://127.0.0.1:7896/ingest/a1dc9076-9451-41ba-866e-6f3b6df12a5f", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "461ef4" },
      body: JSON.stringify({
        sessionId: "461ef4",
        runId: "rate-stars",
        hypothesisId: "H3",
        location: "RatePage.tsx:saveRating",
        message: "submitting rating from star click",
        data: { recIdPrefix: recId.slice(0, 8), rating, hasNote: Boolean(notes[recId]?.trim()) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    try {
      await api.submitRating({
        recommendationId: recId,
        rating,
        note: notes[recId]?.trim() || undefined,
      });
      const waitMore = Math.max(0, MIN_SAVING_MS - (Date.now() - saveStarted));
      if (waitMore > 0) await delay(waitMore);

      const cardEl = cardRefs.current[recId];
      const pastEl = pastHeadingRef.current;
      if (!cardEl || !pastEl) {
        await load({ silent: true });
        return;
      }
      const fr = cardEl.getBoundingClientRect();
      const pr = pastEl.getBoundingClientRect();
      const deltaY = pr.top - fr.top;

      setPending((p) => p.filter((x) => x.id !== recId));
      if (Math.abs(deltaY) < 8) {
        await load({ silent: true });
        return;
      }
      setDriftAnim({
        rec,
        rating,
        left: fr.left,
        top: fr.top,
        width: fr.width,
        deltaY,
        started: false,
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save rating");
    } finally {
      setSaving(null);
    }
  }

  async function updateHistoryRating(row: Hist, rating: number) {
    if (rating < 1 || rating > 5) return;
    setHistorySaving(row.id);
    try {
      await api.submitRating({
        recommendationId: row.recommendation.id,
        rating,
      });
      await load({ silent: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not update rating");
    } finally {
      setHistorySaving(null);
    }
  }

  function handleDriftTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (e.propertyName !== "transform" || e.target !== e.currentTarget) return;
    setDriftAnim(null);
    void load({ silent: true });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const driftLocked = driftAnim !== null;

  return (
    <div className="relative space-y-5 pb-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-slate-900">
          Rate songs
        </h1>
        <p className="mt-1 text-sm text-slate-800/80">
          Rating a song helps us learn about what you like!
        </p>
      </div>
      {err && <p className="text-sm text-rose-700">{err}</p>}

      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900/55">Awaiting your stars</h2>
        {!pending.length && (
          <GlassCard>
            <p className="text-sm text-slate-800/85">You’re caught up — log a new mood for fresh picks.</p>
          </GlassCard>
        )}
        {pending.map((r) => (
          <div
            key={r.id}
            ref={(el) => {
              cardRefs.current[r.id] = el;
            }}
          >
            <GlassCard strong>
              <p className="text-xs text-slate-600">
                From mood {r.mood.emoji} · {new Date(r.mood.createdAt).toLocaleDateString()}
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
                {r.title}
              </p>
              <p className="text-sm text-slate-700/90">
                {r.artist} {r.genre ? `· ${r.genre}` : ""}
              </p>
              <p className="mt-2 text-xs italic text-emerald-900/70">“{r.explanationLabel}”</p>
              <SaveToPlaylist songRecommendationId={r.id} />
              <div className="mt-4 flex flex-nowrap items-center gap-3">
                <StarInput
                  value={stars[r.id] ?? 0}
                  disabled={saving === r.id || driftLocked}
                  onChange={(n) => {
                    // #region agent log
                    fetch("http://127.0.0.1:7896/ingest/a1dc9076-9451-41ba-866e-6f3b6df12a5f", {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "461ef4" },
                      body: JSON.stringify({
                        sessionId: "461ef4",
                        runId: "rate-stars",
                        hypothesisId: "H2",
                        location: "RatePage.tsx:StarInput.onChange",
                        message: "star value chosen",
                        data: { recIdPrefix: r.id.slice(0, 8), chosen: n },
                        timestamp: Date.now(),
                      }),
                    }).catch(() => {});
                    // #endregion
                    setStars((s) => ({ ...s, [r.id]: n }));
                    void saveRating(r, n);
                  }}
                />
                {saving === r.id && (
                  <span className="shrink-0 rounded-full border border-white/60 bg-white/55 px-2.5 py-0.5 text-xs font-semibold text-slate-700 shadow-sm">
                    Saving…
                  </span>
                )}
              </div>
              <textarea
                className="mt-3 w-full rounded-2xl border border-white/50 bg-white/40 px-3 py-2 text-sm"
                placeholder="Optional note…"
                value={notes[r.id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                rows={2}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {r.externalUrl && (
                  <a
                    href={r.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-white/50 px-5 py-2 text-xs font-bold text-slate-900"
                  >
                    Open YouTube
                  </a>
                )}
              </div>
            </GlassCard>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2
          ref={pastHeadingRef}
          className="text-xs font-bold uppercase tracking-wider text-emerald-900/55"
        >
          Past ratings
        </h2>
        {!history.length && (
          <GlassCard>
            <p className="text-sm text-slate-800/85">No ratings yet — your taste profile starts here.</p>
          </GlassCard>
        )}
        {history.map((row) => (
          <GlassCard key={row.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-600">
                  {row.recommendation.mood.emoji} {row.recommendation.mood.description.slice(0, 60)}
                  {row.recommendation.mood.description.length > 60 ? "…" : ""}
                </p>
                <p className="mt-1 font-semibold text-slate-900">{row.recommendation.title}</p>
                <p className="text-xs text-slate-700/90">{row.recommendation.artist}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <div className="flex flex-nowrap items-center justify-end gap-2">
                  <StarInput
                    value={row.rating}
                    disabled={historySaving === row.id || driftLocked}
                    onChange={(n) => void updateHistoryRating(row, n)}
                  />
                  {historySaving === row.id && (
                    <span className="shrink-0 rounded-full border border-white/60 bg-white/55 px-2.5 py-0.5 text-xs font-semibold text-slate-700 shadow-sm">
                      Saving…
                    </span>
                  )}
                </div>
                {row.note && <p className="max-w-[140px] text-xs text-slate-600">{row.note}</p>}
              </div>
            </div>
          </GlassCard>
        ))}
      </section>

      {driftAnim && (
        <div
          className="pointer-events-none fixed z-[100] will-change-transform"
          style={{
            left: driftAnim.left,
            top: driftAnim.top,
            width: driftAnim.width,
            boxSizing: "border-box",
            transition: `transform ${DRIFT_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            transform: driftAnim.started ? `translateY(${driftAnim.deltaY}px)` : "translateY(0)",
          }}
          onTransitionEnd={handleDriftTransitionEnd}
        >
          <GlassCard strong>
            <p className="text-xs text-slate-600">
              From mood {driftAnim.rec.mood.emoji} · {new Date(driftAnim.rec.mood.createdAt).toLocaleDateString()}
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">
              {driftAnim.rec.title}
            </p>
            <p className="text-sm text-slate-700/90">
              {driftAnim.rec.artist} {driftAnim.rec.genre ? `· ${driftAnim.rec.genre}` : ""}
            </p>
            <p className="mt-2 text-xs italic text-emerald-900/70">“{driftAnim.rec.explanationLabel}”</p>
            <p className="mt-4 text-2xl leading-none text-amber-400 transition-opacity duration-300">
              {"★".repeat(driftAnim.rating)}
            </p>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
