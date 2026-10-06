import { NextResponse } from "next/server";

export const revalidate = 300;

const STREAMER_ID = "toocat030";

function fixUrl(value: unknown): string {
  if (typeof value !== "string") return "";

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return "";
}

function getThumbnail(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") {
    return fixUrl(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const result = getThumbnail(item);

      if (result) return result;
    }

    return "";
  }

  if (typeof value === "object") {
    const item = value as Record<string, unknown>;

    const candidates = [
      item.url,
      item.src,
      item.path,
      item.thumbnail,
      item.thumb,
    ];

    for (const candidate of candidates) {
      const result = getThumbnail(candidate);

      if (result) return result;
    }
  }

  return "";
}

async function getVodThumbnail(
  titleNo: string,
) {
  try {
    const body = new URLSearchParams();

    body.set(
      "nTitleNo",
      titleNo,
    );

    body.set(
      "nApiLevel",
      "10",
    );

    const response = await fetch(
      "https://api.m.sooplive.com/station/video/a/view",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded; charset=UTF-8",

          Referer:
            `https://vod.sooplive.com/player/${titleNo}`,
        },

        body: body.toString(),

        next: {
          revalidate: 3600,
        },
      },
    );

    if (!response.ok) {
      return "";
    }

    const json =
      await response.json();

    const thumb =
      json?.data?.thumb;

    if (
      typeof thumb === "string"
    ) {
      return thumb;
    }

    return "";
  } catch {
    return "";
  }
}

export async function GET() {
  try {
    const apiUrl = new URL(
      `https://chapi.sooplive.com/api/${STREAMER_ID}/vods/all`,
    );

    apiUrl.searchParams.set("page", "1");
    apiUrl.searchParams.set("per_page", "60");
    apiUrl.searchParams.set("orderby", "reg_date");

    const response = await fetch(
      apiUrl.toString(),
      {
        headers: {
          Accept: "application/json",
          Referer: `https://www.sooplive.com/station/${STREAMER_ID}/vod`,
        },

        next: {
          revalidate: 300,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `SOOP API 오류: ${response.status}`,
      );
    }

    const json = await response.json();

    const source = Array.isArray(json?.data)
      ? json.data
      : [];

    const videos = await Promise.all(
  source.map(
    async (item: any) => {
      const id = String(
        item.title_no ?? "",
      );

      const thumbnail =
        id
          ? await getVodThumbnail(id)
          : "";

      return {
        id,

        title: String(
          item.title_name ??
            item.title ??
            "제목 없는 영상",
        ),

        thumbnail,

        url: id
          ? `https://vod.sooplive.com/player/${id}`
          : "",

        publishedAt: String(
          item.reg_date ??
            item.write_date ??
            item.regDate ??
            "",
        ),

        platform: "soop",
      };
    },
  ),
);
      const filteredVideos =
  videos.filter(
    (video) =>
      video.id &&
      video.url,
  );

    return NextResponse.json(
      {
        videos: filteredVideos,
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
      "SOOP VOD 조회 실패:",
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