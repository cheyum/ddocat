import {
  hasSupabase,
  supabaseConfig,
  IMAGE_BUCKET,
} from "../../../../lib/supabase/config";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key))
    return new Response(null, { status: 404 });
  if (!hasSupabase()) return new Response(null, { status: 503 });
  const { url } = supabaseConfig();
  // Redirect instead of proxying image bytes through Vercel Functions.
  return new Response(null, {
    status: 307,
    headers: {
      Location: `${url.replace(/\/$/, "")}/storage/v1/object/public/${IMAGE_BUCKET}/${key}`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
