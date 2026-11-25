# PART 2 · 백엔드 연결 가이드 (클릭 단위)

지금 사이트는 **가짜 데이터 모드**예요. 이 가이드를 순서대로 따라 하면 진짜 회원가입, 게시판, 주문, 예약이 저장되는 사이트가 돼요.
처음 하는 분 기준으로 썼어요. 한 단계 끝날 때마다 ☐ 에 체크하며 진행하세요.

> **비밀 키 원칙 (가장 중요)**
> - 화면 코드(`js/` 폴더)에는 **공개용 값만** 들어가요: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `KAKAO_MAP_KEY`, `PG_CLIENT_KEY`
> - **비밀 키**(`PG_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`)는 **Vercel 환경변수에만** 넣어요. `api/` 폴더의 서버 함수만 읽어요.
> - 비밀 키를 채팅, 메일, 화면 코드, GitHub에 붙여넣지 마세요. 노출됐다면 바로 해당 서비스에서 "재발급(Regenerate)" 하세요.

## 전체 순서 한눈에 보기

| 단계 | 할 일 | 걸리는 시간 |
|---|---|---|
| 1 | Supabase 프로젝트 만들기 | 5분 |
| 2 | SQL 4개 실행 (테이블 → 보안 규칙 → 이미지 저장소 → 시작 데이터) | 5분 |
| 3 | 로그인 설정 (이메일 · 카카오 · 구글) | 10~30분 |
| 4 | GitHub에 코드 올리기 | 10분 |
| 5 | 화면을 진짜 서버로 바꾸기 (index.html 두 줄) | 2분 |
| 6 | Vercel 배포 + 환경변수 등록 | 10분 |
| 7 | 카카오맵 키 발급 + 도메인 등록 | 10분 |
| 8 | 결제(토스페이먼츠) 테스트 키 연결 | 15분 |
| 9 | 문의 알림 메일(Resend) 연결 (선택) | 10분 |
| 10 | 전체 흐름 테스트 | 20분 |
| 11 | 도메인 연결 (선택) | 10분 |

---

## 1. Supabase 프로젝트 만들기 ☐

1. https://supabase.com 접속 → 오른쪽 위 **Start your project** 클릭
2. **Continue with GitHub** 로 가입 (GitHub 계정이 없으면 github.com 에서 먼저 무료 가입)
3. **New project** 클릭
   - Name: `simple-search` (아무거나)
   - Database Password: **Generate a password** 클릭 → 비밀번호를 안전한 곳(비밀번호 관리자)에 저장
   - Region: **Northeast Asia (Seoul)** 선택
   - Plan: **Free**
4. **Create new project** 클릭 → 2분 정도 기다리면 대시보드가 열려요

## 2. 테이블과 보안 규칙 만들기 ☐

파일은 `backend/supabase/` 폴더에 있어요. **반드시 이 순서**로 실행하세요.

1. 왼쪽 메뉴에서 **SQL Editor** (`>_` 모양) 클릭
2. **+ New query** 클릭
3. `01_schema.sql` 파일을 메모장으로 열어 **전부 복사** → 편집창에 붙여넣기 → 오른쪽 아래 **Run** (또는 Ctrl+Enter)
   - 아래에 `Success. No rows returned` 가 나오면 성공
4. 다시 **+ New query** → `02_rls.sql` 붙여넣기 → **Run**
5. **+ New query** → `03_storage.sql` → **Run**
6. **+ New query** → `04_seed.sql` → **Run** (상품·쿠폰은 내 것으로 고쳐서 실행해도 돼요)
7. 확인: 왼쪽 **Table Editor** 를 누르면 `profiles, posts, products, orders, bookings …` 표가 보여요. 각 표 이름 옆에 자물쇠 없이 **RLS enabled** 가 보이면 보안 규칙이 켜진 거예요.

**각 SQL이 하는 일 (쉽게)**

| 파일 | 하는 일 |
|---|---|
| `01_schema.sql` | 표 만들기: 회원 프로필, 문의, 알림, 게시글, 좋아요, 상품, 장바구니, 주문, 쿠폰, 쿠폰 사용 이력, 예약 슬롯, 예약. 그리고 "주문 금액은 DB 가격으로 계산", "쿠폰은 1인 1회", "한 시간에 정원 이상 예약 불가" 같은 규칙 |
| `02_rls.sql` | 행 단위 보안(RLS): **내 프로필·내 글·내 장바구니·내 주문·내 알림만** 고칠 수 있게. 남의 글 수정, 결제 상태 조작, 쿠폰 목록 엿보기를 DB가 막아요 |
| `03_storage.sql` | 이미지 저장소 `uploads` 버킷: 5MB 이하 이미지만, 내 폴더에만 올리기 |
| `04_seed.sql` | 시작 데이터: 상품 6개, 쿠폰 2개, 앞으로 60일 예약 슬롯 |

> 레시피의 `users` 테이블은 Supabase가 자동으로 만드는 `auth.users` 를 그대로 써요(비밀번호를 안전하게 암호화해 보관). 화면에 보일 닉네임·사진·소개는 `profiles` 에 있어요.
>
> 예약 슬롯은 60일치만 만들어져요. **한 달에 한 번** `04_seed.sql` 의 마지막 insert 문만 다시 실행하세요.

## 3. 로그인 설정 ☐

### 3-1. 이메일 로그인 (기본)
1. 왼쪽 **Authentication** → **Sign In / Providers** → **Email** 이 켜져 있는지 확인
2. 테스트할 때 편하게 하려면 **Confirm email** 을 잠시 끄세요 (가입 즉시 로그인). 실서비스에서는 다시 켜는 것을 권장해요.
3. **Authentication → URL Configuration**
   - Site URL: 지금은 `http://localhost:8765`, 6단계 배포 후 `https://내프로젝트.vercel.app` 으로 바꾸기
   - Redirect URLs 에 위 두 주소 모두 추가

### 3-2. 카카오 로그인 (선택)
1. https://developers.kakao.com → 로그인 → **내 애플리케이션 → 애플리케이션 추가하기** (앱 이름, 회사명 입력)
2. **앱 키** 메뉴에서 **REST API 키** 복사
3. **카카오 로그인** 메뉴 → 활성화 **ON** → Redirect URI 에 `https://<내 Supabase 주소>.supabase.co/auth/v1/callback` 등록
4. **보안** 메뉴 → Client Secret **코드 생성** → 활성화
5. **동의항목** → 닉네임, 이메일(비즈 앱 전환 필요할 수 있음) 설정
6. Supabase → **Authentication → Sign In / Providers → Kakao** → 켜고 REST API 키를 *Client ID*, Client Secret 을 *Secret* 에 붙여넣기 → **Save**

### 3-3. 구글 로그인 (선택)
1. https://console.cloud.google.com → 프로젝트 만들기 → **API 및 서비스 → OAuth 동의 화면** 작성
2. **사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID** → 유형 "웹 애플리케이션"
3. 승인된 리디렉션 URI: `https://<내 Supabase 주소>.supabase.co/auth/v1/callback`
4. 받은 클라이언트 ID/보안 비밀을 Supabase → **Providers → Google** 에 붙여넣기 → **Save**

## 4. GitHub에 코드 올리기 ☐

1. https://github.com → 오른쪽 위 **+ → New repository** → 이름 `simple-search` → **Private** 선택 → **Create repository**
2. 새 저장소 화면에서 **uploading an existing file** 링크 클릭
3. 컴퓨터의 `simple-search` 폴더 **안의 파일과 폴더 전부**를 끌어다 놓기 (`.env` 파일은 절대 올리지 않기. `.env.example` 은 괜찮아요)
4. 아래 **Commit changes** 클릭

## 5. 화면을 진짜 서버로 바꾸기 ☐

`index.html` 을 메모장(또는 GitHub 웹에서 연필 아이콘)으로 열고 아래 부분을 찾으세요.

```html
  <script src="js/api.js"></script>
  <!-- PART 2: 위 api.js 대신 아래 두 줄을 켜면 실제 Supabase 와 연결돼요
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
  <script src="js/api-supabase.js"></script>
  -->
```

이렇게 바꿔요 (가짜 API 줄 삭제, 주석 표시 `<!--`, `-->` 삭제):

```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js"></script>
  <script src="js/api-supabase.js"></script>
```

- `js/mock-data.js` 줄은 **지우지 마세요.** 검색 문서와 매장 목록을 계속 거기서 읽어요.
- 화면 코드(`js/views/`)는 하나도 안 고쳐도 돼요. `api.js` 와 `api-supabase.js` 의 함수 이름이 같기 때문이에요.

## 6. Vercel 배포 + 환경변수 ☐

1. https://vercel.com → **Sign Up → Continue with GitHub**
2. **Add New… → Project** → `simple-search` 저장소 옆 **Import**
3. Framework Preset: **Other** (빌드 설정은 건드리지 않아요)
4. **Environment Variables** 펼치고 `.env.example` 의 이름대로 하나씩 추가:

| 이름 | 어디서 복사? | 공개/비밀 |
|---|---|---|
| `SUPABASE_URL` | Supabase → Project Settings → **API** → Project URL | 공개 |
| `SUPABASE_ANON_KEY` | 같은 화면 → `anon` `public` 키 | 공개 |
| `SUPABASE_SERVICE_ROLE_KEY` | 같은 화면 → `service_role` 키 (Reveal) | **비밀** |
| `KAKAO_MAP_KEY` | 7단계에서 발급 | 공개 |
| `PG_CLIENT_KEY` | 8단계에서 발급 | 공개 |
| `PG_SECRET_KEY` | 8단계에서 발급 | **비밀** |
| `RESEND_API_KEY`, `ADMIN_EMAIL`, `MAIL_FROM` | 9단계 (선택) | **비밀** |

5. **Deploy** 클릭 → 1분 뒤 `https://simple-search-xxxx.vercel.app` 주소가 생겨요
6. 3-1의 Supabase **Site URL** 을 이 주소로 바꾸기
7. 환경변수를 나중에 바꾸면: Vercel → **Deployments** → 맨 위 배포 오른쪽 `…` → **Redeploy** 해야 반영돼요

> 화면은 `/api/config` 에서 **공개용 값 4개만** 받아와요(`api/config.js`). 비밀 키는 `api/inquiry.js`, `api/payments/confirm.js` 안에서만 쓰여요.

## 7. 카카오맵 ☐

1. https://developers.kakao.com → 내 애플리케이션 → (3-2에서 만든 앱 또는 새 앱)
2. **앱 키 → JavaScript 키** 복사 → Vercel 환경변수 `KAKAO_MAP_KEY` 에 넣기
3. **플랫폼 → Web 플랫폼 등록** → 사이트 도메인에 `https://simple-search-xxxx.vercel.app` (그리고 테스트용 `http://localhost:8765`) 추가
4. **카카오맵** 메뉴(제품 설정)에서 사용 설정 **ON** (콘솔 버전에 따라 위치가 달라요)
5. Redeploy 후 `매장` 메뉴에 들어가면 예시 지도 대신 진짜 지도가 떠요
6. 매장 위치는 `js/mock-data.js` 의 `stores` 에서 이름·주소·위도(lat)·경도(lng)를 고치세요. 위도·경도는 카카오맵에서 장소 우클릭 → "좌표 복사" 등으로 얻을 수 있어요.

> 길찾기 버튼(카카오맵·네이버지도 링크)은 키가 없어도 지금 바로 동작해요.

## 8. 결제 (토스페이먼츠) ☐

1. https://developers.tosspayments.com → 가입 → **API 키** 메뉴
2. **테스트** 탭의 클라이언트 키(`test_ck_…`) → `PG_CLIENT_KEY`, 시크릿 키(`test_sk_…`) → `PG_SECRET_KEY` 에 넣기
3. Redeploy → 상점에서 담기 → 장바구니 → 주문서 → 결제하기 → **토스 테스트 결제창**이 떠요 (실제 돈은 안 나가요)

**흐름과 안전장치**
1. 주문서에서 "결제하기" → DB 함수 `create_order` 가 **DB에 있는 가격으로** 금액을 계산 (화면에서 금액을 조작해도 무시됨)
2. 토스 결제창 → 성공하면 `/?pay=success&paymentKey=…&orderId=…&amount=…` 로 돌아옴
3. `js/app.js` 가 `/api/payments/confirm` 호출 → 서버가 **주문 금액과 결제 금액이 같은지 확인** → 시크릿 키로 토스 승인 → 주문 `결제완료`, 쿠폰 사용 기록, 장바구니 비우기, 알림 생성

**실서비스 전환**: 사업자 등록 → 토스페이먼츠 **전자결제 신청 및 심사**(보통 1~2주) → 심사 통과 후 **라이브 키**(`live_ck_`, `live_sk_`)로 환경변수 교체. 카카오페이·네이버페이 같은 간편결제는 계약 후 결제창 안에서 선택돼요.

## 9. 문의 알림 메일 (Resend, 선택) ☐

1. https://resend.com 가입 → **API Keys → Create API Key** → 복사해서 `RESEND_API_KEY` 에 넣기
2. `ADMIN_EMAIL` 에 알림 받을 내 이메일
3. 내 도메인이 있으면 **Domains → Add Domain** 으로 인증 후 `MAIL_FROM` 을 `hello@내도메인` 으로. 없으면 `onboarding@resend.dev` (가입한 내 메일로만 발송 가능)
4. 문의 폼에는 사람 눈에 안 보이는 "website" 칸(허니팟)이 있어서, 이 칸을 채우는 스팸봇은 조용히 무시돼요.

> 카카오 알림톡을 원하면 솔라피·알리고 같은 대행사 가입 → 발신 프로필·템플릿 심사 → `api/inquiry.js` 의 메일 보내는 부분 아래에 대행사 API 호출을 추가하면 돼요.

## 10. 전체 흐름 테스트 체크리스트 ☐

배포 주소에서 하나씩 해 보세요.

- [ ] 회원가입 → 로그인 → 상단 "로그인" 버튼이 아바타로 바뀜
- [ ] 종 아이콘에 환영 알림 1개 → 누르면 읽음 처리
- [ ] 마이페이지에서 닉네임·사진 변경 → Supabase **Storage → uploads** 에 사진이 생김
- [ ] 게시판 글쓰기(이미지 첨부) → 목록에 보임 → 다른 계정으로 로그인하면 수정/삭제 버튼이 안 보임
- [ ] 다른 계정으로 좋아요 → 글쓴이 계정에 알림이 **새로고침 없이** 뜸 (Realtime)
- [ ] 문의 접수 → Supabase **Table Editor → inquiries** 에 줄이 생김 (+ 메일 도착)
- [ ] 매장 메뉴에 진짜 카카오맵, 마커 클릭 시 정보창
- [ ] 장바구니 → 쿠폰 WELCOME10 → 토스 테스트 결제 성공 → 마이페이지 주문 내역 "결제완료"
- [ ] 같은 쿠폰 다시 쓰면 "이미 사용한 쿠폰이에요"
- [ ] 예약 → 같은 시간을 다른 계정으로 예약하면 "마감"으로 보임

문제가 생기면 브라우저에서 **F12 → Console** 탭의 빨간 글씨를 복사해서 AI에게 물어보세요.

## 11. 도메인 연결 (선택) ☐

1. 가비아·카페24·Cloudflare 등에서 도메인 구입
2. Vercel → 프로젝트 → **Settings → Domains → Add** → 도메인 입력
3. Vercel이 알려주는 DNS 값(A 레코드 `76.76.21.21` 또는 CNAME `cname.vercel-dns.com`)을 도메인 구입처의 **DNS 관리**에 입력
4. 몇 분~몇 시간 뒤 자물쇠(https)가 자동으로 붙어요
5. 바뀐 도메인을 **Supabase Site URL / Redirect URLs**, **카카오 Web 플랫폼 도메인**에도 추가하세요

---

## 부록: 파일 지도

```
simple-search/
├─ index.html              화면 뼈대 (og 메타 태그 포함)
├─ css/style.css           디자인 (레시피 토큰 그대로)
├─ js/
│  ├─ config.js            공개용 설정값 (로컬 테스트용, 배포 땐 비워 둬도 됨)
│  ├─ mock-data.js         검색 문서·매장 목록 (+ PART 1 가짜 데이터)
│  ├─ api.js               PART 1 가짜 API
│  ├─ api-supabase.js      PART 2 진짜 API (함수 이름 동일)
│  ├─ ui.js, app.js        공통 도우미, 주소 이동
│  └─ views/               기능별 화면
├─ api/                    Vercel 서버 함수 (비밀 키는 여기서만)
│  ├─ config.js            공개용 값 4개 전달
│  ├─ inquiry.js           문의 저장 + 메일
│  └─ payments/confirm.js  결제 승인 (금액 검증)
├─ backend/
│  ├─ GUIDE.md             이 문서
│  └─ supabase/01~04.sql   테이블 · RLS · 저장소 · 시작 데이터
└─ .env.example            필요한 키 이름 목록 (값은 비워 둠)
```

## 부록: 이 코드에서 직접 확인한 것 / 못 한 것

- **확인함**: SQL 4개를 PostgreSQL 16에서 Supabase와 비슷한 환경으로 실행해, 남의 글 수정 차단, 남의 주문 안 보임, 쿠폰 중복 사용 차단, 정원 초과 예약 차단, 좋아요 알림 생성이 동작하는 것을 확인했어요.
- **확인 못 함**: 실제 Supabase 프로젝트·토스·카카오 키가 없어서 `api-supabase.js` 와 `api/` 서버 함수는 실제 서비스와 연결해 보지 못했어요. 10단계 체크리스트로 처음 한 번 꼭 확인해 주세요.
