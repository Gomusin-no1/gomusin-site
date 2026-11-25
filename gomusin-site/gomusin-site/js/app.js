/* =========================================================
   앱 시작 + 주소(#/...)에 따라 화면을 바꾸는 라우터
   ========================================================= */
(function () {
  const { $, $$, icon, setMeta, empty } = UI;
  const page = $("#page");
  const searchPage = $('[data-page="search"]');

  // 주소 규칙: [패턴, 실행할 함수]
  const routes = [
    [/^\/?$/, () => showSearch({}), true],
    [/^\/search$/, (m, q) => showSearch({ q: q.get("q") || "", page: +q.get("page") || 1 }), true],
    [/^\/doc\/([\w-]+)$/, (m) => Views.search.showDoc(m[1], page)],
    // 공지사항 (매장이 올리는 글, js/notices.js). 예전 게시판 주소도 공지사항으로 보내요.
    [/^\/notice$/, () => Views.notice.list(page)],
    [/^\/notice\/([\w-]+)$/, (m) => Views.notice.detail(page, m[1])],
    [/^\/board(\/.*)?$/, () => { location.replace("#/notice"); }],
    [/^\/me$/, (m, q) => Views.account.mypage(page, q.get("tab") || "posts")],
    [/^\/contact$/, () => Views.contact.show(page)],
    [/^\/store$/, () => Views.store.show(page)],
    [/^\/shop$/, () => Views.shop.list(page)],
    [/^\/cart$/, () => Views.shop.cart(page)],
    [/^\/checkout$/, () => Views.shop.checkout(page)],
    [/^\/pay\/result$/, (m, q) => Views.shop.result(page, q)],
    [/^\/booking$/, () => Views.booking.show(page)]
  ];

  function showSearch(args) {
    searchPage.hidden = false; page.hidden = true; page.innerHTML = "";
    Views.search.show(args);
  }

  // 꺼 둔 기능 (js/brand.js 의 features)
  const F = Object.assign({ shop: true, booking: true, account: true, contactForm: true }, (window.BRAND || {}).features);
  const blocked = (path) => (!F.shop && /^\/(shop|cart|checkout|pay)/.test(path)) || (!F.booking && /^\/booking/.test(path)) || (!F.account && /^\/me/.test(path));
  function contactInfo(page) {
    const B = window.BRAND || {}, L = B.links || {}, biz = B.business || {}, esc = UI.esc;
    setMeta("문의하기", "전화 · 카카오톡으로 편하게 문의해 주세요.");
    page.innerHTML = `<div class="page narrow contact-info">
      <div class="page-head"><h2>문의하기</h2></div>
      <p class="muted">궁금한 점은 전화나 카카오톡으로 편하게 물어봐 주세요. ${esc(B.hours || "")}</p>
      <div class="ci-main">
        ${L.kakao ? `<a class="sns-btn sns-kakao" href="${esc(L.kakao)}" target="_blank" rel="noopener">카카오톡 문의하기</a>` : ""}
        ${biz.phone ? `<a class="btn ci-tel" href="tel:${esc(biz.phone.replace(/[^0-9]/g, ""))}">대표번호 ${esc(biz.phone)}</a>` : ""}
      </div>
      <ul class="ci-branches">${(B.branches || []).map((b) => `<li><a href="tel:${esc(b.phone.replace(/[^0-9]/g, ""))}"><strong>${esc(b.name)}</strong><span>${esc(b.phone)}</span>${b.addr ? `<small>${esc(b.addr)}</small>` : ""}</a></li>`).join("")}</ul>
      <p style="text-align:center"><a class="btn ghost" href="#/store">매장 위치 · 길찾기</a></p>
    </div>`;
  }

  let lastPath = "";
  function route() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, qs] = raw.split("?");
    if (blocked(path)) { location.replace("#/"); return; }
    if (!F.contactForm && path === "/contact") { searchPage.hidden = true; page.hidden = false; document.body.classList.remove("searching"); window.scrollTo(0, 0); contactInfo(page); return; }
    const query = new URLSearchParams(qs || "");
    $("#mainNav").classList.remove("open"); $("#menuToggle").setAttribute("aria-expanded", "false");
    $$("#mainNav a").forEach((a) => a.classList.toggle("active", path.startsWith(a.getAttribute("href").slice(1))));
    for (const [re, fn, isSearch] of routes) {
      const m = path.match(re);
      if (!m) continue;
      if (!isSearch) { searchPage.hidden = true; page.hidden = false; document.body.classList.remove("searching"); }
      if (!(isSearch && lastPath === "/search" && path === "/search")) window.scrollTo(0, 0);
      lastPath = path;
      fn(m, query);
      return;
    }
    searchPage.hidden = true; page.hidden = false; document.body.classList.remove("searching");
    setMeta("페이지 없음");
    page.innerHTML = `<div class="page narrow">${empty("페이지를 찾을 수 없어요", "주소가 바뀌었거나 삭제된 페이지예요.")}<p style="text-align:center"><a class="btn" href="#/">홈으로</a></p></div>`;
  }

  // 로그인이 필요한 동작 앞에 붙여요: App.requireLogin(() => ...)
  function requireLogin(next) {
    if (API.getUser()) return next();
    Views.account.openAuth("login", next);
  }

  async function refreshCart() {
    const n = API.cartCount ? API.cartCount() : 0;
    const b = $("#cartBadge"); b.textContent = n > 99 ? "99+" : n; b.hidden = !n;
    $("#cartBtn").setAttribute("aria-label", "장바구니" + (n ? ", " + n + "개 담김" : ""));
  }

  // 토스페이먼츠 결제창에서 돌아왔을 때 (?pay=success&paymentKey=…&orderId=…&amount=…)
  async function handlePaymentReturn() {
    const q = new URLSearchParams(location.search);
    if (!q.get("pay")) return false;
    history.replaceState(null, "", location.pathname);
    if (q.get("pay") === "fail") {
      location.hash = `#/pay/result?status=fail&order=${q.get("orderId") || ""}&code=${q.get("code") || ""}&message=${encodeURIComponent(q.get("message") || "결제가 취소됐어요.")}`;
      return true;
    }
    $("#page").hidden = false; $('[data-page="search"]').hidden = true;
    $("#page").innerHTML = UI.loading("결제를 승인하는 중이에요… 창을 닫지 마세요.");
    try {
      await API.confirmPayment({ orderId: q.get("orderId"), amount: Number(q.get("amount")), paymentKey: q.get("paymentKey") });
      location.hash = "#/pay/result?status=success&order=" + q.get("orderId");
    } catch (e) {
      location.hash = `#/pay/result?status=fail&order=${q.get("orderId")}&code=CONFIRM_FAILED&message=${encodeURIComponent(e.message)}`;
    }
    return true;
  }

  // 브랜드 적용: 로고 이미지/이름, 소개 문구, 매장 사진 갤러리, 사업자 정보
  // 와~ 효과: 숫자가 0부터 올라가고, 섹션이 스르륵 나타나요 (움직임 줄이기 설정이면 꺼져요)
  function wow() {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window);
    const nums = $$(".hp-stats b, .tr-stats b, .rv-sum b");
    const run = (el) => {
      const m = el.textContent.match(/^([\d,]+)(.*)$/); if (!m) return;
      const end = +m[1].replace(/,/g, ""), tail = m[2], t0 = performance.now(), dur = 1400;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - k, 3)));
        el.textContent = v.toLocaleString("ko-KR") + tail; if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    const secs = $$(".brand-trust, .brand-gallery, .brand-reviews, .brand-hero, .tr-promises li, .rv-card");
    if (calm) return;
    secs.forEach((s) => s.classList.add("reveal"));
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      if (e.target.matches("b")) run(e.target); else e.target.classList.add("in");
    }), { threshold: 0.15 });
    nums.concat(secs).forEach((el) => io.observe(el));
  }

  function applyBrand() {
    const B = window.BRAND || {}; const esc = UI.esc;
    $$("[data-brand-logo]").forEach((a) => {
      a.innerHTML = B.logo ? `<img src="${esc(B.logo)}" alt="${esc(B.name || "로고")}">` : esc(B.name || "LOGO");
      a.classList.toggle("has-img", !!B.logo);
    });
    const tg = $("#tagline");
    tg.innerHTML = (B.taglineEyebrow ? `<span class="tg-eyebrow">${esc(B.taglineEyebrow)}</span>` : "") +
      esc(B.tagline || "").replace(/\[(.+?)\]/g, '<em class="gold-shine">$1</em>').replace(/\n/g, "<br>");
    tg.hidden = !B.tagline;
    // 첫 화면 신뢰 띠
    const P = B.proof, pf = $("#heroProof");
    if (P && pf) {
      pf.hidden = false;
      pf.innerHTML = `${(P.stats || []).length ? `<ul class="hp-stats">${P.stats.map((s) => `<li><b>${esc(s.num)}</b><span>${esc(s.label)}</span></li>`).join("")}</ul>` : ""}
        ${P.quote ? `<a class="hp-quote" href="#brandReviews"><span class="rv-stars" aria-label="별점 5점">★★★★★</span> “${esc(P.quote.text)}”<small>${esc(P.quote.by || "")}</small></a>` : ""}
        ${(P.ctas || []).length ? `<div class="hp-ctas">${P.ctas.map((c) => `<a class="btn${c.primary ? "" : " ghost"}" href="${esc(c.href)}">${esc(c.label)}</a>`).join("")}</div>` : ""}`;
      const q = $(".hp-quote", pf); q && q.addEventListener("click", (e) => { e.preventDefault(); $("#brandReviews").scrollIntoView({ behavior: "smooth" }); });
    }
    // 브랜드 배너 (지점 전화 + 바로가기)
    const H = B.hero || {}, hero = $("#brandHero");
    if (H.logo || H.headline || (B.branches || []).length) {
      const L = B.links || {};
      const head = esc(H.headline || "").replace(/\[(.+?)\]/g, "<em>$1</em>");
      // 브랜드 버튼 (카카오톡 · 네이버 · 인스타그램 공식 색상과 마크)
      const MARK = {
        kakao: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3.2c-5.2 0-9.4 3.3-9.4 7.4 0 2.6 1.7 4.9 4.3 6.2l-1 3.8c-.1.3.3.6.6.4l4.5-3c.3 0 .7.1 1 .1 5.2 0 9.4-3.3 9.4-7.4S17.2 3.2 12 3.2Z"/></svg>',
        naver: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.9 12.6 8.8 3.8H3.8v16.4h5.3v-8.8l6.1 8.8h5V3.8h-5.3v8.8Z"/></svg>',
        insta: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.3" cy="6.7" r="1.3" fill="currentColor"/></svg>'
      };
      // 네이버 플레이스는 지점마다 따로(아래 지점 카드), 카카오톡·인스타그램은 하나로 같이 써요
      const brandBtns = [["kakao", "카카오톡 문의하기", L.kakao], ["insta", "인스타그램", L.instagram]]
        .filter(([, , u]) => u)
        .map(([k, t, u]) => `<a class="sns-btn sns-${k}" href="${esc(u)}" target="_blank" rel="noopener"><span class="sns-mark">${MARK[k]}</span>${t}</a>`).join("");
      const quick = [["매장 위치 · 길찾기", "#/store"], ["휴대폰 정보", "#/search?q=" + encodeURIComponent("휴대폰")], ["구매 후기", L.reviews || "#/board"]]
        .filter(([t, u]) => u && !(B.otherSites && t === "휴대폰 정보"))   // 매장 사이트: 휴대폰 정보 대신 다른 지점 바로가기
        .concat((B.otherSites || []).map((o) => [o.name + " 보기", o.url]))
        .map(([t, u]) => `<a href="${esc(u)}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`).join("");
      const one = (B.branches || []).length === 1;   // 매장별 사이트: 지점 카드 하나를 가운데 넓게
      hero.hidden = false;
      hero.innerHTML = `<div class="bh-inner"${H.background ? ` style="background-image:linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.55)),url('${esc(H.background)}')"` : ""}>
        ${H.eyebrow && !H.logoHasEyebrow ? `<p class="bh-eyebrow">${esc(H.eyebrow)}</p>` : ""}
        ${H.logo ? `<img class="bh-logo" src="${esc(H.logo)}" alt="${esc(B.name || "")}">` : ""}
        ${head ? `<p class="bh-head">${head}</p>` : ""}
        ${H.title ? `<h2 class="bh-title">${esc(H.title)}</h2>` : ""}
        ${(B.branches || []).length ? `<ul class="bh-branches${one ? " one" : ""}">${B.branches.map((b) => `<li>
          <a class="bh-call" href="tel:${esc(b.phone.replace(/[^0-9]/g, ""))}"><strong>${esc(b.name)}</strong> ${esc(b.phone.replace(/-/g, "."))}${b.addr ? `<small>${esc(b.addr)}</small>` : ""}${one && B.hours ? `<small class="bh-call-hours">${esc(B.hours)}</small>` : ""}</a>
          ${b.naver ? `<a class="sns-btn sns-naver bh-naver" href="${esc(b.naver)}" target="_blank" rel="noopener"><span class="sns-mark">${MARK.naver}</span>${esc(b.name)} 네이버 플레이스</a>` : ""}
        </li>`).join("")}</ul>` : ""}
        ${B.hours && !one ? `<p class="bh-hours">${esc(B.hours)}</p>` : ""}
        ${brandBtns ? `<div class="sns-row">${brandBtns}</div>` : ""}
        ${quick ? `<nav class="bh-links" aria-label="바로가기">${quick}</nav>` : ""}
      </div>`;
    }
    // 신뢰 지표
    const T = B.trust, ts = $("#brandTrust");
    if (T && ts) {
      const mark = (t) => esc(t || "").replace(/\[(.+?)\]/g, "<em>$1</em>");
      ts.hidden = false;
      ts.innerHTML = `${T.eyebrow ? `<p class="tr-eyebrow">${esc(T.eyebrow)}</p>` : ""}<h2 class="tr-title" id="trustTitle">${esc(T.title || "")}</h2>
        ${(T.stats || []).length ? `<dl class="tr-stats">${T.stats.map((s) => `<div><dt>${esc(s.label)}</dt><dd><b>${esc(s.num)}</b>${esc(s.unit || "")}</dd></div>`).join("")}</dl>` : ""}
        ${(T.promises || []).length ? `<ol class="tr-promises">${T.promises.map((x, i) => `<li><span class="tr-no">${String(i + 1).padStart(2, "0")}</span><strong>${esc(x.title)}</strong><p>${esc(x.text)}</p></li>`).join("")}</ol>` : ""}
        ${T.quote ? `<blockquote class="tr-quote">${mark(T.quote)}</blockquote>` : ""}`;
    }
    const g = $("#brandGallery"), photos = B.gallery || [];
    if (photos.length) {
      g.hidden = false;
      g.innerHTML = `<div class="bg-head"><h2 id="galleryTitle">${esc(B.galleryTitle || "공간을 소개해요")}</h2>${B.galleryText ? `<p class="muted">${esc(B.galleryText)}</p>` : ""}</div>
        ${B.galleryVideo ? `<figure class="bg-video"><video src="${esc(B.galleryVideo.src)}" poster="${esc(B.galleryVideo.poster || "")}" muted loop playsinline preload="none" aria-label="${esc(B.galleryVideo.caption || "매장 영상")}"></video>${B.galleryVideo.caption ? `<figcaption>${esc(B.galleryVideo.caption)}</figcaption>` : ""}</figure>` : ""}
        <div class="bg-grid n${Math.min(photos.length, 6)}">${photos.slice(0, 6).map((p, i) => `<figure${p.fit === "contain" ? ' class="fit"' : ""}><img src="${esc(p.src)}" alt="${esc(p.caption || "매장 사진 " + (i + 1))}" loading="lazy" decoding="async">${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""}</figure>`).join("")}</div>
        <p class="bg-more"><a class="btn" href="#/store">매장 위치 보기</a></p>`;
    }
    // 매장 영상: 화면에 보일 때만 재생 (안 보이면 멈춰서 스크롤이 가벼워요)
    const vid = $(".bg-video video");
    if (vid) {
      if ("IntersectionObserver" in window) new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { vid.preload = "auto"; vid.play().catch(() => {}); } else vid.pause(); }), { threshold: 0.25 }).observe(vid);
      else vid.setAttribute("controls", "");
    }
    // 고객 리뷰
    const R = B.reviews, rv = $("#brandReviews");
    if (R && rv) {
      const mark = (t) => esc(t || "").replace(/\[([\s\S]+?)\]/g, "<em>$1</em>");
      const items = R.items || [], shots = R.shots || [], sum = R.summary || [], kw = R.keywords || [], vis = R.visible || 10;   // 처음에 보이는 리뷰 수 (큰 1 + 3×3)
      rv.hidden = false;
      rv.innerHTML = `${R.eyebrow ? `<p class="tr-eyebrow">${esc(R.eyebrow)}</p>` : ""}<h2 class="tr-title rv-title" id="reviewsTitle">${esc(R.title || "고객 리뷰")}</h2>
        ${R.text ? `<p class="rv-lead">${esc(R.text)}</p>` : ""}
        ${sum.length ? `<div class="rv-sumwrap"><p class="rv-sumhead"><b>N</b>네이버 리뷰</p><dl class="rv-sum">${sum.map((s) => `<div><dt>${esc(s.label)}</dt><dd><b>${esc(s.num)}</b>${esc(s.unit || "")}</dd></div>`).join("")}</dl></div>` : ""}
        ${R.note ? `<p class="rv-note">${esc(R.note)}</p>` : ""}
        ${kw.length ? `<ul class="rv-kw" aria-label="손님들이 많이 고른 키워드">${kw.map((k) => `<li>"${esc(k.text)}"${k.count ? `<b>${esc(String(k.count))}</b>` : ""}</li>`).join("")}</ul>` : ""}
        ${items.length ? `<ul class="rv-list">${items.map((r, i) => `<li class="rv-card${r.featured ? " featured" : ""}${i >= vis ? " rv-extra" : ""}">
            ${r.tag ? `<span class="rv-tag">${esc(r.tag)}</span>` : ""}
            <span class="rv-stars" aria-label="별점 5점 만점">★★★★★</span>
            <blockquote>${mark(r.text)}</blockquote>
            <p class="rv-who"><strong>${esc(r.author || "고객님")}</strong>${r.branch ? ` · ${esc(r.branch)}` : ""}${r.date ? ` · ${esc(r.date)}` : ""}</p>
            ${r.source ? `<p class="rv-src">${esc(r.source)}</p>` : ""}
          </li>`).join("")}</ul>` : ""}
        ${items.length > vis ? `<button class="btn ghost rv-morebtn" type="button" data-rv-more>리뷰 ${items.length - vis}개 더 보기</button>` : ""}
        ${shots.length ? `<div class="rv-shots">${shots.map((s, i) => `<img src="${esc(s)}" alt="실제 고객 리뷰 화면 ${i + 1}" loading="lazy">`).join("")}</div>` : ""}
        ${(R.links || []).length ? `<div class="rv-links"><p>네이버에서 전체 리뷰 보기</p><div>${R.links.map((l) => `<a class="nav-btn nav-naver" target="_blank" rel="noopener" href="${esc(l.url)}"><b>N</b>${esc(l.name)} 리뷰</a>`).join("")}</div></div>` : ""}`;
    }
    const mb = $("[data-rv-more]"); mb && mb.addEventListener("click", () => { $("#brandReviews").classList.add("rv-open"); mb.remove(); });
    wow();
    const biz = B.business || {};
    const labels = [["company", "상호"], ["ceo", "대표"], ["regNo", "사업자등록번호"], ["mailOrderNo", "통신판매업"], ["address", "주소"], ["phone", "전화"], ["email", "이메일"]];
    const rows = labels.filter(([k]) => biz[k]).map(([k, l]) => `<span>${l} ${esc(biz[k])}</span>`);
    if (rows.length) { $("#bizInfo").hidden = false; $("#bizInfo").innerHTML = rows.join(""); }
    if (B.name && B.name !== "LOGO") $$(".footer p")[0].innerHTML = `© 2026 ${esc(B.name)}${B.hero && B.hero.eyebrow ? ` · ${esc(B.hero.eyebrow)}` : ""}. All rights reserved.`;
    if (B.name && B.name !== "LOGO") document.querySelector('meta[property="og:site_name"]').setAttribute("content", B.name);
  }

  async function init() {
    applyBrand();
    if (API.ready) await API.ready;   // 실제 서버 모드: 로그인 상태를 먼저 불러와요
    // 상단 바 아이콘
    $("#menuToggle").innerHTML = icon("menu");
    $("#shareBtn").insertAdjacentHTML("afterbegin", icon("share"));
    $("#cartBtn").insertAdjacentHTML("afterbegin", icon("cart"));
    $("#bellBtn").insertAdjacentHTML("afterbegin", icon("bell"));
    $("#menuToggle").addEventListener("click", () => {
      const nav = $("#mainNav"); const open = nav.classList.toggle("open");
      $("#menuToggle").setAttribute("aria-expanded", String(open));
    });
    $("#shareBtn").addEventListener("click", () => UI.share());

    // 꺼 둔 기능은 메뉴·아이콘에서도 숨겨요
    if (!F.shop) { $$('#mainNav a[href="#/shop"]').forEach((a) => a.remove()); $("#cartBtn").hidden = true; }
    if (!F.booking) $$('#mainNav a[href="#/booking"]').forEach((a) => a.remove());
    if (!F.account) { $(".dropdown-wrap").hidden = true; $("#authSlot").hidden = true; }

    Views.search.init();
    Views.account.init();
    refreshCart();
    window.addEventListener("hashchange", route);
    if (!(await handlePaymentReturn())) route();
  }

  window.App = { requireLogin, refreshCart, route };
  document.addEventListener("DOMContentLoaded", init);
})();
