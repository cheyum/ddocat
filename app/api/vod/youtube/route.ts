import { NextResponse } from "next/server";

export const revalidate = 300;

function getHandle(
  value: string | null,
) {
  if (!value) {
    return "@또오냥";
  }

  const handle = value.trim();

  if (!handle) {
    return "@또오냥";
  }

  return handle.startsWith("@")
    ? handle
    : `@${handle}`;
}

export async function GET(
  request: Request,
) {
  try {
    const apiKey =
      process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      throw new Error(
        "YOUTUBE_API_KEY가 설정되지 않았어요.",
      );
    }

    const requestUrl = new URL(
      request.url,
    );

    const handle = getHandle(
      requestUrl.searchParams.get(
        "handle",
      ),
    );

    /* =========================
       1. handle → 채널 정보
    ========================= */

    const channelUrl =
      new URL(
        "https://www.googleapis.com/youtube/v3/channels",
      );

    channelUrl.searchParams.set(
      "part",
      "contentDetails",
    );

    channelUrl.searchParams.set(
      "forHandle",
      handle,
    );

    channelUrl.searchParams.set(
      "key",
      apiKey,
    );

    const channelResponse =
      await fetch(
        channelUrl.toString(),
        {
          next: {
            revalidate: 3600,
          },
        },
      );

    if (!channelResponse.ok) {
      throw new Error(
        `YouTube 채널 조회 실패: ${channelResponse.status}`,
      );
    }

    const channelJson =
      await channelResponse.json();

    const uploadsPlaylistId =
      channelJson?.items?.[0]
        ?.contentDetails
        ?.relatedPlaylists
        ?.uploads;

    if (!uploadsPlaylistId) {
      throw new Error(
        "YouTube 업로드 목록을 찾지 못했어요.",
      );
    }

    /* =========================
       2. 업로드 영상 조회
    ========================= */

    const playlistUrl =
      new URL(
        "https://www.googleapis.com/youtube/v3/playlistItems",
      );

    playlistUrl.searchParams.set(
      "part",
      "snippet,contentDetails",
    );

    playlistUrl.searchParams.set(
      "playlistId",
      uploadsPlaylistId,
    );

    playlistUrl.searchParams.set(
      "maxResults",
      "50",
    );

    playlistUrl.searchParams.set(
      "key",
      apiKey,
    );

    const playlistResponse =
      await fetch(
        playlistUrl.toString(),
        {
          next: {
            revalidate: 300,
          },
        },
      );

    if (!playlistResponse.ok) {
      throw new Error(
        `YouTube 영상 조회 실패: ${playlistResponse.status}`,
      );
    }

    const playlistJson =
      await playlistResponse.json();

    const videos = (
      playlistJson.items ?? []
    )
      .map((item: any) => {
        const videoId =
          item?.contentDetails
            ?.videoId ??
          item?.snippet
            ?.resourceId
            ?.videoId ??
          "";

        const thumbnails =
          item?.snippet
            ?.thumbnails ?? {};

        const thumbnail =
          thumbnails.maxres?.url ??
          thumbnails.standard?.url ??
          thumbnails.high?.url ??
          thumbnails.medium?.url ??
          thumbnails.default?.url ??
          "";

        return {
          id: videoId,

          title:
            item?.snippet?.title ??
            "제목 없는 영상",

          thumbnail,

          url: videoId
            ? `https://www.youtube.com/watch?v=${videoId}`
            : "",

          publishedAt:
            item?.contentDetails
              ?.videoPublishedAt ??
            item?.snippet
              ?.publishedAt ??
            "",

          platform: "youtube",
        };
      })
      .filter(
        (video: {
          id: string;
          url: string;
        }) =>
          video.id &&
          video.url,
      );

    return NextResponse.json(
      {
        videos,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.error(
      "YouTube 조회 실패:",
      error,
    );

    return NextResponse.json(
      {
        videos: [],
        error: true,
      },
      {
        status: 500,
      },
    );
  }
}