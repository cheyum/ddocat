import { redirect } from "next/navigation";
import { getAdmin } from "../admin-guard";
import { loadSettings } from "../site-data";
import AdminEditor from "./editor";
import { hasSupabase } from "../../lib/supabase/config";
export const dynamic = "force-dynamic";
export default async function Admin() {
  if (!hasSupabase())
    return (
      <main className="unavailable">
        <h1>관리자 연결 설정</h1>
        <p>
          Supabase 연결 후 사용할 수 있어요. 압축파일 안의 README 안내를 따라
          설정해 주세요.
        </p>
        <a href="/">메인으로</a>
      </main>
    );
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  try {
    return <AdminEditor initial={await loadSettings()} />;
  } catch (error) {
    console.error("Admin settings load failed", error);
    return (
      <main className="unavailable">
        관리 화면을 불러오지 못했어요. Supabase 설정과 연결 상태를 확인해
        주세요.
      </main>
    );
  }
}
