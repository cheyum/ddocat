import FanSite from "./fan-site";
import { loadSettings } from "./site-data";
export const dynamic = "force-dynamic";
export default async function Home() {
  try {
    const { config } = await loadSettings();
    return <FanSite section="home" data={config} />;
  } catch {
    return (
      <main className="unavailable">
        페이지를 불러오지 못했어요. 잠시 후 새로고침해 주세요.
      </main>
    );
  }
}
