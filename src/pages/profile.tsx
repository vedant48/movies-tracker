import { useEffect, useState, type SetStateAction } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function ProfilePage() {
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [user, setUser] = useState<{
    id: string;
    email: string;
    created_at: string;
    user_metadata?: { username?: string; full_name?: string; avatar_url?: string; bio?: string };
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

    const metadata = user.user_metadata || {};
    setUsername(metadata.username || "");
    setFullName(metadata.full_name || "");
    setAvatarUrl(metadata.avatar_url || "");
    setBio(metadata.bio || "");
    setCreatedAt(user.created_at);
  }, [user]);

  async function handleSaveProfile() {
    if (!user) return;
    setSaving(true);

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        displayName: fullName,
      },
    });

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      full_name: fullName,
      username,
      avatar_url: avatarUrl,
      bio,
    });

    setSaving(false);

    if (authError || profileError) {
      toast.error("Could not update profile.");
    } else {
      toast.success("Profile updated.");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (!user) return null;

  return (
    <div className="flex flex-1 flex-col gap-6 py-6">
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

        {/* Profile update form */}
        <div className="space-y-4 pt-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e: { target: { value: SetStateAction<string> } }) => setUsername(e.target.value)}
              placeholder="your_username"
            />
          </div>

          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e: { target: { value: SetStateAction<string> } }) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div>
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e: { target: { value: SetStateAction<string> } }) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e: { target: { value: SetStateAction<string> } }) => setBio(e.target.value)}
              placeholder="Tell us something about yourself"
            />
          </div>

          <Button onClick={handleSaveProfile} disabled={saving} className="w-fit">
            {saving ? "Saving…" : "Save Profile"}
          </Button>
        </div>

        <Button variant="outline" className="mt-6" onClick={handleLogout}>
          Log out
        </Button>
      </Card>
    </div>
  );
}
