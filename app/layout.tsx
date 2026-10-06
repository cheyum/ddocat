import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "타마고 WORLD",
  description: "또오냥의 팬 공간. 프로필, VOD, 방송 일정과 미니게임.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
