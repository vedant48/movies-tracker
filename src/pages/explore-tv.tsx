import { useEffect, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { proxyGet } from "../utils/tmdbProxy";
import { SeriesCard } from "../components/series-card";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const IMG = "https://image.tmdb.org/t/p/";
const POSTER = IMG + "w300";
const BACKDROP = IMG + "w1280";

type Item = {
  id: number;
  name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  first_air_date?: string;
  overview: string;
  vote_average: number;
};

/* ───────────────── helper row component ───────────────── */
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
          : items.map((s) => (
              <SeriesCard
                key={s.id}
                id={s.id}
                name={s.name || "Untitled"}
                poster_path={s.poster_path ? POSTER + s.poster_path : ""}
                first_air_date={s.first_air_date || "—"}
                vote_average={s.vote_average}
                overview={s.overview}
              />
            ))}
      </div>
    </div>
  </div>
);

/* ───────────────── main component ───────────────── */
export default function ExploreTv() {
  const [hero, setHero] = useState<Item | null>(null);
  const [trending, setTrending] = useState<Item[]>([]);
  const [airingToday, setAiringToday] = useState<Item[]>([]);
  const [onTheAir, setOnTheAir] = useState<Item[]>([]);
  const [topRated, setTopRated] = useState<Item[]>([]);
  const [popular, setPopular] = useState<Item[]>([]);
  const [dramaShows, setDramaShows] = useState<Item[]>([]);
  const [comedyShows, setComedyShows] = useState<Item[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [trend, airing, onAir, top, pop, drama, comedy, starWars, marvel] = await Promise.all([
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/trending/tv/day"),
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/tv/airing_today"),
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/tv/on_the_air"),
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/tv/top_rated"),
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/tv/popular"),
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/discover/tv?with_genres=18"), // drama
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/discover/tv?with_genres=35"), // comedy
        ]);

        setHero(trend.results[0]);
        setTrending(trend.results);
        setAiringToday(airing.results);
        setOnTheAir(onAir.results);
        setTopRated(top.results);
        setPopular(pop.results);
        setDramaShows(drama.results);
        setComedyShows(comedy.results);
      } catch (e) {
        console.error(e);
        setError("Failed to load content.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-8 py-4 md:gap-10 md:py-8">
      {error && <div className="text-red-500 mb-4 p-4 bg-red-50 rounded-lg">{error}</div>}

      {/* ───────────── Hero Banner ───────────── */}
      <section className="relative h-[250px] md:h-[380px] rounded-xl overflow-hidden shadow">
        {hero ? (
          <Fragment>
            <img
              src={BACKDROP + hero.backdrop_path}
              alt={hero.name}
              className="h-full w-full object-cover object-center"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-8 text-white max-w-sm">
              <h2 className="text-lg md:text-2xl font-bold mb-1">{hero.name}</h2>
              <p className="text-sm line-clamp-2 md:line-clamp-3">{hero.overview}</p>
              <Link
                to={`/series/${hero.id}`}
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

      {/* ───────────── Rows ───────────── */}
      <Row title="Trending Today" items={trending} loading={loading} path="/explore/tv/trending" />
      <Row title="Airing Today" items={airingToday} loading={loading} path="/explore/tv/airing-today" />
      <Row title="Currently Airing" items={onTheAir} loading={loading} path="/explore/tv/on-the-air" />
      <Row title="Top Rated" items={topRated} loading={loading} path="/explore/tv/top" />
      <Row title="Popular" items={popular} loading={loading} path="/explore/tv/popular" />
      <Row title="Drama Picks" items={dramaShows} loading={loading} path="/explore/tv/drama" />
      <Row title="Comedy Corner" items={comedyShows} loading={loading} path="/explore/tv/comedy" />
    </div>
  );
}
