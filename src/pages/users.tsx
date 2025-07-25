import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

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
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .neq("id", currentUserId)
        .ilike("username", `%${search}%`)
        .order("username", { ascending: true });

      if (error) {
        toast.error("Error fetching users");
        return;
      }
      setUsers(data);
    };

    if (currentUserId !== null) {
      fetchUsers();
    }
  }, [search, currentUserId]);

  useEffect(() => {
    const fetchFollowing = async () => {
      const { data, error } = await supabase.from("follows").select("followee_id").eq("follower_id", currentUserId);

      if (error) return;
      const ids = new Set(data.map((item) => item.followee_id));
      setFollowingIds(ids);
    };

    if (currentUserId) {
      fetchFollowing();
    }
  }, [currentUserId]);

  const toggleFollow = async (targetId: string) => {
    if (!currentUserId) return;

    if (followingIds.has(targetId)) {
      // Unfollow
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("followee_id", targetId);

      if (error) {
        toast.error("Error unfollowing");
        return;
      }
      toast.success("Unfollowed");
      setFollowingIds((prev) => {
        const copy = new Set(prev);
        copy.delete(targetId);
        return copy;
      });
    } else {
      // Follow
      const { error } = await supabase.from("follows").insert({
        follower_id: currentUserId,
        followee_id: targetId,
      });

      if (error) {
        toast.error("Error following");
        return;
      }
      toast.success("Followed");
      setFollowingIds((prev) => new Set(prev).add(targetId));
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search users..."
        className="mb-6"
      />

      <div className="grid gap-4">
        {users.map((user) => (
          <UserCard key={user.id} user={user} isFollowing={followingIds.has(user.id)} toggleFollow={toggleFollow} />
        ))}
      </div>
    </div>
  );
}

function UserCard({ user, isFollowing, toggleFollow }: any) {
  const [counts, setCounts] = useState({ want: 0, watched: 0, followers: 0, following: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      const [{ count: want }, { count: watched }, { count: followers }, { count: following }] = await Promise.all([
        supabase
          .from("user_movies")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "want"),

        supabase
          .from("user_movies")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "watched"),

        supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("followee_id", user.id),

        supabase.from("follows").select("followee_id", { count: "exact", head: true }).eq("follower_id", user.id),
      ]);

      setCounts({
        want: want || 0,
        watched: watched || 0,
        followers: followers || 0,
        following: following || 0,
      });
    };

    fetchCounts();
  }, [user.id]);

  return (
    <Card className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Avatar>
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback>{user.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{user.username}</p>
          <div className="text-sm text-muted-foreground flex gap-2">
            <span>Want: {counts.want}</span>
            <span>Watched: {counts.watched}</span>
            <span>Followers: {counts.followers}</span>
            <span>Following: {counts.following}</span>
          </div>
        </div>
      </div>
      <Button variant={isFollowing ? "outline" : "default"} onClick={() => toggleFollow(user.id)}>
        {isFollowing ? "Unfollow" : "Follow"}
      </Button>
    </Card>
  );
}
