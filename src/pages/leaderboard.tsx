import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc("get_leaderboard_data", { search_term: `%${search}%` });

      if (error) {
        toast.error("Error fetching leaderboard");
        console.error(error);
        setError("Failed to load leaderboard.");
        setLoading(false);
        return;
      }

      const sorted = data.sort((a, b) => b.total_runtime - a.total_runtime);
      setUsers(sorted);
      setLoading(false);
    };

    fetchLeaderboard();
  }, [search]);

  useEffect(() => {
    const fetchFollowing = async () => {
      if (!currentUserId) return;

      const { data, error } = await supabase.from("follows").select("followee_id").eq("follower_id", currentUserId);
      if (error) return;

      const ids = new Set(data.map((item) => item.followee_id));
      setFollowingIds(ids);
    };

    fetchFollowing();
  }, [currentUserId]);

  const toggleFollow = async (targetId: string) => {
    if (!currentUserId) return;

    const followAction = followingIds.has(targetId) ? "unfollow" : "follow";

    const { error } =
      followAction === "unfollow"
        ? await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("followee_id", targetId)
        : await supabase.from("follows").insert({ follower_id: currentUserId, followee_id: targetId });

    if (error) {
      toast.error(`Failed to ${followAction}`);
      return;
    }

    toast.success(followAction === "follow" ? "Followed" : "Unfollowed");
    setFollowingIds((prev) => {
      const copy = new Set(prev);
      followAction === "follow" ? copy.add(targetId) : copy.delete(targetId);
      return copy;
    });
  };

  return (
    <div className="py-8">

      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search users..."
        className="mb-6"
      />

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 5 }).map((_, idx) => (
            <SkeletonCard key={idx} />
          ))}
        </div>
      ) : error ? (
        <p className="text-center text-destructive">{error}</p>
      ) : users.length === 0 ? (
        <p className="text-center text-muted-foreground">No users found.</p>
      ) : (
        <div className="grid gap-4">
          {users.map((user, index) => (
            <LeaderboardCard
              key={user.id}
              user={user}
              rank={index + 1}
              isFollowing={followingIds.has(user.id)}
              isCurrentUser={user.id === currentUserId}
              toggleFollow={toggleFollow}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LeaderboardCard({ user, rank, isFollowing, isCurrentUser, toggleFollow }: any) {
  const badgeInfo =
    rank === 1
      ? { color: "border-yellow-400 bg-yellow-50 dark:bg-yellow-900", label: "🥇 Gold", variant: "default" }
      : rank === 2
      ? { color: "border-gray-300 bg-gray-50 dark:bg-gray-800", label: "🥈 Silver", variant: "secondary" }
      : rank === 3
      ? { color: "border-amber-700 bg-amber-50 dark:bg-amber-900", label: "🥉 Bronze", variant: "secondary" }
      : { color: "", label: "", variant: "outline" };

  return (
    <Card
      className={`p-4 flex items-center justify-between relative ${rank <= 3 ? `border-2 ${badgeInfo.color}` : ""}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center w-10">
          <span className="text-lg font-bold">{rank}</span>
          {rank <= 3 && (
            <Badge variant={badgeInfo.variant} className="mt-1">
              {badgeInfo.label}
            </Badge>
          )}
        </div>

        <Avatar>
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback>{user.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
        </Avatar>

        <div className="ml-4">
          <p className="font-semibold flex items-center gap-2">
            {user.username}
            {isCurrentUser && <Badge variant="outline">You</Badge>}
          </p>
          <div className="text-sm text-muted-foreground flex flex-wrap gap-2 mt-1">
            <span>
              ⏱️ {Math.floor(user.total_runtime / 60)}h {user.total_runtime % 60}m
            </span>
            <span>👥 {user.followers_count} Followers</span>
            <span>👤 {user.following_count} Following</span>
            <span>📅 Joined {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {!isCurrentUser && (
        <Button variant={isFollowing ? "outline" : "default"} onClick={() => toggleFollow(user.id)}>
          {isFollowing ? "Unfollow" : "Follow"}
        </Button>
      )}
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <Skeleton className="h-8 w-20" />
    </Card>
  );
}
