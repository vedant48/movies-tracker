import { Routes, Route, Navigate } from "react-router-dom";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import AuthPage from "./pages/auth";
import { AppSidebar } from "./components/app-sidebar";
import TrackerPage from "./pages/tracker";
import ExplorePage from "./pages/explore";

import data from "./data.json";
import { ChartAreaInteractive } from "./components/chart-area-interactive";

// Dashboard component
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

// Activity placeholder component
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

// Search placeholder component
function Search() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Search</h1>
        <p className="text-muted-foreground">Search for movies and TV series.</p>
      </div>
    </div>
  );
}

// Profile placeholder component
function Profile() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your profile settings.</p>
      </div>
    </div>
  );
}

function Explore() {
  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Explore</h1>
        <p className="text-muted-foreground">Discover new movies and series.</p>
        <ExplorePage />
      </div>
    </div>
  );
}

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("user_email");
    if (email) setUserEmail(email);
  }, []);

  function logout() {
    localStorage.removeItem("user_email");
    setUserEmail(null);
  }

  if (!userEmail) {
    return <AuthPage onAuth={(user) => setUserEmail(user.email)} />;
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="flex flex-1 flex-col overflow-x-hidden">
        <SiteHeader />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SidebarInset>
    </SidebarProvider>
  );
}
