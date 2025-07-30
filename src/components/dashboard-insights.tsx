import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { User } from "lucide-react";
import PersonDrawer from "./person-drawer";
import { Badge } from "./ui/badge";
import GenreDrawer from "./genre-drawer";

type GenreInfo = { id: number; name: string; count: number };

export default function DashboardInsights() {
  const [genreData, setGenreData] = useState<GenreInfo[]>([]);
  const [recommendations, setRecommendations] = useState<GenreInfo[]>([]);
  const [topDirectors, setTopDirectors] = useState<any[]>([]);
  const [topCast, setTopCast] = useState<any[]>([]);
  const [genreScore, setGenreScore] = useState(0);
  const [selectedPersonId, setSelectedPersonId] = useState<number | null>(null);
  const [selectedDirectorId, setSelectedDirectorId] = useState<number | null>(null);
  const [isDirectorDrawerOpen, setDirectorDrawerOpen] = useState(false);
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [selectedGenreName, setSelectedGenreName] = useState<string | null>(null);
  const [isGenreDrawerOpen, setGenreDrawerOpen] = useState(false);

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

      const genreCount: { [name: string]: { id: number; count: number } } = {};
      const directorCount: { [name: string]: number } = {};
      const castCount: { [id: number]: { name: string; profile_path: string; count: number } } = {};

      movies.forEach((movie: { genres: any; directors: any; cast: any }) => {
        (movie.genres || []).forEach((genre: { id: number; name: string }) => {
          if (!genreCount[genre.name]) {
            genreCount[genre.name] = { id: genre.id, count: 0 };
          }
          genreCount[genre.name].count += 1;
        });

        (movie.directors || []).forEach((person: { name: string }) => {
          directorCount[person.name] = (directorCount[person.name] || 0) + 1;
        });

        (movie.cast || []).forEach((person: { id: number; name: string; profile_path: string }) => {
          if (!castCount[person.id]) {
            castCount[person.id] = { ...person, count: 0 };
          }
          castCount[person.id].count++;
        });
      });

      const totalGenreCount = Object.values(genreCount).reduce((a, b) => a + b.count, 0);
      const diversityScore = Object.keys(genreCount).length / Math.max(totalGenreCount, 1);
      setGenreScore(Number((diversityScore * 100).toFixed(1)));

      const sortedGenres = Object.entries(genreCount).sort((a, b) => b[1].count - a[1].count);
      const sortedDirectors = Object.entries(directorCount).sort((a, b) => b[1] - a[1]);
      const sortedCast = Object.values(castCount).sort((a, b) => b.count - a.count);

      setGenreData(
        sortedGenres.slice(0, 5).map(([name, { id, count }]) => ({
          id,
          name,
          count,
        }))
      );
      const directorDetails = sortedDirectors
        .slice(0, 5)
        .map(([name]) => {
          const movie = movies.find((m: { directors: any }) =>
            (m.directors || []).some((d: { name: string }) => d.name === name)
          );
          const person = movie?.directors?.find((d: { name: string }) => d.name === name);
          return person ? { ...person, count: directorCount[name] } : null;
        })
        .filter(Boolean);

      setTopDirectors(directorDetails);
      setTopCast(sortedCast.slice(0, 6));

      const genreThreshold = totalGenreCount / Object.keys(genreCount).length;
      const trendingGenres = sortedGenres
        .filter(([_, genreObj]) => genreObj.count <= genreThreshold)
        .slice(0, 3)
        .map(([name, { id, count }]) => ({ id, name, count }));
      setRecommendations(trendingGenres);
    };

    fetchStats();
  }, []);

  const handlePersonClick = (id: number) => setSelectedPersonId(id);
  const closePersonDrawer = () => setSelectedPersonId(null);
  const handleDirectorClick = (id: number) => {
    setSelectedDirectorId(id);
    setDirectorDrawerOpen(true);
  };
  const handleGenreClick = (id: number, name: string) => {
    setSelectedGenreId(id);
    setSelectedGenreName(name);
    setGenreDrawerOpen(true);
  };

  const closeDirectorDrawer = () => {
    setDirectorDrawerOpen(false);
    setSelectedDirectorId(null);
  };

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
              {genreData.map((genre) => (
                <li key={genre.name}>
                  <Badge
                    variant="secondary"
                    className="px-3 py-1 text-sm font-medium cursor-pointer"
                    onClick={() => handleGenreClick(genre.id, genre.name)}
                  >
                    {genre.name} ({genre.count}x)
                  </Badge>
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
        <CardContent className="flex gap-4 overflow-x-auto">
          {topDirectors.map((person) => (
            <div
              key={person}
              className="flex flex-col items-center gap-2 w-24 flex-shrink-0 group cursor-pointer"
              onClick={() => handleDirectorClick(person.id)}
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
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most Watched Actors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
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
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-3">
        <CardHeader>
          <CardTitle>Recommendations Based on Trends</CardTitle>
          <CardDescription>Genres you explored less, try more!</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2 pl-1">
            {recommendations.map((genre) => (
              <li key={genre.name}>
                <Badge
                  variant="secondary"
                  className="px-3 py-1 text-sm font-medium cursor-pointer"
                  onClick={() => handleGenreClick(genre.id, genre.name)}
                >
                  {genre.name}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {selectedPersonId && (
        <PersonDrawer personId={selectedPersonId} isOpen={!!selectedPersonId} onClose={closePersonDrawer} />
      )}
      {isDirectorDrawerOpen && (
        <PersonDrawer personId={selectedDirectorId} isOpen={isDirectorDrawerOpen} onClose={closeDirectorDrawer} />
      )}
      {isGenreDrawerOpen && (
        <GenreDrawer
          genreId={selectedGenreId}
          genreName={selectedGenreName || ""}
          isOpen={isGenreDrawerOpen}
          onClose={() => setGenreDrawerOpen(false)}
        />
      )}
    </div>
  );
}
