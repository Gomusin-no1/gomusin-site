/* =========================================================
   브랜드 설정 — 로고·매장 사진·지점 연락처·사업자 정보
   ---------------------------------------------------------
   사진 파일은 assets/brand/ 폴더에, 경로는 아래 따옴표 안에 써요.
   비워 둔 항목("" 또는 [])은 화면에 나오지 않아요.
   자세한 규격: assets/brand/README.md
   ========================================================= */
window.BRAND = {
  name: "고무신모바일",
  // 금색 붓글씨 로고 (검정 배경용). 흰 배경에 쓸 땐 logo-dark.png, 흰 로고는 logo-white.png
  logo: "assets/brand/logo-gold.png",
  tagline: "고객님들의 무한한 신뢰를 받는 매장",

  // 홈 검색창 아래 브랜드 배너 (검정 배경 + 금색 로고)
  hero: {
    // 첫 화면 전체에 보케 배경과 금색 로고가 이미 들어가서, 아래 띠에는 지점 연락처만 보여요.
    // 띠에도 배경·로고를 넣고 싶으면 아래 두 줄에 경로를 넣으세요.
    background: "",                                // 예: "assets/brand/hero-bokeh.jpg"
    logo: "",                                      // 예: "assets/brand/logo-gold.png"
    title: "가까운 지점으로 바로 연결해 드려요",
    eyebrow: "휴대폰성지 폰명장",
    logoHasEyebrow: true,                          // 로고 그림 안에 위 문구가 이미 들어 있어서 글자는 숨겨요
    // [강조] 로 감싼 부분이 강조돼요
    headline: ""                                   // 예: "고객님들의 [무한한 신뢰]를 받는 매장"
  },

  // 지점 연락처 (전화 버튼으로 바로 연결돼요)
  branches: [
    { name: "부평본점", phone: "010-7667-0687" },
    { name: "간석점", phone: "010-8500-0687" },
    { name: "숭의점", phone: "010-5965-0687" }
  ],

  // 바로가기 주소 — 주소를 넣으면 버튼이 나타나요
  links: {
    kakao: "https://pf.kakao.com/_cxgtKxb",
    instagram: "https://www.instagram.com/p.m_gomusin/",
    naverPlace: "https://map.naver.com/p/entry/place/2022868201",
    reviews: ""       // 구매 후기 페이지 (비우면 게시판으로 연결)
  },

  // 신뢰 지표 (홈 첫 화면 아래) — 포스터 내용을 블랙·골드로 다시 구성
  trust: {
    eyebrow: "2012 — 2026",
    title: "15년, 입소문에는 이유가 있습니다",
    stats: [
      { num: "15", unit: "년", label: "2012년부터 한자리에서" },
      { num: "58,000", unit: "건+", label: "누적 개통 (전체 매장 합산)" },
      { num: "3", unit: "곳", label: "부평본점 · 간석점 · 숭의점" }
    ],
    promises: [
      { title: "정직한 시세", text: "허위 시세표로 거짓된 거래를 하지 않겠습니다." },
      { title: "끝까지 책임", text: "판매 이후에도 서비스와 응대를 끝까지 책임지겠습니다." },
      { title: "직접 비교", text: "가격과 조건, 직접 비교해 보세요." }
    ],
    quote: "한 번도 안 오신 손님은 있어도, [한 번만 오신 분은 없습니다]"
  },

  // 매장 사진 갤러리
  gallery: [
    { src: "assets/brand/store-crowd.jpg", caption: "개통 행사 날, 매장 앞" },
    { src: "assets/brand/store-ganseok.jpg", caption: "간석점" },
    { src: "assets/brand/store-queue.jpg", caption: "줄 서서 폰 사는 집" }
  ],
  galleryTitle: "고객이 소개하고, 가족이 찾아오는 곳",
  galleryText: "한 분의 만족이 다음 인연이 되었습니다.",

  storePhotos: { s2: "assets/brand/store-ganseok.jpg" },   // s1 부평본점 · s2 간석점 · s3 숭의점
  productPhotos: {},   // 예: { g1: "assets/brand/product-1.jpg" }

  business: {
    company: "고무신모바일",  // 상호
    ceo: "",            // 대표자
    regNo: "",          // 사업자등록번호
    mailOrderNo: "",    // 통신판매업 신고번호
    address: "",
    phone: "1588-2470",  // 대표번호 (간석점 간판 기준)
    email: ""
  }
};
