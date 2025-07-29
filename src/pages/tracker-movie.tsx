import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MovieCard } from "@/components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface UserMovie {
  id?: number;
  movie_id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  runtime: number;
  status: "want" | "watched";
  rating?: number;
  review?: string;
  from_name?: string; // only for recommended movies
}

export default function MovieTrackerPage() {
  const [wantList, setWantList] = useState<UserMovie[]>([]);
  const [watchedList, setWatchedList] = useState<UserMovie[]>([]);
  const [recommendedList, setRecommendedList] = useState<UserMovie[]>([]);
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

      try {
        // Fetch user movie list (want/watched)
        const { data: userMovies, error: movieError } = await supabase
          .from("user_movies")
          .select("*")
          .eq("user_id", user.id);

        if (movieError) throw movieError;

        const want = userMovies.filter((item: { status: string }) => item.status === "want");
        const watched = userMovies.filter((item: { status: string }) => item.status === "watched");
        setWantList(want);
        setWatchedList(watched);

        // Fetch recommendations
        const { data: recData, error: recError } = await supabase
          .from("notifications")
          .select("movie_id, movie_title, poster_path, from_name, release_date")
          .eq("user_id", user.id)
          .eq("type", "recommendation");

        if (recError) throw recError;

        // Format recommendation data to match UserMovie shape
        const recList: UserMovie[] = recData.map(
          (rec: { movie_id: any; movie_title: any; poster_path: any; from_name: any; release_date: any }) => ({
            movie_id: rec.movie_id,
            title: rec.movie_title,
            poster_path: rec.poster_path,
            release_date: rec.release_date,
            runtime: 0,
            status: "want",
            from_name: rec.from_name,
          })
        );

        setRecommendedList(recList);
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Failed to load your movie tracker data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserMovies();
  }, []);

  return (
    <div>
      <Tabs defaultValue="want">
        <TabsList className="my-8">
          <TabsTrigger value="want">Want to Watch</TabsTrigger>
          <TabsTrigger value="watched">Watched</TabsTrigger>
          <TabsTrigger value="recommended">Recommended By</TabsTrigger>
        </TabsList>

        {/* Want List */}
        <TabsContent value="want">
          {loading ? (
            <MovieListSkeleton />
          ) : wantList.length > 0 ? (
            <MovieGrid movies={wantList} />
          ) : (
            <p className="text-muted-foreground text-center py-8">No movies in your Want list yet.</p>
          )}
        </TabsContent>

        {/* Watched List */}
        <TabsContent value="watched">
          {loading ? (
            <MovieListSkeleton />
          ) : watchedList.length > 0 ? (
            <MovieGrid movies={watchedList} showRating />
          ) : (
            <p className="text-muted-foreground text-center py-8">No movies in your Watched list yet.</p>
          )}
        </TabsContent>

        {/* Recommended List */}
        <TabsContent value="recommended">
          {loading ? (
            <MovieListSkeleton />
          ) : recommendedList.length > 0 ? (
            <MovieGrid movies={recommendedList} showRecommender />
          ) : (
            <p className="text-muted-foreground text-center py-8">No recommendations yet.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MovieGrid({
  movies,
  showRating = false,
  showRecommender = false,
}: {
  movies: UserMovie[];
  showRating?: boolean;
  showRecommender?: boolean;
}) {
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
          {showRecommender && movie.from_name && (
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              👤 {movie.from_name}
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
