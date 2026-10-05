import { getAdmin, sameOrigin } from "../../admin-guard";
import { configSchema } from "../../site-model";
import { z } from "zod";
const saveSchema = z.object({
  config: configSchema,
  revision: z.number().int().nonnegative(),
});
export async function PUT(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: "요청을 확인할 수 없어요." },
      { status: 403 },
    );
  const admin = await getAdmin();
  if (!admin)
    return Response.json(
      { error: "관리자만 수정할 수 있어요." },
      { status: 403 },
    );
  try {
    if (Number(request.headers.get("content-length")) > 200000)
      return Response.json({ error: "내용이 너무 커요." }, { status: 413 });
    const raw = await request.text();
    if (raw.length > 200000)
      return Response.json({ error: "내용이 너무 커요." }, { status: 413 });
    const { config, revision } = saveSchema.parse(JSON.parse(raw));
    const { data, error } = await admin.supabase.rpc("save_site_config", {
      next_value: config,
      expected_revision: revision,
    });
    if (error?.code === "40001")
      return Response.json(
        {
          error:
            "다른 창에서 내용이 바뀌었어요. 새로고침 후 다시 수정해 주세요.",
        },
        { status: 409 },
      );
    if (error || typeof data !== "number") {
      console.error("Settings RPC failed", error);
      return Response.json(
        { error: "저장하지 못했어요. 연결 상태를 확인해 주세요." },
        { status: 503 },
      );
    }
    return Response.json(
      { config, revision: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Settings save failed", error);
    return Response.json(
      { error: "입력 내용과 영상 주소를 확인해 주세요." },
      { status: 400 },
    );
  }
}
