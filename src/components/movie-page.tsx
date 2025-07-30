import { useParams } from "react-router-dom";
import { useEffect, useState, type SetStateAction } from "react";
import { proxyGet } from "@/utils/tmdbProxy";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Star, Clock, Calendar, Info, Popcorn, User, Users, Film, X, ArrowLeft, Share2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { MovieCard } from "./movie-card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Bookmark, CheckCircle, Edit, Trash2, Loader2, Pencil } from "lucide-react";
import PersonDrawer from "./person-drawer";
import { RecommendDrawer } from "./recommend-drawer";

interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  genres: { id: number; name: string }[];
  runtime: number;
  status: string;
  tagline?: string;
  revenue?: number;
  budget?: number;
  original_language?: string;
  belongs_to_collection?: {
    id: number;
    name: string;
    poster_path: string;
    backdrop_path: string;
  };
}

interface Credit {
  id: number;
  name: string;
  character?: string;
  job?: string;
  profile_path: string;
  known_for_department: string;
}

interface Credits {
  cast: Credit[];
  crew: Credit[];
}

interface Collection {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  parts: {
    overview: string;
    vote_average: number;
    id: number;
    title: string;
    poster_path: string;
    release_date: string;
  }[];
}

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export default function MoviePage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [movieStatus, setMovieStatus] = useState<"want" | "watched" | null>(null);
  const [loadingStatus, setLoadingStatus] = useState<"want" | "watched" | "delete" | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userReview, setUserReview] = useState("");
  const [showWatchedModal, setShowWatchedModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tempRating, setTempRating] = useState<number | null>(null);
  const [tempReview, setTempReview] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [isPersonDrawerOpen, setIsPersonDrawerOpen] = useState(false);
  const [isRecommendOpen, setIsRecommendOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [movieData, creditsData] = await Promise.all([
          proxyGet<Movie>(`/v1/tmdb/3/movie/${id}`),
          proxyGet<Credits>(`/v1/tmdb/3/movie/${id}/credits`),
        ]);

        setMovie(movieData);
        setCredits(creditsData);

        if (movieData.belongs_to_collection) {
          try {
            const collectionData = await proxyGet<Collection>(
              `/v1/tmdb/3/collection/${movieData.belongs_to_collection.id}`
            );
            setCollection(collectionData);
          } catch (err) {
            console.error("Error loading collection:", err);
          }
        }
      } catch (err) {
        console.error("Error loading movie:", err);
        setError("Failed to load movie.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const formatCurrency = (value: number | undefined): string => {
    if (!value) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatRuntime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Get top 10 cast members
  const topCast = credits?.cast.slice(0, 10) || [];

  // Get top crew members (directors, producers, writers)
  const topCrew =
    credits?.crew
      .filter((person) => ["Director", "Producer", "Writer", "Screenplay"].includes(person.job || ""))
      .slice(0, 6) || [];

  const handlePersonClick = (personId: number) => {
    setSelectedPersonId(personId);
    setIsPersonDrawerOpen(true);
  };

  const closePersonDrawer = () => {
    setIsPersonDrawerOpen(false);
    setSelectedPersonId(null);
  };

  useEffect(() => {
    const fetchMovieStatus = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("user_movies")
        .select("status, rating, review")
        .eq("user_id", user.id)
        .eq("movie_id", movie?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Fetch error:", error.message);
        return;
      }

      if (data?.status === "want" || data?.status === "watched") {
        setMovieStatus(data.status);
        setUserRating(data.rating ?? null);
        setUserReview(data.review ?? "");
      } else {
        setMovieStatus(null);
      }
    };

    if (movie?.id) fetchMovieStatus();
  }, [movie?.id]);

  // Add or update movie
  const handleAddMovie = async (status: "want" | "watched", rating?: number | null, review?: string) => {
    try {
      setLoadingStatus(status);
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) {
        toast.error("You must be logged in.");
        return;
      }

      // Top 6 cast members: { id, name, profile_path }
      const topCast =
        credits?.cast?.slice(0, 6).map((person) => ({
          id: person.id,
          name: person.name,
          profile_path: person.profile_path,
        })) || [];

      // Top 3 directors: { id, name, profile_path }
      const topDirectors =
        credits?.crew
          ?.filter((person) => person.job === "Director")
          .slice(0, 3)
          .map((person) => ({
            id: person.id,
            name: person.name,
            profile_path: person.profile_path,
          })) || [];

      // Genres: { id, name }
      const genres =
        movie?.genres?.map((genre) => ({
          id: genre.id,
          name: genre.name,
        })) || [];

      const overview = movie?.overview?.slice(0, 200) || "";

      const payload: any = {
        user_id: user.id,
        movie_id: movie?.id,
        title: movie?.title,
        poster_path: movie?.poster_path,
        release_date: movie?.release_date,
        runtime: movie?.runtime,
        status,
        watched_at: status === "watched" ? new Date().toISOString() : null,
        genres,
        cast: topCast,
        directors: topDirectors,
        overview,
      };

      if (status === "watched") {
        payload.rating = rating ?? tempRating;
        payload.review = review ?? tempReview;
      }

      const { error } = await supabase.from("user_movies").upsert(payload, { onConflict: "user_id, movie_id" });

      if (error) throw error;

      toast.success(`Movie added to ${status === "want" ? "Want" : "Watched"} list`);
      setMovieStatus(status);
      setUserRating(rating ?? tempRating);
      setUserReview(review ?? tempReview);
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Error saving movie.");
    } finally {
      setLoadingStatus(null);
    }
  };

  // Delete movie from user_movies
  const handleDeleteMovie = async () => {
    try {
      setLoadingStatus("delete");
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) {
        toast.error("You must be logged in.");
        return;
      }

      const { error } = await supabase.from("user_movies").delete().eq("user_id", user.id).eq("movie_id", movie?.id);

      if (error) throw error;

      toast.success("Movie removed from your list.");
      setMovieStatus(null);
      setUserRating(null);
      setUserReview("");
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Error removing movie.");
    } finally {
      setLoadingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="w-full md:w-1/3 h-[500px] rounded-xl" />
            <div className="w-full md:w-2/3 space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-1/3" />
              </div>
              <div className="flex flex-wrap gap-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-20 rounded-full" />
                ))}
              </div>
              <Separator className="my-4" />
              <div className="space-y-3">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex flex-wrap gap-4 mt-8">
                <Skeleton className="h-10 w-32 rounded-full" />
                <Skeleton className="h-10 w-32 rounded-full" />
              </div>

              {/* Skeleton for new sections */}
              <Skeleton className="h-6 w-1/4 mt-12" />
              <div className="flex gap-4 overflow-x-auto pb-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center flex-shrink-0 w-24">
                    <Skeleton className="rounded-full w-20 h-20 mb-2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>

              <Skeleton className="h-6 w-1/4 mt-8" />
              <div className="flex gap-4 overflow-x-auto pb-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center flex-shrink-0 w-24">
                    <Skeleton className="rounded-full w-20 h-20 mb-2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="p-4 max-w-4xl mx-auto h-[60vh] flex flex-col items-center justify-center text-center">
        <Info className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{error || "Movie not found"}</h2>
        <p className="text-muted-foreground mb-6">We couldn't find the movie you're looking for.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <Button variant="ghost" onClick={() => window.history.back()} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>
      <div className="px-4 lg:px-6">
        {/* Backdrop */}
        {/* {movie.backdrop_path && (
        <div className="relative rounded-xl overflow-hidden mb-8 h-64 md:h-80">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
          <img
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
            alt={`${movie.title} backdrop`}
            className="w-full h-full object-cover"
          />
        </div>
      )} */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="w-full md:w-1/3">
            <Card className="overflow-hidden border-0 shadow-lg py-0">
              {movie.poster_path ? (
                <img
                  src={`${IMAGE_BASE_URL}${movie.poster_path}`}
                  alt={movie.title}
                  className="w-full object-cover rounded-lg"
                />
              ) : (
                <div className="bg-muted border rounded-xl w-full aspect-[2/3] flex items-center justify-center">
                  <Popcorn className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </Card>
          </div>

          {/* Movie Details */}
          <div className="w-full md:w-2/3">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight">{movie.title}</CardTitle>

                {movie.tagline && (
                  <CardDescription className="text-lg italic text-muted-foreground">"{movie.tagline}"</CardDescription>
                )}

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                  </div>

                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>

                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  {movie.genres.map((genre) => (
                    <Badge key={genre.id} variant="secondary" className="px-3 py-1 text-sm font-medium">
                      {genre.name}
                    </Badge>
                  ))}
                </div>

                <h3 className="text-lg font-semibold mb-3">Overview</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {movie.overview || "No overview available."}
                </p>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-full">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium">{movie.status}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-medium">{formatCurrency(movie.budget)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-full">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                      <p className="font-medium">{formatCurrency(movie.revenue)}</p>
                    </div>
                  </div>

                  {movie.original_language && (
                    <div className="flex items-center gap-3">
                      <div className="bg-muted p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="2" y1="12" x2="22" y2="12"></line>
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Language</p>
                        <p className="font-medium">{movie.original_language.toUpperCase()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 mt-4">
                <div className="flex flex-col gap-4 w-full">
                  {movieStatus === "want" ? (
                    <div className="flex flex-col items-center gap-4 p-4 bg-secondary/50 rounded-xl border">
                      <div className="flex items-center gap-2 text-primary">
                        <Bookmark className="w-5 h-5" />
                        <span className="font-medium">This movie is in your Want List</span>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" onClick={handleDeleteMovie} disabled={loadingStatus === "delete"}>
                          {loadingStatus === "delete" ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          Remove
                        </Button>
                        <Button onClick={() => setShowWatchedModal(true)} disabled={loadingStatus === "watched"}>
                          {loadingStatus === "watched" ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Mark as Watched
                        </Button>
                      </div>
                    </div>
                  ) : movieStatus === "watched" ? (
                    <div className="flex flex-col gap-4 p-4 bg-success/10 rounded-xl border">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">You've watched this movie</span>
                      </div>

                      {(userRating !== null || userReview) && (
                        <div className="p-3 bg-background rounded-lg border">
                          {userRating !== null && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-5 h-5 ${
                                      i < Math.floor(userRating / 2)
                                        ? "fill-yellow-500 text-yellow-500"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="font-medium">{userRating}/10</span>
                            </div>
                          )}
                          {userReview && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-foreground mb-1">Your review:</p>
                              <p className="text-muted-foreground">"{userReview}"</p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <Button variant="outline" onClick={handleDeleteMovie} disabled={loadingStatus === "delete"}>
                          {loadingStatus === "delete" ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          Remove
                        </Button>
                        <Button variant="secondary" onClick={() => setShowEditModal(true)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit Review
                        </Button>
                        <Button onClick={() => handleAddMovie("want")} disabled={loadingStatus === "want"}>
                          {loadingStatus === "want" ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Bookmark className="w-4 h-4 mr-2" />
                          )}
                          Move to Want List
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 py-5"
                          onClick={() => handleAddMovie("want")}
                          disabled={loadingStatus === "want"}
                        >
                          {loadingStatus === "want" ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Bookmark className="w-4 h-4 mr-2" />
                          )}
                          Want to Watch
                        </Button>
                        <Button
                          className="flex-1 py-5"
                          onClick={() => {
                            setShowWatchedModal(true);
                            // Reset temp review state when opening modal
                            setTempRating(null);
                            setTempReview("");
                          }}
                          disabled={loadingStatus === "watched"}
                        >
                          {loadingStatus === "watched" ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Watched
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                <Button variant="secondary" onClick={() => setIsRecommendOpen(true)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Recommend
                </Button>
                {/* Watched Modal */}
                <Dialog open={showWatchedModal} onOpenChange={setShowWatchedModal}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Mark as Watched
                      </DialogTitle>
                      <DialogDescription>Share your thoughts about this movie</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="rating">Your Rating</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider
                            id="rating"
                            min={0}
                            max={10}
                            step={1}
                            value={[tempRating || 0]}
                            onValueChange={(val: SetStateAction<number | null>[]) => setTempRating(val[0])}
                          />
                          <span className="w-12 text-center font-medium">{tempRating || 0}/10</span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="review">Your Review</Label>
                        <Textarea
                          id="review"
                          value={tempReview}
                          onChange={(e: { target: { value: SetStateAction<string> } }) => setTempReview(e.target.value)}
                          placeholder="What did you think of this movie?"
                          className="mt-2 min-h-[100px]"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowWatchedModal(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          handleAddMovie("watched", tempRating, tempReview);
                          setShowWatchedModal(false);
                        }}
                        disabled={loadingStatus === "watched"}
                      >
                        {loadingStatus === "watched" ? "Saving..." : "Save & Mark as Watched"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Edit Modal */}
                <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl flex items-center gap-2">
                        <Edit className="w-5 h-5 text-blue-600" />
                        Edit Your Review
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="edit-rating">Your Rating</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <Slider
                            id="edit-rating"
                            min={0}
                            max={10}
                            step={1}
                            value={[tempRating || 0]}
                            onValueChange={(val: SetStateAction<number | null>[]) => setTempRating(val[0])}
                          />
                          <span className="w-12 text-center font-medium">{tempRating || 0}/10</span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="edit-review">Your Review</Label>
                        <Textarea
                          id="edit-review"
                          value={tempReview}
                          onChange={(e: { target: { value: SetStateAction<string> } }) => setTempReview(e.target.value)}
                          placeholder="Update your thoughts..."
                          className="mt-2 min-h-[100px]"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowEditModal(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          handleAddMovie("watched", tempRating, tempReview);
                          setShowEditModal(false);
                        }}
                        disabled={loadingStatus === "watched"}
                      >
                        {loadingStatus === "watched" ? "Updating..." : "Update Review"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {isRecommendOpen && (
                  <RecommendDrawer
                    open={isRecommendOpen}
                    onClose={() => setIsRecommendOpen(false)}
                    movie={{
                      id: movie.id,
                      title: movie.title,
                      poster_path: movie.poster_path,
                      release_date: movie.release_date,
                    }}
                  />
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
        {/* Collection Section */}
        {collection && collection.parts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <Film className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">The {collection.name} Collection</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4">
              {collection.parts.map((item) => (
                <MovieCard
                  key={item.id}
                  id={item.id}
                  title={item.title || "Untitled"}
                  poster_path={item.poster_path || ""}
                  release_date={item.release_date || "N/A"}
                  vote_average={item.vote_average || 0}
                  overview={item.overview || "No description available."}
                  highlight={item.id === movie.id} // optional custom prop for 'Current' badge
                />
              ))}
            </div>
          </div>
        )}
        {/* Cast & Crew Section */}
        <div className="mt-12">
          <div className="mb-10">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" /> Cast
            </h3>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-6 pb-4">
                {topCast.map((person) => (
                  <div
                    key={person.id}
                    className="flex flex-col items-center gap-2 w-24 flex-shrink-0 group cursor-pointer"
                    onClick={() => handlePersonClick(person.id)}
                  >
                    <div className="rounded-full w-20 h-20 overflow-hidden border-2 border-gray-200 group-hover:border-primary transition-colors">
                      {person.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="bg-gray-200 border-2 border-dashed rounded-full w-full h-full flex items-center justify-center text-gray-400">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-medium group-hover:text-primary transition-colors">{person.name}</p>
                      {person.character && (
                        <p className="text-xs text-muted-foreground truncate w-full">{person.character}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" /> Crew
            </h3>
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-6 pb-4">
                {topCrew.map((person) => (
                  <div
                    key={person.id}
                    className="flex flex-col items-center gap-2 w-24 flex-shrink-0 group cursor-pointer"
                    onClick={() => handlePersonClick(person.id)}
                  >
                    <div className="rounded-full w-20 h-20 overflow-hidden border-2 border-gray-200 group-hover:border-primary transition-colors">
                      {person.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="bg-gray-200 border-2 border-dashed rounded-full w-full h-full flex items-center justify-center text-gray-400">
                          <User className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-medium group-hover:text-primary transition-colors">{person.name}</p>
                      {person.job && <p className="text-xs text-muted-foreground truncate w-full">{person.job}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <PersonDrawer personId={selectedPersonId} isOpen={isPersonDrawerOpen} onClose={closePersonDrawer} />
      </div>
    </div>
  );
}
