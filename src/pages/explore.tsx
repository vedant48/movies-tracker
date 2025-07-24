import { useEffect, useState } from "react";
import { proxyGet } from "../utils/tmdbProxy";
import { Link } from "react-router-dom";

interface Item {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  overview: string;
  release_date?: string;
  first_air_date?: string;
}

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w300";

const Explore = () => {
  const [topMovies, setTopMovies] = useState<Item[]>([]);
  const [popularMovies, setPopularMovies] = useState<Item[]>([]);
  const [latestMovies, setLatestMovies] = useState<Item[]>([]);
  const [topTV, setTopTV] = useState<Item[]>([]);
  const [popularTV, setPopularTV] = useState<Item[]>([]);
  const [latestTV, setLatestTV] = useState<Item[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAll() {
      try {
        const [topM, popularM, latestM, topT, popularT, latestT] = await Promise.all([
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/movie/top_rated"),
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/movie/popular"),
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/movie/now_playing"),
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/tv/top_rated"),
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/tv/popular"),
          proxyGet<{ results: Item[] }>("/v1/tmdb/3/tv/on_the_air"),
        ]);

        setTopMovies(topM.results);
        setPopularMovies(popularM.results);
        setLatestMovies(latestM.results);
        setTopTV(topT.results);
        setPopularTV(popularT.results);
        setLatestTV(latestT.results);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load content.");
      }
    }

    fetchAll();
  }, []);

  const renderScrollSection = (title: string, items: Item[], path: string) => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link to={path} className="text-sm text-blue-600 hover:underline">
          View More →
        </Link>
      </div>

      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 pb-4 min-w-max">
          {items.map((item) => (
            <div key={item.id} className="w-[150px] flex-shrink-0">
              {item.poster_path && (
                <img
                  src={`${IMAGE_BASE_URL}${item.poster_path}`}
                  alt={item.title || item.name}
                  className="rounded-lg w-full h-[225px] object-cover mb-2 shadow-md hover:shadow-lg transition-shadow"
                />
              )}
              <div className="text-sm font-medium line-clamp-2 text-center px-1">{item.title || item.name}</div>
              <div className="text-xs text-gray-500 text-center mt-1">{item.release_date || item.first_air_date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      {error && <div className="text-red-500 mb-4 p-4 bg-red-50 rounded-lg">{error}</div>}

      <div className="space-y-8">
        {renderScrollSection("🎞️ Top Rated Movies", topMovies, "/explore/movies/top")}
        {renderScrollSection("🔥 Popular Movies", popularMovies, "/explore/movies/popular")}
        {renderScrollSection("🆕 Latest Movies", latestMovies, "/explore/movies/latest")}
        {renderScrollSection("📺 Top Rated Series", topTV, "/explore/tv/top")}
        {renderScrollSection("🔥 Popular Series", popularTV, "/explore/tv/popular")}
        {renderScrollSection("🆕 Latest Series", latestTV, "/explore/tv/latest")}
      </div>
    </div>
  );
};

export default Explore;
