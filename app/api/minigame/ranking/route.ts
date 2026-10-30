import { NextResponse } from "next/server";
import { createAdminDb } from "../../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

type RankingEntry = {
  id: string;
  nickname: string;
  moves: number;
  timeMs: number;
  createdAt: string;
};

function cleanNickname(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(
      /[\u0000-\u001f\u007f]/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function isValidMoves(
  value: number,
) {
  return (
    Number.isInteger(value) &&
    value >= 6 &&
    value <= 500
  );
}

function isBetter(
  moves: number,
  timeMs: number,
  target: RankingEntry,
) {
  return (
    moves < target.moves ||
    (
      moves === target.moves &&
      timeMs < target.timeMs
    )
  );
}

function qualifies(
  rankings: RankingEntry[],
  moves: number,
  timeMs: number,
) {
  if (rankings.length < 3) {
    return true;
  }

  return isBetter(
    moves,
    timeMs,
    rankings[2],
  );
}

async function loadRankings() {
  const db = createAdminDb();

  const {
    data,
    error,
  } = await db
    .from("memory_game_rankings")
    .select(
      `
        id,
        nickname,
        moves,
        time_ms,
        created_at
      `,
    )
    .order(
      "moves",
      {
        ascending: true,
      },
    )
    .order(
      "time_ms",
      {
        ascending: true,
      },
    )
    .order(
      "created_at",
      {
        ascending: true,
      },
    )
    .limit(3);

  if (error) {
    throw error;
  }

  return (data ?? []).map(
    (row): RankingEntry => ({
      id: row.id,

      nickname:
        row.nickname,

      moves:
        row.moves,

      timeMs:
        row.time_ms,

      createdAt:
        row.created_at,
    }),
  );
}

async function cleanupRankings() {
  const db = createAdminDb();

  const {
    data,
    error,
  } = await db
    .from("memory_game_rankings")
    .select("id")
    .order(
      "moves",
      {
        ascending: true,
      },
    )
    .order(
      "time_ms",
      {
        ascending: true,
      },
    )
    .order(
      "created_at",
      {
        ascending: true,
      },
    )
    .range(3, 1000);

  if (error) {
    throw error;
  }

  const ids =
    (data ?? []).map(
      (row) => row.id,
    );

  if (!ids.length) {
    return;
  }

  const {
    error: deleteError,
  } = await db
    .from(
      "memory_game_rankings",
    )
    .delete()
    .in(
      "id",
      ids,
    );

  if (deleteError) {
    throw deleteError;
  }
}

export async function GET() {
  try {
    const rankings =
      await loadRankings();

    return NextResponse.json(
      {
        rankings,
      },
      {
        headers: {
          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "미니게임 랭킹 조회 실패:",
      error,
    );

    return NextResponse.json(
      {
        rankings: [],
        error:
          "랭킹을 불러오지 못했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  try {
    const body =
      await request.json();

    const action =
      typeof body.action === "string"
        ? body.action
        : "";

    const db =
      createAdminDb();

    /*
     * 게임 시작
     */
    if (action === "start") {
      const cutoff =
        new Date(
          Date.now() -
            2 *
              60 *
              60 *
              1000,
        ).toISOString();

      await db
        .from(
          "memory_game_attempts",
        )
        .delete()
        .lt(
          "created_at",
          cutoff,
        );

      const {
        data,
        error,
      } = await db
        .from(
          "memory_game_attempts",
        )
        .insert({
          registered: false,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        attemptId:
          data.id,
      });
    }

    /*
     * 게임 완료
     */
    if (action === "finish") {
      const attemptId =
        typeof body.attemptId ===
        "string"
          ? body.attemptId
          : "";

      const moves =
        Number(body.moves);

      if (
        !attemptId ||
        !isValidMoves(moves)
      ) {
        return NextResponse.json(
          {
            error:
              "올바르지 않은 게임 기록입니다.",
          },
          {
            status: 400,
          },
        );
      }

      const {
        data: attempt,
        error: attemptError,
      } = await db
        .from(
          "memory_game_attempts",
        )
        .select(
          `
            id,
            started_at,
            finished_at,
            moves,
            time_ms,
            registered
          `,
        )
        .eq(
          "id",
          attemptId,
        )
        .maybeSingle();

      if (attemptError) {
        throw attemptError;
      }

      if (!attempt) {
        return NextResponse.json(
          {
            error:
              "게임 시작 기록을 찾을 수 없습니다.",
          },
          {
            status: 404,
          },
        );
      }

      let finalMoves =
        attempt.moves ??
        moves;

      let timeMs =
        attempt.time_ms ??
        0;

      if (
        !attempt.finished_at
      ) {
        timeMs =
          Date.now() -
          new Date(
            attempt.started_at,
          ).getTime();

        if (
          timeMs < 4000 ||
          timeMs > 3600000
        ) {
          return NextResponse.json(
            {
              error:
                "비정상적인 플레이 시간입니다.",
            },
            {
              status: 400,
            },
          );
        }

        finalMoves =
          moves;

        const {
          error: updateError,
        } = await db
          .from(
            "memory_game_attempts",
          )
          .update({
            finished_at:
              new Date()
                .toISOString(),

            moves:
              finalMoves,

            time_ms:
              timeMs,
          })
          .eq(
            "id",
            attemptId,
          )
          .is(
            "finished_at",
            null,
          );

        if (updateError) {
          throw updateError;
        }
      }

      const rankings =
        await loadRankings();

      return NextResponse.json({
        qualified:
          qualifies(
            rankings,
            finalMoves,
            timeMs,
          ),

        moves:
          finalMoves,

        timeMs,

        rankings,
      });
    }

    /*
     * TOP 3 닉네임 등록
     */
    if (action === "submit") {
      const attemptId =
        typeof body.attemptId ===
        "string"
          ? body.attemptId
          : "";

      const nickname =
        cleanNickname(
          body.nickname,
        );

      if (
        !attemptId ||
        nickname.length < 1 ||
        nickname.length > 20
      ) {
        return NextResponse.json(
          {
            error:
              "닉네임은 1~20자로 입력해 주세요.",
          },
          {
            status: 400,
          },
        );
      }

      const {
        data: attempt,
        error: attemptError,
      } = await db
        .from(
          "memory_game_attempts",
        )
        .select(
          `
            id,
            finished_at,
            moves,
            time_ms,
            registered
          `,
        )
        .eq(
          "id",
          attemptId,
        )
        .maybeSingle();

      if (attemptError) {
        throw attemptError;
      }

      if (
        !attempt ||
        !attempt.finished_at ||
        !attempt.moves ||
        !attempt.time_ms
      ) {
        return NextResponse.json(
          {
            error:
              "완료된 게임 기록을 찾을 수 없습니다.",
          },
          {
            status: 400,
          },
        );
      }

      if (
        attempt.registered
      ) {
        return NextResponse.json(
          {
            error:
              "이미 등록된 기록입니다.",
          },
          {
            status: 409,
          },
        );
      }

      const rankings =
        await loadRankings();

      if (
        !qualifies(
          rankings,
          attempt.moves,
          attempt.time_ms,
        )
      ) {
        return NextResponse.json(
          {
            qualified: false,

            rankings,

            error:
              "등록 전에 새로운 기록이 올라와 TOP 3에서 벗어났습니다.",
          },
          {
            status: 409,
          },
        );
      }

      const {
        error: insertError,
      } = await db
        .from(
          "memory_game_rankings",
        )
        .insert({
          nickname,

          moves:
            attempt.moves,

          time_ms:
            attempt.time_ms,
        });

      if (insertError) {
        throw insertError;
      }

      const {
        error: markError,
      } = await db
        .from(
          "memory_game_attempts",
        )
        .update({
          registered: true,
        })
        .eq(
          "id",
          attemptId,
        );

      if (markError) {
        throw markError;
      }

      /*
       * 4위 이하 기록 삭제
       */
      await cleanupRankings();

      const updatedRankings =
        await loadRankings();

      return NextResponse.json({
        qualified: true,

        registered: true,

        rankings:
          updatedRankings,
      });
    }

    return NextResponse.json(
      {
        error:
          "지원하지 않는 요청입니다.",
      },
      {
        status: 400,
      },
    );
  } catch (error) {
    console.error(
      "미니게임 랭킹 처리 실패:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "랭킹 처리 중 문제가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}