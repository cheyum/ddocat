"use client";
import { useState } from "react";
import { createClient } from "../../../lib/supabase/client";
export default function LoginForm() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.user)
        throw new Error("이메일과 비밀번호를 확인해 주세요.");
      const { data: admin, error: adminError } = await supabase
        .from("fanpage_admins")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (adminError || !admin) {
        await supabase.auth.signOut();
        throw new Error("관리자로 등록된 계정만 접근할 수 있어요.");
      }
      window.location.assign("/admin");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "로그인하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="login-form">
      <label>
        이메일
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
        />
      </label>
      <label>
        비밀번호
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
        />
      </label>
      <p role="status">{message}</p>
      <button className="primary-button" disabled={busy}>
        {busy ? "로그인 중…" : "로그인"}
      </button>
      <a href="/">팬페이지로 돌아가기</a>
    </form>
  );
}
