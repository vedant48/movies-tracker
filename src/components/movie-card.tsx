import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MovieCardProps {
  id: number;
  title: string;
  poster_path: string;
  release_date: string;
  vote_average?: number;
  overview?: string;
  highlight?: boolean;
}

export function MovieCard({ id, title, poster_path, release_date, vote_average, overview, highlight }: MovieCardProps) {
  const releaseYear = release_date ? new Date(release_date).getFullYear() : "N/A";

  return (
    <Link to={`/movie/${id}`} className="group transition-transform hover:scale-105">
      <abbr title={title} className="block">
        <Card className="border-0 shadow-none overflow-hidden relative py-0">
          <div className="relative rounded-lg overflow-hidden aspect-[2/3]">
            {poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${poster_path}`}
                alt={title}
                className="rounded-lg w-full h-[225px] object-cover shadow-md group-hover:blur-sm transition-all duration-300"
              />
            ) : (
              <div className="bg-muted border-2 border-dashed rounded-xl w-full h-full flex items-center justify-center">
                <div className="text-muted-foreground text-center p-4">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto" />
                  <p className="mt-2 font-medium">No image</p>
                </div>
              </div>
            )}

            {/* Rating Badge */}
            {vote_average && (
              <div className="absolute top-2 right-2">
                <Badge variant="secondary">
                  <Star className="w-4 h-4 fill-white" />
                  {vote_average?.toFixed(1)}
                </Badge>
              </div>
            )}

            {/* Highlight Border */}
            {highlight && <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />}

            {/* Title + Year Overlay */}
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/70 to-transparent p-2 text-white z-10 transition-opacity duration-300 group-hover:opacity-0">
              <h3 className="font-semibold text-sm truncate">{title}</h3>
              <p className="text-xs text-white/80">{releaseYear}</p>
            </div>

            {/* Overview Hover Overlay */}
            <div className="absolute inset-0 bg-black/60 p-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <p className="text-sm text-white text-center line-clamp-5">
                {overview ? overview : "No description available."}
              </p>
            </div>
          </div>
        </Card>
      </abbr>
    </Link>
  );
}
