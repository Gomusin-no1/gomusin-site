/* =========================================================
   3-5. 회원가입·로그인  [API 키 필요]
   3-4. 마이페이지        [서버 필요]
   3-6. 알림 — 배지·드롭다운 [서버 필요]
   ========================================================= */
window.Views = window.Views || {};
(function () {
  const { $, $$, esc, icon, toast, openModal, setErr, focusFirstError, valid, pwToggle, ago, date, won, empty, withState, uploader, setMeta } = UI;

  const avatarHtml = (u, cls = "") => u && u.avatar
    ? `<img class="avatar ${cls}" src="${esc(u.avatar)}" alt="${esc(u.nickname)} 프로필 사진">`
    : `<span class="avatar ${cls}" aria-hidden="true">${esc((u && u.nickname || "?").slice(0, 1))}</span>`;

  // ---------- 상단 바: 로그인 버튼 ↔ 프로필 아바타 ----------
  function renderAuthSlot() {
    const u = API.getUser();
    const slot = $("#authSlot");
    if (!u) {
      slot.innerHTML = `<button class="btn sm" id="loginBtn">로그인</button>`;
      $("#loginBtn").addEventListener("click", () => openAuth("login"));
      return;
    }
    slot.innerHTML = `<div class="dropdown-wrap">
      <button class="avatar-btn" id="avatarBtn" aria-haspopup="true" aria-expanded="false" aria-label="${esc(u.nickname)}님 메뉴">${avatarHtml(u)}</button>
      <div class="dropdown" id="profileMenu" hidden style="width:220px">
        <div class="dropdown-head"><span>${esc(u.nickname)}님</span></div>
        <ul class="menu-list">
          <li><a href="#/me">마이페이지</a></li>
          <li><a href="#/me?tab=orders">주문 내역</a></li>
          <li><a href="#/me?tab=bookings">예약 내역</a></li>
          <li><button id="logoutBtn">로그아웃</button></li>
        </ul>
      </div></div>`;
    const btn = $("#avatarBtn"), menu = $("#profileMenu");
    btn.addEventListener("click", (e) => { e.stopPropagation(); closeAll(menu); menu.hidden = !menu.hidden; btn.setAttribute("aria-expanded", String(!menu.hidden)); });
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) menu.hidden = true; });
    $("#logoutBtn").addEventListener("click", async () => { await API.signOut(); toast("로그아웃했어요"); if (location.hash.startsWith("#/me")) location.hash = "#/"; });
  }
  function closeAll(except) { $$(".dropdown").forEach((d) => { if (d !== except) d.hidden = true; }); }

  // ---------- 로그인 / 회원가입 모달 ----------
  function openAuth(mode = "login", onSuccess) {
    const m = openModal(`<div id="authBox"></div>`, { label: "로그인" });
    const box = $("#authBox", m.el);
    function draw(mode) {
      const isLogin = mode === "login";
      box.innerHTML = `
        <h2>${isLogin ? "로그인" : "회원가입"}</h2>
        <div class="tabs" role="tablist">
          <button role="tab" aria-selected="${isLogin}" data-mode="login">로그인</button>
          <button role="tab" aria-selected="${!isLogin}" data-mode="signup">회원가입</button>
        </div>
        <form novalidate>
          <div class="form-error" role="alert"></div>
          ${isLogin ? "" : `<label class="field"><span>닉네임</span><input class="input" name="nickname" maxlength="20" placeholder="2~20자" autocomplete="nickname"><span class="err"></span></label>`}
          <label class="field"><span>이메일<b class="req">*</b></span><input class="input" type="email" name="email" placeholder="you@example.com" autocomplete="email" required><span class="err"></span></label>
          <label class="field"><span>비밀번호<b class="req">*</b></span>
            <div class="pw-wrap"><input class="input" type="password" name="password" placeholder="8자 이상" autocomplete="${isLogin ? "current-password" : "new-password"}" required><button type="button" class="pw-toggle" aria-label="비밀번호 보기">${icon("eye")}</button></div>
            <span class="err"></span></label>
          ${isLogin ? "" : `<label class="field"><span>비밀번호 확인<b class="req">*</b></span>
            <div class="pw-wrap"><input class="input" type="password" name="password2" autocomplete="new-password" required><button type="button" class="pw-toggle" aria-label="비밀번호 보기">${icon("eye")}</button></div>
            <span class="err"></span></label>`}
          <button class="btn block" type="submit">${isLogin ? "로그인" : "가입하기"}</button>
        </form>
        <div class="or">또는</div>
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <button class="btn ghost" data-provider="kakao">카카오로 계속</button>
          <button class="btn ghost" data-provider="google">구글로 계속</button>
        </div>
        ${isLogin ? `<p class="hint" style="text-align:center;margin-top:16px">테스트 계정: demo@example.com / password1234</p>` : ""}`;
      pwToggle(box);
      $$("[data-mode]", box).forEach((b) => b.addEventListener("click", () => draw(b.dataset.mode)));
      $$("[data-provider]", box).forEach((b) => b.addEventListener("click", async () => {
        b.disabled = true;
        try { await API.signInWithProvider(b.dataset.provider); } catch (e) { $(".form-error", box).textContent = e.message; }
        b.disabled = false;
      }));
      const form = $("form", box);
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const f = form.elements; let ok = true;
        const check = (name, cond, msg) => { setErr(form, name, cond ? "" : msg); if (!cond) ok = false; };
        $(".form-error", box).textContent = "";
        check("email", valid.email(f.email.value), f.email.value ? "이메일 형식이 올바르지 않아요." : "이메일을 입력해 주세요.");
        check("password", valid.password(f.password.value), f.password.value ? "비밀번호는 8자 이상이에요." : "비밀번호를 입력해 주세요.");
        if (!isLogin) {
          check("nickname", !f.nickname.value || f.nickname.value.trim().length >= 2, "닉네임은 2자 이상이에요.");
          check("password2", f.password2.value === f.password.value, "비밀번호가 서로 달라요.");
        }
        if (!ok) return focusFirstError(form);
        const submit = $("button[type=submit]", form);
        submit.disabled = true; submit.textContent = isLogin ? "로그인 중…" : "가입 중…";
        try {
          const u = isLogin
            ? await API.signIn({ email: f.email.value, password: f.password.value })
            : await API.signUp({ email: f.email.value, password: f.password.value, nickname: f.nickname.value.trim() });
          m.close();
          toast(isLogin ? u.nickname + "님, 반가워요!" : "가입을 환영해요, " + u.nickname + "님!");
          onSuccess && onSuccess();
        } catch (err) {
          $(".form-error", box).textContent = err.message;
          submit.disabled = false; submit.textContent = isLogin ? "로그인" : "가입하기";
        }
      });
      $("input", form).focus();
    }
    draw(mode);
  }

  // ---------- 알림 (종 아이콘 + 배지 + 드롭다운) ----------
  let notis = [];
  async function loadNotis() {
    try { notis = await API.listNotifications(); } catch (e) { notis = null; }
    renderBadge();
  }
  function renderBadge() {
    const n = (notis || []).filter((x) => !x.read).length;
    const b = $("#bellBadge"); b.textContent = n > 9 ? "9+" : n; b.hidden = !n;
    $("#bellBtn").setAttribute("aria-label", "알림" + (n ? ", 안 읽은 알림 " + n + "개" : ""));
  }
  function renderDropdown() {
    const dd = $("#notiDropdown");
    const u = API.getUser();
    if (!u) { dd.innerHTML = `<div class="dropdown-head">알림</div><div class="state" style="padding:28px 16px">${icon("bell")}<strong>로그인하면 알림을 볼 수 있어요</strong><div class="chips"><button class="btn sm" data-login>로그인</button></div></div>`; $("[data-login]", dd).onclick = () => { dd.hidden = true; openAuth("login"); }; return; }
    if (notis === null) { dd.innerHTML = `<div class="dropdown-head">알림</div>` + UI.errorState("알림을 불러오지 못했어요."); $("[data-retry]", dd).onclick = async () => { dd.innerHTML = UI.loading(); await loadNotis(); renderDropdown(); }; return; }
    const unread = notis.filter((x) => !x.read).length;
    dd.innerHTML = `<div class="dropdown-head"><span>알림 ${unread ? `<span class="muted small">안 읽음 ${unread}</span>` : ""}</span><button data-all ${unread ? "" : "disabled"}>모두 읽기</button></div>` +
      (notis.length
        ? `<ul class="noti-list">${notis.map((n) => `<li><button class="${n.read ? "read" : "unread"}" data-id="${n.id}" data-link="${esc(n.link || "")}"><span class="dot" aria-hidden="true"></span><span>${esc(n.message)}<time datetime="${n.created_at}">${ago(n.created_at)}${n.read ? "" : " · 안 읽음"}</time></span></button></li>`).join("")}</ul>`
        : `<div class="state" style="padding:28px 16px">${icon("bell")}<strong>새 알림이 없어요</strong></div>`);
    const all = $("[data-all]", dd);
    all && all.addEventListener("click", async () => { all.disabled = true; await API.markAllRead(); notis.forEach((n) => (n.read = true)); renderBadge(); renderDropdown(); toast("모든 알림을 읽음 처리했어요"); });
    $$(".noti-list button", dd).forEach((b) => b.addEventListener("click", async () => {
      const n = notis.find((x) => x.id === b.dataset.id);
      if (!n.read) { n.read = true; renderBadge(); API.markRead(n.id); }
      dd.hidden = true; $("#bellBtn").setAttribute("aria-expanded", "false");
      if (b.dataset.link) location.hash = b.dataset.link.replace(/^#/, "");
    }));
  }
  function bindBell() {
    const btn = $("#bellBtn"), dd = $("#notiDropdown");
    btn.addEventListener("click", async (e) => {
      e.stopPropagation(); closeAll(dd);
      dd.hidden = !dd.hidden; btn.setAttribute("aria-expanded", String(!dd.hidden));
      if (!dd.hidden) { dd.innerHTML = UI.loading(); await loadNotis(); renderDropdown(); }
    });
    dd.addEventListener("click", (e) => e.stopPropagation());
    document.addEventListener("click", () => { closeAll(); btn.setAttribute("aria-expanded", "false"); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAll(); });
  }

  // ---------- 마이페이지 ----------
  const TABS = [["posts", "내가 쓴 글"], ["likes", "좋아요"], ["orders", "주문 내역"], ["bookings", "예약 내역"]];
  function mypage(page, tab) {
    setMeta("마이페이지");
    const u = API.getUser();
    if (!u) {
      page.innerHTML = `<div class="page narrow">${empty("로그인이 필요해요", "마이페이지는 로그인 후 볼 수 있어요.", `<div class="chips"><button class="btn" data-login>로그인</button></div>`)}</div>`;
      $("[data-login]", page).onclick = () => openAuth("login", () => mypage(page, tab));
      return;
    }
    page.innerHTML = `<div class="page">
      <div class="page-head"><h2>마이페이지</h2></div>
      <section class="card profile" aria-label="내 프로필">
        <div>${avatarHtml(u, "lg")}</div>
        <div>
          <strong style="font-size:1.2rem">${esc(u.nickname)}</strong>
          <div class="muted small">${esc(u.email)} · ${date(u.created_at)} 가입</div>
          <p style="margin:8px 0 12px">${u.bio ? esc(u.bio) : '<span class="muted">소개글이 없어요.</span>'}</p>
          <button class="btn sm" data-edit>${icon("edit")}프로필 수정</button>
        </div>
      </section>
      <div class="tabs" role="tablist" style="margin-top:28px">${TABS.map(([k, l]) => `<button role="tab" aria-selected="${k === tab}" data-tab="${k}">${l}</button>`).join("")}</div>
      <div id="tabBody" role="tabpanel"></div></div>`;
    $("[data-edit]", page).addEventListener("click", () => editProfile(() => mypage(page, tab)));
    $$("[data-tab]", page).forEach((b) => b.addEventListener("click", () => history.replaceState(null, "", "#/me?tab=" + b.dataset.tab) || mypage(page, b.dataset.tab)));
    const body = $("#tabBody", page);
    const views = {
      posts: [API.listMyPosts, (list) => list.length
        ? `<ul class="list">${list.map((p) => `<li><a href="#/board/${p.id}">${esc(p.title)}</a><span class="muted small">${date(p.created_at)} · 조회 ${p.views}</span></li>`).join("")}</ul>`
        : empty("아직 쓴 글이 없어요", "", `<div class="chips"><a class="btn sm" href="#/board/new">첫 글 쓰기</a></div>`)],
      likes: [API.listLikedPosts, (list) => list.length
        ? `<ul class="list">${list.map((p) => `<li><a href="#/board/${p.id}">${esc(p.title)}</a><span class="muted small">${esc(p.author)} · ${date(p.created_at)}</span></li>`).join("")}</ul>`
        : empty("좋아요한 글이 없어요", "게시판에서 마음에 드는 글에 좋아요를 눌러 보세요.")],
      orders: [API.listMyOrders, (list) => list.length
        ? `<ul class="list">${list.map((o) => `<li><div><strong>${esc(o.items[0].name)}${o.items.length > 1 ? " 외 " + (o.items.length - 1) + "건" : ""}</strong><div class="muted small">${date(o.created_at)} · 주문번호 ${esc(o.id)}</div></div><div style="text-align:right"><div>${won(o.total)}</div><span class="status ${o.status === "결제완료" ? "ok" : ""}">${esc(o.status)}</span></div></li>`).join("")}</ul>`
        : empty("주문 내역이 없어요", "", `<div class="chips"><a class="btn sm" href="#/shop">상점 둘러보기</a></div>`)],
      bookings: [API.listMyBookings, (list) => list.length
        ? `<ul class="list">${list.map((b) => `<li><div><strong>${esc(b.date)} ${esc(b.time)}</strong><div class="muted small">${esc(b.name)} · ${esc(b.phone)}</div></div><span class="status ok">${esc(b.status)}</span></li>`).join("")}</ul>`
        : empty("예약 내역이 없어요", "", `<div class="chips"><a class="btn sm" href="#/booking">상담 예약하기</a></div>`)]
    };
    const [task, render] = views[tab] || views.posts;
    withState(body, task, (data) => { body.innerHTML = render(data); });
  }

  function editProfile(done) {
    const u = API.getUser();
    const m = openModal(`<h2>프로필 수정</h2>
      <form novalidate>
        <div class="form-error" role="alert"></div>
        <div class="field"><span>프로필 사진</span><div id="avatarUp"></div></div>
        <label class="field"><span>닉네임<b class="req">*</b></span><input class="input" name="nickname" value="${esc(u.nickname)}" maxlength="20"><span class="err"></span></label>
        <label class="field"><span>소개</span><textarea class="textarea" name="bio" maxlength="100" style="min-height:80px">${esc(u.bio || "")}</textarea><span class="hint">100자 이내</span></label>
        <div class="row end"><button type="button" class="btn ghost" data-close>취소</button><button class="btn" type="submit">저장</button></div>
      </form>`, { label: "프로필 수정" });
    const up = uploader($("#avatarUp", m.el), { single: true, max: 1, initial: u.avatar ? [u.avatar] : [] });
    const form = $("form", m.el);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nick = form.elements.nickname.value.trim();
      setErr(form, "nickname", nick.length >= 2 ? "" : "닉네임은 2자 이상이에요.");
      if (nick.length < 2) return focusFirstError(form);
      const btn = $("button[type=submit]", form); btn.disabled = true; btn.textContent = "저장 중…";
      try {
        let avatar = up.getExisting()[0] || "";
        const f = up.getFiles()[0];
        if (f) avatar = await API.uploadImage(f, { max: 256 });
        await API.updateProfile({ nickname: nick, bio: form.elements.bio.value.trim(), avatar });
        m.close(); toast("프로필을 저장했어요"); done && done();
      } catch (err) { $(".form-error", form).textContent = err.message; btn.disabled = false; btn.textContent = "저장"; }
    });
  }

  Views.account = {
    init() {
      renderAuthSlot(); bindBell(); loadNotis();
      API.onAuthChange(() => { renderAuthSlot(); loadNotis(); App.refreshCart(); });
      API.onNotification && API.onNotification(() => loadNotis());
    },
    openAuth, mypage, avatarHtml
  };
})();
