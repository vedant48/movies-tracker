import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X, Film, Star, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { proxyGet } from "../utils/tmdbProxy";
import { Skeleton } from "@/components/ui/skeleton";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

interface GenreDrawerProps {
  genreId: number | null;
  genreName: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  vote_average: number;
}

function GenreDrawer({ genreId, genreName, isOpen, onClose }: GenreDrawerProps) {
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
  const [latestMovies, setLatestMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!genreId || !isOpen) return;

    const fetchGenreMovies = async () => {
      setIsLoading(true);
      try {
        const [topRated, latest] = await Promise.all([
          proxyGet<{ results: Movie[] }>(
            `/v1/tmdb/3/discover/movie?with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=100`
          ),
          proxyGet<{ results: Movie[] }>(`/v1/tmdb/3/discover/movie?with_genres=${genreId}&sort_by=release_date.desc`),
        ]);

        setTopMovies(topRated.results.slice(0, 16));
        setLatestMovies(latest.results.slice(0, 16));
      } catch (err) {
        console.error("Error fetching genre movies:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGenreMovies();
  }, [genreId, isOpen]);

  return (
    <Drawer open={isOpen} onOpenChange={(open: any) => !open && onClose()}>
      <DrawerContent className="!fixed !top-[-10%] !h-auto !max-h-[100vh]">
        <div className="flex flex-col h-full overflow-y-auto">
          <DrawerHeader className="border-b px-6 py-4 bg-muted/30">
            <div className="flex justify-between items-start">
              <div>
                <DrawerTitle className="text-2xl font-bold">{genreName}</DrawerTitle>
                <DrawerDescription>Genre Highlights</DrawerDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DrawerHeader>

          <div className="p-6 space-y-10">
            {isLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-6 w-1/3 mb-4" />
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-full space-y-2">
                      <Skeleton className="w-full h-52 rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Top Rated Movies */}
                {topMovies.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Top Rated Movies</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                      {topMovies.map((movie) => (
                        <Link to={`/movie/${movie.id}`} key={movie.id} onClick={onClose}>
                          <Card className="hover:shadow transition-shadow py-0">
                            {movie.poster_path ? (
                              <img
                                src={`${IMAGE_BASE_URL}${movie.poster_path}`}
                                alt={movie.title}
                                className="rounded-t w-full h-52 object-cover"
                              />
                            ) : (
                              <div className="bg-muted w-full h-52 flex items-center justify-center">
                                <Film className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                            <CardContent className="p-2">
                              <h4 className="text-sm font-semibold truncate">{movie.title}</h4>
                              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                <span>{movie.release_date?.slice(0, 4) || "N/A"}</span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                  {movie.vote_average.toFixed(1)}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Latest Movies */}
                {latestMovies.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Latest Releases</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                      {latestMovies.map((movie) => (
                        <Link to={`/movie/${movie.id}`} key={movie.id} onClick={onClose}>
                          <Card className="hover:shadow transition-shadow py-0">
                            {movie.poster_path ? (
                              <img
                                src={`${IMAGE_BASE_URL}${movie.poster_path}`}
                                alt={movie.title}
                                className="rounded-t w-full h-52 object-cover"
                              />
                            ) : (
                              <div className="bg-muted w-full h-52 flex items-center justify-center">
                                <Film className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                            <CardContent className="p-2">
                              <h4 className="text-sm font-semibold truncate">{movie.title}</h4>
                              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                                <span>{movie.release_date?.slice(0, 4) || "N/A"}</span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                  {movie.vote_average.toFixed(1)}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!isLoading && !topMovies.length && !latestMovies.length && (
              <div className="text-center mt-10">
                <Info className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold">No movies found for this genre</h3>
                <Button variant="outline" className="mt-4" onClick={onClose}>
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default GenreDrawer;
