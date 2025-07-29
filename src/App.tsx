import { useEffect, useState } from "react";
import { type Session } from "@supabase/supabase-js";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import { supabase } from "@/lib/supabase";
import SupraAuthPage from "./pages/supra-auth";
import { AppSidebar } from "./components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import ExploreMovie from "./pages/explore-movie";
import ExploreTv from "./pages/explore-tv";
import SearchPage from "./pages/search";
import MoviePage from "./components/movie-page";
import SeriesPage from "./components/series-page";
import { SectionCards } from "./components/section-cards";
import { WatchTimeChart } from "./components/chart-area-interactive";
import ProfilePage from "./pages/profile";

import { Skeleton } from "@/components/ui/skeleton";
import { LoaderCircle } from "lucide-react";
import MovieTrackerPage from "./pages/tracker-movie";
import UserProfilePage from "./pages/user-profile";
import { BottomNav } from "./components/bottom-navigation";
import LeaderboardPage from "./pages/leaderboard";
import { ScrollToTop } from "./utils/scroll-to-top";
import SeriesTrackerPage from "./pages/tracker-series";
import { Toaster } from "sonner";
import { Button } from "@/components/ui/button";
import DashboardInsights from "./components/dashboard-insights";

const FullScreenLoader = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <LoaderCircle className="w-8 h-8 animate-spin text-muted-foreground" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
};

function Dashboard() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <SectionCards />
        <div className="px-4 lg:px-6">
          <WatchTimeChart />
        </div>
        <DashboardInsights />
      </div>
    </div>
  );
}

function ActivityMovie() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Activity</h1>
            <p className="text-muted-foreground">Track your movie and series activity here.</p>
          </div>
          <Button onClick={() => navigate("/activity/tv")} variant="outline" className="text-sm">
            Switch to Series
          </Button>
        </div>

        <MovieTrackerPage />
      </div>
    </div>
  );
}

function ActivitySeries() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Activity</h1>
            <p className="text-muted-foreground">Track your movie and series activity here.</p>
          </div>
          <Button onClick={() => navigate("/activity/movies")} variant="outline" className="text-sm">
            Switch to Movies
          </Button>
        </div>

        <SeriesTrackerPage />
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
  const navigate = useNavigate();
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Explore Movies</h1>
            <p className="text-muted-foreground">Discover new movies.</p>
          </div>
          <Button onClick={() => navigate("/explore/tv")} variant="outline" className="text-sm">
            Switch to Series
          </Button>
        </div>

        <ExploreMovie />
      </div>
    </div>
  );
}

function ExploreTvPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold">Explore TV</h1>
            <p className="text-muted-foreground">Discover new TV series.</p>
          </div>
          <Button onClick={() => navigate("/explore/movies")} variant="outline" className="text-sm">
            Switch to Movies
          </Button>
        </div>

        <ExploreTv />
      </div>
    </div>
  );
}

function Leaderboard() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">Top watcher as per runtime.</p>
        <LeaderboardPage />
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session fetch
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false); // done loading
    });

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!session) {
    return <SupraAuthPage />;
  }

  return (
    <SidebarProvider>
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:flex">
        <AppSidebar variant="inset" />
      </div>

      {/* Main Content Area */}
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        <SiteHeader />
        {/* Add bottom padding for mobile to prevent content overlap */}
        <div className="flex-1 overflow-auto pb-16 md:pb-0">
          <Toaster position="top-right" />
          <ScrollToTop /> {/* Scroll to top on route change */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />

            {/* Activity */}
            <Route path="/activity/movies" element={<ActivityMovie />} />
            <Route path="/activity/tv" element={<ActivitySeries />} />

            {/* Explore */}
            <Route path="/explore/movies" element={<ExploreMoviePage />} />
            <Route path="/explore/tv" element={<ExploreTvPage />} />

            {/* Search / Profile */}
            <Route path="/search" element={<Search />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<UserProfilePage />} />

            {/* Details */}
            <Route path="/movie/:id" element={<MoviePage />} />
            <Route path="/series/:id" element={<SeriesPage />} />

            <Route path="/users" element={<Leaderboard />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </SidebarInset>

      {/* Bottom Navigation - visible only on mobile */}
      <BottomNav />
    </SidebarProvider>
  );
}
