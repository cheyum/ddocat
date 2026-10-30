"use client";
import { useState, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import LivePlayer from "./live-player";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import {
  Cat,
  UserRound,
  Play,
  CalendarDays,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  RotateCcw,
  Check,
  LockKeyhole,
  MessageCircleQuestion,
  X,
} from "lucide-react";
import type { Config } from "./site-model";
const menus = [
  { key: "profile", label: "프로필", Icon: UserRound },
  { key: "vod", label: "VOD", Icon: Play },
  { key: "calendar", label: "캘린더", Icon: CalendarDays },
  { key: "minigame", label: "미니게임", Icon: Gamepad2 },
  { key: "qna", label: "Q&A", Icon: MessageCircleQuestion },
];
type AutoVod = {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
  platform: "soop" | "youtube";
};

type VodView =
  | "overview"
  | "soop"
  | "youtube";
export function Backdrop({
  data,
  background,
}: {
  data: Config;
  background?: string;
}) {
  const selectedBackground =
    background || data.background;

  return (
    <div
      className="backdrop"
      aria-hidden="true"
      style={
        {
          "--pc-bg": selectedBackground
            ? `url("${selectedBackground}")`
            : "none",

          "--mobile-bg":
            data.mobileBackground || selectedBackground
              ? `url("${
                  data.mobileBackground ||
                  selectedBackground
                }")`
              : "none",

          "--bg-position": data.position,
          "--mobile-position":
            data.mobilePosition,
          "--bg-scale": data.zoom / 100,
          "--shade": data.overlay / 100,
        } as React.CSSProperties
      }
    >
      <div className="backdrop-image" />
      <div className="backdrop-shade" />
    </div>
  );
}
export function ProfileCard({
  data,
  showLive = false,
}: {
  data: Config;
  showLive?: boolean;
}) {
  return (
    <article className="profile-card">
      <div className="card-eyebrow">
        <span>SOOP STREAMER</span>
        <Heart size={15} />
      </div>
      <div className="avatar">
        {data.avatar ? (
          <img src={data.avatar} alt={`${data.name} 프로필`} />
        ) : (
          <Cat size={56} strokeWidth={1} />
        )}
      </div>
      <h1>
        {data.name}
        <span className="name-mark">✦</span>
      </h1>
      <p className="profile-bio">{data.bio}</p>
      {showLive && <LivePlayer />}
      <div className="profile-divider" />
      <div className="socials">
        {data.soop ? (
          <a
            className="primary-link"
            href={data.soop}
            target="_blank"
            rel="noopener noreferrer"
          >
            SOOP 방송국 <ExternalLink size={16} />
          </a>
        ) : (
          <span className="unlinked">SOOP 링크 준비 중</span>
        )}
        {data.youtube && (
          <a
            className="secondary-link"
            href={data.youtube}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Play size={16} />
            또오냥 유튜브
          </a>
        )}
        {data.cafe && (
  <a
    className="secondary-link"
    href={data.cafe}
    target="_blank"
    rel="noopener noreferrer"
  >
    <ExternalLink size={16} />
    또오냥 팬카페
  </a>
)}
      {data.namuwiki && (
  <a
    className="secondary-link"
    href={data.namuwiki}
    target="_blank"
    rel="noopener noreferrer"
  >
    <ExternalLink size={16} />
    또오냥 위키
  </a>
)}
      </div>
    </article>
  );
}
export default function FanSite({
  data,
  section,
}: {
  data: Config;
  section: string;
}) {
  const active = menus.find((m) => m.key === section);
  const backgroundList = [
  data.background,
  ...(data.backgrounds ?? []),
].filter((value): value is string => Boolean(value));
/* ========================================
   배경 이미지 미리 다운로드
======================================== */
useEffect(() => {
  const timer = window.setTimeout(() => {
    const images = [
      ...backgroundList,
      data.mobileBackground,
    ].filter(
      (value): value is string =>
        Boolean(value),
    );

    images.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, 500);

  return () => {
    window.clearTimeout(timer);
  };
}, [
  data.background,
  data.backgrounds,
  data.mobileBackground,
]);

const [backgroundIndex, setBackgroundIndex] =
  useState(0);

/* 페이지 이동 후에도 직전 배경 기억 */
useLayoutEffect(() => {
  if (!backgroundList.length) return;

  const saved = sessionStorage.getItem(
    "DDOCAT-background-index",
  );

  if (saved === null) return;

  const savedIndex = Number(saved);

  if (
    Number.isInteger(savedIndex) &&
    savedIndex >= 0 &&
    savedIndex < backgroundList.length
  ) {
    setBackgroundIndex(savedIndex);
  } else {
    sessionStorage.setItem(
      "DDOCAT-background-index",
      "0",
    );

    setBackgroundIndex(0);
  }
}, [backgroundList.length]);

function changeBackground(index: number) {
  if (!backgroundList.length) return;

  const nextIndex =
    ((index % backgroundList.length) +
      backgroundList.length) %
    backgroundList.length;

  setBackgroundIndex(nextIndex);

  sessionStorage.setItem(
    "DDOCAT-background-index",
    String(nextIndex),
  );
}

function previousBackground() {
  changeBackground(backgroundIndex - 1);
}

function nextBackground() {
  changeBackground(backgroundIndex + 1);
}

const router = useRouter();

const [vodResetKey, setVodResetKey] =
  useState(0);


/* ========================================
   다른 팬페이지를 미리 불러오기
======================================== */
useEffect(() => {
  router.prefetch("/");
  router.prefetch("/profile");
  router.prefetch("/vod");
  router.prefetch("/calendar");
  router.prefetch("/minigame");
  router.prefetch("/qna");
}, [router]);




const [adminLoginOpen, setAdminLoginOpen] =
  useState(false);

const [adminEmail, setAdminEmail] =
  useState("");

const [adminPassword, setAdminPassword] =
  useState("");
  const [adminLoginError, setAdminLoginError] = useState("");
  const [adminLoginBusy, setAdminLoginBusy] = useState(false);

  async function adminLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (adminLoginBusy) return;

    setAdminLoginBusy(true);
    setAdminLoginError("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });

      if (error) {
        setAdminLoginError("이메일 또는 비밀번호를 확인해 주세요.");
        return;
      }

      setAdminLoginOpen(false);

      router.push("/admin");
      router.refresh();
    } catch {
      setAdminLoginError("로그인 중 문제가 발생했어요.");
    } finally {
      setAdminLoginBusy(false);
    }
  }
  return (
    <div className={`site ${section === "home" ? "home" : "inner"}`}>
      <Backdrop
  data={data}
  background={backgroundList[backgroundIndex]}
/>
      <header className="site-header">
        <div className="brand-area">
  <Link
    href="/"
    className="brand"
    aria-label="또오냥 메인"
  >
    {data.brandlogo ? (
      <img
        src={data.brandlogo}
        alt="또오냥 로고"
        className="brand-logo"
      />
    ) : (
      <Cat size={27} strokeWidth={1.7} />
    )}

    <span>
      {data.name}
      <small>타마고 WORLD</small>
    </span>
  </Link>

  {backgroundList.length > 1 && (
      <div className="background-switcher">
        <button
          type="button"
          onClick={previousBackground}
          aria-label="이전 배경"
        >
          <ChevronLeft size={16} />
        </button>

        <span>
          {backgroundIndex + 1} /{" "}
          {backgroundList.length}
        </span>

        <button
          type="button"
          onClick={nextBackground}
          aria-label="다음 배경"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    )}
</div>
        <nav aria-label="페이지 메뉴">
  {menus.map(({ key, label, Icon }) => (
  <Link
    key={key}
    href={`/${key}`}
    prefetch={true}
    aria-current={
      section === key
        ? "page"
        : undefined
    }
    onClick={(e) => {
      if (
        key === "vod" &&
        section === "vod"
      ) {
        e.preventDefault();

        setVodResetKey(
          (current) => current + 1,
        );
      }
    }}
  >
    <Icon size={17} />
    <span>{label}</span>
  </Link>
))}

  <a
    href="/admin/login"
    onClick={(e) => {
      e.preventDefault();
      setAdminLoginError("");
      setAdminLoginOpen(true);
    }}
  >
    <LockKeyhole size={17} />
    <span>관리자</span>
  </a>
</nav>
      </header>
      {section === "home" ? (
        <main className="home-main">
          <ProfileCard
           data={data} 
           showLive
          />
        </main>
      ) : (
        <main className="page-main">
          <div className="page-heading">
            <span className="eyebrow">DDOCAT / {section.toUpperCase()}</span>
            <h1>
              {active?.label}
              <span>✦</span>
            </h1>
          </div>
          {section === "profile" && (
            <section className="about-layout">
              <ProfileCard data={data} />
              <article className="panel about-panel">
                <span className="eyebrow">ABOUT</span>
                <h2>또오냥 소개</h2>
                <p className="about-copy">
                  {data.about || "또오냥의 소개가 곧 채워질 예정이에요."}
                </p>
              </article>
            </section>
          )}
          {section === "vod" && (
  <VodPage
    youtubeUrl={data.youtube}
    resetKey={vodResetKey}
  />
)}
          {section === "calendar" && (
  <SoopCalendar />
)}
          {section === "qna" && (
  <QnaPage />
)}
          {section === "minigame" && (
  <div className="minigame-page">

    <MemoryGame />

    <ExternalGameList />

  </div>
)}
        </main>
      )}
      <footer className="site-footer">
        <span>{data.name} 타마고 WORLD</span>
        <span>타마고와 함께하는 공간</span>
      </footer>
    {adminLoginOpen && (
  <div
    className="admin-login-overlay"
    onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        setAdminLoginOpen(false);
      }
    }}
  >
    <div
      className="admin-login-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-login-title"
    >
      <button
        type="button"
        className="admin-login-close"
        onClick={() => setAdminLoginOpen(false)}
        aria-label="로그인 창 닫기"
      >
        <X size={20} />
      </button>

      <div className="admin-login-icon">
        <LockKeyhole size={24} />
      </div>

      <span className="admin-login-eyebrow">
        DDOCAT ADMIN
      </span>

      <h2 id="admin-login-title">
        관리자 로그인
      </h2>

      <p className="admin-login-description">
        관리자 계정으로 로그인해 주세요.
      </p>

      <form onSubmit={adminLogin}>
        <label>
          이메일
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="이메일"
            autoComplete="email"
            required
          />
        </label>

        <label>
          비밀번호
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="비밀번호"
            autoComplete="current-password"
            required
          />
        </label>

        {adminLoginError && (
          <p className="admin-login-error">
            {adminLoginError}
          </p>
        )}

        <button
          type="submit"
          className="admin-login-submit"
          disabled={adminLoginBusy}
        >
          {adminLoginBusy
            ? "로그인 중..."
            : "관리자 로그인"}
        </button>
      </form>
    </div>
  </div>
)}

</div>
);
}
function VodPage({
  youtubeUrl,
  resetKey,
}: {
  youtubeUrl: string;
  resetKey: number;
}) {
  const [view, setView] =
    useState<VodView>("overview");
    useEffect(() => {
  setView("overview");
}, [resetKey]);

  const [soopVideos, setSoopVideos] =
    useState<AutoVod[]>([]);

  const [
    youtubeVideos,
    setYoutubeVideos,
  ] = useState<AutoVod[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadVideos() {
      setLoading(true);
      setError("");

      try {
        let youtubeHandle =
          "@또오냥";

        try {
          if (youtubeUrl) {
            const url =
              new URL(youtubeUrl);

            const part =
              url.pathname
                .split("/")
                .filter(Boolean)
                .find((value) =>
                  value.startsWith("@"),
                );

            if (part) {
              youtubeHandle =
                decodeURIComponent(
                  part,
                );
            }
          }
        } catch {
          /* 기본 handle 사용 */
        }

        const [
          soopResult,
          youtubeResult,
        ] =
          await Promise.allSettled([
            fetch(
              "/api/vod/soop",
              {
                signal:
                  controller.signal,
              },
            ).then(
              async (response) => {
                if (!response.ok) {
                  throw new Error(
                    "SOOP VOD 조회 실패",
                  );
                }

                return response.json();
              },
            ),

            fetch(
              `/api/vod/youtube?handle=${encodeURIComponent(
                youtubeHandle,
              )}`,
              {
                signal:
                  controller.signal,
              },
            ).then(
              async (response) => {
                if (!response.ok) {
                  throw new Error(
                    "YouTube 영상 조회 실패",
                  );
                }

                return response.json();
              },
            ),
          ]);

        if (
          soopResult.status ===
          "fulfilled"
        ) {
          setSoopVideos(
            Array.isArray(
              soopResult.value
                ?.videos,
            )
              ? soopResult.value
                  .videos
              : [],
          );
        }

        if (
          youtubeResult.status ===
          "fulfilled"
        ) {
          setYoutubeVideos(
            Array.isArray(
              youtubeResult.value
                ?.videos,
            )
              ? youtubeResult.value
                  .videos
              : [],
          );
        }

        if (
          soopResult.status ===
            "rejected" &&
          youtubeResult.status ===
            "rejected"
        ) {
          setError(
            "영상을 불러오지 못했어요.",
          );
        }
      } catch (error) {
        if (
          error instanceof
            DOMException &&
          error.name ===
            "AbortError"
        ) {
          return;
        }

        setError(
          "영상을 불러오지 못했어요.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadVideos();

    return () => {
      controller.abort();
    };
  }, [youtubeUrl]);

  function changeView(
    next: "soop" | "youtube",
  ) {
    setView((current) =>
      current === next
        ? "overview"
        : next,
    );
  }

  if (loading) {
  return (
    <section className="vod-section">
      <div className="panel vod-shell">
        <div className="vod-shell-header">
          <div className="vod-shell-title">
            <span className="eyebrow">
              VIDEO ARCHIVE
            </span>

            <h2>
              또오냥 영상 모아보기
            </h2>
          </div>
        </div>

        <div className="vod-loading">
          <Play
            size={34}
            strokeWidth={1.3}
          />

          <p>
            최신 영상을 불러오고 있어요.
          </p>
        </div>
      </div>
    </section>
  );
}

return (
  <section className="vod-section">
    <div className="panel vod-shell">
      <div className="vod-shell-header">
        <div className="vod-shell-title">
          <span className="eyebrow">
            VIDEO ARCHIVE
          </span>

          <h2>
            또오냥 영상 모아보기
          </h2>
        </div>

        <div className="vod-platform-tabs">
          <button
            type="button"
            className={
              view === "soop"
                ? "active"
                : ""
            }
            onClick={() =>
              changeView("soop")
            }
          >
            SOOP
          </button>

          <button
            type="button"
            className={
              view === "youtube"
                ? "active"
                : ""
            }
            onClick={() =>
              changeView("youtube")
            }
          >
            YouTube
          </button>
        </div>
      </div>

      {error && (
        <p className="vod-error">
          {error}
        </p>
      )}

      <div className="vod-shell-content">
        {view === "overview" && (
          <div className="vod-overview">
            <VodGroup
              title="SOOP 최신 VOD"
              videos={soopVideos.slice(
                0,
                3,
              )}
              emptyText="SOOP VOD가 아직 없어요."
              onMore={() =>
                setView("soop")
              }
            />

            <VodGroup
              title="YouTube 최신 영상"
              videos={youtubeVideos.slice(
                0,
                3,
              )}
              emptyText="YouTube 영상이 아직 없어요."
              onMore={() =>
                setView("youtube")
              }
            />
          </div>
        )}

        {view === "soop" && (
          <VodGroup
            title="SOOP VOD"
            videos={soopVideos}
            emptyText="SOOP VOD가 아직 없어요."
          />
        )}

        {view === "youtube" && (
          <VodGroup
            title="YouTube"
            videos={youtubeVideos}
            emptyText="YouTube 영상이 아직 없어요."
          />
        )}
      </div>
    </div>
  </section>
);
}
function VodGroup({
  title,
  videos,
  emptyText,
  onMore,
}: {
  title: string;
  videos: AutoVod[];
  emptyText: string;
  onMore?: () => void;
}) {
  return (
    <section className="vod-platform-group">
      <div className="vod-group-heading">
        <h2>{title}</h2>

        {onMore && (
          <button
            type="button"
            onClick={onMore}
          >
            전체보기
          </button>
        )}
      </div>

      {videos.length ? (
        <div className="vod-grid">
          {videos.map((video) => (
            <VodCard
              key={`${video.platform}-${video.id}`}
              video={video}
            />
          ))}
        </div>
      ) : (
        <div className="empty panel">
          <Play
            size={36}
            strokeWidth={1.2}
          />

          <h2>
            {emptyText}
          </h2>
        </div>
      )}
    </section>
  );
}
function VodCard({
  video,
}: {
  video: AutoVod;
}) {
  return (
    <a
      className="vod-card panel"
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="vod-thumb">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt=""
            loading="lazy"
          />
        ) : (
          <Play size={36} />
        )}

        <span className="play-icon">
          <Play
            size={19}
            fill="currentColor"
          />
        </span>

        <span className="vod-platform-badge">
          {video.platform ===
          "youtube"
            ? "YouTube"
            : "SOOP"}
        </span>
      </div>

      <h2>
        {video.title}
      </h2>


    </a>
  );
}
function Empty({
  Icon,
  title,
  text,
}: {
  Icon: typeof Play;
  title: string;
  text: string;
}) {
  return (
    <div className="empty panel">
      <Icon size={36} strokeWidth={1.2} />
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  kind: string;
};

function getKoreaNow() {
  return new Date(
    new Date().toLocaleString(
      "en-US",
      {
        timeZone:
          "Asia/Seoul",
      },
    ),
  );
}

function SoopCalendar() {
  const now = getKoreaNow();

  const [month, setMonth] = useState({
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  const [events, setEvents] =
    useState<CalendarEvent[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ========================================
     SOOP 캘린더 자동 불러오기
  ======================================== */
  useEffect(() => {
    const controller =
      new AbortController();

    async function loadCalendar() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/calendar/soop?year=${month.year}&month=${month.month + 1}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            "캘린더 조회 실패",
          );
        }

        const result =
          await response.json();

        setEvents(
          Array.isArray(result.events)
            ? result.events
            : [],
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setEvents([]);

        setError(
          "SOOP 일정을 불러오지 못했어요.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadCalendar();

    return () => {
      controller.abort();
    };
  }, [month.year, month.month]);

  const prefix =
    `${month.year}-${String(
      month.month + 1,
    ).padStart(2, "0")}`;

  const firstDay = new Date(
    month.year,
    month.month,
    1,
  ).getDay();

  const daysInMonth = new Date(
    month.year,
    month.month + 1,
    0,
  ).getDate();

  const today =
    `${now.getFullYear()}-${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")}`;

  function moveMonth(value: number) {
    const next = new Date(
      month.year,
      month.month + value,
      1,
    );

    setMonth({
      year: next.getFullYear(),
      month: next.getMonth(),
    });
  }

  function goToday() {
    const current =
      getKoreaNow();

    setMonth({
      year: current.getFullYear(),
      month: current.getMonth(),
    });
  }

  return (
    <section className="soop-calendar-page">
      <div className="schedule-calendar panel">
        <div className="schedule-calendar-header">
  <div className="schedule-calendar-label">
     또오냥 일정
  </div>

  <h2 className="schedule-calendar-month">
    {month.year}.{" "}
    {String(
      month.month + 1,
    ).padStart(2, "0")}
  </h2>

  <div className="schedule-calendar-controls">
    <button
      type="button"
      className="calendar-today-button"
      onClick={goToday}
    >
      오늘
    </button>

    <button
      type="button"
      aria-label="이전 달"
      onClick={() =>
        moveMonth(-1)
      }
    >
      <ChevronLeft size={19} />
    </button>

    <button
      type="button"
      aria-label="다음 달"
      onClick={() =>
        moveMonth(1)
      }
    >
      <ChevronRight size={19} />
    </button>
  </div>
</div>

        {loading && (
          <div className="schedule-status">
            <CalendarDays
              size={22}
            />

            <span>
              SOOP 일정을 불러오고
              있어요.
            </span>
          </div>
        )}

        {error && (
          <div className="schedule-status schedule-error">
            <CalendarDays
              size={22}
            />

            <span>
              {error}
            </span>
          </div>
        )}

        <div className="schedule-weekdays">
          {[
            "일",
            "월",
            "화",
            "수",
            "목",
            "금",
            "토",
          ].map((day, index) => (
            <div
              key={day}
              className={`schedule-weekday ${
                index === 0
                  ? "sunday"
                  : index === 6
                    ? "saturday"
                    : ""
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="schedule-grid">
          {Array.from({
            length: firstDay,
          }).map((_, index) => (
            <div
              key={`blank-${index}`}
              className="schedule-day schedule-day-empty"
            />
          ))}

          {Array.from({
            length: daysInMonth,
          }).map((_, index) => {
            const day =
              index + 1;

            const date =
              `${prefix}-${String(
                day,
              ).padStart(2, "0")}`;

            const dayEvents =
              events
                .filter(
                  (event) =>
                    event.date ===
                    date,
                )
                .sort((a, b) =>
                  a.time.localeCompare(
                    b.time,
                  ),
                );

            const weekday =
              new Date(
                month.year,
                month.month,
                day,
              ).getDay();

            return (
              <div
                key={date}
                className={`schedule-day ${
                  date === today
                    ? "today"
                    : ""
                }`}
              >
                <div className="schedule-day-number">
                  <span
                    className={
                      weekday === 0
                        ? "sunday"
                        : weekday === 6
                          ? "saturday"
                          : ""
                    }
                  >
                    {day}
                  </span>

                  {date === today && (
                    <small>
                      TODAY
                    </small>
                  )}
                </div>

                <div className="schedule-day-events">
                  {dayEvents.map(
                    (event) => (
                      <div
                        className="schedule-event"
                        key={event.id}
                      >
                        {event.time && (
                          <span className="schedule-event-time">
                            {
                              event.time
                            }
                          </span>
                        )}

                        <strong>
                          {
                            event.title
                          }
                        </strong>

                        {event.kind && (
                          <span className="schedule-event-kind">
                            {
                              event.kind
                            }
                          </span>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type QnaPost = {
  id: string;
  author: string;
  title: string;
  content: string;
  answer: string | null;
  status: "waiting" | "answered";
  createdAt: string;
  answeredAt: string | null;
};

function formatQnaDate(value: string) {
  return new Intl.DateTimeFormat(
    "ko-KR",
    {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(new Date(value));
}

function QnaPage() {
  const [posts, setPosts] =
    useState<QnaPost[]>([]);

  const [selectedPost, setSelectedPost] =
    useState<QnaPost | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadQna() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          "/api/qna",
          {
            signal: controller.signal,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(
            "Q&A 조회 실패",
          );
        }

        const result =
          await response.json();

        setPosts(
          Array.isArray(result.posts)
            ? result.posts
            : [],
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setError(
          "Q&A를 불러오지 못했어요.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadQna();

    return () => {
      controller.abort();
    };
  }, []);

  if (selectedPost) {
    return (
      <section className="qna-section">
        <div className="panel qna-shell">
          <div className="qna-detail-top">
            <button
              type="button"
              className="qna-back-button"
              onClick={() =>
                setSelectedPost(null)
              }
            >
              ← 목록으로
            </button>

            <span
              className={`qna-status ${
                selectedPost.status ===
                "answered"
                  ? "answered"
                  : "waiting"
              }`}
            >
              {selectedPost.status ===
              "answered"
                ? "답변완료"
                : "답변대기"}
            </span>
          </div>

          <div className="qna-detail-heading">
            <h2>
              {selectedPost.title}
            </h2>

            <div className="qna-detail-meta">
              <span>
                {selectedPost.author}
              </span>

              <span>
                {formatQnaDate(
                  selectedPost.createdAt,
                )}
              </span>
            </div>
          </div>

          <div className="qna-question">
            <span className="qna-label">
              QUESTION
            </span>

            <p>
              {selectedPost.content}
            </p>
          </div>

          <div className="qna-answer">
            <span className="qna-label">
              ANSWER
            </span>

            {selectedPost.answer ? (
              <p>
                {selectedPost.answer}
              </p>
            ) : (
              <div className="qna-answer-empty">
                아직 관리자의 답변이
                등록되지 않았어요.
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="qna-section">
      <div className="panel qna-shell">
        <div className="qna-header">
          <div>
            <span className="eyebrow">
              TAMAGO Q&A
            </span>

            <h2>
              또오냥에게 질문하기
            </h2>

            <p>
              SOOP 계정 인증 후 질문을
              남길 수 있어요. 원하는 경우
              익명으로 작성할 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            className="qna-write-button"
            disabled
            title="SOOP 인증 기능 연결 후 활성화됩니다."
          >
            질문 작성
          </button>
        </div>

        {loading ? (
          <div className="qna-empty">
            Q&A를 불러오고 있어요.
          </div>
        ) : error ? (
          <div className="qna-empty qna-error">
            {error}
          </div>
        ) : posts.length > 0 ? (
          <div className="qna-list">
            {posts.map((post) => (
              <button
                type="button"
                className="qna-list-item"
                key={post.id}
                onClick={() =>
                  setSelectedPost(post)
                }
              >
                <span
                  className={`qna-status ${
                    post.status ===
                    "answered"
                      ? "answered"
                      : "waiting"
                  }`}
                >
                  {post.status ===
                  "answered"
                    ? "답변완료"
                    : "답변대기"}
                </span>

                <div className="qna-list-content">
                  <strong>
                    {post.title}
                  </strong>

                  <div className="qna-list-meta">
                    <span>
                      {post.author}
                    </span>

                    <span>
                      {formatQnaDate(
                        post.createdAt,
                      )}
                    </span>
                  </div>
                </div>

                <span className="qna-list-arrow">
                  ›
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="qna-empty">
            아직 등록된 질문이 없어요.
          </div>
        )}
      </div>
    </section>
  );
}

type ExternalGame = {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  description?: string;
};

const externalGames: ExternalGame[] = [
  {
    id: "game-1",
    title: "사과게임",
    url: "https://www.gamesaien.com/game/fruit_box_a/",
    thumbnail: "/images/사과게임.png",
  },

  {
    id: "game-2",
    title: "사과게임(멀티)",
    url: "https://apple.oshizi.com/ko/",
    thumbnail: "/images/사과게임멀티.png",
  },
  
  {
    id: "game-3",
    title: "컬러타일",
    url: "https://www.gamesaien.com/game/color_tiles/",
    thumbnail: "/images/컬러타일.png",
  },
  
  {
    id: "game-4",
    title: "컬러타일(멀티)",
    url: "https://color-tiles.oshizi.com/ko/",
    thumbnail: "/images/컬러타일멀티.png",
  },
];

const symbols = [
  "🐱",
  "🐾",
  "🎀",
  "🌙",
  "💚",
  "⭐",
];

type GameRanking = {
  id: string;
  nickname: string;
  moves: number;
  timeMs: number;
  createdAt: string;
};

function formatGameTime(
  timeMs: number,
) {
  return `${(
    timeMs / 1000
  ).toFixed(1)}초`;
}

function MemoryGame() {
  const [
    cards,
    setCards,
  ] = useState<string[]>([]);

  const [
    open,
    setOpen,
  ] = useState<number[]>([]);

  const [
    matched,
    setMatched,
  ] = useState<number[]>([]);

  const [
    moves,
    setMoves,
  ] = useState(0);

  const [
    started,
    setStarted,
  ] = useState(false);

  const [
    completed,
    setCompleted,
  ] = useState(false);

  const [
    starting,
    setStarting,
  ] = useState(false);

  const [
    finishing,
    setFinishing,
  ] = useState(false);

  const [
    attemptId,
    setAttemptId,
  ] = useState("");

  const [
    startedAt,
    setStartedAt,
  ] = useState<number | null>(
    null,
  );

  const [
    elapsedMs,
    setElapsedMs,
  ] = useState(0);

  const [
    rankings,
    setRankings,
  ] =
    useState<GameRanking[]>([]);

  const [
    rankingLoading,
    setRankingLoading,
  ] = useState(true);

  const [
    rankingError,
    setRankingError,
  ] = useState("");

  const [
    qualified,
    setQualified,
  ] = useState(false);

  const [
    registered,
    setRegistered,
  ] = useState(false);

  const [
    nickname,
    setNickname,
  ] = useState("");

  const [
    rankBusy,
    setRankBusy,
  ] = useState(false);

  const [
    rankMessage,
    setRankMessage,
  ] = useState("");

  async function loadRankings() {
    try {
      setRankingLoading(
        true,
      );

      setRankingError("");

      const response =
        await fetch(
          "/api/minigame/ranking",
          {
            cache:
              "no-store",
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "랭킹 조회 실패",
        );
      }

      setRankings(
        Array.isArray(
          result.rankings,
        )
          ? result.rankings
          : [],
      );
    } catch {
      setRankingError(
        "랭킹을 불러오지 못했어요.",
      );
    } finally {
      setRankingLoading(
        false,
      );
    }
  }

function ExternalGameList() {
  if (!externalGames.length) {
    return null;
  }

  return (
    <section className="external-games-section">

      <div className="external-games-heading">

        <div>
          <span className="eyebrow">
            EXTERNAL GAMES
          </span>

          <h2>
            다른 게임도 플레이해보세요
          </h2>

          <p>
            게임을 선택하면 새 탭에서 열립니다.
          </p>
        </div>

      </div>


      <div className="external-games-grid">

        {externalGames.map(
          (game) => (

            <a
              key={game.id}
              className="external-game-card panel"
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
            >

              <div className="external-game-thumbnail">

                {game.thumbnail ? (

                  <img
                    src={game.thumbnail}
                    alt={`${game.title} 썸네일`}
                    loading="lazy"
                  />

                ) : (

                  <div className="external-game-thumbnail-empty">

                    <Gamepad2
                      size={38}
                      strokeWidth={1.2}
                    />

                  </div>

                )}

                <span className="external-game-badge">
                  GAME
                </span>

              </div>


              <div className="external-game-info">

                <div className="external-game-title">

                  <h3>
                    {game.title}
                  </h3>

                  <ExternalLink
                    size={15}
                  />

                </div>


                {game.description && (

                  <p>
                    {game.description}
                  </p>

                )}


                <span className="external-game-play">
                  플레이하기
                  <ExternalLink
                    size={12}
                  />
                </span>

              </div>

            </a>

          ),
        )}

      </div>

    </section>
  );
}

  useEffect(() => {
    loadRankings();
  }, []);

  /*
   * 화면용 타이머
   */
  useEffect(() => {
    if (
      !started ||
      completed ||
      startedAt === null
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setElapsedMs(
            Date.now() -
              startedAt,
          );
        },
        100,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [
    started,
    completed,
    startedAt,
  ]);

  /*
   * 게임 시작
   */
  async function start() {
    if (starting) {
      return;
    }

    setStarting(true);

    setRankingError("");
    setRankMessage("");

    try {
      const response =
        await fetch(
          "/api/minigame/ranking",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action:
                  "start",
              }),
          },
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.attemptId
      ) {
        throw new Error(
          result.error ||
            "게임 시작 실패",
        );
      }

      const array = [
        ...symbols,
        ...symbols,
      ];

      for (
        let i =
          array.length - 1;
        i > 0;
        i--
      ) {
        const j =
          Math.floor(
            Math.random() *
              (i + 1),
          );

        [
          array[i],
          array[j],
        ] = [
          array[j],
          array[i],
        ];
      }

      setAttemptId(
        result.attemptId,
      );

      setCards(array);

      setOpen([]);
      setMatched([]);

      setMoves(0);

      setCompleted(false);

      setQualified(false);
      setRegistered(false);

      setNickname("");

      setRankMessage("");

      setElapsedMs(0);

      setStartedAt(
        Date.now(),
      );

      setStarted(true);
    } catch {
      setRankingError(
        "게임 기록 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setStarting(false);
    }
  }

  /*
   * 카드 두 장 확인
   */
  useEffect(() => {
    if (
      open.length !== 2 ||
      completed
    ) {
      return;
    }

    const [
      first,
      second,
    ] = open;

    const timer =
      window.setTimeout(
        () => {
          if (
            cards[first] ===
            cards[second]
          ) {
            setMatched(
              (current) => [
                ...current,
                first,
                second,
              ],
            );
          }

          setOpen([]);
        },
        700,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    open,
    cards,
    completed,
  ]);

  /*
   * 게임 완료
   */
  useEffect(() => {
    if (
      !started ||
      completed ||
      matched.length !== 12
    ) {
      return;
    }

    setCompleted(true);

    if (
      startedAt !== null
    ) {
      setElapsedMs(
        Date.now() -
          startedAt,
      );
    }

    async function finishGame() {
      if (!attemptId) {
        return;
      }

      setFinishing(true);

      setRankMessage("");

      try {
        const response =
          await fetch(
            "/api/minigame/ranking",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  action:
                    "finish",

                  attemptId,

                  moves,
                }),
            },
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "기록 확인 실패",
          );
        }

        if (
          Number.isFinite(
            result.timeMs,
          )
        ) {
          setElapsedMs(
            result.timeMs,
          );
        }

        setRankings(
          Array.isArray(
            result.rankings,
          )
            ? result.rankings
            : [],
        );

        const isQualified =
          Boolean(
            result.qualified,
          );

        setQualified(
          isQualified,
        );

        if (
          isQualified
        ) {
          setRankMessage(
            "TOP 3 기록입니다! 원하는 닉네임으로 기록을 남겨주세요.",
          );
        } else {
          setRankMessage(
            "게임을 완료했지만 현재 TOP 3에는 들지 못했어요.",
          );
        }
      } catch {
        setQualified(false);

        setRankMessage(
          "게임은 완료했지만 랭킹 기록을 확인하지 못했어요.",
        );
      } finally {
        setFinishing(false);
      }
    }

    finishGame();
  }, [
    started,
    completed,
    matched.length,
    attemptId,
    moves,
    startedAt,
  ]);

  function flip(
    index: number,
  ) {
    if (
      completed ||
      open.length === 2 ||
      open.includes(index) ||
      matched.includes(index)
    ) {
      return;
    }

    setOpen([
      ...open,
      index,
    ]);

    if (
      open.length === 1
    ) {
      setMoves(
        (current) =>
          current + 1,
      );
    }
  }

  async function submitRanking(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const clean =
      nickname.trim();

    if (
      !qualified ||
      !attemptId ||
      !clean ||
      rankBusy
    ) {
      return;
    }

    setRankBusy(true);

    setRankMessage("");

    try {
      const response =
        await fetch(
          "/api/minigame/ranking",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                action:
                  "submit",

                attemptId,

                nickname:
                  clean,
              }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        if (
          Array.isArray(
            result.rankings,
          )
        ) {
          setRankings(
            result.rankings,
          );
        }

        setQualified(false);

        setRankMessage(
          result.error ||
            "랭킹을 등록하지 못했어요.",
        );

        return;
      }

      setRankings(
        Array.isArray(
          result.rankings,
        )
          ? result.rankings
          : [],
      );

      setRegistered(true);

      setQualified(false);

      setRankMessage(
        "TOP 3 랭킹에 등록됐어요!",
      );
    } catch {
      setRankMessage(
        "랭킹 등록 중 문제가 발생했어요.",
      );
    } finally {
      setRankBusy(false);
    }
  }

  return (
    <section className="memory-game-page">

      <aside className="panel ranking-board">

        <div className="ranking-board-heading">

          <span className="eyebrow">
            TOP RANKING
          </span>

          <h2>
            🏆 TOP 3
          </h2>

          <p>
            시도 횟수가 적을수록
            높은 순위이며,
            동률이면 완료 시간이
            빠른 기록이 우선이에요.
          </p>

        </div>

        {rankingLoading ? (

          <div className="ranking-empty">
            랭킹을 불러오고
            있어요.
          </div>

        ) : rankingError ? (

          <div className="ranking-empty ranking-error">
            {rankingError}
          </div>

        ) : rankings.length ? (

          <div className="ranking-list">

            {rankings.map(
              (
                entry,
                index,
              ) => (

                <div
                  className={`ranking-row ranking-${index + 1}`}
                  key={
                    entry.id
                  }
                >

                  <span className="ranking-place">
                    {index + 1}
                  </span>

                  <div className="ranking-player">

                    <strong>
                      {
                        entry.nickname
                      }
                    </strong>

                    <span>
                      {
                        entry.moves
                      }
                      회 ·{" "}
                      {formatGameTime(
                        entry.timeMs,
                      )}
                    </span>

                  </div>

                </div>
              ),
            )}

          </div>

        ) : (

          <div className="ranking-empty">
            아직 등록된 기록이
            없어요.
            <br />
            첫 번째 TOP 3의
            주인공이 되어보세요.
          </div>

        )}

      </aside>


      <div className="panel game ranked-game">

        <div className="game-heading">

          <div>

            <span className="eyebrow">
              MEMORY GAME
            </span>

            <h2>
              냥냥 짝 맞추기
            </h2>

            <p>
              같은 그림 두 장을
              찾아보세요.
            </p>

          </div>


          <div className="game-live-stats">

            <span>
              {moves}회
            </span>

            <span>
              {matched.length /
                2}
              /6쌍
            </span>

            <span>
              {formatGameTime(
                elapsedMs,
              )}
            </span>

          </div>

        </div>


        {started ? (

          <>

            <div className="memory-grid">

              {cards.map(
                (
                  card,
                  index,
                ) => (

                  <button
                    key={
                      index
                    }
                    type="button"
                    onClick={() =>
                      flip(
                        index,
                      )
                    }
                    disabled={
                      completed ||
                      matched.includes(
                        index,
                      ) ||
                      open.length ===
                        2
                    }
                    className={`memory-card ${
                      open.includes(
                        index,
                      ) ||
                      matched.includes(
                        index,
                      )
                        ? "flipped"
                        : ""
                    }`}
                    aria-label={
                      open.includes(
                        index,
                      ) ||
                      matched.includes(
                        index,
                      )
                        ? card
                        : `${index + 1}번 카드 뒤집기`
                    }
                  >

                    {open.includes(
                      index,
                    ) ||
                    matched.includes(
                      index,
                    ) ? (

                      card

                    ) : (

                      <Cat
                        size={28}
                        strokeWidth={
                          1.2
                        }
                      />

                    )}

                  </button>

                ),
              )}

            </div>


            {completed && (

              <div className="game-result-card">

                <div className="game-result-title">

                  <Check
                    size={20}
                  />

                  <div>

                    <strong>
                      게임 완료!
                    </strong>

                    <span>
                      {moves}회 ·{" "}
                      {formatGameTime(
                        elapsedMs,
                      )}
                    </span>

                  </div>

                </div>


                {finishing ? (

                  <p className="rank-message">
                    TOP 3 진입 여부를
                    확인하고 있어요.
                  </p>

                ) : qualified ? (

                  <form
                    className="rank-entry-form"
                    onSubmit={
                      submitRanking
                    }
                  >

                    <p>
                      {
                        rankMessage
                      }
                    </p>

                    <label>

                      랭킹 닉네임

                      <input
                        type="text"
                        value={
                          nickname
                        }
                        onChange={(
                          event,
                        ) =>
                          setNickname(
                            event
                              .target
                              .value,
                          )
                        }
                        maxLength={
                          20
                        }
                        placeholder="1~20자"
                        autoComplete="off"
                      />

                    </label>

                    <button
                      type="submit"
                      className="primary-button"
                      disabled={
                        rankBusy ||
                        !nickname.trim()
                      }
                    >

                      {rankBusy
                        ? "등록 중..."
                        : "TOP 3 등록"}

                    </button>

                  </form>

                ) : (

                  <p
                    className={`rank-message ${
                      registered
                        ? "success"
                        : ""
                    }`}
                  >
                    {
                      rankMessage
                    }
                  </p>

                )}

              </div>

            )}


            <button
              type="button"
              className="primary-button game-restart-button"
              onClick={
                start
              }
              disabled={
                starting
              }
            >

              <RotateCcw
                size={16}
              />

              {starting
                ? "준비 중..."
                : "다시 하기"}

            </button>

          </>

        ) : (

          <div className="game-start">

            <Gamepad2
              size={48}
              strokeWidth={1}
            />

            <p>
              누구나 로그인 없이
              참여할 수 있어요.
              <br />
              TOP 3에 들면 원하는
              닉네임으로 기록할 수
              있습니다.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={
                start
              }
              disabled={
                starting
              }
            >

              {starting
                ? "게임 준비 중..."
                : "게임 시작"}

            </button>

          </div>

        )}

      </div>

    </section>
  );
}