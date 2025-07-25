import { supabase } from "@/lib/supabase";

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  return data?.user || null;
};
