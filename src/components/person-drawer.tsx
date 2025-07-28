import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { X, User, Info, Star, Film } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { proxyGet } from "../utils/tmdbProxy";
import { Skeleton } from "@/components/ui/skeleton";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

interface PersonDetail {
  id: number;
  name: string;
  biography: string;
  profile_path: string;
  birthday: string;
  place_of_birth: string;
  known_for_department: string;
}

interface PersonMovieCredit {
  id: number;
  title: string;
  poster_path: string;
  character: string;
  release_date: string;
  vote_average: number;
}

interface PersonDrawerProps {
  personId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

function PersonDrawer({ personId, isOpen, onClose }: PersonDrawerProps) {
  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [personMovies, setPersonMovies] = useState<PersonMovieCredit[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!personId || !isOpen) return;

    const fetchPersonData = async () => {
      setIsLoading(true);
      try {
        const [personData, movieCredits] = await Promise.all([
          proxyGet<PersonDetail>(`/v1/tmdb/3/person/${personId}`),
          proxyGet<{ cast: PersonMovieCredit[] }>(`/v1/tmdb/3/person/${personId}/movie_credits`),
        ]);

        setPerson(personData);
        // Sort movies by release date (newest first)
        const sortedMovies = [...movieCredits.cast].sort(
          (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
        );
        setPersonMovies(sortedMovies);
      } catch (err) {
        console.error("Error loading person details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPersonData();
  }, [personId, isOpen]);

  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open: any) => !open && onClose()}>
      <DrawerContent className="!fixed !top-[-10%] !h-auto !max-h-[100vh]">
        <div className="flex flex-col h-full overflow-y-auto">
          <DrawerHeader className="border-b px-6 py-4 bg-muted/30">
            <div className="flex justify-between items-start">
              <div>
                <DrawerTitle className="text-2xl font-bold">{person?.name || "Person Details"}</DrawerTitle>
                <DrawerDescription>{person?.known_for_department || "Loading..."}</DrawerDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DrawerHeader>

          <div className="p-6 space-y-10">
            {isLoading ? (
              <div className="p-4 space-y-6">
                <div className="flex gap-8">
                  <Skeleton className="w-32 h-32 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-6 w-1/4 mb-4" />
                  <div className="flex gap-4 overflow-x-auto">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-32 flex-shrink-0 space-y-2">
                        <Skeleton className="w-24 h-36 rounded-lg mx-auto" />
                        <Skeleton className="h-4 w-20 mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : person ? (
              <>
                {/* Profile & Bio Section */}
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex flex-col items-center">
                    {person.profile_path ? (
                      <img
                        src={`${IMAGE_BASE_URL}${person.profile_path}`}
                        alt={person.name}
                        className="rounded-full w-40 h-40 object-cover mb-4 shadow-lg"
                      />
                    ) : (
                      <div className="rounded-full w-40 h-40 bg-gray-200 flex items-center justify-center mb-4">
                        <User className="w-20 h-20 text-gray-400" />
                      </div>
                    )}
                    <div className="text-center text-sm text-muted-foreground">
                      {person.birthday && (
                        <div>
                          <p className="font-medium">Born</p>
                          <p>
                            {formatDate(person.birthday)}
                            {person.place_of_birth && ` • ${person.place_of_birth}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-3">Biography</h3>
                    {person.biography ? (
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                        {person.biography.length > 800 ? person.biography.slice(0, 800) + "…" : person.biography}
                      </p>
                    ) : (
                      <p className="italic text-muted-foreground">No biography available.</p>
                    )}
                  </div>
                </div>

                {/* Filmography Section */}
                {personMovies.length > 0 && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4">🎬 Filmography</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                      {personMovies.map((movie) => (
                        <Link to={`/movie/${movie.id}`} key={movie.id} className="group" onClick={onClose}>
                          <Card className="border hover:shadow transition-shadow py-0">
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
                              {movie.character && (
                                <p className="text-xs text-muted-foreground truncate mt-1">as {movie.character}</p>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center mt-10">
                <Info className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold">Person details not available</h3>
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

export default PersonDrawer;
