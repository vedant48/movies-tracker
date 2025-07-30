import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FilmIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";

export function SiteHeader() {
  const [avatarUrl, setAvatarUrl] = useState("");
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchProfileData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url, full_name, username")
          .eq("id", userData.user.id)
          .single();

        if (profile) {
          setAvatarUrl(profile.avatar_url || "");
          setFullName(profile.full_name || "");
          setUserName(profile.username || "");
        }
      }
    };

    fetchProfileData();
  }, []);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <header className="relative flex h-[var(--header-height)] items-center border-b px-4 lg:px-6">
      {/* Desktop: Sidebar Trigger (visible lg+) */}
      <div className="hidden lg:flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mx-2 h-4" />
      </div>

      {/* Mobile: Logo left aligned */}
      <Link to="/" className="flex items-center gap-2 lg:hidden">
        <FilmIcon className="size-5" />
        <span className="text-base font-semibold">Want2Watch</span>
      </Link>

      {/* Desktop: Centered Logo */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden lg:flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2">
          <FilmIcon className="size-5" />
          <span className="text-base font-semibold">Want2Watch</span>
        </Link>
      </div>

      {/* Right: Avatar always visible */}
      <div className="ml-auto">
        <Link to="/profile">
          <Avatar className="w-10 h-10 border-2 border-white shadow-md">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={fullName || userName || "User"} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm">
                {getInitials(fullName || userName || "User")}
              </AvatarFallback>
            )}
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
