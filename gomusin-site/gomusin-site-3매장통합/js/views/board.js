/* =========================================================
   3-7. 글쓰기·게시판 — 작성·수정·삭제 [서버 필요]
   3-8. 이미지 업로드 (글쓰기 화면에서 사용) [서버 필요]
   3-9. 공유하기 (상세 화면) [프론트만]
   ========================================================= */
window.Views = window.Views || {};
(function () {
  const { $, esc, icon, toast, date, empty, withState, pagination, uploader, setMeta, setErr, focusFirstError, share, openModal } = UI;
  const SIZE = 10;

  function list(page, p = 1) {
    setMeta("게시판", "1인 기업가들의 질문과 노하우");
    page.innerHTML = `<div class="page">
      <div class="page-head"><h2>게시판</h2><button class="btn" data-write>${icon("edit")}글쓰기</button></div>
      <div id="boardBody"></div></div>`;
    $("[data-write]", page).addEventListener("click", () => App.requireLogin(() => (location.hash = "#/board/new")));
    const body = $("#boardBody", page);
    withState(body, () => API.listPosts({ page: p, size: SIZE }), ({ items, total }) => {
      if (!total) { body.innerHTML = empty("아직 글이 없어요", "첫 번째 글을 남겨 보세요!"); return; }
      body.innerHTML = `<table class="board-table">
        <thead><tr><th class="num">번호</th><th>제목</th><th class="author">작성자</th><th class="date">날짜</th><th class="views">조회</th></tr></thead>
        <tbody>${items.map((it, i) => `<tr>
          <td class="num">${total - (p - 1) * SIZE - i}</td>
          <td class="t"><a href="#/board/${it.id}">${esc(it.title)}</a>${it.images && it.images.length ? ` <span class="muted" title="이미지 첨부">${icon("image")}</span>` : ""}
            <div class="meta-m">${esc(it.author)} · ${date(it.created_at)} · 조회 ${it.views}</div></td>
          <td class="author">${esc(it.author)}</td><td class="date">${date(it.created_at)}</td><td class="views">${it.views}</td></tr>`).join("")}</tbody></table>`;
      body.appendChild(pagination(total, SIZE, p, (n) => (location.hash = "#/board?page=" + n)));
    });
  }

  function detail(page, id) {
    withState(page, () => API.getPost(id, { countView: true }), (post) => {
      const u = API.getUser();
      const mine = u && u.id === post.user_id;
      const liked = u && post.likes.includes(u.id);
      setMeta(post.title, post.body.slice(0, 80));
      page.innerHTML = `<div class="page narrow">
        <a class="back" href="#/board">${icon("left")}목록으로</a>
        <article>
          <header class="post-head"><h2>${esc(post.title)}</h2>
            <div class="muted small">${esc(post.author)} · ${date(post.created_at)}${post.updated_at !== post.created_at ? " (수정됨)" : ""} · 조회 ${post.views}</div></header>
          <div class="post-body">${esc(post.body)}</div>
          ${post.images.length ? `<div class="post-images">${post.images.map((src, i) => `<img src="${esc(src)}" alt="첨부 이미지 ${i + 1}" loading="lazy">`).join("")}</div>` : ""}
        </article>
        <hr class="divider">
        <div class="row between">
          <div class="row">
            <button class="btn ${liked ? "is-on" : ""}" data-like aria-pressed="${!!liked}">${icon("heart")}좋아요 <span>${post.likes.length}</span></button>
            <button class="btn ghost" data-share>${icon("share")}공유</button>
          </div>
          ${mine ? `<div class="row"><a class="btn ghost" href="#/board/${post.id}/edit">수정</a><button class="btn danger" data-del>삭제</button></div>` : ""}
        </div></div>`;
      $("[data-share]", page).addEventListener("click", () => share({ title: post.title }));
      $("[data-like]", page).addEventListener("click", (e) => App.requireLogin(async () => {
        const b = e.currentTarget || $("[data-like]", page);
        b.disabled = true;
        try { const r = await API.toggleLike(post.id); b.classList.toggle("is-on", r.liked); b.setAttribute("aria-pressed", r.liked); $("span", b).textContent = r.count; }
        catch (err) { toast(err.message, "error"); }
        b.disabled = false;
      }));
      const del = $("[data-del]", page);
      del && del.addEventListener("click", () => {
        const m = openModal(`<h2>글을 삭제할까요?</h2><p class="muted">삭제한 글은 되돌릴 수 없어요.</p><div class="row end"><button class="btn ghost" data-close>취소</button><button class="btn danger" data-ok>삭제</button></div>`, { label: "삭제 확인" });
        $("[data-ok]", m.el).addEventListener("click", async (ev) => {
          ev.target.disabled = true;
          try { await API.deletePost(post.id); m.close(); toast("글을 삭제했어요"); location.hash = "#/board"; }
          catch (err) { m.close(); toast(err.message, "error"); }
        });
      });
    });
  }

  function form(page, id) {
    if (!API.getUser()) {
      page.innerHTML = `<div class="page narrow">${empty("로그인이 필요해요", "글을 쓰려면 먼저 로그인해 주세요.", `<div class="chips"><button class="btn" data-login>로그인</button></div>`)}</div>`;
      $("[data-login]", page).onclick = () => Views.account.openAuth("login", () => form(page, id));
      return;
    }
    const draw = (post) => {
      const u = API.getUser();
      if (post && post.user_id !== u.id) { page.innerHTML = `<div class="page narrow">${empty("본인 글만 수정할 수 있어요", "")}</div>`; return; }
      setMeta(post ? "글 수정" : "글쓰기");
      page.innerHTML = `<div class="page narrow">
        <a class="back" href="${post ? "#/board/" + post.id : "#/board"}">${icon("left")}${post ? "글로 돌아가기" : "목록으로"}</a>
        <h2>${post ? "글 수정" : "글쓰기"}</h2>
        <form novalidate class="card">
          <div class="form-error" role="alert"></div>
          <label class="field"><span>제목<b class="req">*</b></span><input class="input" name="title" maxlength="80" value="${esc(post ? post.title : "")}" placeholder="제목을 입력해 주세요"><span class="err"></span></label>
          <label class="field"><span>본문<b class="req">*</b></span><textarea class="textarea" name="body" maxlength="5000" placeholder="내용을 입력해 주세요" style="min-height:220px">${esc(post ? post.body : "")}</textarea><span class="err"></span></label>
          <div class="field"><span>이미지 첨부</span><div id="up"></div></div>
          <div class="row end"><a class="btn ghost" href="${post ? "#/board/" + post.id : "#/board"}">취소</a><button class="btn" type="submit">${post ? "수정 완료" : "등록"}</button></div>
        </form></div>`;
      const up = uploader($("#up", page), { max: 5, initial: post ? post.images : [] });
      const f = $("form", page);
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = f.elements.title.value.trim(), body = f.elements.body.value.trim();
        setErr(f, "title", title ? (title.length >= 2 ? "" : "제목은 2자 이상이에요.") : "제목을 입력해 주세요.");
        setErr(f, "body", body ? (body.length >= 5 ? "" : "본문은 5자 이상이에요.") : "본문을 입력해 주세요.");
        if (title.length < 2 || body.length < 5) return focusFirstError(f);
        const btn = $("button[type=submit]", f); btn.disabled = true; btn.textContent = "이미지 올리는 중…";
        try {
          const images = await up.uploadAll();
          btn.textContent = "저장 중…";
          const saved = post ? await API.updatePost(post.id, { title, body, images }) : await API.createPost({ title, body, images });
          toast(post ? "글을 수정했어요" : "글을 등록했어요");
          location.hash = "#/board/" + saved.id;
        } catch (err) { $(".form-error", f).textContent = err.message; btn.disabled = false; btn.textContent = post ? "수정 완료" : "등록"; }
      });
    };
    if (id) withState(page, () => API.getPost(id), draw); else draw(null);
  }

  Views.board = { list, detail, form };
})();
