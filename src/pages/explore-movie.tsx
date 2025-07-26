import { useEffect, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { proxyGet } from "../utils/tmdbProxy";
import { MovieCard } from "../components/movie-card";
import { Skeleton } from "@/components/ui/skeleton";

const IMAGE_BASE = "https://image.tmdb.org/t/p/";
const POSTER = IMAGE_BASE + "w300";
const BACKDROP = IMAGE_BASE + "w1280"; // hero banner

type Item = {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview: string;
  release_date?: string;
  vote_average: number;
};

/* ---------- helper to render any scroll row ---------- */
const Row = ({ title, items, path, loading }: { title: string; items: Item[]; path: string; loading?: boolean }) => (
  <div>
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <Link to={path} className="text-sm text-blue-600 hover:underline">
        View More →
      </Link>
    </div>

    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-4 pb-4 min-w-max">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[225px] w-[150px] rounded-lg shrink-0" />
            ))
          : items.map((m) => (
              <MovieCard
                key={m.id}
                id={m.id}
                title={m.title || "Untitled"}
                poster_path={m.poster_path ? POSTER + m.poster_path : ""}
                release_date={m.release_date || "—"}
                vote_average={m.vote_average}
                overview={m.overview}
              />
            ))}
      </div>
    </div>
  </div>
);

/* ---------- component ---------- */
export default function ExploreMovie() {
  /* state buckets */
  const [hero, setHero] = useState<Item | null>(null);
  const [topMovies, setTopMovies] = useState<Item[]>([]);
  const [popularMovies, setPopularMovies] = useState<Item[]>([]);
  const [latestMovies, setLatestMovies] = useState<Item[]>([]);
  const [trendingToday, setTrendingToday] = useState<Item[]>([]);
  const [upcoming, setUpcoming] = useState<Item[]>([]);
  const [actionMovies, setActionMovies] = useState<Item[]>([]);
  const [comedyMovies, setComedyMovies] = useState<Item[]>([]);
  const [collections, setCollections] = useState<Item[][]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  /* fetch once on mount */
  useEffect(() => {
    (async () => {
      try {
        const [
          topM,
          popularM,
          latestM,
          trending,
          upComing,
          actionM,
          comedyM,
          hpCollection,
          batmanCollection,
          matrixCollection,
          marvelCollection,
        ] = await Promise.all([
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/movie/top_rated"),
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/movie/popular"),
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/movie/now_playing"),
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/trending/movie/day"),
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/movie/upcoming"),
          proxyGet<{ results: Item[] }>(
            "/v1/tmdb/3/discover/movie?with_genres=28" // action
          ),
          proxyGet<{ results: Item[] }>(
            "/v1/tmdb/3/discover/movie?with_genres=35" // comedy
          ),
          proxyGet<{ parts: Item[] }>("/v1/tmdb/3/collection/1241"), // Harry Potter
          proxyGet<{ parts: Item[] }>("/v1/tmdb/3/collection/263"), // Dark Knight
          proxyGet<{ parts: Item[] }>("/v1/tmdb/3/collection/131292"), // Marvel Disney+ Shows
          proxyGet<{ parts: Item[] }>("/v1/tmdb/3/collection/2344"), // Star-Wars Live Action
        ]);

        setHero(trending.results[0]);
        setTopMovies(topM.results);
        setPopularMovies(popularM.results);
        setLatestMovies(latestM.results);
        setTrendingToday(trending.results);
        setUpcoming(upComing.results);
        setActionMovies(actionM.results);
        setComedyMovies(comedyM.results);
        setCollections([hpCollection.parts, batmanCollection.parts, matrixCollection.parts, marvelCollection.parts]);
      } catch (err) {
        console.error(err);
        setError("Failed to load content.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ------------ UI ------------ */
  return (
    <div className="flex flex-1 flex-col gap-8 py-4 md:gap-10 md:py-8">
      {error && <div className="text-red-500 mb-4 p-4 bg-red-50 rounded-lg">{error}</div>}

      {/* ---------- HERO ---------- */}
      <section className="relative h-[250px] md:h-[380px] rounded-xl overflow-hidden shadow">
        {hero ? (
          <Fragment>
            <img
              src={BACKDROP + hero.backdrop_path}
              alt={hero.title}
              className="h-full w-full object-cover object-center"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-8 text-white max-w-sm">
              <h2 className="text-lg md:text-2xl font-bold mb-1">{hero.title}</h2>
              <p className="text-sm line-clamp-2 md:line-clamp-3">{hero.overview}</p>
              <Link
                to={`/movie/${hero.id}`}
                className="mt-3 inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded"
              >
                Details
              </Link>
            </div>
          </Fragment>
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </section>

      {/* rows */}
      <Row title="Trending Today" items={trendingToday} loading={loading} path="/explore/movies/trending" />
      <Row title="Upcoming" items={upcoming} loading={loading} path="/explore/movies/upcoming" />
      <Row title="Top Rated" items={topMovies} loading={loading} path="/explore/movies/top" />
      <Row title="Popular" items={popularMovies} loading={loading} path="/explore/movies/popular" />
      <Row title="Now Playing" items={latestMovies} loading={loading} path="/explore/movies/latest" />
      <Row title="Action Hits" items={actionMovies} loading={loading} path="/explore/movies/action" />
      <Row title="Comedy Picks" items={comedyMovies} loading={loading} path="/explore/movies/comedy" />

      {/* ---------- COLLECTION SHOWCASE ---------- */}
      <h2 className="text-xl font-semibold mt-6">Iconic Collections</h2>
      {collections.map((col, idx) => (
        <Row
          key={idx}
          title={idx === 0 ? "Harry Potter Collection" : idx === 1 ? "Dark Knight Trilogy" : idx === 2 ? "Iron Man Trilogy" : "Matrix Trilogy"}
          items={col}
          loading={loading}
          path={`/explore/movies/collection/${idx + 1}`}
        />
      ))}
    </div>
  );
}
