import { useState, useEffect, type SetStateAction } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Search, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Follower {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface RecommendDrawerProps {
  open: boolean;
  onClose: () => void;
  movie: {
    id: number;
    title: string;
    poster_path: string | null;
    release_date: string | null;
  };
}

export function RecommendDrawer({ open, onClose, movie }: RecommendDrawerProps) {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [alreadyRecommendedIds, setAlreadyRecommendedIds] = useState<Set<string>>(new Set());
  const [selectedFollowers, setSelectedFollowers] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    const fetchFollowers = async () => {
      setLoading(true);
      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch followers (simplified - you'll need your actual implementation)
        const { data, error } = await supabase
          .from("follows")
          .select("follower: profiles!follows_follower_id_fkey (*)")
          .eq("followee_id", user.id);

        if (error) throw error;

        setFollowers(data.map((item: any) => item.follower));
        const { data: existingRecs, error: existingError } = await supabase
          .from("notifications")
          .select("user_id")
          .eq("from", user.id)
          .eq("movie_id", movie.id)
          .eq("type", "recommendation");

        if (existingError) throw existingError;

        // Store recommended follower IDs in a Set
        const recommendedIds = new Set<string>(existingRecs.map((rec: { user_id: string }) => rec.user_id));
        setAlreadyRecommendedIds(recommendedIds);
      } catch (error) {
        console.error("Error fetching followers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [open]);

  const toggleFollower = (followerId: string) => {
    setSelectedFollowers((prev) =>
      prev.includes(followerId) ? prev.filter((id) => id !== followerId) : [...prev, followerId]
    );
  };


  const handleRecommend = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const senderName = user.user_metadata?.username || user.user_metadata?.full_name || user.email;
      for (const followerId of selectedFollowers) {
        await supabase.from("notifications").insert({
          user_id: followerId,
          type: "recommendation",
          movie_id: movie.id,
          movie_title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          from: user.id,
          from_name: senderName,
        });
      }

      onClose();
      toast.success(`Recommended to ${selectedFollowers.length} followers!`);
    } catch (error) {
      console.error("Error sending recommendation:", error);
      toast.error("Failed to send recommendation");
    }
  };

  const filteredFollowers = followers.filter((follower) =>
    follower.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>Recommend "{movie.title}"</DrawerTitle>
          <DrawerDescription>Select followers to recommend this movie to</DrawerDescription>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search followers..."
              className="pl-10"
              value={search}
              onChange={(e: { target: { value: SetStateAction<string> } }) => setSearch(e.target.value)}
            />
          </div>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading followers...</p>
            </div>
          ) : filteredFollowers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <User className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No followers found</p>
              {search && <p className="text-sm text-muted-foreground mt-2">No matches for "{search}"</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFollowers.map((follower) => {
                const isSelected = selectedFollowers.includes(follower.id);
                const isAlreadyRecommended = alreadyRecommendedIds.has(follower.id);

                return (
                  <div
                    key={follower.id}
                    className={`flex items-center gap-4 p-3 rounded-lg transition-colors
                      ${isAlreadyRecommended ? "bg-muted cursor-not-allowed opacity-50" : "cursor-pointer"}
                      ${!isAlreadyRecommended && isSelected ? "bg-primary/10" : ""}
                      ${!isAlreadyRecommended && !isSelected ? "hover:bg-muted" : ""}
                    `}
                    onClick={() => {
                      if (!isAlreadyRecommended) toggleFollower(follower.id);
                    }}
                  >
                    <Avatar className="h-12 w-12">
                      {follower.avatar_url ? (
                        <AvatarImage src={follower.avatar_url} alt={follower.username} />
                      ) : (
                        <AvatarFallback>{follower.username.charAt(0).toUpperCase()}</AvatarFallback>
                      )}
                    </Avatar>

                    <div className="flex-1">
                      <p className="font-medium">{follower.username}</p>
                      {isAlreadyRecommended && <p className="text-xs text-muted-foreground">Already recommended</p>}
                    </div>

                    {!isAlreadyRecommended && isSelected && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DrawerFooter className="pt-0">
          <Button onClick={handleRecommend} disabled={selectedFollowers.length === 0}>
            Send to {selectedFollowers.length} follower{selectedFollowers.length !== 1 ? "s" : ""}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
