export type MusicIntent = {
  comfort?: boolean;
  energy?: boolean;
  distraction?: boolean;
};

export type User = {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  displayName?: string | null;
  avatarUrl?: string | null;
  favoriteGenres?: unknown;
  favoriteArtists?: unknown;
  musicIntent?: MusicIntent | null;
  profilePublic?: boolean;
  analyticsOptIn?: boolean;
  showListeningActivity?: boolean;
  emailVerifiedAt?: string | null;
  createdAt?: string;
};

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export type RecommendationType = "mood_match" | "dare" | "taste_based";

export type SongRecommendation = {
  id: string;
  moodId: string;
  title: string;
  artist: string;
  genre: string | null;
  recommendationType: RecommendationType;
  externalUrl: string | null;
  explanationLabel: string;
  displayOrder: number;
  createdAt: string;
};

export type Mood = {
  id: string;
  description: string;
  emoji: string;
  color: string;
  moodScore: number;
  createdAt: string;
  recommendations: SongRecommendation[];
};

export type Greeting = {
  id: string;
  content: string;
  timeOfDay: TimeOfDay;
  createdAt: string;
};

export type PlaylistPreset = "comfort" | "late_night" | "emotional_wreck" | "villain_arc";

export type PlaylistItemRow = {
  id: string;
  playlistId: string;
  songRecommendationId: string;
  createdAt: string;
  songRecommendation: SongRecommendation & {
    mood: { id: string; description: string; emoji: string; createdAt: string };
  };
};

export type PlaylistRow = {
  id: string;
  userId: string;
  name: string;
  preset: PlaylistPreset | null;
  createdAt: string;
  items: PlaylistItemRow[];
};
