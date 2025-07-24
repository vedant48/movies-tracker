import { useEffect, useState } from "react";
import { proxyGet } from "../utils/tmdbProxy";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Types
interface Movie {
  id: number;
  title: string;
  release_date: string;
  poster_path: string;
  overview: string;
}
interface Series {
  id: number;
  name: string;
  first_air_date: string;
  poster_path: string;
  overview: string;
}

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w300";

export default function TrackerPage() {
  const [moviesWant, setMoviesWant] = useState<Movie[]>([]);
  const [moviesWatched, setMoviesWatched] = useState<Movie[]>([]);
  const [seriesWant, setSeriesWant] = useState<Series[]>([]);
  const [seriesWatched, setSeriesWatched] = useState<Series[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [error, setError] = useState("");
  const [errorSeries, setErrorSeries] = useState("");

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await proxyGet<{ results: Movie[] }>("/v1/tmdb/3/movie/popular");
        setMoviesWant(data.results || []);
      } catch (e: any) {
        setError("Failed to load movies.");
      } finally {
        setLoading(false);
      }
    };
    const fetchSeries = async () => {
      setLoadingSeries(true);
      setErrorSeries("");
      try {
        const data = await proxyGet<{ results: Series[] }>("/v1/tmdb/3/tv/popular");
        setSeriesWant(data.results || []);
      } catch (e: any) {
        setErrorSeries("Failed to load series.");
      } finally {
        setLoadingSeries(false);
      }
    };

    fetchMovies();
    fetchSeries();
  }, []);

  // Move functions
  function markMovieAsWatched(movie: Movie) {
    setMoviesWant((prev) => prev.filter((m) => m.id !== movie.id));
    setMoviesWatched((prev) => [...prev, movie]);
  }
  function moveMovieToWantList(movie: Movie) {
    setMoviesWatched((prev) => prev.filter((m) => m.id !== movie.id));
    setMoviesWant((prev) => [...prev, movie]);
  }
  function markSeriesAsWatched(series: Series) {
    setSeriesWant((prev) => prev.filter((s) => s.id !== series.id));
    setSeriesWatched((prev) => [...prev, series]);
  }
  function moveSeriesToWantList(series: Series) {
    setSeriesWatched((prev) => prev.filter((s) => s.id !== series.id));
    setSeriesWant((prev) => [...prev, series]);
  }

  const email = localStorage.getItem("user_email");

  return (
    <>
      {/* MAIN FIX: Added overflow-x-hidden to prevent horizontal scroll */}
      <div className="w-full overflow-x-hidden">

        {/* Added max-w-full to prevent overflow */}
        <Tabs defaultValue="movies" className="my-8 max-w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="series">Series</TabsTrigger>
          </TabsList>

          {/* MOVIES TAB */}
          <TabsContent value="movies">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Want to Watch - added overflow-hidden */}
              <Card className="p-4 overflow-hidden">
                <h2 className="font-semibold mb-2">Want to Watch</h2>
                {loading ? (
                  <div>Loading movies...</div>
                ) : error ? (
                  <div className="text-red-500">{error}</div>
                ) : moviesWant.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No movies in this list.</p>
                ) : (
                  <ul>
                    {moviesWant.map((movie) => (
                      <li key={movie.id} className="mb-3 flex items-center gap-3 justify-between">
                        <div className="flex gap-2 items-center min-w-0">
                          {movie.poster_path && (
                            <img
                              src={`${IMAGE_BASE_URL}${movie.poster_path}`}
                              alt={movie.title}
                              className="w-10 h-14 object-cover rounded flex-shrink-0"
                            />
                          )}
                          <div className="flex flex-col min-w-0">
                            {/* Added truncate and max-width for long titles */}
                            <span className="font-semibold truncate max-w-[120px] sm:max-w-[180px]">{movie.title}</span>
                            <span className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[180px]">
                              {movie.release_date}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="whitespace-nowrap flex-shrink-0"
                          onClick={() => markMovieAsWatched(movie)}
                        >
                          Mark as Watched
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* Watched - added overflow-hidden */}
              <Card className="p-4 overflow-hidden">
                <h2 className="font-semibold mb-2">Watched</h2>
                {moviesWatched.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No movies watched yet.</p>
                ) : (
                  <ul>
                    {moviesWatched.map((movie) => (
                      <li key={movie.id} className="mb-3 flex items-center gap-3 justify-between">
                        <div className="flex gap-2 items-center min-w-0">
                          {movie.poster_path && (
                            <img
                              src={`${IMAGE_BASE_URL}${movie.poster_path}`}
                              alt={movie.title}
                              className="w-10 h-14 object-cover rounded flex-shrink-0"
                            />
                          )}
                          <div className="flex flex-col min-w-0">
                            {/* Added truncate and max-width for long titles */}
                            <span className="font-semibold truncate max-w-[120px] sm:max-w-[180px]">{movie.title}</span>
                            <span className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[180px]">
                              {movie.release_date}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="whitespace-nowrap flex-shrink-0"
                          onClick={() => moveMovieToWantList(movie)}
                        >
                          Move to Want List
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* SERIES TAB */}
          <TabsContent value="series">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Want to Watch - added overflow-hidden */}
              <Card className="p-4 overflow-hidden">
                <h2 className="font-semibold mb-2">Want to Watch</h2>
                {loadingSeries ? (
                  <div>Loading series...</div>
                ) : errorSeries ? (
                  <div className="text-red-500">{errorSeries}</div>
                ) : seriesWant.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No series in this list.</p>
                ) : (
                  <ul>
                    {seriesWant.map((series) => (
                      <li key={series.id} className="mb-3 flex items-center gap-3 justify-between">
                        <div className="flex gap-2 items-center min-w-0">
                          {series.poster_path && (
                            <img
                              src={`${IMAGE_BASE_URL}${series.poster_path}`}
                              alt={series.name}
                              className="w-10 h-14 object-cover rounded flex-shrink-0"
                            />
                          )}
                          <div className="flex flex-col min-w-0">
                            {/* Added truncate and max-width for long titles */}
                            <span className="font-semibold truncate max-w-[120px] sm:max-w-[180px]">{series.name}</span>
                            <span className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[180px]">
                              {series.first_air_date}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="whitespace-nowrap flex-shrink-0"
                          onClick={() => markSeriesAsWatched(series)}
                        >
                          Mark as Watched
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* Watched - added overflow-hidden */}
              <Card className="p-4 overflow-hidden">
                <h2 className="font-semibold mb-2">Watched</h2>
                {seriesWatched.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No series watched yet.</p>
                ) : (
                  <ul>
                    {seriesWatched.map((series) => (
                      <li key={series.id} className="mb-3 flex items-center gap-3 justify-between">
                        <div className="flex gap-2 items-center min-w-0">
                          {series.poster_path && (
                            <img
                              src={`${IMAGE_BASE_URL}${series.poster_path}`}
                              alt={series.name}
                              className="w-10 h-14 object-cover rounded flex-shrink-0"
                            />
                          )}
                          <div className="flex flex-col min-w-0">
                            {/* Added truncate and max-width for long titles */}
                            <span className="font-semibold truncate max-w-[120px] sm:max-w-[180px]">{series.name}</span>
                            <span className="text-xs text-gray-400 truncate max-w-[120px] sm:max-w-[180px]">
                              {series.first_air_date}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="whitespace-nowrap flex-shrink-0"
                          onClick={() => moveSeriesToWantList(series)}
                        >
                          Move to Want List
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
