import "server-only";
import { createClient } from "../lib/supabase/server";
import { hasSupabase } from "../lib/supabase/config";
export async function getAdmin() {
  if (!hasSupabase()) return null;
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: admin, error: adminError } = await supabase
    .from("fanpage_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (adminError || !admin) return null;
  return { supabase, user };
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin;
}
