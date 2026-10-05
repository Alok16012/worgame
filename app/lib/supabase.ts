import { createClient } from "@supabase/supabase-js";

export const DEFAULT_SUPABASE_URL = "https://dodxyywylaikvsezfduu.supabase.co";
export const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZHh5eXd5bGFpa3ZzZXpmZHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExMzI0MjUsImV4cCI6MjEwNjcwODQyNX0.jSY-EHy1ofu7DuK7wh9Q6nKdngRTBnjFteEDaSvfiFE";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

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
