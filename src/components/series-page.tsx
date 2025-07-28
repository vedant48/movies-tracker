import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { proxyGet } from "@/utils/tmdbProxy";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Star, Clock, Calendar, Play, Info, Popcorn, User, Users, Check, Plus, Bookmark, List } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import PersonDrawer from "./person-drawer";
// import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface Series {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
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
  created_by?: { id: number; name: string; profile_path: string }[];
  production_companies?: { id: number; name: string; logo_path: string }[];
  seasons?: {
    id: number;
    season_number: number;
    poster_path: string;
    name: string;
    overview: string;
    air_date: string;
  }[];
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

interface Seasons {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string;
  poster_path: string;
}

interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  runtime: number;
  still_path: string;
  vote_average: number;
}

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export default function SeriesPage() {
  const { id: seriesId } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<Series | null>(null);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [episodesBySeason, setEpisodesBySeason] = useState<Record<number, Episode[]>>({});
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [activeSeason, setActiveSeason] = useState<number>(1);
  const [error, setError] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [isPersonDrawerOpen, setIsPersonDrawerOpen] = useState(false);
  //  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userSeriesStatus, setUserSeriesStatus] = useState<"want" | "watching" | "watched" | null>(null);
  const [userSeasons, setUserSeasons] = useState<Record<number, any>>({});
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<number>>(new Set());
  const [isSeasonDrawerOpen, setIsSeasonDrawerOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [seasonRating, setSeasonRating] = useState<number | null>(null);
  const [seasonReview, setSeasonReview] = useState<string>("");
  const [totalAiredEpisodes, setTotalAiredEpisodes] = useState(0);
  const [watchedEpisodeCount, setWatchedEpisodeCount] = useState(0);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUserId || !seriesId) return;

    // Fetch user series status
    const fetchUserSeriesStatus = async () => {
      const { data, error } = await supabase
        .from("user_series")
        .select("status")
        .eq("user_id", currentUserId)
        .eq("series_id", parseInt(seriesId))
        .single();

      if (error && error.code !== "PGRST116") {
        // Ignore not found error
        console.error("Error fetching series status:", error);
      } else {
        setUserSeriesStatus(data?.status || null);
      }
    };

    // Fetch user seasons
    const fetchUserSeasons = async () => {
      const { data, error } = await supabase
        .from("user_seasons")
        .select("season_number, status, rating, review")
        .eq("user_id", currentUserId)
        .eq("series_id", parseInt(seriesId));

      if (error) {
        console.error("Error fetching seasons:", error);
      } else {
        const seasonsMap = data.reduce((acc, row) => {
          acc[row.season_number] = row;
          return acc;
        }, {});
        setUserSeasons(seasonsMap);
      }
    };

    fetchUserSeriesStatus();
    fetchUserSeasons();
  }, [currentUserId, seriesId]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [seriesData, creditsData] = await Promise.all([
          proxyGet<Series>(`/v1/tmdb/3/tv/${seriesId}`),
          proxyGet<Credits>(`/v1/tmdb/3/tv/${seriesId}/credits`),
        ]);

        setSeries(seriesData);
        setCredits(creditsData);
        const validSeasons = seriesData.seasons?.filter((s: Seasons) => s.season_number > 0) || [];
        if (validSeasons.length > 0) {
          const firstValidSeason = validSeasons[0];
          setActiveSeason(firstValidSeason.season_number);
          fetchSeasonEpisodes(firstValidSeason.season_number);
        }
      } catch (err) {
        console.error("Error loading series:", err);
        setError("Failed to load series.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [seriesId]);

  const fetchSeasonEpisodes = async (seasonNumber: number) => {
    if (episodesBySeason[seasonNumber]) return;

    setLoadingEpisodes(true);
    try {
      const data = await proxyGet<{ episodes: Episode[] }>(`/v1/tmdb/3/tv/${seriesId}/season/${seasonNumber}`);
      setEpisodesBySeason((prev) => ({
        ...prev,
        [seasonNumber]: data.episodes,
      }));

      // Fetch watched episodes for this season
      if (currentUserId && seriesId) {
        const { data: watchedData, error } = await supabase
          .from("user_episodes")
          .select("episode_id")
          .eq("user_id", currentUserId)
          .eq("series_id", parseInt(seriesId))
          .eq("season_number", seasonNumber);

        if (!error && watchedData) {
          setWatchedEpisodes((prev) => {
            const newSet = new Set(prev);
            watchedData.forEach((ep) => newSet.add(ep.episode_id));
            return newSet;
          });
        }
      }
    } catch (err) {
      console.error(`Error loading episodes for season ${seasonNumber}:`, err);
    } finally {
      setLoadingEpisodes(false);
    }
  };

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

  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  const handleSeasonClick = (seasonNumber: number) => {
    setActiveSeason(seasonNumber);
    fetchSeasonEpisodes(seasonNumber);
  };

  const addToWantList = async () => {
    if (!currentUserId || !series) return;

    const { error } = await supabase.from("user_series").upsert(
      {
        user_id: currentUserId,
        series_id: series.id,
        title: series.name,
        poster_path: series.poster_path,
        first_air_date: series.first_air_date,
        status: "want",
      },
      { onConflict: "user_id, series_id" }
    );

    if (error) {
      toast({ title: "Error", description: "Failed to add to want list", variant: "destructive" });
      console.error(error);
    } else {
      toast({ title: "Added to Want List", description: `${series.name} has been added to your want list` });
      setUserSeriesStatus("want");
    }
  };

  const fetchEpisodesForSeason = async (seasonNumber: number): Promise<Episode[]> => {
    try {
      const data = await proxyGet<{ episodes: Episode[] }>(`/v1/tmdb/3/tv/${seriesId}/season/${seasonNumber}`);
      return data.episodes;
    } catch (err) {
      console.error(`Error loading episodes for season ${seasonNumber}:`, err);
      return [];
    }
  };

  const markSeriesAsWatched = async () => {
    if (!currentUserId || !series) return;

    // Mark series as watched
    const { error: seriesError } = await supabase.from("user_series").upsert(
      {
        user_id: currentUserId,
        series_id: series.id,
        title: series.name,
        poster_path: series.poster_path,
        first_air_date: series.first_air_date,
        status: "watched",
      },
      { onConflict: "user_id, series_id" }
    );

    if (seriesError) {
      toast({ title: "Error", description: "Failed to mark series as watched", variant: "destructive" });
      console.error(seriesError);
      return;
    }

    // Mark all seasons as watched
    const seasons = series.seasons?.filter((s) => s.season_number > 0) || [];
    const newSeasons = { ...userSeasons };
    const allEpisodeIds: number[] = [];

    // Process all seasons in parallel
    const seasonPromises = seasons.map(async (season) => {
      // Mark season as watched
      await supabase.from("user_seasons").upsert(
        {
          user_id: currentUserId,
          series_id: series.id,
          season_number: season.season_number,
          status: "watched",
        },
        { onConflict: "user_id, series_id, season_number" }
      );

      // Update state immediately
      newSeasons[season.season_number] = { ...(newSeasons[season.season_number] || {}), status: "watched" };

      // Get episodes for this season
      let episodes: Episode[] = [];
      if (episodesBySeason[season.season_number]) {
        episodes = episodesBySeason[season.season_number];
      } else {
        episodes = await fetchEpisodesForSeason(season.season_number);
      }

      // Process aired episodes
      const airedEpisodes = episodes.filter((ep) => ep.air_date && new Date(ep.air_date) <= new Date());

      // Mark all aired episodes as watched
      const episodePromises = airedEpisodes.map((episode) =>
        supabase.from("user_episodes").upsert(
          {
            user_id: currentUserId,
            series_id: series.id,
            season_number: season.season_number,
            episode_number: episode.episode_number,
            episode_id: episode.id,
            title: episode.name,
            air_date: episode.air_date,
            status: "watched",
          },
          { onConflict: "user_id, episode_id" }
        )
      );

      await Promise.all(episodePromises);

      // Add to watched set
      airedEpisodes.forEach((ep) => allEpisodeIds.push(ep.id));
    });

    await Promise.all(seasonPromises);

    // Update UI state
    toast({ title: "Series Watched", description: `${series.name} has been marked as watched` });
    setUserSeriesStatus("watched");
    setUserSeasons(newSeasons);
    setWatchedEpisodes((prev) => new Set([...prev, ...allEpisodeIds]));
    setUserSeriesStatus("watched");
    setWatchedEpisodeCount(totalAiredEpisodes);
  };

  const removeFromList = async () => {
    if (!currentUserId || !series) return;

    // Delete series, seasons, and episodes
    await Promise.all([
      supabase.from("user_series").delete().eq("user_id", currentUserId).eq("series_id", series.id),
      supabase.from("user_seasons").delete().eq("user_id", currentUserId).eq("series_id", series.id),
      supabase.from("user_episodes").delete().eq("user_id", currentUserId).eq("series_id", series.id),
    ]);

    toast({ title: "Removed", description: `${series.name} has been removed from your lists` });
    setUserSeriesStatus(null);
    setUserSeasons({});
    setWatchedEpisodes(new Set());
    setWatchedEpisodeCount(0);
    setUserSeriesStatus(null);
  };

  // Season Actions
  const markSeasonAsWatched = async (seasonNumber: number) => {
    if (!currentUserId || !series) return;

    // Mark season as watched
    const { error: seasonError } = await supabase.from("user_seasons").upsert(
      {
        user_id: currentUserId,
        series_id: series.id,
        season_number: seasonNumber,
        status: "watched",
      },
      { onConflict: "user_id, series_id, season_number" }
    );

    if (seasonError) {
      toast({ title: "Error", description: "Failed to mark season as watched", variant: "destructive" });
      console.error(seasonError);
      return;
    }

    // Mark all aired episodes in the season as watched
    if (!episodesBySeason[seasonNumber]) {
      await fetchSeasonEpisodes(seasonNumber);
    }

    const episodes = episodesBySeason[seasonNumber] || [];
    const airedEpisodes = episodes.filter((ep) => ep.air_date && new Date(ep.air_date) <= new Date());

    for (const episode of airedEpisodes) {
      await supabase.from("user_episodes").upsert(
        {
          user_id: currentUserId,
          series_id: series.id,
          season_number: seasonNumber,
          episode_number: episode.episode_number,
          episode_id: episode.id,
          title: episode.name,
          air_date: episode.air_date,
          status: "watched",
        },
        { onConflict: "user_id, episode_id" }
      );
    }

    toast({ title: "Season Watched", description: `Season ${seasonNumber} has been marked as watched` });

    // Update state
    setUserSeasons((prev) => ({
      ...prev,
      [seasonNumber]: { ...(prev[seasonNumber] || {}), status: "watched" },
    }));

    // Update watched episodes
    const newWatchedEpisodes = new Set(watchedEpisodes);
    airedEpisodes.forEach((ep) => newWatchedEpisodes.add(ep.id));
    setWatchedEpisodes(newWatchedEpisodes);
  };

  const openSeasonRating = (seasonNumber: number) => {
    setSelectedSeason(seasonNumber);
    setSeasonRating(userSeasons[seasonNumber]?.rating || null);
    setSeasonReview(userSeasons[seasonNumber]?.review || "");
    setIsSeasonDrawerOpen(true);
  };

  const saveSeasonRating = async () => {
    if (!currentUserId || !series || selectedSeason === null) return;

    const { error } = await supabase.from("user_seasons").upsert(
      {
        user_id: currentUserId,
        series_id: series.id,
        season_number: selectedSeason,
        rating: seasonRating,
        review: seasonReview,
        status: "watched",
      },
      { onConflict: "user_id, series_id, season_number" }
    );

    if (error) {
      toast({ title: "Error", description: "Failed to save rating", variant: "destructive" });
      console.error(error);
    } else {
      toast({ title: "Rating Saved", description: `Your rating for season ${selectedSeason} has been saved` });
      setUserSeasons((prev) => ({
        ...prev,
        [selectedSeason]: { ...(prev[selectedSeason] || {}), rating: seasonRating, review: seasonReview },
      }));
      setIsSeasonDrawerOpen(false);
    }
  };

  // Episode Actions
  const toggleEpisodeWatched = async (episode: Episode) => {
    if (!currentUserId || !series) return;

    const isWatched = watchedEpisodes.has(episode.id);
    const episodeAired = episode.air_date && new Date(episode.air_date) <= new Date();
    if (isWatched) {
      setWatchedEpisodeCount((prev) => prev - 1);
    } else {
      setWatchedEpisodeCount((prev) => prev + 1);
    }
    if (!episodeAired) {
      toast({ title: "Episode Not Aired", description: "This episode hasn't aired yet", variant: "destructive" });
      return;
    }

    if (isWatched) {
      // Remove from watched
      const { error } = await supabase
        .from("user_episodes")
        .delete()
        .eq("user_id", currentUserId)
        .eq("episode_id", episode.id);

      if (error) {
        toast({ title: "Error", description: "Failed to mark episode as unwatched", variant: "destructive" });
        console.error(error);
      } else {
        // Update watched episodes
        const newWatched = new Set(watchedEpisodes);
        newWatched.delete(episode.id);
        setWatchedEpisodes(newWatched);

        // Recalculate season status
        updateSeasonStatus(episode.season_number);
      }
    } else {
      // Add to watched
      const { error } = await supabase.from("user_episodes").upsert(
        {
          user_id: currentUserId,
          series_id: series.id,
          season_number: episode.season_number,
          episode_number: episode.episode_number,
          episode_id: episode.id,
          title: episode.name,
          air_date: episode.air_date,
          status: "watched",
        },
        { onConflict: "user_id, episode_id" }
      );

      if (error) {
        toast({ title: "Error", description: "Failed to mark episode as watched", variant: "destructive" });
        console.error(error);
      } else {
        // Update watched episodes
        const newWatched = new Set(watchedEpisodes);
        newWatched.add(episode.id);
        setWatchedEpisodes(newWatched);

        // Update season status
        updateSeasonStatus(episode.season_number);
      }
    }
  };

  useEffect(() => {
    // Calculate total aired episodes when series data changes
    if (series && Object.keys(episodesBySeason).length > 0) {
      let total = 0;
      Object.values(episodesBySeason).forEach((seasonEpisodes) => {
        seasonEpisodes.forEach((ep) => {
          if (ep.air_date && new Date(ep.air_date) <= new Date()) {
            total++;
          }
        });
      });
      setTotalAiredEpisodes(total);
    }
  }, [series, episodesBySeason]);

  useEffect(() => {
    // Update watched episode count
    setWatchedEpisodeCount(watchedEpisodes.size);
  }, [watchedEpisodes]);

  const updateSeriesStatus = async () => {
    if (!currentUserId || !series) return;

    // Calculate watched percentage
    const percentage = totalAiredEpisodes > 0 ? Math.round((watchedEpisodeCount / totalAiredEpisodes) * 100) : 0;

    let newStatus = userSeriesStatus;

    if (watchedEpisodeCount === totalAiredEpisodes && totalAiredEpisodes > 0) {
      newStatus = "watched";
    } else if (watchedEpisodeCount > 0) {
      newStatus = "watching";
    } else {
      // Check if it's still in the want list
      const { data } = await supabase
        .from("user_series")
        .select("status")
        .eq("user_id", currentUserId)
        .eq("series_id", series.id);

      newStatus = data?.[0]?.status === "want" ? "want" : null;
    }

    // Update series status if changed
    if (newStatus !== userSeriesStatus) {
      if (newStatus) {
        await supabase.from("user_series").upsert(
          {
            user_id: currentUserId,
            series_id: series.id,
            title: series.name,
            poster_path: series.poster_path,
            first_air_date: series.first_air_date,
            status: newStatus,
          },
          { onConflict: "user_id, series_id" }
        );
      } else {
        await supabase.from("user_series").delete().eq("user_id", currentUserId).eq("series_id", series.id);
      }

      setUserSeriesStatus(newStatus);
    }
  };

  // Call this after any episode change
  useEffect(() => {
    if (series) {
      updateSeriesStatus();
    }
  }, [watchedEpisodeCount, totalAiredEpisodes]);

  if (loading) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
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
    );
  }

  if (error || !series) {
    return (
      <div className="p-4 max-w-4xl mx-auto h-[60vh] flex flex-col items-center justify-center text-center">
        <Info className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{error || "Series not found"}</h2>
        <p className="text-muted-foreground mb-6">We couldn't find the series you're looking for.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="w-full md:w-1/3">
            <Card className="overflow-hidden border-0 shadow-lg py-0">
              {series.poster_path ? (
                <img
                  src={`${IMAGE_BASE_URL}${series.poster_path}`}
                  alt={series.name}
                  className="w-full object-cover rounded-lg"
                />
              ) : (
                <div className="bg-muted border rounded-xl w-full aspect-[2/3] flex items-center justify-center">
                  <Popcorn className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </Card>
          </div>

          {/* Series Details */}
          <div className="w-full md:w-2/3">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight">{series.name}</CardTitle>

                {series.tagline && (
                  <CardDescription className="text-lg italic text-muted-foreground">"{series.tagline}"</CardDescription>
                )}

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 bg-primary/10 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{series.vote_average.toFixed(1)}</span>
                  </div>

                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{new Date(series.first_air_date).getFullYear()}</span>
                  </div>

                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{formatRuntime(series.runtime)}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  {series.genres.map((genre) => (
                    <Badge key={genre.id} variant="secondary" className="px-3 py-1 text-sm font-medium">
                      {genre.name}
                    </Badge>
                  ))}
                </div>

                <h3 className="text-lg font-semibold mb-3">Overview</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {series.overview || "No overview available."}
                </p>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-full">
                      <Info className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium">{series.status}</p>
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
                      <p className="font-medium">{formatCurrency(series.budget)}</p>
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
                      <p className="font-medium">{formatCurrency(series.revenue)}</p>
                    </div>
                  </div>

                  {series.original_language && (
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
                        <p className="font-medium">{series.original_language.toUpperCase()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-wrap gap-3 mt-4">
                <Button className="gap-2">
                  <Play className="w-5 h-5" />
                  Watch Trailer
                </Button>
                {currentUserId ? (
                  <div className="flex flex-col gap-4 w-full">
                    <div className="flex items-center gap-4">
                      {userSeriesStatus ? (
                        <>
                          <Button variant="default" className="gap-2 flex-1">
                            <Check className="w-4 h-4" />
                            {userSeriesStatus === "want"
                              ? "Want to Watch"
                              : `Watched (${watchedEpisodeCount}/${totalAiredEpisodes})`}
                          </Button>
                          <Button variant="outline" onClick={removeFromList}>
                            Remove
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="outline" className="gap-2 flex-1" onClick={addToWantList}>
                            <Bookmark className="w-4 h-4" />
                            Want to Watch
                          </Button>
                          <Button variant="default" className="gap-2 flex-1" onClick={markSeriesAsWatched}>
                            <Check className="w-4 h-4" />
                            Mark as Watched
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Progress bar */}
                    {totalAiredEpisodes > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{
                            width: `${Math.min(100, Math.round((watchedEpisodeCount / totalAiredEpisodes) * 100))}%`,
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button variant="outline" disabled>
                    Sign in to track
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
        {/* Seasons Section */}
        {series.seasons && series.seasons.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Seasons</h2>
              {currentUserId && (
                <div className="flex gap-2">
                  {userSeasons[activeSeason]?.status === "watched" && (
                    <Button variant="outline" onClick={() => openSeasonRating(activeSeason)}>
                      <Star className="w-4 h-4 mr-2" />
                      Rate Season
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => markSeasonAsWatched(activeSeason)}
                    disabled={userSeasons[activeSeason]?.status === "watched"}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark Season Watched
                  </Button>
                </div>
              )}
            </div>

            {/* Season Tabs */}
            <div className="flex overflow-x-auto pb-2 mb-6 scrollbar-hide">
              {series.seasons.map((season) => (
                <Button
                  key={season.id}
                  variant={activeSeason === season.season_number ? "default" : "outline"}
                  className={`mr-2 rounded-full px-4 py-2 transition-all ${
                    activeSeason === season.season_number ? "font-bold" : ""
                  }`}
                  onClick={() => handleSeasonClick(season.season_number)}
                >
                  {season.name}
                  {userSeasons[season.season_number]?.status === "watched" && <Check className="w-4 h-4 ml-2" />}
                </Button>
              ))}
            </div>

            {/* Episodes List */}
            {loadingEpisodes ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center p-4 border rounded-lg">
                    <Skeleton className="w-16 h-16 rounded mr-4" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : episodesBySeason[activeSeason] ? (
              <div className="space-y-4">
                {episodesBySeason[activeSeason].map((episode) => {
                  const isWatched = watchedEpisodes.has(episode.id);
                  const episodeAired = episode.air_date && new Date(episode.air_date) <= new Date();

                  return (
                    <Card key={episode.id} className="hover:shadow-md transition-shadow py-0 group">
                      <CardContent className="p-4 flex items-start">
                        {episode.still_path ? (
                          <img
                            src={`${IMAGE_BASE_URL}${episode.still_path}`}
                            alt={episode.name}
                            className="w-24 h-24 rounded-lg object-cover mr-4"
                          />
                        ) : (
                          <div className="bg-muted border w-24 h-24 rounded-lg flex items-center justify-center mr-4">
                            <Play className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="text-lg font-semibold">
                              Episode {episode.episode_number}: {episode.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              {episode.runtime > 0 && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatRuntime(episode.runtime)}
                                </Badge>
                              )}
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(episode.air_date)}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-muted-foreground mt-2">
                            {episode.overview
                              ? episode.overview.length > 180
                                ? episode.overview.slice(0, 180) + "…"
                                : episode.overview
                              : "No description available."}
                          </p>

                          {currentUserId && (
                            <div className="mt-4 flex justify-end">
                              <Button
                                variant={isWatched ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleEpisodeWatched(episode)}
                                disabled={!episodeAired}
                              >
                                {isWatched ? (
                                  <>
                                    <Check className="w-4 h-4 mr-2" />
                                    Watched
                                  </>
                                ) : episodeAired ? (
                                  "Mark as Watched"
                                ) : (
                                  "Unaired"
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="w-12 h-12 mx-auto mb-2" />
                <p>No episodes found for this season</p>
              </div>
            )}
          </div>
        )}

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

          <div className="mb-10">
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

          {series.created_by && series.created_by.length > 0 && (
            <div className="mb-10">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" /> Created By
              </h3>
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-6 pb-4">
                  {series.created_by.map((creator) => (
                    <div
                      key={creator.id}
                      className="flex flex-col items-center gap-2 w-24 flex-shrink-0 group cursor-pointer"
                      onClick={() => handlePersonClick(creator.id)}
                    >
                      <div className="rounded-full w-20 h-20 overflow-hidden border-2 border-gray-200 group-hover:border-primary transition-colors">
                        {creator.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w200${creator.profile_path}`}
                            alt={creator.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="bg-gray-200 border-2 border-dashed rounded-full w-full h-full flex items-center justify-center text-gray-400">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="font-medium group-hover:text-primary transition-colors">{creator.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <PersonDrawer personId={selectedPersonId} isOpen={isPersonDrawerOpen} onClose={closePersonDrawer} />
      </div>
    </div>
  );
}
