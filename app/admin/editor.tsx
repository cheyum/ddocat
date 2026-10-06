"use client";
import { useState, useEffect, useRef } from "react";
import {
  ImagePlus,
  Save,
  Eye,
  UserRound,
  CalendarDays,
  Play,
  Trash2,
  Plus,
  House,
  Check,
} from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { IMAGE_BUCKET } from "../../lib/supabase/config";
import type { Config } from "../site-model";
import { Backdrop, ProfileCard } from "../fan-site";
type ImageFieldKey =
  | "background"
  | "mobileBackground"
  | "avatar"
  | "brandLogo";

const IMAGE_SPECS: Record<
  ImageFieldKey,
  {
    width: number;
    height: number;
    description: string;
    fit: "cover" | "contain";
  }
> = {
  background: {
    width: 1920,
    height: 1080,
    description: "1920 × 1080px · 16:9",
    fit: "cover",
  },

  mobileBackground: {
    width: 1080,
    height: 1920,
    description: "1080 × 1920px · 9:16",
    fit: "cover",
  },

  avatar: {
    width: 800,
    height: 800,
    description: "800 × 800px · 정사각형",
    fit: "cover",
  },

  brandLogo: {
    width: 512,
    height: 512,
    description: "512 × 512px · 투명 이미지 권장",
    fit: "contain",
  },
};
async function resizeImage(
  file: File,
  spec: (typeof IMAGE_SPECS)[ImageFieldKey],
) {
  const bitmap = await createImageBitmap(file);

  const canvas = document.createElement("canvas");

  canvas.width = spec.width;
  canvas.height = spec.height;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("이미지를 처리하지 못했어요.");
  }

  ctx.clearRect(0, 0, spec.width, spec.height);

  if (spec.fit === "contain") {
    const scale = Math.min(
      spec.width / bitmap.width,
      spec.height / bitmap.height,
    );

    const width = bitmap.width * scale;
    const height = bitmap.height * scale;

    const x = (spec.width - width) / 2;
    const y = (spec.height - height) / 2;

    ctx.drawImage(bitmap, x, y, width, height);
  } else {
    const sourceRatio = bitmap.width / bitmap.height;
    const targetRatio = spec.width / spec.height;

    let sx = 0;
    let sy = 0;
    let sw = bitmap.width;
    let sh = bitmap.height;

    if (sourceRatio > targetRatio) {
      sw = bitmap.height * targetRatio;
      sx = (bitmap.width - sw) / 2;
    } else {
      sh = bitmap.width / targetRatio;
      sy = (bitmap.height - sh) / 2;
    }

    ctx.drawImage(
      bitmap,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      spec.width,
      spec.height,
    );
  }

  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error("이미지 변환에 실패했어요."));
        }
      },
      "image/webp",
      0.92,
    );
  });

  return new File(
    [blob],
    `image-${Date.now()}.webp`,
    {
      type: "image/webp",
    },
  );
}
export default function AdminEditor({
  initial,
}: {
  initial: { config: Config; revision: number };
}) {
  const [data, setData] = useState(initial.config),
    [revision, setRevision] = useState(initial.revision),
    [tab, setTab] = useState("main"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [dirty, setDirty] = useState(false),
    [preview, setPreview] = useState(false);
  const uploading = useRef(false);
  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function update<K extends keyof Config>(key: K, value: Config[K]) {
    setData((d) => ({ ...d, [key]: value }));
    setDirty(true);
    setMessage("");
  }
  async function upload(
  file: File | undefined,
  field: ImageFieldKey,
  apply: (url: string) => void,
) {
  if (!file || uploading.current) return;

  uploading.current = true;
  setBusy(true);
  setMessage("이미지를 규격에 맞게 조절하고 있어요…");

  try {
    if (file.size > 10 * 1024 * 1024 || file.size < 12) {
      throw new Error(
        "10MB 이하 JPG, PNG, WebP 이미지를 선택해 주세요.",
      );
    }

    const u = new Uint8Array(
      await file.slice(0, 12).arrayBuffer(),
    );

    let valid = false;

    if (
      u[0] === 255 &&
      u[1] === 216 &&
      u[2] === 255
    ) {
      valid = true;
    } else if (
      u.slice(0, 8).join(",") ===
      "137,80,78,71,13,10,26,10"
    ) {
      valid = true;
    } else if (
      String.fromCharCode(...u.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...u.slice(8, 12)) === "WEBP"
    ) {
      valid = true;
    }

    if (!valid) {
      throw new Error(
        "JPG, PNG, WebP만 지원해요.",
      );
    }

    const resizedFile = await resizeImage(
      file,
      IMAGE_SPECS[field],
    );

    setMessage("이미지를 올리고 있어요…");

    const r = await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contentType: resizedFile.type,
        size: resizedFile.size,
      }),
    });

    const v = (await r.json()) as {
      error?: string;
      path: string;
      token: string;
      url: string;
    };

    if (!r.ok) {
      throw new Error(
        v.error || "업로드 준비에 실패했어요.",
      );
    }

    const { error } = await createClient()
      .storage
      .from(IMAGE_BUCKET)
      .uploadToSignedUrl(
        v.path,
        v.token,
        resizedFile,
        {
          contentType: resizedFile.type,
          cacheControl: "31536000",
        },
      );

    if (error) {
      throw new Error(
        "이미지를 올리지 못했어요. 다시 시도해 주세요.",
      );
    }

    apply(v.url);

    setDirty(true);

    setMessage(
      `${IMAGE_SPECS[field].description} 규격으로 변환했어요. 저장을 누르면 적용돼요.`,
    );
  } catch (e) {
    setMessage(
      e instanceof Error
        ? e.message
        : "업로드하지 못했어요.",
    );
  } finally {
    uploading.current = false;
    setBusy(false);
  }
}
  async function save() {
    setBusy(true);
    setMessage("저장 중…");
    try {
      const r = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ config: data, revision }),
        }),
        v = (await r.json()) as { error?: string; revision: number };
      if (!r.ok) throw new Error(v.error);
      setRevision(v.revision);
      setDirty(false);
      setMessage("저장했어요. 팬페이지에 적용됐어요.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }
  function ImageField({
  label,
  field,
}: {
  label: string;
  field: ImageFieldKey;
}) {
    return (
      <div className="image-field">
        <span>{label}</span>
        <small className="image-size-guide">
  권장 및 자동 변환 규격 · {IMAGE_SPECS[field].description}
</small>
        <div className="upload-preview">
          {data[field] ? (
            <img src={data[field]} alt={label} />
          ) : (
            <ImagePlus size={28} />
          )}
        </div>
        <label className="secondary-button upload-button">
          이미지 선택
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={busy}
            onChange={(e) =>
  upload(
    e.target.files?.[0],
    field,
    (url) => update(field, url),
  )
}
          />
        </label>
        {data[field] && (
          <button
            className="text-button"
            disabled={busy}
            onClick={() => update(field, "")}
          >
            이미지 해제
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <a className="admin-brand" href="/">
          또오냥 <span>관리자</span>
        </a>
        <div className="admin-actions">
          <form action="/api/auth/logout" method="post">
            <button className="secondary-button" type="submit" disabled={busy}>
              로그아웃
            </button>
          </form>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="secondary-button"
          >
            <House size={16} />
            팬페이지
          </a>
          <button
            className="primary-button"
            onClick={save}
            disabled={busy || !dirty}
          >
            <Save size={16} />
            {busy ? "처리 중" : "변경사항 저장"}
          </button>
        </div>
      </header>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          {[
            { key: "main", label: "메인 화면", Icon: ImagePlus },
            { key: "profile", label: "프로필", Icon: UserRound },
            { key: "vod", label: "VOD", Icon: Play },
            { key: "calendar", label: "캘린더", Icon: CalendarDays },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={tab === key ? "active" : ""}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
          <p>변경 후 저장을 누르면 팬페이지에 반영돼요.</p>
        </aside>
        <main className="admin-content">
          <div className="admin-title">
            <div>
              <span className="eyebrow">FAN SPACE / ADMIN</span>
              <h1>
                {
                  (
                    {
                      main: "메인 화면",
                      profile: "프로필",
                      vod: "VOD",
                      calendar: "캘린더",
                    } as Record<string, string>
                  )[tab]
                }{" "}
                관리
              </h1>
            </div>
            {tab === "main" && (
              <button
                className="secondary-button"
                onClick={() => setPreview(!preview)}
              >
                <Eye size={16} />
                미리보기
              </button>
            )}
          </div>
          <p role="status" className="save-message">
            {message ||
              (dirty
                ? "저장하지 않은 변경사항이 있어요."
                : "모든 변경사항이 저장되어 있어요.")}
          </p>
          <fieldset disabled={busy} className="edit-fields">
            {tab === "main" && (
              <>
                <section className="edit-panel">
                  <h2>배경 이미지</h2>
                  <p>
                    JPG · PNG · WebP / 최대 10MB. 모바일 배경이 없으면 PC 배경을
                    사용해요.
                  </p>
                  <div className="image-fields">
                    <ImageField label="PC 배경" field="background" />
                    <ImageField label="모바일 배경" field="mobileBackground" />
                    <ImageField label="상단 로고 이미지" field="brandlogo" />
                  </div>
                  <div className="form-grid">
                    <label>
                      PC 이미지 위치
                      <select
                        value={data.position}
                        onChange={(e) =>
                          update(
                            "position",
                            e.target.value as Config["position"],
                          )
                        }
                      >
                        <option value="left">왼쪽</option>
                        <option value="center">가운데</option>
                        <option value="right">오른쪽</option>
                      </select>
                    </label>
                    <label>
                      모바일 이미지 위치
                      <select
                        value={data.mobilePosition}
                        onChange={(e) =>
                          update(
                            "mobilePosition",
                            e.target.value as Config["mobilePosition"],
                          )
                        }
                      >
                        <option value="72%">캐릭터 중심</option>
                        <option value="left">왼쪽</option>
                        <option value="center">가운데</option>
                        <option value="right">오른쪽</option>
                      </select>
                    </label>
                    <label>
                      어두운 오버레이 · {data.overlay}%
                      <input
                        type="range"
                        min="0"
                        max="70"
                        value={data.overlay}
                        onChange={(e) =>
                          update("overlay", Number(e.target.value))
                        }
                      />
                    </label>
                    <label>
                      배경 확대 · {data.zoom}%
                      <input
                        type="range"
                        min="100"
                        max="150"
                        value={data.zoom}
                        onChange={(e) => update("zoom", Number(e.target.value))}
                      />
                    </label>
                  </div>
                </section>
                {preview && (
                  <section className="admin-preview">
                    <Backdrop data={data} />
                    <ProfileCard data={data} />
                  </section>
                )}
              </>
            )}
            {tab === "profile" && (
              <section className="edit-panel">
                <h2>또오냥 소개</h2>
                <ImageField label="프로필 이미지" field="avatar" />
                <div className="form-grid">
                  <label>
                    이름
                    <input
                      maxLength={40}
                      value={data.name}
                      onChange={(e) => update("name", e.target.value)}
                    />
                  </label>
                  <label>
                    짧은 소개
                    <input
                      maxLength={200}
                      value={data.bio}
                      onChange={(e) => update("bio", e.target.value)}
                    />
                  </label>
                  <label>
                    SOOP 방송국 주소
                    <input
                      type="url"
                      placeholder="https://…"
                      value={data.soop}
                      onChange={(e) => update("soop", e.target.value)}
                    />
                  </label>
                  <label>
                    YouTube 주소
                    <input
                      type="url"
                      placeholder="https://…"
                      value={data.youtube}
                      onChange={(e) => update("youtube", e.target.value)}
                    />
                  </label>

                  <label>
                   네이버 카페 주소
                   <input
                     type="url"
                     placeholder="https://…"
                     value={data.cafe}
                     onChange={(e) => update("cafe", e.target.value)}
                    />
                  </label>
                  <label>
                    나무위키 주소
                    <input
                      type="url"
                      placeholder="https://…"
                      value={data.namuwiki}
                      onChange={(e) => update("namuwiki", e.target.value)}
                    />
                  </label>
                  <label className="wide">
                    프로필 본문
                    <textarea
                      rows={8}
                      maxLength={5000}
                      value={data.about}
                      onChange={(e) => update("about", e.target.value)}
                    />
                  </label>
                </div>
              </section>
            )}
            {tab === "vod" && (
              <section className="edit-panel">
                <div className="edit-panel-heading">
                  <h2>영상 목록</h2>
                  <button
                    className="secondary-button"
                    onClick={() =>
                      update("vods", [
                        ...data.vods,
                        {
                          id: crypto.randomUUID(),
                          title: "",
                          url: "",
                          thumbnail: "",
                        },
                      ])
                    }
                  >
                    <Plus size={16} />
                    영상 추가
                  </button>
                </div>
                {!data.vods.length && <p>아직 등록된 영상이 없어요.</p>}
                {data.vods.map((v, i) => (
                  <div className="edit-item" key={v.id}>
                    <div className="edit-item-heading">
                      <strong>영상 {i + 1}</strong>
                      <button
                        aria-label="영상 삭제"
                        onClick={() =>
                          update(
                            "vods",
                            data.vods.filter((x) => x.id !== v.id),
                          )
                        }
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="form-grid">
                      <label>
                        영상 제목
                        <input
                          maxLength={150}
                          value={v.title}
                          onChange={(e) =>
                            update(
                              "vods",
                              data.vods.map((x) =>
                                x.id === v.id
                                  ? { ...x, title: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                      </label>
                      <label>
                        영상 주소
                        <input
                          type="url"
                          placeholder="https://…"
                          value={v.url}
                          onChange={(e) =>
                            update(
                              "vods",
                              data.vods.map((x) =>
                                x.id === v.id
                                  ? { ...x, url: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                      </label>
                      <label>
                        썸네일
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={(e) =>
                            upload(e.target.files?.[0], (url) =>
                              setData((d) => ({
                                ...d,
                                vods: d.vods.map((x) =>
                                  x.id === v.id ? { ...x, thumbnail: url } : x,
                                ),
                              })),
                            )
                          }
                        />
                      </label>
                      {v.thumbnail && (
                        <img
                          className="thumb-small"
                          src={v.thumbnail}
                          alt="썸네일"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </section>
            )}
            {tab === "calendar" && (
              <section className="edit-panel">
                <div className="edit-panel-heading">
                  <h2>방송 일정</h2>
                  <button
                    className="secondary-button"
                    onClick={() =>
                      update("events", [
                        ...data.events,
                        {
                          id: crypto.randomUUID(),
                          date: new Date().toLocaleDateString("sv-SE", {
                            timeZone: "Asia/Seoul",
                          }),
                          time: "21:00",
                          title: "",
                          kind: "방송",
                        },
                      ])
                    }
                  >
                    <Plus size={16} />
                    일정 추가
                  </button>
                </div>
                {!data.events.length && <p>아직 등록된 일정이 없어요.</p>}
                {data.events.map((v) => (
                  <div className="edit-item" key={v.id}>
                    <div className="edit-item-heading">
                      <strong>{v.date}</strong>
                      <button
                        aria-label="일정 삭제"
                        onClick={() =>
                          update(
                            "events",
                            data.events.filter((x) => x.id !== v.id),
                          )
                        }
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="form-grid">
                      {(["date", "time", "title"] as const).map((k) => (
                        <label key={k}>
                          {
                            { date: "날짜", time: "시간", title: "일정 제목" }[
                              k
                            ]
                          }
                          <input
                            type={k === "title" ? "text" : k}
                            value={v[k]}
                            onChange={(e) =>
                              update(
                                "events",
                                data.events.map((x) =>
                                  x.id === v.id
                                    ? { ...x, [k]: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                        </label>
                      ))}
                      <label>
                        일정 종류
                        <select
                          value={v.kind}
                          onChange={(e) =>
                            update(
                              "events",
                              data.events.map((x) =>
                                x.id === v.id
                                  ? {
                                      ...x,
                                      kind: e.target
                                        .value as Config["events"][number]["kind"],
                                    }
                                  : x,
                              ),
                            )
                          }
                        >
                          {["방송", "게임", "합방", "휴방"].map((k) => (
                            <option key={k}>{k}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </fieldset>
        </main>
      </div>
    </div>
  );
}
