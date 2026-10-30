import { NextResponse } from "next/server";

import { createAdminDb } from "../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db =
      createAdminDb();

    const {
      data,
      error,
    } = await db
      .from("qna_posts")
      .select(`
        id,
        soop_nickname,
        is_anonymous,
        title,
        content,
        answer,
        status,
        created_at,
        answered_at
      `)
      .order(
        "created_at",
        {
          ascending: false,
        },
      );

    if (error) {
      throw error;
    }

    const posts =
      (data ?? []).map(
        (post) => ({
          id: post.id,

          author:
            post.is_anonymous
              ? "익명"
              : post.soop_nickname,

          title:
            post.title,

          content:
            post.content,

          answer:
            post.answer,

          status:
            post.status,

          createdAt:
            post.created_at,

          answeredAt:
            post.answered_at,
        }),
      );

    return NextResponse.json(
      {
        posts,
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
      "Q&A 조회 실패:",
      error,
    );

    return NextResponse.json(
      {
        posts: [],
        error:
          "Q&A를 불러오지 못했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}