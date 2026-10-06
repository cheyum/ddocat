"use client";
import { useState, useEffect, useLayoutEffect, } from "react";
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
  X,
} from "lucide-react";
import type { Config } from "./site-model";
const menus = [
  { key: "profile", label: "프로필", Icon: UserRound },
  { key: "vod", label: "VOD", Icon: Play },
  { key: "calendar", label: "캘린더", Icon: CalendarDays },
  { key: "minigame", label: "미니게임", Icon: Gamepad2 },
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
    "ddocat-background-index",
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
      "ddocat-background-index",
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
    "ddocat-background-index",
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
}, [router]);


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
            <span className="eyebrow">ddocat / {section.toUpperCase()}</span>
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
          {section === "minigame" && <MemoryGame />}
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
        ddocat ADMIN
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
        <div className="vod-loading panel">
          <Play
            size={34}
            strokeWidth={1.3}
          />

          <p>
            최신 영상을 불러오고
            있어요.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="vod-section">
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
            changeView(
              "youtube",
            )
          }
        >
          YouTube
        </button>
      </div>

      {error && (
        <p className="vod-error">
          {error}
        </p>
      )}

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

const symbols = ["🐱", "🐾", "🎀", "🌙", "💚", "⭐"];
function MemoryGame() {
  const [cards, setCards] = useState<string[]>([]),
    [open, setOpen] = useState<number[]>([]),
    [matched, setMatched] = useState<number[]>([]),
    [moves, setMoves] = useState(0),
    [started, setStarted] = useState(false);
  function start() {
    const array = [...symbols, ...symbols];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    setCards(array);
    setOpen([]);
    setMatched([]);
    setMoves(0);
    setStarted(true);
  }
  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open;
    const timer = setTimeout(() => {
      if (cards[a] === cards[b]) setMatched((m) => [...m, a, b]);
      setOpen([]);
    }, 700);
    return () => clearTimeout(timer);
  }, [open, cards]);
  function flip(i: number) {
    if (open.length === 2 || open.includes(i) || matched.includes(i)) return;
    setOpen([...open, i]);
    if (open.length === 1) setMoves((m) => m + 1);
  }
  return (
    <section className="panel game">
      <div className="game-heading">
        <div>
          <span className="eyebrow">MEMORY GAME</span>
          <h2>냥냥 짝 맞추기</h2>
          <p>같은 그림 두 장을 찾아보세요.</p>
        </div>
        <span className="moves">
          {moves}번 시도 · {matched.length / 2}/6쌍
        </span>
      </div>
      {started ? (
        <>
          <div className="memory-grid">
            {cards.map((c, i) => (
              <button
                key={i}
                onClick={() => flip(i)}
                disabled={matched.includes(i) || open.length === 2}
                className={`memory-card ${open.includes(i) || matched.includes(i) ? "flipped" : ""}`}
                aria-label={
                  open.includes(i) || matched.includes(i)
                    ? c
                    : `${i + 1}번 카드 뒤집기`
                }
              >
                {open.includes(i) || matched.includes(i) ? (
                  c
                ) : (
                  <Cat size={28} strokeWidth={1.2} />
                )}
              </button>
            ))}
          </div>
          {matched.length === 12 && (
            <p className="game-win">
              <Check size={20} /> 모두 찾았어요! {moves}번 만에 성공.
            </p>
          )}
          <button className="primary-button" onClick={start}>
            <RotateCcw size={16} />
            다시 하기
          </button>
        </>
      ) : (
        <div className="game-start">
          <Gamepad2 size={48} strokeWidth={1} />
          <button className="primary-button" onClick={start}>
            게임 시작
          </button>
        </div>
      )}
    </section>
  );
}
