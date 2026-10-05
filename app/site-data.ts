import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { configSchema, defaults } from "./site-model";
import { hasSupabase, supabaseConfig } from "../lib/supabase/config";
export async function loadSettings() {
  // The public pages can be previewed before a Supabase project is connected.
  if (!hasSupabase()) return { config: defaults, revision: 0 };
  const { url, key } = supabaseConfig();
  const db = createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  const { data, error } = await db
    .from("site_settings")
    .select("value, revision")
    .eq("id", "site")
    .maybeSingle();
  if (error) throw new Error(`설정을 불러오지 못했습니다: ${error.message}`);
  return data
    ? {
        config: configSchema.parse(data.value),
        revision: Number(data.revision),
      }
    : { config: defaults, revision: 0 };
}
