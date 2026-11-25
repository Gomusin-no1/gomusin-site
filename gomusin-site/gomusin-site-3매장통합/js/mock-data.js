/* =========================================================
   가짜 데이터 (PART 1 전용)
   실제 서비스로 바꿀 때 이 파일은 지우거나 그대로 두어도 돼요.
   ========================================================= */
window.MOCK = {
  // 검색 대상 문서
  docs: [
    { id: "h1", title: "휴대폰 구매 전 꼭 확인할 것: 공시지원금 vs 선택약정", url: "", summary: "기기값을 바로 깎는 공시지원금과 매달 요금을 25% 할인받는 선택약정, 내 사용 패턴에 맞는 쪽을 매장에서 함께 계산해 드려요." },
    { id: "h2", title: "번호이동 · 기기변경 · 신규가입 차이", url: "", summary: "통신사를 바꾸는 번호이동, 같은 통신사에서 폰만 바꾸는 기기변경, 새 번호를 만드는 신규가입. 조건이 다르니 상담 때 꼭 말씀해 주세요." },
    { id: "h3", title: "중고폰 매입: 쓰던 휴대폰 제값 받는 법", url: "", summary: "액정·배터리 상태와 구성품에 따라 매입가가 달라져요. 초기화 전에 사진과 연락처 백업을 먼저 해 두세요." },
    { id: "h4", title: "요금제 고르는 법: 데이터 사용량부터 확인하세요", url: "", summary: "최근 3개월 데이터 사용량을 보면 맞는 요금제가 보여요. 필요 이상 비싼 요금제를 권하지 않는 것이 고무신의 원칙이에요." },
    { id: "h5", title: "개통 당일 준비물과 걸리는 시간", url: "", summary: "신분증과 본인 명의 결제 수단을 챙겨 오세요. 데이터 옮기기까지 매장에서 도와드려요." },
    { id: "h6", title: "구매 후기: 고객님들이 직접 남긴 이야기", url: "", link: "#/", linkText: "홈에서 리뷰 보기", summary: "네이버 플레이스 방문자 리뷰를 원문 그대로 홈 화면에 모아 두었어요. 지점별 네이버 리뷰도 바로 볼 수 있어요." },
  ],
  // 결과 0건일 때 보여줄 추천 키워드
  suggestKeywords: ["휴대폰", "번호이동", "요금제", "중고폰", "개통", "후기"],
  // "아무거나" 버튼이 고르는 키워드
  randomKeywords: ["휴대폰", "번호이동", "요금제", "중고폰", "개통", "선택약정", "공시지원금", "기기변경", "후기", "데이터"],

  // 데모 계정 (로그인 테스트용)
  users: [
    { id: "u1", email: "demo@example.com", password: "password1234", nickname: "데모사장", bio: "AI로 1인 기업 운영 중", avatar: "", created_at: "2026-10-01T09:00:00Z" },
    { id: "u2", email: "mina@example.com", password: "password1234", nickname: "미나", bio: "", avatar: "", created_at: "2026-10-05T09:00:00Z" }
  ],

  posts: [
    { id: "p1", user_id: "u2", title: "처음 사업자 등록했어요! 질문 있습니다", body: "간이과세자로 시작하는 게 나을까요, 일반과세자로 시작하는 게 나을까요?\n매출은 아직 거의 없어요.", images: [], views: 42, likes: ["u1"], created_at: "2026-11-02T10:12:00Z", updated_at: "2026-11-02T10:12:00Z" },
    { id: "p2", user_id: "u1", title: "AI 상담봇 붙이고 문의 응답 시간이 줄었어요", body: "자주 묻는 질문 20개를 정리해서 넣었더니 단순 문의는 거의 자동으로 해결돼요.\n설정 방법 궁금하신 분 댓글 주세요.", images: [], views: 87, likes: ["u2"], created_at: "2026-11-05T14:30:00Z", updated_at: "2026-11-05T14:30:00Z" },
    { id: "p3", user_id: "u2", title: "쿠폰 정률 vs 정액 어떤 게 나을까요", body: "객단가가 2만원 정도인데 10% 할인과 2천원 할인 중 고민이에요.", images: [], views: 23, likes: [], created_at: "2026-11-08T09:05:00Z", updated_at: "2026-11-08T09:05:00Z" },
    { id: "p4", user_id: "u2", title: "예약 노쇼 어떻게 관리하세요?", body: "하루에 한두 건은 꼭 노쇼가 나요. 예약금을 받아야 할지 고민입니다.", images: [], views: 31, likes: [], created_at: "2026-11-10T19:44:00Z", updated_at: "2026-11-10T19:44:00Z" },
    { id: "p5", user_id: "u1", title: "무료 플랜으로 홈페이지 만든 후기", body: "Supabase와 Vercel 무료 플랜으로 충분히 돌아가요. 방문자가 많아지면 그때 유료로 바꾸면 될 것 같아요.", images: [], views: 120, likes: ["u2"], created_at: "2026-11-12T08:20:00Z", updated_at: "2026-11-12T08:20:00Z" },
    { id: "p6", user_id: "u2", title: "상품 사진 AI로 배경 바꿔봤어요", body: "생각보다 자연스럽네요. 스마트폰 사진도 충분합니다.", images: [], views: 15, likes: [], created_at: "2026-11-14T11:00:00Z", updated_at: "2026-11-14T11:00:00Z" },
    { id: "p7", user_id: "u2", title: "세금 신고 기간 알림 받는 방법 있나요?", body: "홈택스 알림 말고 따로 챙기는 방법이 있는지 궁금해요.", images: [], views: 9, likes: [], created_at: "2026-11-16T16:10:00Z", updated_at: "2026-11-16T16:10:00Z" },
    { id: "p8", user_id: "u1", title: "뉴스레터 첫 발송 했습니다", body: "구독자 37명으로 시작! 오픈율 60% 나왔어요.", images: [], views: 54, likes: [], created_at: "2026-11-18T07:55:00Z", updated_at: "2026-11-18T07:55:00Z" },
    { id: "p9", user_id: "u2", title: "배송비 무료 기준 얼마로 하시나요", body: "3만원? 5만원? 다들 어떻게 정하셨는지 궁금합니다.", images: [], views: 12, likes: [], created_at: "2026-11-19T13:25:00Z", updated_at: "2026-11-19T13:25:00Z" },
    { id: "p10", user_id: "u2", title: "알림톡 비용 생각보다 저렴하네요", body: "건당 몇 원 수준이라 주문 안내용으로 쓰기 좋아요.", images: [], views: 18, likes: [], created_at: "2026-11-20T10:40:00Z", updated_at: "2026-11-20T10:40:00Z" },
    { id: "p11", user_id: "u1", title: "노션 업무 템플릿 공유해요", body: "할 일 / 고객 / 콘텐츠 3개 데이터베이스로 나눠 쓰고 있어요.", images: [], views: 66, likes: [], created_at: "2026-11-21T09:15:00Z", updated_at: "2026-11-21T09:15:00Z" },
    { id: "p12", user_id: "u2", title: "1인 기업 번아웃 극복기", body: "주 1회는 무조건 쉬는 날로 정했더니 오히려 매출이 늘었어요.", images: [], views: 77, likes: [], created_at: "2026-11-22T21:00:00Z", updated_at: "2026-11-22T21:00:00Z" }
  ],

  notifications: [
    { id: "n1", user_id: "u1", type: "like", message: "미나님이 내 글을 좋아해요: AI 상담봇 붙이고…", read: false, link: "#/board/p2", created_at: "2026-11-23T09:30:00Z" },
    { id: "n2", user_id: "u1", type: "system", message: "예약 시스템이 열렸어요. 상담을 예약해 보세요.", read: false, link: "#/booking", created_at: "2026-11-22T12:00:00Z" },
    { id: "n3", user_id: "u1", type: "coupon", message: "첫 구매 10% 할인 쿠폰 WELCOME10 이 도착했어요.", read: false, link: "#/shop", created_at: "2026-11-21T08:00:00Z" },
    { id: "n4", user_id: "u1", type: "system", message: "회원가입을 환영해요!", read: true, link: "#/me", created_at: "2026-10-01T09:00:00Z" }
  ],

  products: [
    { id: "g1", name: "1인 기업 시작 키트 (전자책)", price: 12000, emoji: "📘", desc: "사업자 등록부터 첫 매출까지" },
    { id: "g2", name: "AI 프롬프트 100선", price: 9900, emoji: "🤖", desc: "바로 복사해서 쓰는 업무 프롬프트" },
    { id: "g3", name: "노션 업무 템플릿", price: 15000, emoji: "🗂️", desc: "할 일·고객·콘텐츠 관리" },
    { id: "g4", name: "1:1 온라인 컨설팅 (60분)", price: 50000, emoji: "💬", desc: "화상으로 진행하는 맞춤 상담" },
    { id: "g5", name: "로고 디자인 패키지", price: 39000, emoji: "🎨", desc: "글자 로고 3종 + 색상 가이드" },
    { id: "g6", name: "홈페이지 점검 리포트", price: 29000, emoji: "🔍", desc: "속도·SEO·모바일 점검" }
  ],

  // 쿠폰: type은 "rate"(정률 %) 또는 "fixed"(정액 원)
  coupons: [
    { code: "WELCOME10", type: "rate", amount: 10, min_order: 10000, expires_at: "2027-12-31T23:59:59Z", label: "첫 구매 10% 할인" },
    { code: "SAVE3000", type: "fixed", amount: 3000, min_order: 30000, expires_at: "2027-12-31T23:59:59Z", label: "3만원 이상 3,000원 할인" },
    { code: "OLD2025", type: "fixed", amount: 5000, min_order: 0, expires_at: "2025-12-31T23:59:59Z", label: "작년 쿠폰" },
    { code: "ONCE5000", type: "fixed", amount: 5000, min_order: 20000, expires_at: "2027-12-31T23:59:59Z", label: "1회용 5,000원 할인" }
  ],
  // 쿠폰 사용 이력 (데모 계정은 ONCE5000을 이미 썼어요 → 중복 사용 에러 테스트용)
  couponUses: [{ code: "ONCE5000", user_id: "u1", order_id: "o0" }],

  orders: [
    { id: "o0", user_id: "u1", total: 7900, status: "결제완료", items: [{ product_id: "g2", name: "AI 프롬프트 100선", qty: 1, price: 9900 }], discount: 2000, created_at: "2026-11-01T10:00:00Z" }
  ],

  // 고무신 지점 (2026-11-24 사용자 제공)
  // hours: 비어 있으면 표시하지 않아요. lat/lng(좌표)를 넣으면 카카오맵 길찾기와 진짜 지도 마커가 켜져요.
  // naver: 지점 네이버 플레이스 링크 (비어 있으면 주소로 네이버지도 검색)
  // guide: "찾아오는 길" 한 줄 (예: "OO역 2번 출구에서 도보 3분"). 비어 있으면 표시하지 않아요.
  stores: [
    { id: "s1", name: "고무신 부평본점", address: "인천광역시 부평구 열우물로87번길 33 1층", naver: "https://naver.me/xMnYCBng", guide: "", phone: "010-7667-0687", hours: "오전 10:00 ~ 저녁 8:00", lat: null, lng: null, x: 38, y: 40 },
    { id: "s2", name: "고무신 간석점", address: "인천광역시 부평구 배곶남로21번길 1 1층", naver: "https://naver.me/FORNRhqv", guide: "", phone: "010-8500-0687", hours: "오전 10:00 ~ 저녁 8:00", lat: null, lng: null, x: 68, y: 36 },
    { id: "s3", name: "고무신 숭의점", address: "인천광역시 미추홀구 독배로 437 1층 101호", naver: "https://naver.me/GqfUfsQr", guide: "", phone: "010-5965-0687", hours: "오전 10:00 ~ 저녁 8:00", lat: null, lng: null, x: 32, y: 84 }
  ],
  // 예시 지도(카카오 키 없을 때)에 표시할 랜드마크. 실제 있는 곳만 넣어 주세요. x·y 는 예시 지도 위 위치(%).
  // 예: { name: "OO역", type: "subway", x: 40, y: 40 }   type: subway(지하철) · place(건물/마트 등)
  // 카카오 키를 넣으면 진짜 지도에 주변 지하철역이 자동으로 표시돼요.
  landmarks: [],

  // 예약: 하루 시간표와 슬롯당 정원
  slotTimes: ["10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"],
  slotCapacity: 1
};
