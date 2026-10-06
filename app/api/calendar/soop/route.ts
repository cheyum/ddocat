import { NextResponse } from "next/server";

export const revalidate = 300;

const STREAMER_ID = "toocat030";

type SoopEvent = {
  title?: string;
  eventDate?: string;
  eventTime?: string;
  calendarTypeName?: string;
};

function formatDate(
  date: Date,
) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

async function fetchWeek(
  date: Date,
) {
  const {
    year,
    month,
    day,
  } = formatDate(date);

  const url = new URL(
    `https://api-channel.sooplive.co.kr/v1.1/channel/${STREAMER_ID}/calendar`,
  );

  url.searchParams.set(
    "view",
    "week",
  );

  url.searchParams.set(
    "year",
    String(year),
  );

  url.searchParams.set(
    "month",
    String(month),
  );

  url.searchParams.set(
    "day",
    String(day),
  );

  url.searchParams.set(
    "userId",
    STREAMER_ID,
  );

  const response = await fetch(
    url.toString(),
    {
      headers: {
        Accept:
          "application/json, text/plain, */*",

        "User-Agent":
          "Mozilla/5.0",

        Referer:
          `https://www.sooplive.com/station/${STREAMER_ID}/calendar`,
      },

      next: {
        revalidate: 300,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `SOOP Calendar API 오류: ${response.status}`,
    );
  }

  const json =
    await response.json();

  const days =
    Array.isArray(json?.days)
      ? json.days
      : Array.isArray(
            json?.data?.days,
          )
        ? json.data.days
        : [];

  const events: SoopEvent[] =
    [];

  for (const dayData of days) {
    if (
      !Array.isArray(
        dayData?.events,
      )
    ) {
      continue;
    }

    for (
      const event of dayData.events
    ) {
      events.push(event);
    }
  }

  return events;
}

export async function GET(
  request: Request,
) {
  try {
    const url =
      new URL(request.url);

    const now =
      new Date();

    const year =
      Number(
        url.searchParams.get(
          "year",
        ),
      ) ||
      now.getFullYear();

    const month =
      Number(
        url.searchParams.get(
          "month",
        ),
      ) ||
      now.getMonth() + 1;

    if (
      year < 2000 ||
      year > 2100 ||
      month < 1 ||
      month > 12
    ) {
      return NextResponse.json(
        {
          events: [],
          error: true,
        },
        {
          status: 400,
        },
      );
    }

    /*
      해당 월을 포함하는 첫 번째 주
    */
    const firstDay =
      new Date(
        Date.UTC(
          year,
          month - 1,
          1,
        ),
      );

    firstDay.setUTCDate(
      firstDay.getUTCDate() -
        firstDay.getUTCDay(),
    );

    /*
      해당 월을 포함하는 마지막 주
    */
    const lastDay =
      new Date(
        Date.UTC(
          year,
          month,
          0,
        ),
      );

    lastDay.setUTCDate(
      lastDay.getUTCDate() +
        (6 -
          lastDay.getUTCDay()),
    );

    const weekDates: Date[] =
      [];

    const cursor =
      new Date(firstDay);

    while (
      cursor <= lastDay
    ) {
      weekDates.push(
        new Date(cursor),
      );

      cursor.setUTCDate(
        cursor.getUTCDate() + 7,
      );
    }

    /*
      각 주 데이터를 동시에 조회
    */
    const results =
      await Promise.all(
        weekDates.map(
          fetchWeek,
        ),
      );

    const prefix =
      `${year}-${String(
        month,
      ).padStart(2, "0")}`;

    const map =
      new Map<
        string,
        {
          id: string;
          title: string;
          date: string;
          time: string;
          kind: string;
        }
      >();

    results
      .flat()
      .forEach(
        (
          event,
          index,
        ) => {
          const date =
            String(
              event.eventDate ??
                "",
            );

          if (
            !date.startsWith(
              prefix,
            )
          ) {
            return;
          }

          const title =
            String(
              event.title ??
                "일정",
            );

          const time =
            String(
              event.eventTime ??
                "",
            );

          const kind =
            String(
              event.calendarTypeName ??
                "일정",
            );

          const key =
            `${date}-${time}-${title}-${kind}`;

          if (map.has(key)) {
            return;
          }

          map.set(key, {
            id:
              `${date}-${time}-${index}`,

            title,
            date,
            time,
            kind,
          });
        },
      );

    const events =
      Array.from(
        map.values(),
      ).sort(
        (a, b) =>
          (
            a.date +
            a.time
          ).localeCompare(
            b.date +
              b.time,
          ),
      );

    return NextResponse.json(
      {
        events,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error(
      "SOOP 캘린더 조회 실패:",
      error,
    );

    return NextResponse.json(
      {
        events: [],
        error: true,
      },
      {
        status: 500,
      },
    );
  }
}