import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STREAMER_ID = "toocat030";

const SOOP_API =
  `https://api-channel.sooplive.co.kr/v1.1/channel/${STREAMER_ID}/home/section/broad`;

export async function GET() {
  try {
    const response = await fetch(SOOP_API, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.sooplive.co.kr/",
        Origin: "https://www.sooplive.co.kr",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          isLive: false,
          error: true,
          message: "SOOP 방송 상태를 확인하지 못했습니다.",
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const text = await response.text();

    // 방송 중이 아니면 빈 응답이 올 수 있음
    if (!text.trim()) {
      return NextResponse.json(
        {
          isLive: false,
          streamerId: STREAMER_ID,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    let data: any;

    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          isLive: false,
          error: true,
          message: "SOOP 응답을 읽지 못했습니다.",
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const broadNo =
      data?.broadNo ??
      data?.broad_no ??
      null;

    // broadNo가 없으면 OFFLINE
    if (!broadNo) {
      return NextResponse.json(
        {
          isLive: false,
          streamerId: STREAMER_ID,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const title =
      data?.broadTitle ??
      data?.broad_title ??
      "";

    return NextResponse.json(
      {
        isLive: true,
        streamerId: STREAMER_ID,
        broadNo: String(broadNo),
        title,

        // 실제 SOOP 방송 페이지
        liveUrl:
          `https://play.sooplive.co.kr/${STREAMER_ID}/${broadNo}`,

        // 팬사이트 안에 보여줄 플레이어
        embedUrl:
          `https://play.sooplive.co.kr/${STREAMER_ID}/embed`,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("SOOP LIVE 상태 확인 실패:", error);

    return NextResponse.json(
      {
        isLive: false,
        error: true,
        message: "SOOP 방송 상태 확인 중 오류가 발생했습니다.",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}