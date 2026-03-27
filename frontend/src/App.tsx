import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Spinner } from "./components/Spinner";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AppShell } from "./layouts/AppShell";
import { HomePage } from "./pages/HomePage";
import { LogPage } from "./pages/LogPage";
import { SoundtrackPage } from "./pages/SoundtrackPage";
import { RatePage } from "./pages/RatePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { GalleryPage } from "./pages/GalleryPage";
import { AdminPage } from "./pages/AdminPage";
import { SettingsPage } from "./pages/SettingsPage";

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }
  return <>{children}</>;
}

function AdminOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/app/home" replace />;
  return <>{children}</>;
}

function PublicHome() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (user) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/app/home"} replace />;
  }
  return <LandingPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/app"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="log" element={<LogPage />} />
        <Route path="soundtrack" element={<SoundtrackPage />} />
        <Route path="rate" element={<RatePage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminOnly>
            <AdminPage />
          </AdminOnly>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
