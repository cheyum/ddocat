import { createClient } from "../../../../lib/supabase/server";
import { sameOrigin } from "../../../admin-guard";
import { NextResponse } from "next/server";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "요청을 확인할 수 없어요." },
      { status: 403 },
    );
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error)
    return Response.json(
      { error: "로그아웃하지 못했어요. 다시 시도해 주세요." },
      { status: 503 },
    );
  return NextResponse.redirect(new URL("/admin/login", request.url), 303);
}
