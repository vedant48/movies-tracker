import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Film, Star } from "lucide-react";
import { Badge } from "./ui/badge";

interface SeriesCardProps {
  id: number;
  name: string;
  poster_path: string;
  first_air_date: string;
  vote_average?: number;
  overview?: string;
}

export function SeriesCard({ id, name, poster_path, first_air_date, vote_average, overview }: SeriesCardProps) {
  return (
    <Link to={`/series/${id}`} className="group transition-transform hover:scale-105">
      <abbr title={name} className="block">
        <Card className="border-0 shadow-none overflow-hidden relative py-0">
          <div className="relative rounded-lg overflow-hidden aspect-[2/3]">
            {poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${poster_path}`}
                alt={name}
                className="rounded-lg w-full h-[225px] object-cover shadow-md group-hover:blur-sm transition-all duration-300"
              />
            ) : (
              <div className="bg-muted border-2 border-dashed rounded-xl w-full h-[225px] flex items-center justify-center">
                <Film className="w-12 h-12 text-muted-foreground" />
              </div>
            )}

            {/* Rating Badge */}
            <div className="absolute top-2 right-2">
              <Badge variant="secondary">
                <Star className="w-4 h-4 fill-white" />
                {vote_average?.toFixed(1)}
              </Badge>
            </div>

            {/* Title + Year Overlay */}
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/70 to-transparent p-2 text-white z-10 transition-opacity duration-300 group-hover:opacity-0">
              <h3 className="font-semibold text-sm truncate">{name}</h3>
              <p className="text-xs text-white/80">{first_air_date}</p>
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
