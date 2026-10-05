"use client";

import { useEffect, useState } from "react";

type LiveInfo = {
  isLive: boolean;
  broadNo?: string;
  title?: string;
  liveUrl?: string;
  embedUrl?: string;
  error?: boolean;
  message?: string;
};

export default function LivePlayer() {
  const [live, setLive] = useState<LiveInfo | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkLive() {
      try {
        const response = await fetch("/api/live", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (mounted) {
          setLive(data);
        }
      } catch (error) {
        console.error("LIVE 상태 확인 실패:", error);

        if (mounted) {
          setLive({
            isLive: false,
            error: true,
          });
        }
      }
    }

    checkLive();

    // 60초마다 방송 상태 재확인
    const timer = window.setInterval(checkLive, 60 * 1000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  // 처음 확인 중
  if (!live) {
    return (
      <div className="mainLiveBox mainLiveLoading">
        <div className="mainLiveLoadingDot" />
        <span>방송 상태 확인 중</span>
      </div>
    );
  }

  // SOOP 조회 자체가 실패한 경우
  if (live.error) {
    return (
      <div className="mainLiveBox mainLiveOffline">
        <span className="mainLiveSymbol">◇</span>

        <strong>CHECKING</strong>

        <p>방송 상태를 확인할 수 없어요</p>
      </div>
    );
  }

  // OFFLINE
  if (!live.isLive) {
    return (
      <div className="mainLiveBox mainLiveOffline">
        <span className="mainLiveSymbol">◇</span>

        <strong>OFFLINE</strong>

        <p>지금은 방송 중이 아니에요</p>
      </div>
    );
  }

  // LIVE
  return (
    <div className="mainLiveSection">
      <div className="mainLiveTop">
        <span className="mainLiveBadge">
          <span className="mainLiveDot" />
          LIVE
        </span>

        <a
          href={live.liveUrl}
          target="_blank"
          rel="noreferrer"
          className="mainLiveOpen"
        >
          방송 크게 보기 ↗
        </a>
      </div>

      <div className="mainLiveBox mainLiveOnline">
        <iframe
          key={live.broadNo}
          src={live.embedUrl}
          title="또오냥 SOOP LIVE"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>

      {live.title && (
        <p className="mainLiveTitle">
          {live.title}
        </p>
      )}
    </div>
  );
}