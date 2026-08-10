import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Server-side Supabase client.
 *
 * All app tables are locked down (no anon/authenticated grants or policies), so
 * every read/write goes through trusted server code using the service role.
 * Never import this from client-reachable module scope.
 */
export function createServerSupabase(): SupabaseClient<Database> {
  return supabaseAdmin as unknown as SupabaseClient<Database>;
}
