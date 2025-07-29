import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { IconTrendingUp, IconTrendingDown, IconArrowUpRight } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function SectionCards() {
  const [movieCount, setMovieCount] = useState(0);
  const [seriesCount, setSeriesCount] = useState(0);
  const [recommendationCount, setRecommendationCount] = useState(0);
  const [growthRate, setGrowthRate] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const userId = user.id;

      // Fetch watched series count
      const { count: seriesWatched } = await supabase
        .from("user_series")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "watched");

      const { data: watchedMovies = [], count: movieWatched } = await supabase
        .from("user_movies")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .eq("status", "watched");

      setMovieCount(movieWatched || 0);

      // Calculate average rating and total runtime
      let totalRating = 0;
      let ratedCount = 0;
      let totalRuntimeMinutes = 0;

      watchedMovies.forEach((movie: { rating: number | null | undefined; runtime: number }) => {
        if (movie.rating !== null && movie.rating !== undefined) {
          totalRating += movie.rating;
          ratedCount += 1;
        }
        if (movie.runtime) {
          totalRuntimeMinutes += movie.runtime;
        }
      });

      const averageRating = ratedCount > 0 ? totalRating / ratedCount : 0;
      const hoursWatched = totalRuntimeMinutes / 60;

      setAvgRating(Number(averageRating.toFixed(1)));
      setTotalHours(Number(hoursWatched.toFixed(1)));

      setSeriesCount(seriesWatched || 0);

      // Fetch recommendation count
      const { count: recCount } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("from", userId)
        .eq("type", "recommendation");

      setRecommendationCount(recCount || 0);

      // Calculate growth: new watched movies this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newMoviesThisMonth } = await supabase
        .from("user_movies")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "watched")
        .gte("created_at", startOfMonth.toISOString());

      const growth = movieWatched ? ((newMoviesThisMonth || 0) / movieWatched) * 100 : 0;

      setGrowthRate(Number(growth.toFixed(1)));
    };

    fetchData();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Watched Movies */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Watched Movies</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{movieCount}</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp className="w-4 h-4 mr-1" /> Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex items-center gap-2 font-medium">
            Keep it up! <IconArrowUpRight className="size-4" />
          </div>
          <div className="text-muted-foreground">Total movies you’ve watched.</div>
        </CardFooter>
      </Card>

      {/* Watched Series */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Watched Series</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{seriesCount}</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp className="w-4 h-4 mr-1" /> Engaged
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Binge-worthy stats <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Total series you’ve completed.</div>
        </CardFooter>
      </Card>

      {/* Recommendations Sent */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Recommendations Sent</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {recommendationCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp className="w-4 h-4 mr-1" /> Shared
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Nice! Sharing is caring. <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">You’ve recommended.</div>
        </CardFooter>
      </Card>

      {/* Growth Rate */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth This Month</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{growthRate}%</CardTitle>
          <CardAction>
            <Badge variant="outline">
              {growthRate >= 0 ? (
                <>
                  <IconTrendingUp className="w-4 h-4 mr-1" />+{growthRate}%
                </>
              ) : (
                <>
                  <IconTrendingDown className="w-4 h-4 mr-1" />
                  {growthRate}%
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            {growthRate >= 0 ? "Great Progress!" : "Let's Catch Up!"}
            {growthRate >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">Growth over last month</div>
        </CardFooter>
      </Card>

      {/* Average Rating Card */}
      <Card className="@container/card">
        <CardHeader>
            <CardDescription>Avg. Rating</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {avgRating ? `${avgRating}/10` : "N/A"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {avgRating >= 7 ? (
                <>
                  <IconTrendingUp className="w-4 h-4 mr-1" /> Good Taste!
                </>
              ) : (
                <>
                  <IconTrendingDown className="w-4 h-4 mr-1" /> Could Improve
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">{avgRating >= 7 ? "Great ratings overall" : "Mixed ratings"}</div>
          <div className="text-muted-foreground">Based on your rated movies.</div>
        </CardFooter>
      </Card>

      {/* Total Hours Watched Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Hours Watched</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">{totalHours} hrs</CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp className="w-4 h-4 mr-1" /> Movie Buff!
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">
            Great watch time <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Total hours spent watching movies.</div>
        </CardFooter>
      </Card>
    </div>
  );
}
