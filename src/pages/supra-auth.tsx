import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/lib/supabase";

export default function SupraAuthPage() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={["google", "github", "email"]} />
    </div>
  );
}
