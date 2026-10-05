# 또오냥 팬페이지 — Next.js + Vercel + Supabase

현재까지 만든 팬페이지를 표준 Next.js App Router 프로젝트로 옮긴 코드입니다. ChatGPT Sites나 Cloudflare 전용 코드는 포함하지 않았습니다. 이 압축파일을 받는 것만으로 Vercel에 배포되지는 않습니다.

## 들어 있는 기능

- 전체 화면 메인 배경: 제공한 또오냥 이미지 포함
- 좌측 반투명 프로필 카드, 상단 페이지 메뉴
- 메인 `/`, 프로필 `/profile`, VOD `/vod`, 캘린더 `/calendar`, 미니게임 `/minigame`
- 카드 짝 맞추기 미니게임
- 관리자 로그인 `/admin/login`, 편집 `/admin`
- 배경·프로필 이미지, 소개, SOOP·YouTube 링크, VOD, 일정 편집
- PC·모바일 배경 각각 지정, 위치·확대·오버레이 조절
- 저장 충돌 감지, 관리자만 저장·업로드할 수 있는 서버 검사와 데이터베이스 정책

SOOP 실시간 LIVE 상태 연동, 팬 게시판, 미니게임 순위 저장은 현재 구현 범위에 포함되지 않습니다. 프로필 본문, 영상 목록, 일정은 실제 내용 등록 전 상태입니다.

## 1. 내 컴퓨터에서 화면 확인

1. Node.js 22 LTS 또는 24 LTS를 설치합니다.
2. 압축을 풀고 `ttoonyang-vercel` 폴더를 VS Code로 엽니다.
3. VS Code의 터미널에서 실행합니다.

```bash
npm ci
npm run dev
```

브라우저에서 `http://localhost:3000`에 접속합니다. Supabase 설정 전에도 메인과 4개 페이지를 볼 수 있습니다. 이 상태에서 관리자 기능은 연결 설정 안내를 표시합니다. 파일을 편집하지 않아도 현재 배경은 적용되어 있습니다.

## 2. Supabase 프로젝트 만들기

1. https://supabase.com 에 로그인하고 새 프로젝트를 만듭니다.
2. 프로젝트의 **SQL Editor**를 엽니다.
3. `supabase/schema.sql` 내용을 전부 붙여 넣고 실행합니다.
4. **Authentication > Users**에서 관리자 계정을 추가합니다. 사용할 이메일·비밀번호를 지정하고, 이메일 확인이 완료된 계정으로 만듭니다.
5. 생성된 사용자의 **User UID**를 복사합니다.
6. `supabase/add-admin.sql`의 `REPLACE_WITH_YOUR_SUPABASE_AUTH_USER_UUID`를 그 UID로 바꾸고 SQL Editor에서 실행합니다.

관리자 등록 테이블은 일반 방문자가 직접 추가하거나 수정할 수 없습니다. 일반 회원가입은 이 사이트에 없습니다. 관리자 계정은 Supabase에서 직접 만들며, 필요하면 Supabase 설정에서 신규 회원가입도 꺼둘 수 있습니다.

새 프로젝트의 전용 테이블·버킷 이름을 사용합니다. 기존 다른 서비스의 Supabase 프로젝트에 적용하려면 먼저 같은 이름의 테이블이나 버킷이 없는지 확인하세요.

## 3. 환경변수 연결

프로젝트 루트의 `.env.example`을 복사하여 `.env.local`로 이름을 바꿉니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://프로젝트주소.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=프로젝트의_publishable_key
```

두 값은 Supabase 프로젝트의 **Connect** 또는 프로젝트 설정의 API 관련 화면에서 확인합니다. 기존 프로젝트의 `anon` 공개 키도 publishable key 변수에 사용할 수 있습니다. `service_role`이나 secret key는 이 프로젝트에 필요하지 않으며 위 변수에 넣지 마세요.

저장 후 `npm run dev`를 종료하고 다시 실행합니다. `/admin/login`에서 앞서 만든 관리자 이메일·비밀번호로 로그인합니다.

- 텍스트·영상·일정은 Supabase 데이터베이스에 저장됩니다.
- 새로 올리는 이미지는 Supabase의 `fanpage-images` 버킷에 저장됩니다.
- 관리자 화면의 `변경사항 저장`을 눌러야 팬페이지에 반영됩니다.
- 기본 배경 이미지는 `public/images/main-background.png`입니다.
- 업로드한 이미지는 방문자에게 보여주는 공개 파일입니다. 개인 문서나 비공개 자료를 올리는 용도로 사용하지 마세요.

## 4. GitHub에 코드 올리기

VS Code의 Source Control 또는 GitHub Desktop으로 이 폴더의 내용을 새 GitHub 저장소에 올립니다. `package.json`, `package-lock.json`, `app`, `lib`, `public`, `supabase` 등을 포함합니다.

`node_modules`, `.next`, `.env.local`은 올리지 않습니다. `.gitignore`에 제외 규칙이 들어 있습니다. 압축파일에는 실제 비밀번호·API 키가 포함되어 있지 않습니다.

## 5. Vercel 배포

1. https://vercel.com 에서 **Add New > Project**를 선택합니다.
2. 방금 올린 GitHub 저장소를 가져옵니다.
3. Framework Preset은 **Next.js**를 사용합니다.
4. `package.json`이 저장소 최상단에 있으면 Root Directory는 기본값을 유지합니다. 폴더 안에 올렸다면 해당 `ttoonyang-vercel` 폴더를 지정합니다.
5. 환경변수에 아래 두 값을 추가합니다.
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
6. Node.js 버전은 22.x 또는 24.x를 선택합니다.
7. Deploy를 누릅니다. Build Command는 `npm run build`, Install Command는 `npm ci`를 사용할 수 있습니다. Output Directory는 별도로 지정하지 않습니다.
8. Vercel이 준 주소에서 메인과 `/admin/login`을 확인합니다.

Supabase의 Authentication URL Configuration에서 Site URL을 Vercel 주소로 바꾸는 것도 권장합니다. 이 코드의 로그인은 이메일·비밀번호 방식이고 별도의 OAuth 콜백이나 메일 인증 링크를 사이트에서 사용하지 않습니다.

환경변수를 나중에 추가·변경했다면 Vercel에서 다시 배포하세요. 관리자 화면에는 공개 메뉴 링크를 넣지 않았지만, 접근 권한은 주소 숨기기가 아니라 서버와 Supabase 정책으로 검사합니다.

## 이미지 업로드 방식

관리자 확인 후 서버가 업로드 권한을 발급하고, 브라우저에서 Supabase로 파일을 직접 올립니다. Vercel 함수의 요청·응답 용량 제한 때문에 이미지 파일을 서버에 통째로 전달하지 않습니다. JPG, PNG, WebP 및 최대 10MB 제한은 저장 버킷에도 적용되어 있습니다.

## 검증과 한계

타입 검사와 프로덕션 빌드를 통과했습니다. Supabase 설정 전 메인·하위 페이지와 관리자 안내 화면을 로컬 프로덕션 서버에서 확인했고, 로그인 없는 저장·업로드 요청 및 다른 출처의 요청이 차단되는 것을 확인했습니다. 제공한 배경 이미지가 원본 바이트 그대로 전달되는 것도 확인했습니다. 실제 Supabase 프로젝트의 로그인·저장·업로드는 사용자가 프로젝트를 연결한 뒤 확인해야 합니다. Supabase 서비스의 이용 한도·중단 상태 및 Vercel 설정에 따라 운영 상태가 달라질 수 있습니다.

## 프로젝트 구조

```text
app/
  page.tsx                 메인
  [section]/page.tsx       프로필·VOD·캘린더·미니게임
  fan-site.tsx             현재 페이지 UI와 미니게임
  globals.css              PC·모바일 스타일
  site-model.ts            설정 기본값과 유효성 검사
  site-data.ts             공개 설정 조회
  admin/                   로그인·편집 화면
  api/                     저장·업로드 권한·이미지 주소·로그아웃
lib/supabase/              브라우저·서버 연결
proxy.ts                  관리자 로그인 세션 갱신
public/images/            기본 배경 이미지
supabase/                 테이블·권한 설정 SQL
.env.example              환경변수 예시
```

## 참고한 공식 문서

- Supabase SSR: https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Supabase 서명 업로드: https://supabase.com/docs/reference/javascript/file-buckets-uploadtosignedurl
- Vercel 함수 제한: https://vercel.com/docs/functions/limitations
- Vercel Next.js 배포: https://vercel.com/docs/frameworks/full-stack/nextjs
