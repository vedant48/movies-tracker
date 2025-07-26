import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Follower {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  email: string;
}

interface FollowersDrawerProps {
  profileUserId: string;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFollowerRemoved: () => void;
}

export function FollowersDrawer({
  profileUserId,
  currentUserId,
  open,
  onOpenChange,
  onFollowerRemoved,
}: FollowersDrawerProps) {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isRemoving, setIsRemoving] = useState<Record<string, boolean>>({});

  const getInitials = (name?: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const fetchFollowers = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("follower: profiles!follows_follower_id_fkey (*)")
        .eq("followee_id", profileUserId);

      if (error) throw error;

      const fetchedFollowers = data.map((item: any) => item.follower);
      setFollowers(fetchedFollowers);
    } catch (error) {
      console.error("Error fetching followers:", error);
      toast.error("Failed to load followers");
    } finally {
      setIsFetching(false);
    }
  };

  const handleRemoveFollower = async (followerId: string) => {
    setIsRemoving((prev) => ({ ...prev, [followerId]: true }));
    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", followerId)
        .eq("followee_id", profileUserId);

      if (error) throw error;

      setFollowers((prev) => prev.filter((f) => f.id !== followerId));
      onFollowerRemoved();
      toast.success("Follower removed");
    } catch (error) {
      console.error("Error removing follower:", error);
      toast.error("Failed to remove follower");
    } finally {
      setIsRemoving((prev) => ({ ...prev, [followerId]: false }));
    }
  };

  useEffect(() => {
    if (open) {
      fetchFollowers();
    }
  }, [open, profileUserId]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!fixed !top-[-10%] !h-auto !max-h-[100vh]">
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader className="flex justify-between items-center">
            <div>
              <DrawerTitle className="text-xl flex items-center gap-2">
                <span>👥</span> Followers
              </DrawerTitle>
              <DrawerDescription>{followers.length} people following this user</DrawerDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-5 h-5" />
            </Button>
          </DrawerHeader>

          <div className="p-4">
            {isFetching ? (
              <div className="space-y-4 py-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-9 w-24 rounded-md" />
                  </div>
                ))}
              </div>
            ) : followers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">👤</div>
                <h3 className="text-lg font-medium">No followers yet</h3>
                <p className="text-muted-foreground">Followers will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {followers.map((follower) => (
                  <div
                    key={follower.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Link
                      to={`/profile/${follower.id}`}
                      className="flex items-center gap-3 flex-1"
                      onClick={() => onOpenChange(false)}
                    >
                      <Avatar className="w-12 h-12">
                        {follower.avatar_url ? (
                          <AvatarImage src={follower.avatar_url} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                            {getInitials(follower.full_name || follower.email)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {follower.full_name || (follower.email ? follower.email.split("@")[0] : "Unknown")}
                        </div>
                        <div className="text-sm text-muted-foreground">@{follower.username}</div>
                      </div>
                    </Link>
                    {currentUserId === profileUserId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFollower(follower.id)}
                        disabled={isRemoving[follower.id]}
                      >
                        {isRemoving[follower.id] ? "Removing..." : "Remove"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
