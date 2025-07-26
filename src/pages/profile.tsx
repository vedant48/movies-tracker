import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pencil, LogOut, User, Heart, Eye, Users, Film, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const [saving, setSaving] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFollowersDrawerOpen, setIsFollowersDrawerOpen] = useState(false);
  const [isFollowingDrawerOpen, setIsFollowingDrawerOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    wantList: 0,
    watchedMovies: 0,
    watchedSeries: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isFetchingFollowers, setIsFetchingFollowers] = useState(false);
  const [isFetchingFollowing, setIsFetchingFollowing] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.auth.getUser();

      if (data?.user) {
        setUser(data.user);
        await fetchProfileData(data.user.id);
        await fetchStats(data.user.id);
      } else {
        console.error("No user found:", error);
      }
      setIsLoading(false);
    };

    getUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    const metadata = user.user_metadata || {};
    setUsername(metadata.username || "");
    setFullName(metadata.full_name || "");
    setAvatarUrl(metadata.avatar_url || "");
    setBio(metadata.bio || "");
    setCreatedAt(user.created_at);
  }, [user]);

  const fetchProfileData = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (data) {
      setUsername(data.username || "");
      setFullName(data.full_name || "");
      setAvatarUrl(data.avatar_url || "");
      setBio(data.bio || "");
    }
  };

  const fetchStats = async (userId: string) => {
    try {
      const [
        { count: followersCount },
        { count: followingCount },
        { count: wantMoviesCount },
        { count: watchedMoviesCount },
        { count: wantSeriesCount },
        { count: watchedSeriesCount },
      ] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("followee_id", userId),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
        supabase
          .from("user_movies")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "want"),
        supabase
          .from("user_movies")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "watched"),
        supabase
          .from("user_series")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "want"),
        supabase
          .from("user_series")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "watched"),
      ]);

      setStats({
        followers: followersCount || 0,
        following: followingCount || 0,
        wantList: (wantMoviesCount || 0) + (wantSeriesCount || 0),
        watchedMovies: watchedMoviesCount || 0,
        watchedSeries: watchedSeriesCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  async function handleSaveProfile() {
    if (!user) return;
    setSaving(true);

    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          displayName: fullName,
        },
      });

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        username,
        full_name: fullName,
        avatar_url: avatarUrl,
        bio,
      });

      if (authError || profileError) {
        throw authError || profileError;
      }

      toast.success("Profile updated successfully!");
      setIsDrawerOpen(false);
    } catch (error) {
      toast.error("Could not update profile.");
      console.error("Update error:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

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
    if (!user) return;
    setIsFetchingFollowers(true);

    try {
      const { data, error } = await supabase
        .from("follows")
        .select("follower: profiles!follows_follower_id_fkey (*)")
        .eq("followee_id", user.id);

      if (error) throw error;

      setFollowers(data.map((item: { follower: any; }) => item.follower));
    } catch (error) {
      console.error("Error fetching followers:", error);
      toast.error("Failed to load followers");
    } finally {
      setIsFetchingFollowers(false);
    }
  };

  console.error("followers:", followers);


  const fetchFollowing = async () => {
    if (!user) return;
    setIsFetchingFollowing(true);

    try {
      const { data, error } = await supabase
        .from("follows")
        .select("followee: profiles!follows_followee_id_fkey (*)")
        .eq("follower_id", user.id);

      if (error) throw error;

      setFollowing(data.map((item) => item.followee));
    } catch (error) {
      console.error("Error fetching following:", error);
      toast.error("Failed to load following");
    } finally {
      setIsFetchingFollowing(false);
    }
  };

  const handleRemoveFollower = async (followerId: string) => {
    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", followerId)
        .eq("followee_id", user.id);

      if (error) throw error;

      setFollowers(followers.filter((f) => f.id !== followerId));
      setStats((prev) => ({ ...prev, followers: prev.followers - 1 }));
      toast.success("Follower removed");
    } catch (error) {
      console.error("Error removing follower:", error);
      toast.error("Failed to remove follower");
    }
  };

  const handleUnfollow = async (followeeId: string) => {
    try {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("followee_id", followeeId);

      if (error) throw error;

      setFollowing(following.filter((f) => f.id !== followeeId));
      setStats((prev) => ({ ...prev, following: prev.following - 1 }));
      toast.success("Unfollowed successfully");
    } catch (error) {
      console.error("Error unfollowing:", error);
      toast.error("Failed to unfollow");
    }
  };

  const openFollowersDrawer = async () => {
    setIsFollowersDrawerOpen(true);
    if (followers.length === 0) {
      await fetchFollowers();
    }
  };

  const openFollowingDrawer = async () => {
    setIsFollowingDrawerOpen(true);
    if (following.length === 0) {
      await fetchFollowing();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 py-6">
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-8">
            <Skeleton className="w-32 h-32 rounded-full mx-auto md:mx-0" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />

              <div className="flex flex-wrap gap-6 mt-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-16 mt-2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex flex-1 flex-col gap-6 py-6">
      {/* Profile Header Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={fullName || username} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-4xl">
                  {getInitials(fullName || user.email)}
                </AvatarFallback>
              )}
            </Avatar>

            <Button variant="secondary" className="mt-4 gap-2" onClick={() => setIsDrawerOpen(true)}>
              <Pencil className="w-4 h-4" />
              Edit Profile
            </Button>
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold">{fullName || user.email}</h1>

              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">@{username || "user" + user.id.slice(0, 6)}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  Joined {new Date(createdAt || "").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
              </div>

              <p className="mt-4 text-gray-700 dark:text-gray-300">{bio || "No bio yet. Tell us about yourself!"}</p>
            </div>

            {/* Stats Section */}
            <div className="flex flex-wrap gap-6 mt-8">
              <div className="flex flex-col items-center cursor-pointer group" onClick={openFollowersDrawer}>
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                  <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="font-bold text-xl mt-2">{stats.followers}</span>
                <span className="text-sm text-muted-foreground group-hover:text-indigo-600 transition-colors">
                  Followers
                </span>
              </div>

              <div className="flex flex-col items-center cursor-pointer group" onClick={openFollowingDrawer}>
                <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
                  <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="font-bold text-xl mt-2">{stats.following}</span>
                <span className="text-sm text-muted-foreground group-hover:text-indigo-600 transition-colors">
                  Following
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="bg-rose-100 dark:bg-rose-900/30 p-3 rounded-full">
                  <Heart className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                </div>
                <span className="font-bold text-xl mt-2">{stats.wantList}</span>
                <span className="text-sm text-muted-foreground">Want List</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full">
                  <Eye className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-bold text-xl mt-2">{stats.watchedMovies + stats.watchedSeries}</span>
                <span className="text-sm text-muted-foreground">Watched</span>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Media Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full">
                <Film className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold">Movies Watched</h3>
                <p className="text-2xl font-bold">{stats.watchedMovies}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-purple-50 dark:bg-purple-900/20">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 dark:bg-purple-800 p-2 rounded-full">
                <Film className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold">Series Watched</h3>
                <p className="text-2xl font-bold">{stats.watchedSeries}</p>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {/* Logout Button */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Log out
        </Button>
      </div>

      {/* Edit Profile Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="!fixed !top-[-10%] !h-auto !max-h-[100vh]">
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <DrawerTitle className="text-2xl flex items-center gap-2">
                <Pencil className="w-5 h-5" />
                Edit Profile
              </DrawerTitle>
            </DrawerHeader>

            <div className="p-6 space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={fullName || username} />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl">
                        {getInitials(fullName || user.email)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute -bottom-2 -right-2 rounded-full border-2 border-white shadow-md"
                    onClick={() => {
                      // In a real app, this would trigger image upload
                      setAvatarUrl(
                        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
                      );
                      toast.info("Avatar updated");
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="your_username"
                  />
                </div>

                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us something about yourself"
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground mt-2">This will be displayed on your public profile</p>
                </div>
              </div>
            </div>

            <DrawerFooter className="px-6">
              <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Followers Drawer */}
      <Drawer open={isFollowersDrawerOpen} onOpenChange={setIsFollowersDrawerOpen}>
        <DrawerContent className="!fixed !top-[-10%] !h-auto !max-h-[100vh]">
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader className="flex justify-between items-center">
              <div>
                <DrawerTitle className="text-xl flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Followers
                </DrawerTitle>
                <DrawerDescription>{followers.length} people following you</DrawerDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsFollowersDrawerOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </DrawerHeader>

            <div className="p-4">
              {isFetchingFollowers ? (
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
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium">No followers yet</h3>
                  <p className="text-muted-foreground">Your followers will appear here</p>
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
                        onClick={() => setIsFollowersDrawerOpen(false)}
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
                      <Button variant="outline" size="sm" onClick={() => handleRemoveFollower(follower.id)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Following Drawer */}
      <Drawer open={isFollowingDrawerOpen} onOpenChange={setIsFollowingDrawerOpen}>
        <DrawerContent className="!fixed !top-[-10%] !h-auto !max-h-[100vh]">
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader className="flex justify-between items-center">
              <div>
                <DrawerTitle className="text-xl flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Following
                </DrawerTitle>
                <DrawerDescription>You're following {following.length} people</DrawerDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsFollowingDrawerOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </DrawerHeader>

            <div className="p-4">
              {isFetchingFollowing ? (
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
                  <User className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <h3 className="text-lg font-medium">Not following anyone yet</h3>
                  <p className="text-muted-foreground">People you follow will appear here</p>
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
                        onClick={() => setIsFollowingDrawerOpen(false)}
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
                      <Button variant="outline" size="sm" onClick={() => handleUnfollow(followee.id)}>
                        Unfollow
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
