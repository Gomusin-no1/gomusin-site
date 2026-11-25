/* =========================================================
   3-1. 검색 — 키워드·필터 [프론트만]
   - 입력 300ms 디바운스로 목록 필터링
   - 일치 부분 하이라이트
   - 0건이면 안내 문구 + 추천 키워드
   - 최근 검색어 5개 localStorage 저장
   ========================================================= */
window.Views = window.Views || {};
(function () {
  const { $, esc, icon, highlight, debounce, empty, errorState, pagination, setMeta, share } = UI;
  const RECENT_KEY = "ss_recent_v1";
  const PAGE_SIZE = 5;
  let docs = null;
  let current = { q: "", page: 1 };

  const els = {};
  function cache() {
    els.form = $("#searchForm"); els.q = $("#q"); els.clear = $("#clearQ");
    els.suggest = $("#suggest"); els.recent = $("#recent"); els.results = $("#results");
    $(".search-icon").innerHTML = icon("search");
    els.clear.innerHTML = icon("x");
  }

  // ---------- 최근 검색어 ----------
  function getRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; } catch (e) { return []; } }
  function saveRecent(q) {
    const list = [q].concat(getRecent().filter((x) => x !== q)).slice(0, 5);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch (e) {}
  }
  function removeRecent(q) { try { localStorage.setItem(RECENT_KEY, JSON.stringify(getRecent().filter((x) => x !== q))); } catch (e) {} renderRecent(); }
  function renderRecent() {
    const list = getRecent();
    els.recent.innerHTML = list.length
      ? `<span class="label">최근 검색어</span>` + list.map((q) => `<span class="chip"><button type="button" class="chip-text x" data-q="${esc(q)}" style="font-size:inherit">${esc(q)}</button><button type="button" class="x" data-del="${esc(q)}" aria-label="${esc(q)} 삭제">×</button></span>`).join("")
      : "";
  }

  // ---------- 검색 로직 ----------
  async function ensureDocs() { if (!docs) docs = await API.getDocs(); return docs; }
  function match(q) {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return docs
      .map((d) => {
        const hay = (d.title + " " + d.summary + " " + d.url).toLowerCase();
        if (!words.every((w) => hay.includes(w))) return null;
        const score = words.reduce((s, w) => s + (d.title.toLowerCase().includes(w) ? 3 : 0) + (d.summary.toLowerCase().includes(w) ? 1 : 0), 0);
        return { d, score };
      })
      .filter(Boolean).sort((a, b) => b.score - a.score).map((x) => x.d);
  }

  function renderResults(q, page) {
    const t0 = performance.now();
    const list = match(q);
    const ms = Math.max(0.01, (performance.now() - t0) / 1000).toFixed(2);
    const r = els.results;
    if (!list.length) {
      const chips = window.MOCK.suggestKeywords.map((k) => `<button class="chip" data-q="${esc(k)}">${esc(k)}</button>`).join("");
      r.innerHTML = empty(`'${q}'에 대한 검색 결과가 없어요`, "철자를 확인하거나, 더 짧은 단어로 검색해 보세요. 이런 키워드는 어때요?", `<div class="chips">${chips}</div>`);
      return;
    }
    const pages = Math.ceil(list.length / PAGE_SIZE);
    page = Math.min(Math.max(1, page), pages);
    const slice = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    r.innerHTML = `<p class="result-meta">검색결과 ${list.length}개 (${ms}초)${pages > 1 ? " · " + page + "/" + pages + "페이지" : ""}</p>` +
      slice.map((d) => `<article class="result">
        <a class="title" href="#/doc/${d.id}">${highlight(d.title, q)}</a>
        <cite>${highlight(d.url, q)}</cite>
        <p>${highlight(d.summary, q)}</p></article>`).join("");
    r.appendChild(pagination(list.length, PAGE_SIZE, page, (p) => { go(q, p); window.scrollTo(0, 0); }));
  }

  // 주소(#/search?q=...&page=2)를 바꿔서 뒤로가기도 되게 해요
  function go(q, page = 1, { replace = false } = {}) {
    const h = "#/search?q=" + encodeURIComponent(q) + (page > 1 ? "&page=" + page : "");
    if (replace) history.replaceState(null, "", h); else location.hash = h;
    if (replace) show({ q, page });
  }

  // ---------- 추천(자동완성) 목록 ----------
  let active = -1;
  function renderSuggest(q) {
    if (!q || !docs) { els.suggest.hidden = true; return; }
    const list = match(q).slice(0, 5);
    if (!list.length) { els.suggest.hidden = true; return; }
    active = -1;
    els.suggest.innerHTML = list.map((d, i) => `<li role="option"><button type="button" data-i="${i}" data-title="${esc(d.title)}">${icon("search")}<span>${highlight(d.title, q)}</span></button></li>`).join("");
    els.suggest.hidden = false;
  }
  function moveActive(dir) {
    const items = Array.from(els.suggest.querySelectorAll("button"));
    if (els.suggest.hidden || !items.length) return false;
    active = (active + dir + items.length) % items.length;
    items.forEach((b, i) => b.classList.toggle("active", i === active));
    return true;
  }

  const onType = debounce(async () => {
    const q = els.q.value.trim();
    try { await ensureDocs(); } catch (e) { return; }
    if (document.body.classList.contains("searching")) {
      if (q) { go(q, 1, { replace: true }); } // 결과 화면에서는 목록을 바로 필터링
    } else renderSuggest(q);
  }, 300);

  function submit(q) {
    q = (q || "").trim();
    if (!q) { els.q.focus(); UI.toast("검색어를 입력해 주세요"); return; }
    saveRecent(q); els.suggest.hidden = true; go(q, 1);
  }

  function bind() {
    els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      const items = els.suggest.querySelectorAll("button");
      if (!els.suggest.hidden && active >= 0 && items[active]) return submit(items[active].dataset.title);
      submit(els.q.value);
    });
    els.q.addEventListener("input", () => { els.clear.hidden = !els.q.value; onType(); });
    els.q.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" && moveActive(1)) e.preventDefault();
      else if (e.key === "ArrowUp" && moveActive(-1)) e.preventDefault();
      else if (e.key === "Escape") els.suggest.hidden = true;
    });
    els.q.addEventListener("focus", () => { ensureDocs().then(() => !document.body.classList.contains("searching") && renderSuggest(els.q.value.trim())).catch(() => {}); });
    document.addEventListener("click", (e) => { if (!e.target.closest(".search-box")) els.suggest.hidden = true; });
    els.suggest.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { els.q.value = b.dataset.title; submit(b.dataset.title); } });
    els.clear.addEventListener("click", () => { els.q.value = ""; els.clear.hidden = true; els.suggest.hidden = true; els.q.focus(); });
    $("#randomBtn").addEventListener("click", async () => {
      try { await ensureDocs(); } catch (e) { UI.toast(e.message, "error"); return; }
      const list = window.MOCK.randomKeywords;
      const word = list[Math.floor(Math.random() * list.length)];
      els.q.value = word; els.clear.hidden = false; submit(word);
    });
    els.recent.addEventListener("click", (e) => {
      const del = e.target.closest("[data-del]"); if (del) return removeRecent(del.dataset.del);
      const q = e.target.closest("[data-q]"); if (q) { els.q.value = q.dataset.q; submit(q.dataset.q); }
    });
    els.results.addEventListener("click", (e) => { const c = e.target.closest(".chip[data-q]"); if (c) { els.q.value = c.dataset.q; submit(c.dataset.q); } });
  }

  // ---------- 라우터가 부르는 함수 ----------
  async function show({ q = "", page = 1 } = {}) {
    current = { q, page };
    if (!q) { // 홈 화면
      document.body.classList.remove("searching");
      els.results.hidden = true; els.q.value = ""; els.clear.hidden = true;
      renderRecent(); setMeta("");
      return;
    }
    document.body.classList.add("searching");
    if (els.q.value.trim() !== q) els.q.value = q;
    els.clear.hidden = false; els.suggest.hidden = true; els.results.hidden = false;
    setMeta(q + " 검색결과", "'" + q + "' 검색결과");
    if (!docs) {
      els.results.innerHTML = `<p class="result-meta">검색 중…</p>` + '<div class="skeleton" style="width:60%"></div><div class="skeleton" style="width:30%"></div><div class="skeleton"></div>'.repeat(3);
      try { await ensureDocs(); }
      catch (e) { els.results.innerHTML = errorState(e.message); els.results.querySelector("[data-retry]").onclick = () => show(current); return; }
    }
    renderResults(q, page);
  }

  // 문서 상세 (검색 결과를 누르면 열리는 화면) — 페이지별 og 태그 예시
  async function showDoc(id, page) {
    UI.withState(page, ensureDocs, () => {
      const d = docs.find((x) => x.id === id);
      if (!d) { page.innerHTML = `<div class="page narrow">${empty("문서를 찾을 수 없어요", "")}<p style="text-align:center"><a class="btn" href="#/">검색으로</a></p></div>`; return; }
      setMeta(d.title, d.summary);
      page.innerHTML = `<div class="page narrow">
        <a class="back" href="javascript:history.back()">${icon("left")}뒤로</a>
        <article class="card stack">
          <cite class="muted small" style="font-style:normal">${esc(d.url)}</cite>
          <h2>${esc(d.title)}</h2><p>${esc(d.summary)}</p>
          <p class="muted small">이 화면은 가짜 데이터로 만든 문서 미리보기예요. 실제 서비스에서는 문서 원문 주소로 연결하거나 내 블로그 글을 보여주면 돼요.</p>
          <div class="row"><button class="btn" data-share>${icon("share")}공유하기</button><a class="btn ghost" href="#/">새로 검색</a></div>
        </article></div>`;
      page.querySelector("[data-share]").addEventListener("click", () => share({ title: d.title }));
    });
  }

  Views.search = { init() { cache(); bind(); renderRecent(); }, show, showDoc };
})();
