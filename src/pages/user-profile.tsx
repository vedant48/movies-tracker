import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Heart, Eye, Users, Film } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MovieCard } from "@/components/movie-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FollowersDrawer } from "../components/follower-drawer";
import { FollowingDrawer } from "../components/following-drawer";

type Movie = {
  id: number;
  movie_id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
};

type Series = {
  id: number;
  series_id: number;
  title: string;
  poster_path?: string;
  release_date?: string;
};

export default function UserProfilePage() {
  const { userId } = useParams();
  console.log("User ID from params:", userId);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    wantList: 0,
    watchedMovies: 0,
    watchedSeries: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFollowersDrawerOpen, setIsFollowersDrawerOpen] = useState(false);
  const [isFollowingDrawerOpen, setIsFollowingDrawerOpen] = useState(false);

  const [watchedMoviesList, setWatchedMoviesList] = useState<Movie[]>([]);
  const [watchedSeriesList, setWatchedSeriesList] = useState<Series[]>([]);
  const [wantMoviesList, setWantMoviesList] = useState<Movie[]>([]);
  const [wantSeriesList, setWantSeriesList] = useState<Series[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        setIsCurrentUser(currentUser?.id === userId);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch movie/series stats and lists
        const [
          { count: followersCount },
          { count: followingCount },
          { count: wantMoviesCount, data: wantMovies },
          { count: watchedMoviesCount, data: watchedMovies },
          { count: wantSeriesCount, data: wantSeries },
          { count: watchedSeriesCount, data: watchedSeries },
          { data: followStatus },
        ] = await Promise.all([
          supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", userId),
          supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
          supabase.from("user_movies").select("*").eq("user_id", userId).eq("status", "want"),
          supabase.from("user_movies").select("*").eq("user_id", userId).eq("status", "watched"),
          supabase.from("user_series").select("*").eq("user_id", userId).eq("status", "want"),
          supabase.from("user_series").select("*").eq("user_id", userId).eq("status", "watched"),
          currentUser?.id
            ? supabase.from("follows").select("*").eq("follower_id", currentUser.id).eq("followee_id", userId).single()
            : Promise.resolve({ data: null }),
        ]);

        setIsFollowing(!!followStatus?.data);

        setStats({
          followers: followersCount || 0,
          following: followingCount || 0,
          wantList: (wantMoviesCount || 0) + (wantSeriesCount || 0),
          watchedMovies: watchedMoviesCount || 0,
          watchedSeries: watchedSeriesCount || 0,
        });

        // Set fetched lists
        setWantMoviesList(wantMovies || []);
        setWatchedMoviesList(watchedMovies || []);
        setWantSeriesList(wantSeries || []);
        setWatchedSeriesList(watchedSeries || []);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Could not load profile");
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) fetchProfile();
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!userId) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You need to sign in to follow users");
        return;
      }

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("followee_id", userId);

        if (error) throw error;

        setIsFollowing(false);
        setStats((prev) => ({ ...prev, followers: prev.followers - 1 }));
        toast.success("Unfollowed successfully");
      } else {
        // Follow
        const { error } = await supabase.from("follows").insert({
          follower_id: user.id,
          followee_id: userId,
        });

        if (error) throw error;

        setIsFollowing(true);
        setStats((prev) => ({ ...prev, followers: prev.followers + 1 }));
        toast.success("You're now following this user");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Could not update follow status");
    }
  };

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "US"
    );
  };

  const handleFollowerRemoved = () => {
    setStats((prev) => ({ ...prev, followers: prev.followers - 1 }));
  };

  const handleUnfollowed = () => {
    setStats((prev) => ({ ...prev, following: prev.following - 1 }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <Skeleton className="w-32 h-32 rounded-full mx-auto md:mx-0" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />

                <div className="flex flex-wrap gap-6 mt-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-4 w-16 mt-2" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        <Card className="p-8 text-center max-w-md">
          <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground mb-6">
            The user profile you're looking for doesn't exist or may have been removed.
          </p>
          <Button asChild>
            <a href="/">Go to Home</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6 flex flex-1 flex-col gap-6">
        {/* Profile Header Card */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                {profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name || profile.username} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-4xl">
                    {getInitials(profile.full_name || profile.email)}
                  </AvatarFallback>
                )}
              </Avatar>

              {!isCurrentUser && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  className="mt-4 gap-2"
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? (
                    <>
                      <span>Following</span>
                      <Badge variant="secondary" className="px-1.5 py-0.5">
                        ✓
                      </Badge>
                    </>
                  ) : (
                    "Follow"
                  )}
                </Button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold">{profile.full_name || profile.email}</h1>
                  <Badge variant="secondary" className="px-3 py-1 text-sm">
                    @{profile.username || "user" + profile.id.slice(0, 6)}
                  </Badge>
                </div>

                <p className="text-muted-foreground">
                  Joined{" "}
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>

                <p className="mt-4 text-gray-700 dark:text-gray-300">
                  {profile.bio || "This user hasn't added a bio yet."}
                </p>
              </div>

              {/* Stats Section */}
              <div className="flex flex-wrap gap-6 mt-8">
                <div
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => setIsFollowersDrawerOpen(true)}
                >
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full">
                    <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="font-bold text-xl mt-2">{stats.followers}</span>
                  <span className="text-sm text-muted-foreground">Followers</span>
                </div>

                <div
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => setIsFollowingDrawerOpen(true)}
                >
                  <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full">
                    <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="font-bold text-xl mt-2">{stats.following}</span>
                  <span className="text-sm text-muted-foreground">Following</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="bg-rose-100 dark:bg-rose-900/30 p-3 rounded-full">
                    <Heart className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <span className="font-bold text-xl mt-2">{stats.wantList}</span>
                  <span className="text-sm text-muted-foreground">Want List</span>
                </div>

                <div className="flex flex-col items-center">
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full">
                    <Eye className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="font-bold text-xl mt-2">{stats.watchedMovies + stats.watchedSeries}</span>
                  <span className="text-sm text-muted-foreground">Watched</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Media Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
                  <Film className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Movies Watched</h3>
                  <p className="text-2xl font-bold">{stats.watchedMovies}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded-full">
                  <Film className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Series Watched</h3>
                  <p className="text-2xl font-bold">{stats.watchedSeries}</p>
                </div>
              </div>
            </Card>
          </div>
        </Card>
        {/* Additional Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" />
              Want List
            </h3>
            <p className="text-muted-foreground">
              {stats.wantList === 0
                ? "This user hasn't added anything to their want list yet."
                : `This user wants to watch ${stats.wantList} movies and series.`}
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-500" />
              Recently Watched
            </h3>
            <p className="text-muted-foreground">
              {stats.watchedMovies + stats.watchedSeries === 0
                ? "This user hasn't watched anything yet."
                : `This user has watched ${stats.watchedMovies} movies and ${stats.watchedSeries} series.`}
            </p>
          </Card>
        </div>

        <Tabs defaultValue="want" className="w-full mt-8">
          {/* Tab Headers */}
          <TabsList className="mb-4">
            <TabsTrigger value="want">Want to Watch</TabsTrigger>
            <TabsTrigger value="watched">Watched</TabsTrigger>
          </TabsList>

          {/* Want Tab Content */}
          <TabsContent value="want">
            {/* Want Movies */}
            {wantMoviesList.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Movies</h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                  {wantMoviesList.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      id={movie.movie_id}
                      title={movie.title}
                      poster_path={movie.poster_path || ""}
                      release_date={movie.release_date || ""}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Want Series */}
            {wantSeriesList.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Series</h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                  {wantSeriesList.map((series) => (
                    <MovieCard
                      key={series.id}
                      id={series.series_id}
                      title={series.title}
                      poster_path={series.poster_path || ""}
                      release_date={series.release_date || ""}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Watched Tab Content */}
          <TabsContent value="watched">
            {/* Watched Movies */}
            {watchedMoviesList.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Movies</h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                  {watchedMoviesList.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      id={movie.movie_id}
                      title={movie.title}
                      poster_path={movie.poster_path || ""}
                      release_date={movie.release_date || ""}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Watched Series */}
            {watchedSeriesList.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Series</h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                  {watchedSeriesList.map((series) => (
                    <MovieCard
                      key={series.id}
                      id={series.series_id}
                      title={series.title}
                      poster_path={series.poster_path || ""}
                      release_date={series.release_date || ""}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Followers Drawer */}
        <FollowersDrawer
          profileUserId={userId || ""}
          currentUserId={userId || ""}
          open={isFollowersDrawerOpen}
          onOpenChange={setIsFollowersDrawerOpen}
          onFollowerRemoved={handleFollowerRemoved}
        />

        {/* Following Drawer */}
        <FollowingDrawer
          profileUserId={userId || ""}
          currentUserId={userId || ""}
          open={isFollowingDrawerOpen}
          onOpenChange={setIsFollowingDrawerOpen}
          onUnfollowed={handleUnfollowed}
        />
      </div>
    </div>
  );
}
