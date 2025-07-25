import { useEffect, useState, type SetStateAction } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Stats = {
  moviesWant: number;
  moviesWatched: number;
  seriesWant: number;
  seriesWatched: number;
};

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [user, setUser] = useState<{
    id: string;
    email: string;
    created_at: string;
    user_metadata?: { displayName?: string };
    [key: string]: any;
  } | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUser(data.user);
      } else {
        console.error("No user found:", error);
      }
    };

    getUser();
  }, []);

  useEffect(() => {
    if (!user) return;

    setDisplayName((user.user_metadata as any)?.displayName || "");
    setCreatedAt(user.created_at);

    // fetch counts in parallel
    async function fetchStats() {
      async function count(status: "want" | "watched", type: "movie" | "series") {
        const { count } = await supabase
          .from("user_media")
          .select("*", { count: "exact", head: true })
          .eq("status", status)
          .eq("media_type", type)
          .eq("user_id", user!.id || "");
        return count || 0;
      }

      const [moviesWant, moviesWatched, seriesWant, seriesWatched] = await Promise.all([
        count("want", "movie"),
        count("watched", "movie"),
        count("want", "series"),
        count("watched", "series"),
      ]);

      setStats({ moviesWant, moviesWatched, seriesWant, seriesWatched });
      setLoading(false);
    }

    fetchStats();
  }, [user]);

  async function handleSaveName() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { displayName },
    });
    setSaving(false);
    if (error) {
      toast.error("Could not update name");
    } else {
      toast.success("Profile updated");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (!user) return null;
  return (
    <div className="flex flex-1 flex-col gap-6 py-6">
      {/* Basic details */}
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Account</h2>
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Email</div>
          <div className="font-mono">{user.email}</div>
        </div>
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">Joined</div>
          <div>{new Date(createdAt || "").toLocaleDateString()}</div>
        </div>

        {/* Display name form */}
        <div className="space-y-2 pt-4">
          <Label htmlFor="displayName">Display name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e: { target: { value: SetStateAction<string> } }) => setDisplayName(e.target.value)}
            placeholder="Your cool nickname"
          />
          <Button onClick={handleSaveName} disabled={saving} className="w-fit">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>

        <Button variant="outline" className="mt-6" onClick={handleLogout}>
          Log out
        </Button>
      </Card>

      {/* Stats */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Your Lists</h2>
        {loading || !stats ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Movies – Want" count={stats.moviesWant} />
            <Stat label="Movies – Watched" count={stats.moviesWatched} />
            <Stat label="Series – Want" count={stats.seriesWant} />
            <Stat label="Series – Watched" count={stats.seriesWatched} />
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span>{label}</span>
      <Badge variant="secondary">{count}</Badge>
    </div>
  );
}
