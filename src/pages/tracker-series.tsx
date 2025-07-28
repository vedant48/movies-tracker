import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { SeriesCard } from "../components/series-card";

interface UserSeries {
  id: number;
  series_id: number;
  title: string;
  poster_path: string | null;
  first_air_date: string;
  runtime: number;
  status: "want" | "watched" | "watching";
  rating?: number;
  review?: string;
}

export default function SeriesTrackerPage() {
  const [wantList, setWantList] = useState<UserSeries[]>([]);
  const [watchedList, setWatchedList] = useState<UserSeries[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserMovies = async () => {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) {
        toast.error("Please log in to view your tracker.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from("user_series").select("*").eq("user_id", user.id);

      if (error) {
        toast.error("Failed to load your series list.");
        console.error(error);
        setLoading(false);
        return;
      }

      const want = data.filter((item: UserSeries) => item.status === "want");
      const watched = data.filter((item: UserSeries) => item.status === "watched" || item.status === "watching");
      setWantList(want);
      setWatchedList(watched);
      setLoading(false);
    };

    fetchUserMovies();
  }, []);

  return (
    <div>
      <Tabs defaultValue="want">
        <TabsList className="my-8">
          <TabsTrigger value="want">Want to Watch</TabsTrigger>
          <TabsTrigger value="watched">Watched</TabsTrigger>
        </TabsList>

        <TabsContent value="want">
          {loading ? (
            <SeriesListSkeleton />
          ) : wantList.length > 0 ? (
            <SeriesGrid series={wantList} />
          ) : (
            <p className="text-muted-foreground text-center py-8">No series in your Want list yet.</p>
          )}
        </TabsContent>

        <TabsContent value="watched">
          {loading ? (
            <SeriesListSkeleton />
          ) : watchedList.length > 0 ? (
            <SeriesGrid series={watchedList} showRating />
          ) : (
            <p className="text-muted-foreground text-center py-8">No series in your Watched list yet.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SeriesGrid({ series, showRating = false }: { series: UserSeries[]; showRating?: boolean }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {series.map((series) => (
        <div key={series.series_id} className="relative">
          <SeriesCard
            id={series.series_id}
            name={series.title}
            poster_path={series.poster_path || ""}
            first_air_date={series.first_air_date || ""}
          />
          {showRating && series.rating !== undefined && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              ⭐ {series.rating}/10
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SeriesListSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="w-full aspect-[2/3] rounded-lg" />
      ))}
    </div>
  );
}
