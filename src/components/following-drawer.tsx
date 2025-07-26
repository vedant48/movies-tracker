import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface Followee {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  email: string;
}

interface FollowingDrawerProps {
  profileUserId: string;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnfollowed: () => void;
}

export function FollowingDrawer({
  profileUserId,
  currentUserId,
  open,
  onOpenChange,
  onUnfollowed,
}: FollowingDrawerProps) {
  const [following, setFollowing] = useState<Followee[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isUnfollowing, setIsUnfollowing] = useState<Record<string, boolean>>({});

  const getInitials = (name?: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const fetchFollowing = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("followee: profiles!follows_followee_id_fkey (*)")
        .eq("follower_id", profileUserId);

      if (error) throw error;

      const fetchedFollowing = data.map((item: any) => item.followee);
      setFollowing(fetchedFollowing);
    } catch (error) {
      console.error("Error fetching following:", error);
      toast.error("Failed to load following");
    } finally {
      setIsFetching(false);
    }
  };

  const handleUnfollow = async (followeeId: string) => {
    setIsUnfollowing((prev) => ({ ...prev, [followeeId]: true }));
    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", profileUserId)
        .eq("followee_id", followeeId);

      if (error) throw error;

      setFollowing((prev) => prev.filter((f) => f.id !== followeeId));
      onUnfollowed();
      toast.success("Unfollowed successfully");
    } catch (error) {
      console.error("Error unfollowing:", error);
      toast.error("Failed to unfollow");
    } finally {
      setIsUnfollowing((prev) => ({ ...prev, [followeeId]: false }));
    }
  };

  useEffect(() => {
    if (open) {
      fetchFollowing();
    }
  }, [open, profileUserId]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="!fixed !top-[-10%] !h-auto !max-h-[100vh]">
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader className="flex justify-between items-center">
            <div>
              <DrawerTitle className="text-xl flex items-center gap-2">
                <span>👤</span> Following
              </DrawerTitle>
              <DrawerDescription>Following {following.length} people</DrawerDescription>
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
            ) : following.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">👥</div>
                <h3 className="text-lg font-medium">Not following anyone yet</h3>
                <p className="text-muted-foreground">Followed users will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {following.map((followee) => (
                  <div
                    key={followee.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Link
                      to={`/profile/${followee.id}`}
                      className="flex items-center gap-3 flex-1"
                      onClick={() => onOpenChange(false)}
                    >
                      <Avatar className="w-12 h-12">
                        {followee.avatar_url ? (
                          <AvatarImage src={followee.avatar_url} />
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                            {getInitials(followee.full_name || followee.email)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {followee.full_name || (followee.email ? followee.email.split("@")[0] : "Unknown")}
                        </div>
                        <div className="text-sm text-muted-foreground">@{followee.username}</div>
                      </div>
                    </Link>
                    {currentUserId === profileUserId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnfollow(followee.id)}
                        disabled={isUnfollowing[followee.id]}
                      >
                        {isUnfollowing[followee.id] ? "Unfollowing..." : "Unfollow"}
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
