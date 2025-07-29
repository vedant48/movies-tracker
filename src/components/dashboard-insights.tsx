import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";

export default function DashboardInsights() {
  const [genreData, setGenreData] = useState<{ [genre: string]: number }>({});
  const [topDirectors, setTopDirectors] = useState<string[]>([]);
  const [topActors, setTopActors] = useState<string[]>([]);
  const [genreScore, setGenreScore] = useState(0);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: movies, error } = await supabase
        .from("user_movies")
        .select("genres, cast, directors")
        .eq("user_id", user.id)
        .eq("status", "watched");

      if (error || !movies) return;

      const genreCount: { [genre: string]: number } = {};
      const directorCount: { [name: string]: number } = {};
      const actorCount: { [name: string]: number } = {};

      movies.forEach((movie) => {
        (movie.genres || []).forEach((genre: string) => {
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        });

        (movie.directors || []).forEach((name: string) => {
          directorCount[name] = (directorCount[name] || 0) + 1;
        });

        (movie.cast || []).forEach((name: string) => {
          actorCount[name] = (actorCount[name] || 0) + 1;
        });
      });

      const totalGenreCount = Object.values(genreCount).reduce((a, b) => a + b, 0);
      const diversityScore = Object.keys(genreCount).length / Math.max(totalGenreCount, 1);
      setGenreScore(Number((diversityScore * 100).toFixed(1)));

      const sortedGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]);
      const sortedDirectors = Object.entries(directorCount).sort((a, b) => b[1] - a[1]);
      const sortedActors = Object.entries(actorCount).sort((a, b) => b[1] - a[1]);

      setGenreData(Object.fromEntries(sortedGenres.slice(0, 5)));
      setTopDirectors(sortedDirectors.slice(0, 5).map(([name]) => name));
      setTopActors(sortedActors.slice(0, 5).map(([name]) => name));

      // Recommendations: genres with low count but watched at least once
      const genreThreshold = totalGenreCount / Object.keys(genreCount).length;
      const trendingGenres = sortedGenres
        .filter(([_, count]) => count <= genreThreshold)
        .map(([genre]) => genre)
        .slice(0, 3);
      setRecommendations(trendingGenres);
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 xl:grid-cols-3 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle>Genre Diversity Score</CardTitle>
          <CardDescription>How diverse are your movie genres?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mb-2">{genreScore}%</div>
          <Progress value={genreScore} />
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-2">Top Genres Watched</h4>
            <ul className="list-disc pl-5 space-y-1">
              {Object.entries(genreData).map(([genre, count]) => (
                <li key={genre} className="text-sm">
                  {genre} ({count}x)
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most Watched Directors</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-decimal pl-5 space-y-1">
            {topDirectors.map((name) => (
              <li key={name} className="text-sm">
                {name}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most Watched Actors</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-decimal pl-5 space-y-1">
            {topActors.map((name) => (
              <li key={name} className="text-sm">
                {name}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Recommendations Based on Trends</CardTitle>
          <CardDescription>Genres you explored less, try more!</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1">
            {recommendations.map((genre) => (
              <li key={genre} className="text-sm">
                {genre}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
