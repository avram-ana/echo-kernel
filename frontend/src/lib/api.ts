import type { MusicIntent, PlaylistRow, User } from "../types";

/** In dev, Vite proxies `/api` to the backend. Set VITE_API_URL for production (e.g. https://api.example.com). */
const API_BASE = import.meta.env.VITE_API_URL
  ? `${String(import.meta.env.VITE_API_URL).replace(/\/$/, "")}/api`
  : "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data?.error === "string"
        ? data.error
        : data?.error?.formErrors?.join?.(", ") || res.statusText;
    throw new Error(msg || "Request failed");
  }
  return data as T;
}

export type RegisterBody = {
  username: string;
  email: string;
  password: string;
  favoriteGenres?: string[];
  favoriteArtists?: string[];
  musicIntent?: MusicIntent;
};

type TimeOfDayShape = "morning" | "afternoon" | "evening" | "night";

type MoodShape = {
  id: string;
  description: string;
  emoji: string;
  color: string;
  moodScore: number;
  createdAt: string;
  recommendations: RecShape[];
};

type RecShape = {
  id: string;
  moodId: string;
  title: string;
  artist: string;
  genre: string | null;
  recommendationType: "mood_match" | "dare" | "taste_based";
  externalUrl: string | null;
  explanationLabel: string;
  displayOrder: number;
  createdAt: string;
};

type RecWithMoodShape = RecShape & {
  mood: { id: string; description: string; emoji: string; createdAt: string };
};

type RatingRowShape = {
  id: string;
  rating: number;
  note: string | null;
  recommendation: RecShape & { mood: { description: string; emoji: string } };
};

type GreetingShape = { id: string; content: string; timeOfDay: TimeOfDayShape; createdAt: string };

type AnalyticsShape = {
  totalMoods: number;
  totalSongsRated: number;
  averageMoodScore: number | null;
  averageSongRating: number | null;
  favoriteGenres: { genre: string; avgRating: number; count: number }[];
  topEmojis: { emoji: string; count: number }[];
  topColors: { color: string; count: number }[];
  moodTrend: { date: string; score: number }[];
};

type AdminUserShape = {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
  _count: { moods: number; songRatings: number; greetings: number };
};

type AdminGreetingShape = GreetingShape & {
  user: { id: string; username: string; email: string };
};

export type ProfilePatch = {
  displayName?: string | null;
  avatarUrl?: string | null;
  favoriteGenres?: string[];
  favoriteArtists?: string[];
  musicIntent?: MusicIntent | null;
  profilePublic?: boolean;
  analyticsOptIn?: boolean;
};

export const api = {
  me: () => request<{ user: User }>("/auth/me"),
  login: (body: { email: string; password: string }) =>
    request<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  register: (body: RegisterBody) =>
    request<{ user: User }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),

  changePassword: (body: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    request<{ ok: boolean }>("/auth/change-password", { method: "POST", body: JSON.stringify(body) }),

  updateProfile: (body: ProfilePatch) =>
    request<{ user: User }>("/users/me", { method: "PATCH", body: JSON.stringify(body) }),

  deleteAccount: (password: string) =>
    request<{ ok: boolean }>("/users/me", { method: "DELETE", body: JSON.stringify({ password }) }),

  playlists: () => request<PlaylistRow[]>("/playlists"),

  addPlaylistItem: (playlistId: string, songRecommendationId: string) =>
    request<unknown>(`/playlists/${playlistId}/items`, {
      method: "POST",
      body: JSON.stringify({ songRecommendationId }),
    }),

  removePlaylistItem: (playlistId: string, itemId: string) =>
    request<{ ok: boolean }>(`/playlists/${playlistId}/items/${itemId}`, { method: "DELETE" }),

  createPlaylist: (body: { name: string; preset?: PlaylistRow["preset"] | null }) =>
    request<{ id: string }>("/playlists", { method: "POST", body: JSON.stringify(body) }),

  deletePlaylist: (id: string) => request<{ ok: boolean }>(`/playlists/${id}`, { method: "DELETE" }),

  homeSummary: () =>
    request<{
      timeOfDay: TimeOfDayShape;
      greeting: string;
      latestMood: MoodShape | null;
      weeklyAvgMoodScore: number | null;
      soundtrackSongCount: number;
    }>("/home/summary"),

  moods: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    return request<MoodShape[]>(`/moods${q}`);
  },
  createMood: (body: {
    description: string;
    emoji: string;
    color: string;
    moodScore: number;
  }) => request<MoodShape>("/moods", { method: "POST", body: JSON.stringify(body) }),

  pendingRatings: () => request<RecWithMoodShape[]>("/ratings/pending"),
  ratingHistory: () => request<RatingRowShape[]>("/ratings/history"),
  submitRating: (body: { recommendationId: string; rating: number; note?: string }) =>
    request("/ratings", { method: "POST", body: JSON.stringify(body) }),

  greetings: (params?: { timeOfDay?: string; search?: string }) => {
    const sp = new URLSearchParams();
    if (params?.timeOfDay) sp.set("timeOfDay", params.timeOfDay);
    if (params?.search) sp.set("search", params.search);
    const q = sp.toString();
    return request<GreetingShape[]>(`/greetings${q ? `?${q}` : ""}`);
  },
  createGreeting: (body: { content: string; timeOfDay: TimeOfDayShape }) =>
    request<GreetingShape>("/greetings", { method: "POST", body: JSON.stringify(body) }),
  deleteGreeting: (id: string) =>
    request<{ ok: boolean }>(`/greetings/${id}`, { method: "DELETE" }),

  analytics: () => request<AnalyticsShape>("/analytics"),

  adminUsers: () => request<AdminUserShape[]>("/admin/users"),
  adminDeleteUser: (id: string) =>
    request<{ ok: boolean }>(`/admin/users/${id}`, { method: "DELETE" }),
  adminGreetings: (params?: { timeOfDay?: string; userId?: string; search?: string }) => {
    const sp = new URLSearchParams();
    if (params?.timeOfDay) sp.set("timeOfDay", params.timeOfDay);
    if (params?.userId) sp.set("userId", params.userId);
    if (params?.search) sp.set("search", params.search);
    const q = sp.toString();
    return request<AdminGreetingShape[]>(`/admin/greetings${q ? `?${q}` : ""}`);
  },
  adminDeleteGreeting: (id: string) =>
    request<{ ok: boolean }>(`/admin/greetings/${id}`, { method: "DELETE" }),
};
