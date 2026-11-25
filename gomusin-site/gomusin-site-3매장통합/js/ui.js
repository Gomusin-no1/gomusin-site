/* =========================================================
   화면 도우미: 아이콘, 토스트, 모달, 상태 화면, 페이지네이션,
   이미지 업로더, 공유하기, 입력값 검사
   ========================================================= */
(function () {
  // ---------- 라인 아이콘 (SVG 경로) ----------
  const P = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M9.9 4.2A9.8 9.8 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.2 3.2M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M14.1 14.1a3 3 0 0 1-4.2-4.2M2 2l20 20"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'
  };
  const icon = (name, cls = "") => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ""}</svg>`;

  // ---------- 기본 도우미 ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const won = (n) => Number(n).toLocaleString("ko-KR") + "원";
  const date = (iso) => { const d = new Date(iso); return d.getFullYear() + "." + String(d.getMonth() + 1).padStart(2, "0") + "." + String(d.getDate()).padStart(2, "0"); };
  const ago = (iso) => {
    const s = (Date.now() - new Date(iso)) / 1000;
    if (s < 60) return "방금 전"; if (s < 3600) return Math.floor(s / 60) + "분 전";
    if (s < 86400) return Math.floor(s / 3600) + "시간 전"; if (s < 86400 * 7) return Math.floor(s / 86400) + "일 전";
    return date(iso);
  };
  function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  // 검색어 일치 부분 하이라이트 (HTML 안전)
  function highlight(text, q) {
    const safe = esc(text);
    const words = (q || "").trim().split(/\s+/).filter(Boolean).map((w) => esc(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    if (!words.length) return safe;
    return safe.replace(new RegExp("(" + words.join("|") + ")", "gi"), "<mark>$1</mark>");
  }

  // ---------- 토스트 ----------
  function toast(msg, type = "") {
    const el = document.createElement("div");
    el.className = "toast " + type; el.textContent = msg; el.setAttribute("role", "status");
    $("#toasts").appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  // ---------- 모달 ----------
  let lastFocus = null;
  function openModal(html, { label = "대화상자", onClose } = {}) {
    lastFocus = document.activeElement;
    const root = $("#modalRoot");
    root.innerHTML = `<div class="backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(label)}">
      <button class="icon-btn modal-close" data-close aria-label="닫기">${icon("x")}</button>${html}</div></div>`;
    const bd = $(".backdrop", root);
    const close = () => { root.innerHTML = ""; document.removeEventListener("keydown", onKey); onClose && onClose(); lastFocus && lastFocus.focus && lastFocus.focus(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    bd.addEventListener("click", (e) => { if (e.target === bd || e.target.closest("[data-close]")) close(); });
    document.addEventListener("keydown", onKey);
    const first = $("input, button:not([data-close]), textarea", bd); first && first.focus();
    return { el: $(".modal", root), close };
  }

  // ---------- 상태 화면 ----------
  const loading = (msg = "불러오는 중이에요…") => `<div class="state" role="status"><div class="spinner"></div>${esc(msg)}</div>`;
  const empty = (title, desc = "", extra = "") => `<div class="state">${icon("inbox")}<strong>${esc(title)}</strong>${esc(desc)}${extra}</div>`;
  const errorState = (msg) => `<div class="state error" role="alert">${icon("alert")}<strong>문제가 생겼어요</strong>${esc(msg || "잠시 후 다시 시도해 주세요.")}<div class="chips"><button class="btn sm" data-retry>다시 시도</button></div></div>`;
  // 비동기 화면 그리기: 로딩 → 성공 / 에러(다시 시도)
  async function withState(container, task, render, loadingMsg) {
    container.innerHTML = loading(loadingMsg);
    try { render(await task()); }
    catch (e) {
      container.innerHTML = errorState(e.message);
      const r = $("[data-retry]", container); r && r.addEventListener("click", () => withState(container, task, render, loadingMsg));
    }
  }

  // ---------- 페이지네이션 ----------
  function pagination(total, size, page, onGo) {
    const pages = Math.ceil(total / size);
    const nav = document.createElement("nav");
    nav.className = "pagination"; nav.setAttribute("aria-label", "페이지 이동");
    if (pages <= 1) return nav;
    const btn = (label, p, opts = {}) => {
      const b = document.createElement("button");
      b.type = "button"; b.innerHTML = label; b.disabled = !!opts.disabled;
      if (opts.current) b.setAttribute("aria-current", "page");
      if (opts.aria) b.setAttribute("aria-label", opts.aria);
      b.addEventListener("click", () => onGo(p));
      return b;
    };
    nav.appendChild(btn(icon("left"), page - 1, { disabled: page === 1, aria: "이전 페이지" }));
    const start = Math.max(1, Math.min(page - 2, pages - 4)), end = Math.min(pages, start + 4);
    for (let i = start; i <= end; i++) nav.appendChild(btn(String(i), i, { current: i === page, aria: i + "페이지" }));
    nav.appendChild(btn(icon("right"), page + 1, { disabled: page === pages, aria: "다음 페이지" }));
    return nav;
  }

  // ---------- 이미지 업로더 (드래그&드롭 + 파일 선택 + 미리보기) ----------
  // 사용: const up = uploader(container, { max: 5, initial: [url...] }); up.getFiles(), up.getExisting()
  const MAX_BYTES = 5 * 1024 * 1024;
  function checkImage(file) {
    if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.type)) return "이미지 파일(JPG, PNG, GIF, WEBP)만 올릴 수 있어요: " + file.name;
    if (file.size > MAX_BYTES) return "5MB 이하 이미지만 올릴 수 있어요: " + file.name + " (" + (file.size / 1048576).toFixed(1) + "MB)";
    return "";
  }
  function uploader(container, { max = 5, initial = [], single = false } = {}) {
    let existing = initial.slice();   // 이미 업로드된 이미지 주소
    let files = [];                    // 새로 고른 파일 { file, url }
    const id = "f" + Math.random().toString(36).slice(2, 7);
    container.innerHTML = `
      <label class="dropzone" for="${id}" tabindex="0">
        ${icon("upload")}<div><strong>이미지를 끌어다 놓거나 눌러서 선택</strong></div>
        <div class="small">JPG·PNG·GIF·WEBP, 한 장당 5MB 이하${single ? "" : ", 최대 " + max + "장"}</div>
      </label>
      <input type="file" id="${id}" accept="image/png,image/jpeg,image/gif,image/webp" ${single ? "" : "multiple"} hidden>
      <span class="err" role="alert"></span>
      <div class="thumbs"></div>`;
    const dz = $(".dropzone", container), input = $("input", container), err = $(".err", container), thumbs = $(".thumbs", container);
    function render() {
      thumbs.innerHTML = existing.map((u, i) => `<div class="thumb"><img src="${esc(u)}" alt="첨부 이미지 ${i + 1}"><button type="button" data-ex="${i}" aria-label="이미지 삭제">${icon("x")}</button></div>`).join("")
        + files.map((f, i) => `<div class="thumb"><img src="${f.url}" alt="${esc(f.file.name)} 미리보기"><button type="button" data-new="${i}" aria-label="${esc(f.file.name)} 삭제">${icon("x")}</button></div>`).join("");
    }
    function add(list) {
      const errors = [];
      for (const file of list) {
        const m = checkImage(file); if (m) { errors.push(m); continue; }
        if (single) { files.forEach((f) => URL.revokeObjectURL(f.url)); files = []; existing = []; }
        if (existing.length + files.length >= max) { errors.push("이미지는 최대 " + max + "장까지 올릴 수 있어요."); break; }
        files.push({ file, url: URL.createObjectURL(file) });
      }
      err.textContent = errors.join(" ");
      render(); container.dispatchEvent(new Event("change"));
    }
    input.addEventListener("change", () => { add(Array.from(input.files)); input.value = ""; });
    dz.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } });
    ["dragenter", "dragover"].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.add("over"); }));
    ["dragleave", "drop"].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.remove("over"); }));
    dz.addEventListener("drop", (e) => add(Array.from(e.dataTransfer.files)));
    thumbs.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.ex !== undefined) existing.splice(+b.dataset.ex, 1);
      else { URL.revokeObjectURL(files[+b.dataset.new].url); files.splice(+b.dataset.new, 1); }
      render(); container.dispatchEvent(new Event("change"));
    });
    render();
    return {
      getFiles: () => files.map((f) => f.file),
      getExisting: () => existing.slice(),
      // 새 파일을 업로드하고, 기존 + 새 주소 목록을 돌려줘요
      async uploadAll() { const urls = []; for (const f of files) urls.push(await API.uploadImage(f.file)); return existing.concat(urls); }
    };
  }

  // ---------- 공유하기 ----------
  function setMeta(title, desc) {
    const B = window.BRAND || {}; const name = B.name && B.name !== "LOGO" ? B.name : "심플 검색";
    const full = title ? title + " · " + name : name + (B.hero && B.hero.eyebrow ? " — " + B.hero.eyebrow : " — 무엇이든 검색");
    document.title = full;
    const set = (sel, v) => { const m = document.querySelector(sel); if (m && v) m.setAttribute("content", v); };
    set('meta[property="og:title"]', full);
    if (desc) { set('meta[property="og:description"]', desc); set('meta[name="description"]', desc); }
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (e) {
      const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand("copy"); } catch (_) {}
      ta.remove(); return ok;
    }
  }
  async function share({ title = document.title, url = location.href } = {}) {
    const isMobile = matchMedia("(pointer: coarse)").matches;
    if (isMobile && navigator.share) {
      try { await navigator.share({ title, url }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    const u = encodeURIComponent(url), t = encodeURIComponent(title);
    const m = openModal(`<h2>공유하기</h2>
      <div class="field"><span>페이지 주소</span><div class="coupon-row"><input class="input" value="${esc(url)}" readonly aria-label="페이지 주소"><button class="btn" data-copy>${icon("link")}복사</button></div></div>
      <div class="or">SNS로 공유</div>
      <div class="row">
        <a class="btn ghost sm" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?url=${u}&text=${t}">X (트위터)</a>
        <a class="btn ghost sm" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${u}">페이스북</a>
        <a class="btn ghost sm" target="_blank" rel="noopener" href="https://share.naver.com/web/shareView?url=${u}&title=${t}">네이버</a>
      </div>
      <p class="hint">카카오톡 공유는 카카오 JavaScript 키를 넣은 뒤 Kakao.Share 로 연결할 수 있어요. (backend/GUIDE.md 참고)</p>`, { label: "공유하기" });
    $("[data-copy]", m.el).addEventListener("click", async () => {
      if (await copyText(url)) { toast("링크가 복사됐어요"); m.close(); } else toast("복사하지 못했어요. 주소를 직접 선택해 복사해 주세요.", "error");
    });
  }

  // ---------- 입력값 검사 ----------
  const valid = {
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    phone: (v) => /^01[016789]-?\d{3,4}-?\d{4}$/.test(v.trim()),
    password: (v) => v.length >= 8
  };
  // 휴대폰 번호 자동 하이픈
  function phoneMask(input) {
    input.addEventListener("input", () => {
      const d = input.value.replace(/\D/g, "").slice(0, 11);
      input.value = d.length < 4 ? d : d.length < 8 ? d.slice(0, 3) + "-" + d.slice(3) : d.slice(0, 3) + "-" + d.slice(3, d.length - 4) + "-" + d.slice(-4);
    });
  }
  // 필드 에러 표시: setErr(form, "name", "메시지") / 빈 문자열이면 지움
  function setErr(form, name, msg) {
    const input = form.elements[name]; if (!input) return;
    const field = (input.length && !input.tagName ? input[0] : input).closest(".field");
    if (!field) return;
    field.classList.toggle("invalid", !!msg);
    const e = $(".err", field); if (e) e.textContent = msg || "";
  }
  // 사용자가 다시 입력하면 그 칸의 에러 문구를 지워요
  document.addEventListener("input", (e) => {
    const field = e.target.closest && e.target.closest(".field.invalid");
    if (field) { field.classList.remove("invalid"); const er = $(".err", field); if (er) er.textContent = ""; }
  });
  document.addEventListener("change", (e) => {
    const field = e.target.closest && e.target.closest(".field.invalid");
    if (field && e.target.type === "checkbox") { field.classList.remove("invalid"); const er = $(".err", field); if (er) er.textContent = ""; }
  });
  function focusFirstError(form) { const f = $(".field.invalid input, .field.invalid textarea", form); f && f.focus(); }

  function pwToggle(root) {
    $$(".pw-toggle", root).forEach((b) => b.addEventListener("click", () => {
      const i = b.previousElementSibling; const show = i.type === "password";
      i.type = show ? "text" : "password"; b.innerHTML = icon(show ? "eyeOff" : "eye");
      b.setAttribute("aria-label", show ? "비밀번호 숨기기" : "비밀번호 보기");
    }));
  }

  window.UI = { icon, esc, $, $$, won, date, ago, debounce, highlight, toast, openModal, loading, empty, errorState, withState, pagination, uploader, checkImage, setMeta, share, copyText, valid, phoneMask, setErr, focusFirstError, pwToggle };
})();
