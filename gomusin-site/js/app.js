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
    [/^\/board$/, (m, q) => Views.board.list(page, +q.get("page") || 1)],
    [/^\/board\/new$/, () => Views.board.form(page)],
    [/^\/board\/([\w-]+)\/edit$/, (m) => Views.board.form(page, m[1])],
    [/^\/board\/([\w-]+)$/, (m) => Views.board.detail(page, m[1])],
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

  let lastPath = "";
  function route() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, qs] = raw.split("?");
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
  function applyBrand() {
    const B = window.BRAND || {}; const esc = UI.esc;
    $$("[data-brand-logo]").forEach((a) => {
      a.innerHTML = B.logo ? `<img src="${esc(B.logo)}" alt="${esc(B.name || "로고")}">` : esc(B.name || "LOGO");
      a.classList.toggle("has-img", !!B.logo);
    });
    const tg = $("#tagline"); tg.textContent = B.tagline || ""; tg.hidden = !B.tagline;
    // 브랜드 배너 (지점 전화 + 바로가기)
    const H = B.hero || {}, hero = $("#brandHero");
    if (H.logo || H.headline || (B.branches || []).length) {
      const L = B.links || {};
      const head = esc(H.headline || "").replace(/\[(.+?)\]/g, "<em>$1</em>");
      const quick = [["휴대폰 정보", "#/search?q=" + encodeURIComponent("휴대폰")], ["구매 후기", L.reviews || "#/board"], ["카카오톡 상담", L.kakao], ["인스타그램", L.instagram], ["네이버 플레이스", L.naverPlace]]
        .filter(([, u]) => u)
        .map(([t, u]) => `<a href="${esc(u)}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`).join("");
      hero.hidden = false;
      hero.innerHTML = `<div class="bh-inner"${H.background ? ` style="background-image:linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.55)),url('${esc(H.background)}')"` : ""}>
        ${H.eyebrow && !H.logoHasEyebrow ? `<p class="bh-eyebrow">${esc(H.eyebrow)}</p>` : ""}
        ${H.logo ? `<img class="bh-logo" src="${esc(H.logo)}" alt="${esc(B.name || "")}">` : ""}
        ${head ? `<p class="bh-head">${head}</p>` : ""}
        ${H.title ? `<h2 class="bh-title">${esc(H.title)}</h2>` : ""}
        ${(B.branches || []).length ? `<ul class="bh-branches">${B.branches.map((b) => `<li><a href="tel:${esc(b.phone.replace(/[^0-9]/g, ""))}"><strong>${esc(b.name)}</strong> ${esc(b.phone.replace(/-/g, "."))}</a></li>`).join("")}</ul>` : ""}
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
        <div class="bg-grid n${Math.min(photos.length, 6)}">${photos.slice(0, 6).map((p, i) => `<figure><img src="${esc(p.src)}" alt="${esc(p.caption || "매장 사진 " + (i + 1))}" loading="lazy">${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""}</figure>`).join("")}</div>
        <p class="bg-more"><a class="btn" href="#/store">매장 위치 보기</a></p>`;
    }
    const biz = B.business || {};
    const labels = [["company", "상호"], ["ceo", "대표"], ["regNo", "사업자등록번호"], ["mailOrderNo", "통신판매업"], ["address", "주소"], ["phone", "전화"], ["email", "이메일"]];
    const rows = labels.filter(([k]) => biz[k]).map(([k, l]) => `<span>${l} ${esc(biz[k])}</span>`);
    if (rows.length) { $("#bizInfo").hidden = false; $("#bizInfo").innerHTML = rows.join(""); }
    if (B.name && B.name !== "LOGO") $$(".footer p")[0].innerHTML = `© 2026 ${esc(B.name)} · 지금은 <strong>테스트(가짜 데이터) 모드</strong>예요. 입력한 내용은 이 브라우저에만 저장돼요.`;
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

    Views.search.init();
    Views.account.init();
    refreshCart();
    window.addEventListener("hashchange", route);
    if (!(await handlePaymentReturn())) route();
  }

  window.App = { requireLogin, refreshCart, route };
  document.addEventListener("DOMContentLoaded", init);
})();
