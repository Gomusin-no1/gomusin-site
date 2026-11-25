/* =========================================================
   가짜 데이터 (PART 1 전용)
   실제 서비스로 바꿀 때 이 파일은 지우거나 그대로 두어도 돼요.
   ========================================================= */
window.MOCK = {
  // 검색 대상 문서
  docs: [
    { id: "h1", title: "휴대폰 구매 전 꼭 확인할 것: 공시지원금 vs 선택약정", url: "gomusin.example.com/guide/subsidy", summary: "기기값을 바로 깎는 공시지원금과 매달 요금을 25% 할인받는 선택약정, 내 사용 패턴에 맞는 쪽을 매장에서 함께 계산해 드려요." },
    { id: "h2", title: "번호이동 · 기기변경 · 신규가입 차이", url: "gomusin.example.com/guide/join-type", summary: "통신사를 바꾸는 번호이동, 같은 통신사에서 폰만 바꾸는 기기변경, 새 번호를 만드는 신규가입. 조건이 다르니 상담 때 꼭 말씀해 주세요." },
    { id: "h3", title: "중고폰 매입: 쓰던 휴대폰 제값 받는 법", url: "gomusin.example.com/guide/trade-in", summary: "액정·배터리 상태와 구성품에 따라 매입가가 달라져요. 초기화 전에 사진과 연락처 백업을 먼저 해 두세요." },
    { id: "h4", title: "요금제 고르는 법: 데이터 사용량부터 확인하세요", url: "gomusin.example.com/guide/plan", summary: "최근 3개월 데이터 사용량을 보면 맞는 요금제가 보여요. 필요 이상 비싼 요금제를 권하지 않는 것이 고무신의 원칙이에요." },
    { id: "h5", title: "개통 당일 준비물과 걸리는 시간", url: "gomusin.example.com/guide/activation", summary: "신분증과 본인 명의 결제 수단을 챙겨 오세요. 데이터 옮기기까지 매장에서 도와드려요." },
    { id: "h6", title: "구매 후기: 고객님들이 직접 남긴 이야기", url: "gomusin.example.com/reviews", summary: "1·2·3호점에서 휴대폰을 바꾸신 고객님들의 솔직한 후기를 모았어요. 게시판에서도 볼 수 있어요." },
    { id: "d1", title: "1인 기업 시작 가이드: 사업자 등록부터 첫 매출까지", url: "simple.example.com/guide/start", summary: "혼자 시작하는 사업, 무엇부터 해야 할까요? 사업자 등록, 통장 분리, 세금 신고 일정까지 처음 하는 사람 기준으로 차근차근 정리했어요." },
    { id: "d2", title: "AI로 고객 문의 자동 응대하기", url: "simple.example.com/ai/chatbot", summary: "자주 묻는 질문을 정리해 AI 상담봇에 학습시키면 밤에도 문의에 답할 수 있어요. 설정 방법과 주의할 점을 알려드려요." },
    { id: "d3", title: "무료로 시작하는 홈페이지 만들기", url: "simple.example.com/web/free-site", summary: "Supabase 무료 플랜과 Vercel 무료 배포만으로 회원가입, 게시판, 예약까지 되는 홈페이지를 만드는 방법이에요." },
    { id: "d4", title: "간편결제 도입 체크리스트", url: "simple.example.com/pay/checklist", summary: "카드 결제와 카카오페이·네이버페이·토스페이를 붙이려면 사업자 등록과 PG 심사가 필요해요. 준비 서류를 한 번에 확인하세요." },
    { id: "d5", title: "쿠폰으로 첫 구매 전환율 높이기", url: "simple.example.com/marketing/coupon", summary: "첫 구매 10% 할인, 3만원 이상 3천원 할인처럼 조건이 분명한 쿠폰이 효과가 좋아요. 쿠폰 설계 예시를 모았어요." },
    { id: "d6", title: "예약 시스템으로 노쇼 줄이기", url: "simple.example.com/booking/no-show", summary: "예약 확인 알림, 시간 슬롯 정원 관리, 예약금 설정으로 노쇼를 줄이는 방법을 소개해요." },
    { id: "d7", title: "블로그 글 하루 10분 만에 쓰는 법", url: "simple.example.com/content/blog-10min", summary: "AI에게 개요를 받고, 내 경험 한 줄을 더하면 짧은 시간에도 진정성 있는 글을 쓸 수 있어요." },
    { id: "d8", title: "스마트스토어 vs 자사몰, 무엇이 유리할까", url: "simple.example.com/commerce/compare", summary: "수수료, 고객 데이터, 마케팅 자유도를 기준으로 두 방식을 비교했어요. 처음에는 둘을 함께 쓰는 것도 방법이에요." },
    { id: "d9", title: "세금 신고 달력: 1인 사업자 필수 일정", url: "simple.example.com/tax/calendar", summary: "부가가치세, 종합소득세, 원천세 신고 기한을 달력으로 정리했어요. 놓치면 가산세가 붙으니 미리 챙기세요." },
    { id: "d10", title: "카카오맵으로 매장 위치 안내하기", url: "simple.example.com/web/kakao-map", summary: "카카오맵 JavaScript 키를 발급받고 도메인을 등록하면 홈페이지에 지도와 길찾기 버튼을 넣을 수 있어요." },
    { id: "d11", title: "이메일 뉴스레터로 단골 만들기", url: "simple.example.com/marketing/newsletter", summary: "한 달에 두 번, 유용한 정보와 짧은 소식만 보내도 재구매율이 올라가요. 무료 도구로 시작하는 방법이에요." },
    { id: "d12", title: "AI 이미지로 상품 사진 꾸미기", url: "simple.example.com/ai/product-photo", summary: "스마트폰으로 찍은 사진의 배경을 AI로 바꾸면 전문 촬영 없이도 깔끔한 상품 사진을 만들 수 있어요." },
    { id: "d13", title: "개인정보 처리방침 쉽게 작성하기", url: "simple.example.com/legal/privacy", summary: "문의 폼, 회원가입을 받는다면 개인정보 처리방침이 꼭 필요해요. 필수 항목과 무료 생성기를 소개해요." },
    { id: "d14", title: "고객 리뷰 모으는 7가지 방법", url: "simple.example.com/marketing/review", summary: "구매 후 3일째 리뷰 요청 메시지, 사진 리뷰 적립금 등 실제로 효과 있었던 방법을 정리했어요." },
    { id: "d15", title: "노션으로 1인 기업 업무 관리하기", url: "simple.example.com/tools/notion", summary: "할 일, 고객 목록, 콘텐츠 일정을 노션 하나로 관리하는 템플릿과 사용법이에요." },
    { id: "d16", title: "검색에 잘 걸리는 홈페이지 만들기 (SEO 기초)", url: "simple.example.com/web/seo", summary: "페이지 제목, 설명 문구, og 이미지 같은 메타 태그를 잘 쓰면 검색과 공유 미리보기가 좋아져요." },
    { id: "d17", title: "AI 비서에게 일 맡기는 프롬프트 예시", url: "simple.example.com/ai/prompts", summary: "견적서 작성, 고객 답장, 상품 설명 쓰기 등 바로 복사해서 쓸 수 있는 프롬프트 모음이에요." },
    { id: "d18", title: "배송비 정책 정하는 법", url: "simple.example.com/commerce/shipping", summary: "무료배송 기준 금액을 정하면 객단가가 올라가요. 업종별 평균 배송비 정책을 비교해 봤어요." },
    { id: "d19", title: "알림톡으로 주문·예약 안내 보내기", url: "simple.example.com/tools/alimtalk", summary: "카카오 알림톡을 쓰면 주문 완료, 예약 확인 메시지를 자동으로 보낼 수 있어요. 비용과 신청 절차를 알려드려요." },
    { id: "d20", title: "혼자 일할 때 번아웃 피하기", url: "simple.example.com/life/burnout", summary: "일과 휴식의 경계를 정하고, 반복 업무는 자동화하세요. 1인 기업가들이 실제로 쓰는 루틴을 모았어요." },
    { id: "d21", title: "상담 신청 폼에 꼭 넣어야 할 항목", url: "simple.example.com/web/contact-form", summary: "이름, 연락처, 문의 내용, 개인정보 동의 체크면 충분해요. 너무 많은 항목은 오히려 문의를 줄여요." },
    { id: "d22", title: "무료 디자인 도구로 로고 만들기", url: "simple.example.com/design/logo", summary: "글자 로고 하나로도 충분히 브랜드가 돼요. 색 두 가지와 폰트 하나로 시작하는 방법이에요." },
    { id: "d23", title: "정기 구독 상품 만들기", url: "simple.example.com/commerce/subscription", summary: "매달 꾸준한 매출을 만드는 구독 상품. 가격 설정과 해지 정책까지 고려해야 할 점을 정리했어요." },
    { id: "d24", title: "AI로 월간 매출 보고서 자동으로 만들기", url: "simple.example.com/ai/report", summary: "스프레드시트 데이터를 AI에게 주면 매출 추이와 다음 달 할 일을 정리한 보고서를 받을 수 있어요." }
  ],
  // 결과 0건일 때 보여줄 추천 키워드
  suggestKeywords: ["휴대폰", "번호이동", "요금제", "중고폰", "개통", "후기"],
  // "아무거나" 버튼이 고르는 키워드
  randomKeywords: ["휴대폰", "번호이동", "요금제", "중고폰", "개통", "선택약정", "1인 기업", "AI", "홈페이지", "결제", "쿠폰", "예약", "세금", "노션", "뉴스레터", "리뷰", "배송비", "알림톡", "로고", "구독", "번아웃", "상품 사진"],

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
