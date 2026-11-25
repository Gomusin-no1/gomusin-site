/* =========================================================
   3-2. 문의 폼 — 상담 신청 접수 [서버 필요]
   이름·연락처·문의 내용·개인정보 동의, 필수값 검증, 완료 화면
   스팸 방지: 사람 눈에 안 보이는 "website" 칸(허니팟)
   ========================================================= */
window.Views = window.Views || {};
(function () {
  const { $, esc, icon, setMeta, setErr, focusFirstError, valid, phoneMask, openModal } = UI;

  function show(page) {
    setMeta("상담 신청", "궁금한 점을 남겨 주시면 빠르게 연락드려요.");
    const u = API.getUser();
    page.innerHTML = `<div class="page narrow">
      <div class="page-head"><h2>상담 신청</h2></div>
      <p class="muted">궁금한 점을 남겨 주시면 영업일 기준 1일 안에 연락드려요.</p>
      <form class="card" novalidate>
        <div class="form-error" role="alert"></div>
        <label class="field"><span>이름<b class="req">*</b></span><input class="input" name="name" maxlength="20" autocomplete="name" value="${esc(u ? u.nickname : "")}"><span class="err"></span></label>
        <label class="field"><span>연락처<b class="req">*</b></span><input class="input" name="phone" inputmode="numeric" autocomplete="tel" placeholder="010-1234-5678"><span class="err"></span></label>
        <label class="field"><span>문의 내용<b class="req">*</b></span><textarea class="textarea" name="message" maxlength="1000" placeholder="10자 이상 적어 주세요"></textarea><span class="hint"><span data-count>0</span>/1000자</span><span class="err"></span></label>
        <div class="hp" aria-hidden="true"><label>웹사이트<input name="website" tabindex="-1" autocomplete="off"></label></div>
        <div class="field"><label class="check"><input type="checkbox" name="agree"><span>[필수] 개인정보 수집·이용에 동의해요. <button type="button" class="chip" data-policy style="padding:0 8px;font-size:.78rem">내용 보기</button></span></label><span class="err"></span></div>
        <button class="btn block" type="submit">상담 신청하기</button>
      </form></div>`;
    const f = $("form", page);
    phoneMask(f.elements.phone);
    f.elements.message.addEventListener("input", () => ($("[data-count]", page).textContent = f.elements.message.value.length));
    $("[data-policy]", page).addEventListener("click", (e) => { e.preventDefault(); openModal(`<h2>개인정보 수집·이용 안내</h2>
      <p><strong>수집 항목</strong>: 이름, 연락처, 문의 내용</p><p><strong>목적</strong>: 상담 신청 확인 및 회신</p>
      <p><strong>보관 기간</strong>: 상담 완료 후 1년 (이후 즉시 삭제)</p><p class="muted small">동의하지 않을 수 있으며, 이 경우 상담 신청이 어려워요.</p>
      <div class="row end"><button class="btn" data-close>확인</button></div>`, { label: "개인정보 안내" }); });

    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = { name: f.elements.name.value.trim(), phone: f.elements.phone.value.trim(), message: f.elements.message.value.trim(), agree: f.elements.agree.checked, website: f.elements.website.value };
      const errs = {
        name: v.name ? (v.name.length >= 2 ? "" : "이름은 2자 이상 적어 주세요.") : "이름을 입력해 주세요.",
        phone: v.phone ? (valid.phone(v.phone) ? "" : "휴대폰 번호 형식이 아니에요. 예) 010-1234-5678") : "연락처를 입력해 주세요.",
        message: v.message ? (v.message.length >= 10 ? "" : "문의 내용을 10자 이상 적어 주세요.") : "문의 내용을 입력해 주세요.",
        agree: v.agree ? "" : "개인정보 수집·이용에 동의해야 신청할 수 있어요."
      };
      Object.entries(errs).forEach(([k, m]) => setErr(f, k, m));
      if (Object.values(errs).some(Boolean)) return focusFirstError(f);
      const btn = $("button[type=submit]", f); btn.disabled = true; btn.textContent = "보내는 중…";
      $(".form-error", f).textContent = "";
      try {
        await API.createInquiry(v);
        page.innerHTML = `<div class="page narrow"><div class="done card">${icon("check")}
          <h2>상담 신청이 접수됐어요</h2>
          <p class="muted">${esc(v.name)}님, 남겨 주신 연락처로 영업일 기준 1일 안에 연락드릴게요.</p>
          <dl><dt>이름</dt><dd>${esc(v.name)}</dd><dt>연락처</dt><dd>${esc(v.phone)}</dd></dl>
          <div class="row" style="justify-content:center"><a class="btn" href="#/">홈으로</a><button class="btn ghost" data-again>한 번 더 문의하기</button></div></div></div>`;
        $("[data-again]", page).addEventListener("click", () => show(page));
      } catch (err) {
        $(".form-error", f).textContent = err.message + " 입력한 내용은 그대로 있어요.";
        btn.disabled = false; btn.textContent = "상담 신청하기";
      }
    });
  }

  Views.contact = { show };
})();
