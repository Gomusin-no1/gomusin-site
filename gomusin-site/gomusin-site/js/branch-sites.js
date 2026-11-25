/* =========================================================
   매장별 홈페이지 — 같은 파일 하나로 3개 매장 사이트를 운영해요
   ---------------------------------------------------------
   · gomusin.vercel.app (기본)      → 부평본점 사이트
   · 주소에 ganseok 이 들어가면     → 간석점 사이트
   · 주소에 sungui 이 들어가면      → 숭의점 사이트
   · 미리 보기: 주소 끝에 ?store=ganseok 처럼 붙여도 돼요 (?store=all → 3개 매장 통합 화면)
   · Vercel 에서 실제 주소가 다르게 만들어졌으면 아래 url 만 고치면 돼요
   매장 사진을 더 넣으려면 아래 gallery 에 줄을 추가하면 돼요.
   (사진 파일은 assets/brand/ 폴더에)
   ========================================================= */
(function () {
  const SITES = {
    bupyeong: {
      branch: "부평본점", store: "s1", url: "https://gomusin.vercel.app",
      gallery: [
        { src: "assets/brand/main-crowd.jpg", caption: "부평본점 · 줄 서서 폰 사는 집" },
        { src: "assets/brand/store-bupyeong.jpg", caption: "부평본점" }
      ],
      quote: { text: "가족들 다 바꿀 때 본점만 오는 것 같아요!!", by: "부평본점 네이버 방문자 리뷰 · fir****" }
    },
    ganseok: {
      branch: "간석점", store: "s2", url: "https://gomusin-ganseok.vercel.app",
      gallery: [
        { src: "assets/brand/interior-ganseok.jpg", caption: "간석점 · 매장 안" },
        { src: "assets/brand/store-ganseok.jpg", caption: "간석점" }
      ],
      trustBg: "assets/brand/bg-trust-ganseok.jpg",   // 15년 섹션 뒤 흐린 배경 (손님 얼굴은 가림 처리)
      quote: { text: "멀어도 여기말고 다른매장은 못가겠어요", by: "간석점 네이버 방문자 리뷰 · psc****" }
    },
    sungui: {
      branch: "숭의점", store: "s3", url: "https://gomusin-sungui.vercel.app",
      gallery: [
        { src: "assets/brand/interior-sungui.jpg", caption: "숭의점 · 매장 안" },
        { src: "assets/brand/store-sungui.jpg", caption: "숭의점" }
      ],
      trustBg: "assets/brand/bg-trust-sungui.jpg",   // 15년 섹션 뒤 흐린 배경 (손님 얼굴은 가림 처리)
      quote: { text: "휴대폰 성지 알아보다가 왔는데 너무 저렴하게 잘 해주셨어요", by: "숭의점 네이버 방문자 리뷰 · weny****" }
    }
  };
  const ALIAS = { bupyeong: /bupyeong|bupyong|bonjeom/, ganseok: /ganseok|gansuk/, sungui: /sungui|sungeui|soongui|soongeui/ };

  let key = "";
  try { key = (new URLSearchParams(location.search).get("store") || "").toLowerCase(); } catch (e) {}
  if (key !== "all" && !SITES[key]) {
    const host = location.hostname.toLowerCase();
    key = Object.keys(ALIAS).find((k) => ALIAS[k].test(host)) || "";
  }
  if (key === "all") key = "";          // 3개 매장 통합 화면 (?store=all)
  else if (!SITES[key]) key = "bupyeong";   // 기본 = 부평본점
  const S = SITES[key];
  if (!S) return;   // 통합 사이트

  const B = window.BRAND, br = B.branches.find((b) => b.name === S.branch);
  const tel = br.phone.replace(/[^0-9]/g, "");
  const R = B.reviews, sum = R.summary.find((x) => x.label === S.branch);

  B.siteBranch = S.branch;
  B.otherSites = Object.keys(SITES).filter((k) => k !== key).map((k) => ({ name: SITES[k].branch, url: SITES[k].url }));
  B.name = "고무신모바일 " + S.branch;
  B.taglineEyebrow = "SINCE 2012 · " + S.branch;
  B.branches = [br];
  B.hours = "오전 10:00 ~ 저녁 8:00";
  B.hero.title = S.branch + "으로 바로 연결해 드려요";
  B.proof.stats = B.proof.stats.map((s) => (/리뷰/.test(s.label) && sum ? { num: sum.num + "건", label: S.branch + " 네이버 리뷰" } : s));
  B.proof.quote = S.quote;
  B.proof.ctas = [
    { label: S.branch + " 길찾기", href: "#/store", primary: true },
    { label: S.branch + " 전화 " + br.phone, href: "tel:" + tel }
  ];
  B.links.reviews = br.naver;
  B.links.naverPlace = br.naver;

  const items = R.items.filter((r) => r.branch === S.branch).map((r) => Object.assign({}, r, { featured: false }));
  if (items.length) items[0].featured = true;
  R.items = items;
  R.summary = sum ? [sum] : [];
  R.links = R.links.filter((l) => l.name === S.branch);
  R.text = S.branch + "을 다녀가신 손님들이 네이버에 직접 남긴 이야기예요. 원문 그대로 읽어 보세요.";

  B.gallery = S.gallery;
  if (S.trustBg) {   // 15년 섹션 배경을 그 매장 사진으로
    const st = document.createElement("style");
    st.textContent = `.brand-trust::before { background: linear-gradient(180deg, #0A0A0B 0%, rgba(10,10,11,.68) 14%, rgba(10,10,11,.6) 50%, rgba(10,10,11,.78) 82%, #0A0A0B 100%), url("${S.trustBg}") center 45% / cover no-repeat; }`;
    document.head.appendChild(st);
  }
  B.galleryTitle = S.branch + "을 소개합니다";

  if (window.MOCK && window.MOCK.stores) window.MOCK.stores = window.MOCK.stores.filter((s) => s.id === S.store);
})();
