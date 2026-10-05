import { z } from "zod";
import { getAdmin, sameOrigin } from "../../admin-guard";
import { IMAGE_BUCKET } from "../../../lib/supabase/config";
const uploadSchema = z.object({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z
    .number()
    .int()
    .min(12)
    .max(10 * 1024 * 1024),
});
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "요청을 확인할 수 없어요." },
      { status: 403 },
    );
  const admin = await getAdmin();
  if (!admin)
    return Response.json(
      { error: "관리자만 업로드할 수 있어요." },
      { status: 403 },
    );
  try {
    const raw = await request.text();
    if (raw.length > 1000)
      return Response.json(
        { error: "잘못된 업로드 요청이에요." },
        { status: 400 },
      );
    const { contentType } = uploadSchema.parse(JSON.parse(raw));
    const extension = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    }[contentType];
    const path = crypto.randomUUID() + "." + extension;
    const { data, error } = await admin.supabase.storage
      .from(IMAGE_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data) throw error || new Error("Missing upload token");
    return Response.json(
      { path: data.path, token: data.token, url: "/api/assets/" + path },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Upload token failed", error);
    return Response.json(
      {
        error:
          "이미지를 올리지 못했어요. 파일 크기와 Supabase 설정을 확인해 주세요.",
      },
      { status: 400 },
    );
  }
}
