import { redirect } from "next/navigation";
import { getAdmin } from "../../admin-guard";
import { hasSupabase } from "../../../lib/supabase/config";
import LoginForm from "./form";
export const dynamic = "force-dynamic";
export default async function Login() {
  if (await getAdmin()) redirect("/admin");
  return (
    <div className="admin-shell login-shell">
      <main className="login-panel">
        <a href="/" className="admin-brand">
          또오냥 <span>관리자</span>
        </a>
        <h1>관리자 로그인</h1>
        {hasSupabase() ? (
          <LoginForm />
        ) : (
          <p>Supabase 연결이 필요해요. README 설정 안내를 확인해 주세요.</p>
        )}
      </main>
    </div>
  );
}
