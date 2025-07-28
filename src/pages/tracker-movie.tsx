import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface UserMovie {
  id: number;
  movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  runtime: number;
  status: "want" | "watched";
  rating?: number;
  review?: string;
}

export default function MovieTrackerPage() {
  const [wantList, setWantList] = useState<UserMovie[]>([]);
  const [watchedList, setWatchedList] = useState<UserMovie[]>([]);
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

      const { data, error } = await supabase.from("user_movies").select("*").eq("user_id", user.id);

      if (error) {
        toast.error("Failed to load your movie list.");
        console.error(error);
        setLoading(false);
        return;
      }

      const want = data.filter((item) => item.status === "want");
      const watched = data.filter((item) => item.status === "watched");
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
            <MovieListSkeleton />
          ) : wantList.length > 0 ? (
            <MovieGrid movies={wantList} />
          ) : (
            <p className="text-muted-foreground text-center py-8">No movies in your Want list yet.</p>
          )}
        </TabsContent>

        <TabsContent value="watched">
          {loading ? (
            <MovieListSkeleton />
          ) : watchedList.length > 0 ? (
            <MovieGrid movies={watchedList} showRating />
          ) : (
            <p className="text-muted-foreground text-center py-8">No movies in your Watched list yet.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MovieGrid({ movies, showRating = false }: { movies: UserMovie[]; showRating?: boolean }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {movies.map((movie) => (
        <div key={movie.movie_id} className="relative">
          <MovieCard
            id={movie.movie_id}
            title={movie.title}
            poster_path={movie.poster_path || ""}
            release_date={movie.release_date || ""}
          />
          {showRating && movie.rating !== undefined && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              ⭐ {movie.rating}/10
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MovieListSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="w-full aspect-[2/3] rounded-lg" />
      ))}
    </div>
  );
}
