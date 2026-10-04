import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dodxyywylaikvsezfduu.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = () => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseAnonKey.includes("•") &&
    supabaseAnonKey.length > 20
  );
};

export const supabase = createClient(
  supabaseUrl,
  isSupabaseConfigured() ? supabaseAnonKey : "dummy-key-placeholder"
);

export const getSupabaseAdmin = () => {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRole || serviceRole.includes("•") || serviceRole.length <= 20) {
    return null;
  }
  return createClient(supabaseUrl, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};
