import { notFound } from "next/navigation";
import FanSite from "../fan-site";
import { loadSettings } from "../site-data";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!["profile", "vod", "calendar", "minigame"].includes(section)) notFound();
  try {
    const { config } = await loadSettings();
    return <FanSite section={section} data={config} />;
  } catch {
    return (
      <main className="unavailable">
        페이지를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
      </main>
    );
  }
}
