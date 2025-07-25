/* ---------------------------------- App.tsx --------------------------------- */
import { useEffect, useState } from "react";
import { type Session } from "@supabase/supabase-js";
import { Routes, Route, Navigate } from "react-router-dom";

import { supabase } from "@/lib/supabase";
import SupraAuthPage from "./pages/supra-auth"; // ← your Auth component
import { AppSidebar } from "./components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";

import TrackerPage from "./pages/tracker";
import ExploreMovie from "./pages/explore-movie";
import ExploreTv from "./pages/explore-tv";
import SearchPage from "./pages/search";
import MoviePage from "./components/movie-page";
import SeriesPage from "./components/series-page";
import { SectionCards } from "./components/section-cards";
import { ChartAreaInteractive } from "./components/chart-area-interactive";
import { DataTable } from "./components/data-table";
import data from "./data.json";
import ProfilePage from "./pages/profile";

/* ───────────────────── helper wrapper components ───────────────────── */

function Dashboard() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive />
        </div>
        <DataTable data={data} />
      </div>
    </div>
  );
}

function Activity() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-muted-foreground">Track your movie and series activity here.</p>
        <TrackerPage />
      </div>
    </div>
  );
}

function Search() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-muted-foreground">Search for movies and TV series.</p>
        <SearchPage />
      </div>
    </div>
  );
}

function Profile() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your profile settings.</p>
        <ProfilePage />
      </div>
    </div>
  );
}

function ExploreMoviePage() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Explore Movies</h1>
        <p className="text-muted-foreground">Discover new movies.</p>
        <ExploreMovie />
      </div>
    </div>
  );
}

function ExploreTvPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Explore TV</h1>
        <p className="text-muted-foreground">Discover new TV series.</p>
        <ExploreTv />
      </div>
    </div>
  );
}

/* ───────────────────────────── main app ───────────────────────────── */

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  /* 1️⃣  Keep the session in React state */
  useEffect(() => {
    // initial check
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    // subscribe to future changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    return () => subscription.unsubscribe();
  }, []);

  /* 2️⃣  If not authenticated, show Supabase Auth UI */
  if (!session) {
    return <SupraAuthPage />;
  }

  /* 3️⃣  Authenticated area wrapped with sidebar / header */
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <SiteHeader />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* Activity */}
          <Route path="/activity/movies" element={<Activity />} />
          <Route path="/activity/tv" element={<Activity />} />

          {/* Explore */}
          <Route path="/explore/movies" element={<ExploreMoviePage />} />
          <Route path="/explore/tv" element={<ExploreTvPage />} />

          {/* Search / Profile */}
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile />} />

          {/* Details */}
          <Route path="/movie/:id" element={<MoviePage />} />
          <Route path="/series/:id" element={<SeriesPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SidebarInset>
    </SidebarProvider>
  );
}
