import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { proxyGet } from "../utils/tmdbProxy";
import { MovieCard } from "../components/movie-card";
import { SeriesCard } from "../components/series-card";
import { Search, X, Film, Tv } from "lucide-react";

type Movie = {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
};

type Series = {
  id: number;
  name: string;
  poster_path: string | null;
  first_air_date: string;
  vote_average: number;
  overview: string;
};

const IMAGE_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2U2ZTZlNiIgdmlld0JveD0iMCAwIDEwMCAxNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNTAiIHJ4PSIyMCIvPjxwYXRoIGQ9Ik0wIDExMEgxMDBWMTEySDB6IiBmaWxsPSIjZGRkIiBvcGFjaXR5PSIuNSIvPjwvc3ZnPg==";

const skeletonArray = Array.from({ length: 16 });

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("movies");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced fetch
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setMovies([]);
        setSeries([]);
        return;
      }

      setLoading(true);
      try {
        const [movieRes, tvRes] = await Promise.all([
          proxyGet<{ results: Movie[] }>(`/v1/tmdb/3/search/movie?query=${encodeURIComponent(query)}`),
          proxyGet<{ results: Series[] }>(`/v1/tmdb/3/search/tv?query=${encodeURIComponent(query)}`),
        ]);
        setMovies(movieRes.results || []);
        setSeries(tvRes.results || []);
      } catch (err) {
        console.error("Search error:", err);
        setMovies([]);
        setSeries([]);
      } finally {
        setLoading(false);
      }
    };

    const t = setTimeout(fetchResults, 500);
    return () => clearTimeout(t);
  }, [query]);

  const NotFound = ({ label }: { label: string }) => (
    <div className="col-span-full flex flex-col items-center gap-2 py-10 text-muted-foreground">
      {label === "Movies" ? <Film className="h-8 w-8" /> : <Tv className="h-8 w-8" />}
      <p className="text-sm">
        {query ? `No ${label.toLowerCase()} match “${query}”.` : `Start searching for ${label.toLowerCase()}...`}
      </p>
    </div>
  );

  const SkeletonGrid = () => (
    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 pb-4">
      {skeletonArray.map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-[225px] w-[150px] rounded-lg" />
          <Skeleton className="h-4 w-[150px]" />
        </div>
      ))}
    </div>
  );

  /* ---------- UI ---------- */

  return (
    <div className="p-0">
      {/* Search bar */}
      <div className="relative my-8 w-full max-w-xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        {query && (
          <X
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-red-500 transition"
            size={18}
            onClick={() => setQuery("")}
          />
        )}
        <Input
          placeholder="Search for movies or series..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-8 py-2 rounded-md border focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="movies">Movies</TabsTrigger>
          <TabsTrigger value="series">Series</TabsTrigger>
        </TabsList>

        {/* Movies Tab */}
        <TabsContent value="movies">
          {loading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 pb-4">
              {movies.length ? (
                movies.map((m) => (
                  <MovieCard
                    key={m.id}
                    id={m.id}
                    title={m.title || "Untitled"}
                    poster_path={m.poster_path || IMAGE_PLACEHOLDER}
                    release_date={m.release_date || "N/A"}
                    vote_average={m.vote_average || 0}
                    overview={m.overview}
                  />
                ))
              ) : (
                <NotFound label="Movies" />
              )}
            </div>
          )}
        </TabsContent>

        {/* Series Tab */}
        <TabsContent value="series">
          {loading ? (
            <SkeletonGrid />
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 pb-4">
              {series.length ? (
                series.map((s) => (
                  <SeriesCard
                    key={s.id}
                    id={s.id}
                    name={s.name || "Untitled"}
                    poster_path={s.poster_path || IMAGE_PLACEHOLDER}
                    first_air_date={s.first_air_date || "N/A"}
                    vote_average={s.vote_average || 0}
                  />
                ))
              ) : (
                <NotFound label="Series" />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
