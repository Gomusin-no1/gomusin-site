/* =========================================================
   공지사항 — 매장에서 올리는 공지 (손님은 읽기만)
   - 내용은 js/notices.js 한 파일에서 관리해요.
   ========================================================= */
window.Views = window.Views || {};
(function () {
  const { $, esc, icon, empty, setMeta, share } = UI;
  const all = () => (window.NOTICES || []).slice().sort((a, b) => (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || b.date.localeCompare(a.date));
  const d = (s) => (s || "").replace(/-/g, ".");

  function list(page) {
    setMeta("공지사항", "고무신모바일 매장 소식과 행사 안내");
    const items = all();
    page.innerHTML = `<div class="page">
      <div class="page-head"><h2>공지사항</h2></div>
      ${items.length ? `<ul class="notice-list">${items.map((n) => `<li><a href="#/notice/${esc(n.id)}">
          ${n.pin ? `<span class="notice-pin">중요</span>` : ""}<strong>${esc(n.title)}</strong>
          <span class="notice-date">${d(n.date)}</span></a></li>`).join("")}</ul>`
        : empty("아직 공지가 없어요", "새 소식이 생기면 여기에서 알려 드릴게요.")}
    </div>`;
  }

  function detail(page, id) {
    const n = (window.NOTICES || []).find((x) => x.id === id);
    if (!n) { page.innerHTML = `<div class="page narrow">${empty("공지를 찾을 수 없어요", "", `<div class="chips"><a class="btn sm" href="#/notice">목록으로</a></div>`)}</div>`; return; }
    setMeta(n.title, n.body.slice(0, 80));
    page.innerHTML = `<div class="page narrow">
      <a class="back" href="#/notice">${icon("left")}목록으로</a>
      <article>
        <header class="post-head">${n.pin ? `<span class="notice-pin">중요</span>` : ""}<h2>${esc(n.title)}</h2>
          <div class="muted small">고무신모바일 · ${d(n.date)}</div></header>
        <div class="post-body">${esc(n.body)}</div>
      </article>
      <hr class="divider">
      <div class="row"><button class="btn ghost" data-share>${icon("share")}공유</button><a class="btn ghost" href="#/notice">목록으로</a></div>
    </div>`;
    $("[data-share]", page).addEventListener("click", () => share({ title: n.title }));
  }

  Views.notice = { list, detail };
})();
