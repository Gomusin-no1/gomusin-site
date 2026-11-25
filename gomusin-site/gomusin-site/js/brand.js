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
  logo: "assets/brand/logo-gold-w.png",   // 위 작은 글씨(휴대폰성지 폰명장)는 흰색, 간격 넓힘. 원본: logo-gold.png
  tagline: "[고]객님들의 [무]한한 [신]뢰를 받는 매장",   // 금색 세 글자 = 고·무·신   // [ ] = 금색 강조, \n = 줄바꿈
  taglineEyebrow: "SINCE 2012",

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

  // 첫 화면(검색창 아래) 신뢰 띠 — 숫자와 리뷰는 실제 확인된 것만
  proof: {
    stats: [
      { num: "15년", label: "2012년부터 한자리" },
      { num: "58,000건+", label: "누적 개통" },
      { num: "3,425건", label: "네이버 리뷰" }   // 부평본점 1,550 + 간석점 1,073 + 숭의점 802 (2026-11-25 사용자 확인)
    ],
    quote: { text: "멀어도 여기말고 다른매장은 못가겠어요", by: "간석점 네이버 방문자 리뷰 · psc****" },
    ctas: [
      { label: "가까운 매장 · 길찾기", href: "#/store", primary: true },
      { label: "전화 상담 1588-2476", href: "tel:15882476" }
    ]
  },

  // 기능 켜기/끄기 — 아직 실제 서버(Supabase)가 없어서, 손님이 오해할 수 있는 예시 기능은 꺼 두었어요.
  //  shop: 상점·장바구니 / booking: 상담 예약 / account: 로그인·알림 / contactForm: 문의 입력 폼
  //  (false 인 동안 "문의"는 전화·카카오톡 안내 화면으로 보여요. 서버 연결 후 true 로 바꾸면 다시 켜져요)
  features: { shop: false, booking: false, account: false, contactForm: false },

  // 지점 연락처 (전화 버튼으로 바로 연결돼요)
  branches: [
    { name: "부평본점", phone: "010-7667-0687", addr: "부평구 열우물로87번길 33", naver: "https://naver.me/xMnYCBng" },
    { name: "간석점", phone: "010-8500-0687", addr: "부평구 배곶남로21번길 1", naver: "https://naver.me/FORNRhqv" },
    { name: "숭의점", phone: "010-5965-0687", addr: "미추홀구 독배로 437", naver: "https://naver.me/GqfUfsQr" }
  ],
  hours: "모든 지점 오전 10:00 ~ 저녁 8:00",

  // 바로가기 주소 — 주소를 넣으면 버튼이 나타나요
  links: {
    kakao: "https://pf.kakao.com/_cxgtKxb",
    instagram: "https://www.instagram.com/p.m_gomusin/",
    naverPlace: "https://map.naver.com/p/entry/place/2022868201",
    reviews: "https://naver.me/xMnYCBng"   // 구매 후기: 실제 네이버 리뷰로 연결 (비우면 게시판으로 연결)
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

  // 고객 리뷰 (홈 사진 아래) — 반드시 실제 손님이 남긴 리뷰만 넣어 주세요. 지어낸 리뷰는 법(표시광고법) 위반이에요.
  //  - items 가 비어 있으면 제목과 "네이버 리뷰 보기" 버튼만 보여요.
  //  - text 안에서 [ ] 로 감싼 부분은 금색으로 강조돼요.  예: "인천 [멀리서 찾아왔는데] 정말 친절했어요"
  //  - 이름은 꼭 가려서 넣어 주세요 (예: "김**").  tag: 카드 위 작은 꼬리표 (예: "멀리서 왔어요", "가족 소개")
  //  - shots: 네이버·카카오 리뷰 화면 캡처 사진 경로 (assets/brand/ 에 넣고 경로 적기)
  reviews: {
    eyebrow: "REAL REVIEW",
    title: "손님들이 먼저 증명합니다",
    text: "'성지'라는 말은 저희가 아니라 손님들이 먼저 붙여 주셨어요. 관악구에서, 검단에서 다시 찾아오시는 이유를 직접 읽어 보세요.",
    summary: [
      { label: "부평본점", num: "1,550", unit: "건" },
      { label: "간석점", num: "1,073", unit: "건" },
      { label: "숭의점", num: "802", unit: "건" }
    ],
    note: "네이버 리뷰 수 · 2026.11.25 기준. 아래 리뷰는 원문 그대로 옮겼고, 닉네임은 일부 가렸어요.",
    keywords: [
      // { text: "친절해요", count: 0 },
    ],
    items: [
      { featured: true, tag: "처음 와 본 손님의 이야기", text: "휴대폰 매장은 처음 방문해 봤는데, 생각했던 것보다 훨씬 친절하고 만족스러운 상담을 받았습니다!\n\n처음부터 끝까지 하나하나 자세하게 설명해 주시고, 궁금한 점도 편하게 질문할 수 있도록 친절하게 응대해 주셔서 좋았습니다. 무엇보다 [불필요한 권유 없이 제 상황에 맞춰 합리적으로 안내해 주시는 점]이 가장 마음에 들었습니다.\n\n덕분에 부담 없이 기분 좋게 휴대폰 구매할 수 있었습니다. 다음에 휴대폰을 바꾸게 되더라도 꼭 다시 방문하고 싶네요! [주변 지인들에게도 적극 추천하고 싶은 매장입니다.] 😊", author: "마르***", branch: "부평본점", source: "네이버 방문자 리뷰" },
      { tag: "멀리서 왔어요", text: "휴대폰변경하려고\n[소개받고 관악구에서왔는데]\n진짜여지껏구매하면서\n못느껴봤던친절함이랑\n저에게맡게 상세하게설명해주셔서 [멀리서온보람이있습니다]", author: "toh3****", branch: "간석점", source: "네이버 방문자 리뷰" },
      { tag: "이사 가서도 찾아와요", text: "간석동살다가  검단으로이사갔는데\n항상친절하게 잘해줘서 이사가서도\n방문했어요 [멀어도 여기말고\n다른매장은 못가겠어요]", author: "psc****", branch: "간석점", source: "네이버 방문자 리뷰" },
      { tag: "발품 끝에 정착", text: "드디어찾앗다 [부평에서 젤싸고 솔직한집]ㅋ\n발품팔다 정착합니다.오늘 울트라로 변경했습니다 기계정말싸게 해주셧고 요금제높이쓰는거말고 아무조건업이 싼가격에주셧읍니다~^^", author: "jbh8****", branch: "부평본점", source: "네이버 방문자 리뷰" },
      { tag: "성지 비교 후 선택", text: "휴대폰변경 하려고 여기저기성지알아보다가\n[간석성지 고무신모바일] 물어봤는데\n조건도 좋고 친절해서 구매하고갑니다\n불필요한조건이 없어서 너무좋았습니다", author: "rla****", branch: "간석점", source: "네이버 방문자 리뷰" },
      { tag: "성지", text: "[휴대폰 성지 알아보다가 왔는데] 너무 저렴하게 잘 해주셨어요 자주 이용할게요 감사합니다", author: "weny****", branch: "숭의점", source: "네이버 방문자 리뷰" },
      { tag: "성지 비교 후 선택", text: "[성지 비교 해보다가] 우연히 들렸는데 가격은 물론 친절하게 다 봐주시더라구요 편안하게 구매했습니다", author: "랑고**", branch: "숭의점", source: "네이버 방문자 리뷰" },
      { tag: "온 가족 단골", text: "딸 핸드폰 바꿔주러 왔어요~\n아이폰 18프로 저렴하게 해주셔서\n김사합니다 항상 친절하게 대해주시니\n[가족들 다 바꿀 때 본점만 오는 것 같아요!!]", author: "fir****", branch: "부평본점", source: "네이버 방문자 리뷰" },
      { tag: "오래 다닌 매장", text: "딸이 최근에 고무신에서 바꿨고 [저도 오래 다닌 매장]인데 이번에 약정 끝나서 바꿨어요!! 지원 많이 해주셔서 감사합니다!!", author: "ddw****", branch: "부평본점", source: "네이버 방문자 리뷰" },
      { tag: "일주일 만에 또", text: "며칠전에 와이프 휴대폰 바꿀때 너무 잘해주셔서\n[일주일만에 저도 바꾸러 왔습니다]\n오늘도 너무 잘해주셔서 단골 약속하고 갑니다!", author: "rlar****", branch: "부평본점", source: "네이버 방문자 리뷰" },
      { tag: "입소문", text: "[동네에서 잘해준다고 소문나서] 매장\n와봤는데 진짜너무친절하시고\n휴대폰요금 나오는것도 절반이상\n줄여주셔서 너무만족하고변경햇습니다", author: "poo****", branch: "간석점", source: "네이버 방문자 리뷰" },
      { tag: "온 가족 단골", text: "동네에 성지매장 행사한다해서\n휴대폰변경했어요 항상너무잘해주셔서\n[모든가족이 믿고올수있는매장]이라\n넘좋아요^^", author: "rice****", branch: "간석점", source: "네이버 방문자 리뷰" },
      { tag: "꼼꼼한 상담", text: "친절하고 꼼꼼한 상담 덕분에 기분 좋게 휴대폰 개통했습니다! 요금제 비교도 딱 필요한 것만 알기 쉽게 설명해 주시고, 데이터 이동까지 깔끔하게 도와주셔서 너무 편했어요. [과한 권유 없이 합리적으로] 잘 맞춘 것 같아 만족스럽습니다. 번창하세요!", author: "전**", branch: "숭의점", source: "네이버 방문자 리뷰" }
    ],
    shots: [],
    links: [
      { name: "부평본점", url: "https://naver.me/xMnYCBng" },
      { name: "간석점", url: "https://naver.me/FORNRhqv" },
      { name: "숭의점", url: "https://naver.me/GqfUfsQr" }
    ]
  },

  // 매장 사진 갤러리
  gallery: [
    { src: "assets/brand/main-crowd.jpg", caption: "부평본점 · 줄 서서 폰 사는 집" },
    { src: "assets/brand/store-ganseok.jpg", caption: "간석점" },
    { src: "assets/brand/store-sungui.jpg", caption: "숭의점" }
  ],
  galleryTitle: "고객이 소개하고, 가족이 찾아오는 곳",
  galleryText: "한 분의 만족이 다음 인연이 되었습니다.",

  storePhotos: { s1: "assets/brand/store-bupyeong.jpg", s2: "assets/brand/store-ganseok.jpg", s3: "assets/brand/store-sungui.jpg" },   // s1 부평본점 · s2 간석점 · s3 숭의점
  productPhotos: {},   // 예: { g1: "assets/brand/product-1.jpg" }

  business: {
    company: "고무신모바일",  // 상호
    ceo: "",            // 대표자
    regNo: "",          // 사업자등록번호
    mailOrderNo: "",    // 통신판매업 신고번호
    address: "",
    phone: "1588-2476",  // 대표번호 (2026-11-25 사용자 확인)
    email: ""
  }
};
