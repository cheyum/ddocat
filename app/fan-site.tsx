"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import LivePlayer from "./live-player";
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
} from "lucide-react";
import type { Config } from "./site-model";
const menus = [
  { key: "profile", label: "프로필", Icon: UserRound },
  { key: "vod", label: "VOD", Icon: Play },
  { key: "calendar", label: "캘린더", Icon: CalendarDays },
  { key: "minigame", label: "미니게임", Icon: Gamepad2 },
];
export function Backdrop({ data }: { data: Config }) {
  return (
    <div
      className="backdrop"
      aria-hidden="true"
      style={
        {
          "--pc-bg": data.background ? `url("${data.background}")` : "none",
          "--mobile-bg":
            data.mobileBackground || data.background
              ? `url("${data.mobileBackground || data.background}")`
              : "none",
          "--bg-position": data.position,
          "--mobile-position": data.mobilePosition,
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
      </div>
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
  return (
    <div className={`site ${section === "home" ? "home" : "inner"}`}>
      <Backdrop data={data} />
      <header className="site-header">
        <Link href="/" className="brand" aria-label="또오냥 메인">
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
        <nav aria-label="페이지 메뉴">
          {menus.map(({ key, label, Icon }) => (
            <Link
              key={key}
              href={`/${key}`}
              aria-current={section === key ? "page" : undefined}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          ))}
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
            <span className="eyebrow">TTOONYANG / {section.toUpperCase()}</span>
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
            <section className="vod-section">
              {data.vods.length ? (
                <div className="vod-grid">
                  {data.vods.map((v) => (
                    <a
                      key={v.id}
                      className="vod-card panel"
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="vod-thumb">
                        {v.thumbnail ? (
                          <img src={v.thumbnail} alt="" />
                        ) : (
                          <Play size={36} />
                        )}
                        <span className="play-icon">
                          <Play size={19} fill="currentColor" />
                        </span>
                      </div>
                      <h2>{v.title}</h2>
                      <span className="vod-meta">
                        영상 보러가기 <ExternalLink size={14} />
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <Empty
                  Icon={Play}
                  title="다시 보고 싶은 순간들"
                  text="등록된 VOD가 아직 없어요."
                />
              )}
            </section>
          )}
          {section === "calendar" && <Schedule events={data.events} />}{" "}
          {section === "minigame" && <MemoryGame />}
        </main>
      )}
      <footer className="site-footer">
        <span>{data.name} FAN SPACE</span>
        <span>팬이 함께하는 공간</span>
      </footer>
    </div>
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
function Schedule({ events }: { events: Config["events"] }) {
  const [month, setMonth] = useState({ year: 2026, month: 9 }),
    [selected, setSelected] = useState("");
  useEffect(() => {
    const now = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
    );
    setMonth({ year: now.getFullYear(), month: now.getMonth() });
    setSelected(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    );
  }, []);
  const prefix = `${month.year}-${String(month.month + 1).padStart(2, "0")}`,
    first = new Date(month.year, month.month, 1).getDay(),
    days = new Date(month.year, month.month + 1, 0).getDate();
  function move(n: number) {
    const d = new Date(month.year, month.month + n, 1);
    setMonth({ year: d.getFullYear(), month: d.getMonth() });
    setSelected("");
  }
  const list = events
    .filter((e) => (selected ? e.date === selected : e.date.startsWith(prefix)))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return (
    <section className="calendar-layout">
      <div className="panel calendar">
        <div className="calendar-heading">
          <h2>
            {month.year}. {String(month.month + 1).padStart(2, "0")}
          </h2>
          <div>
            <button aria-label="이전 달" onClick={() => move(-1)}>
              <ChevronLeft size={20} />
            </button>
            <button aria-label="다음 달" onClick={() => move(1)}>
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        <div className="calendar-grid">
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <span className="weekday" key={d}>
              {d}
            </span>
          ))}
          {Array.from({ length: first }, (_, i) => (
            <span key={`blank${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const date = `${prefix}-${String(i + 1).padStart(2, "0")}`,
              has = events.some((e) => e.date === date);
            return (
              <button
                className={`day ${selected === date ? "selected" : ""}`}
                key={date}
                onClick={() => setSelected(selected === date ? "" : date)}
                aria-pressed={selected === date}
              >
                <span>{i + 1}</span>
                {has && <span className="event-dot" />}
              </button>
            );
          })}
        </div>
      </div>
      <aside className="panel agenda">
        <span className="eyebrow">SCHEDULE</span>
        <h2>
          {selected ? selected.slice(5).replace("-", "월 ") + "일" : "이번 달"}{" "}
          일정
        </h2>
        {list.length ? (
          list.map((e) => (
            <article className="event" key={e.id}>
              <span className="event-kind">{e.kind}</span>
              <h3>{e.title}</h3>
              <p>
                {e.date} · {e.time}
              </p>
            </article>
          ))
        ) : (
          <div className="agenda-empty">
            <CalendarDays size={28} />
            <p>등록된 일정이 없어요.</p>
          </div>
        )}
      </aside>
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
