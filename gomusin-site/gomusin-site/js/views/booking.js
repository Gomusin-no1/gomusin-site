/* =========================================================
   3-13. 예약·캘린더 — 날짜·시간 선택 [서버 필요]
   달력에서 날짜 → 가능한 시간 버튼(찬 시간은 비활성) → 정보 입력 → 완료
   일요일과 지난 날짜, 60일 이후는 선택할 수 없어요.
   ========================================================= */
window.Views = window.Views || {};
(function () {
  const { $, $$, esc, icon, setMeta, setErr, focusFirstError, valid, phoneMask, empty, errorState, loading } = UI;
  const DOW = ["일", "월", "화", "수", "목", "금", "토"];
  const ymd = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const MAX_DAYS = 60;

  function show(page) {
    setMeta("상담 예약", "원하는 날짜와 시간을 골라 상담을 예약하세요.");
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const last = new Date(today); last.setDate(last.getDate() + MAX_DAYS);
    const state = { month: new Date(today.getFullYear(), today.getMonth(), 1), date: null, time: null };
    const u = API.getUser();

    page.innerHTML = `<div class="page"><div class="page-head"><h2>상담 예약</h2></div>
      <div class="booking-layout">
        <section class="card" aria-label="날짜 선택">
          <div class="cal-head"><button class="icon-btn" data-prev aria-label="이전 달">${icon("left")}</button><strong data-title aria-live="polite"></strong><button class="icon-btn" data-next aria-label="다음 달">${icon("right")}</button></div>
          <div class="cal" data-cal></div>
          <p class="hint">일요일은 쉬어요. 오늘부터 ${MAX_DAYS}일 안의 날짜만 예약할 수 있어요.</p>
        </section>
        <section class="card" aria-label="시간 선택">
          <h3 data-date-title>날짜를 먼저 골라 주세요</h3>
          <div data-slots>${empty("달력에서 날짜를 선택하면", "예약 가능한 시간이 여기에 나와요.")}</div>
          <form data-form hidden novalidate>
            <hr class="divider">
            <div class="form-error" role="alert"></div>
            <label class="field"><span>예약자 이름<b class="req">*</b></span><input class="input" name="name" value="${esc(u ? u.nickname : "")}" autocomplete="name"><span class="err"></span></label>
            <label class="field"><span>연락처<b class="req">*</b></span><input class="input" name="phone" inputmode="numeric" placeholder="010-1234-5678" autocomplete="tel"><span class="err"></span></label>
            <label class="field"><span>요청 사항</span><textarea class="textarea" name="memo" style="min-height:80px" maxlength="300"></textarea></label>
            <button class="btn block" type="submit" data-submit>예약하기</button>
          </form>
        </section></div></div>`;

    const cal = $("[data-cal]", page);
    function drawCal() {
      const y = state.month.getFullYear(), m = state.month.getMonth();
      $("[data-title]", page).textContent = y + "년 " + (m + 1) + "월";
      $("[data-prev]", page).disabled = y === today.getFullYear() && m === today.getMonth();
      $("[data-next]", page).disabled = new Date(y, m + 1, 1) > last;
      const first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
      let html = DOW.map((d) => `<div class="dow">${d}</div>`).join("") + "<div></div>".repeat(first);
      for (let d = 1; d <= days; d++) {
        const dt = new Date(y, m, d), key = ymd(dt);
        const off = dt < today || dt > last || dt.getDay() === 0;
        html += `<button type="button" data-d="${key}" ${off ? "disabled" : ""} class="${+dt === +today ? "today" : ""}" aria-pressed="${state.date === key}" aria-label="${m + 1}월 ${d}일${off ? " 예약 불가" : ""}">${d}</button>`;
      }
      cal.innerHTML = html;
    }
    async function drawSlots() {
      const box = $("[data-slots]", page);
      const [, mm, dd] = state.date.split("-");
      $("[data-date-title]", page).textContent = +mm + "월 " + +dd + "일 시간 선택";
      box.innerHTML = loading("예약 가능한 시간을 확인하는 중…");
      $("[data-form]", page).hidden = true;
      try {
        let slots = await API.getSlots(state.date);
        // 오늘이면 이미 지난 시간도 막아요
        if (state.date === ymd(new Date())) { const h = new Date().getHours(); slots = slots.map((s) => (parseInt(s.time) <= h ? { ...s, left: 0, past: true } : s)); }
        const open = slots.filter((s) => s.left > 0).length;
        box.innerHTML = `<div class="legend"><span>남은 시간 ${open}개</span><span>회색 = 마감</span></div>` + (open
          ? `<div class="slots">${slots.map((s) => `<button type="button" class="btn ${state.time === s.time ? "is-on" : ""}" data-t="${s.time}" ${s.left > 0 ? "" : "disabled"} aria-pressed="${state.time === s.time}">${s.time}<small>${s.left > 0 ? "예약 가능" : s.past ? "지난 시간" : "마감"}</small></button>`).join("")}</div>`
          : empty("이 날은 모두 마감됐어요", "다른 날짜를 선택해 주세요."));
      } catch (e) {
        box.innerHTML = errorState(e.message); $("[data-retry]", box).onclick = drawSlots;
      }
    }
    cal.addEventListener("click", (e) => {
      const b = e.target.closest("[data-d]"); if (!b || b.disabled) return;
      state.date = b.dataset.d; state.time = null; drawCal(); drawSlots();
    });
    $("[data-prev]", page).addEventListener("click", () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); drawCal(); });
    $("[data-next]", page).addEventListener("click", () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); drawCal(); });
    $("[data-slots]", page).addEventListener("click", (e) => {
      const b = e.target.closest("[data-t]"); if (!b || b.disabled) return;
      state.time = b.dataset.t;
      $$("[data-t]", page).forEach((x) => { const on = x === b; x.classList.toggle("is-on", on); x.setAttribute("aria-pressed", on); });
      const f = $("[data-form]", page); f.hidden = false;
      $("[data-submit]", page).textContent = state.date + " " + state.time + " 예약하기";
      f.elements.name.focus();
    });

    const f = $("[data-form]", page);
    phoneMask(f.elements.phone);
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = f.elements.name.value.trim(), phone = f.elements.phone.value.trim();
      setErr(f, "name", name.length >= 2 ? "" : "이름을 2자 이상 입력해 주세요.");
      setErr(f, "phone", valid.phone(phone) ? "" : phone ? "휴대폰 번호 형식이 아니에요." : "연락처를 입력해 주세요.");
      if (name.length < 2 || !valid.phone(phone)) return focusFirstError(f);
      const btn = $("[data-submit]", page); btn.disabled = true; btn.textContent = "예약 중…";
      try {
        const b = await API.createBooking({ date: state.date, time: state.time, name, phone, memo: f.elements.memo.value.trim() });
        page.innerHTML = `<div class="page narrow"><div class="done card">${icon("check")}
          <h2>예약이 완료됐어요</h2><p class="muted">예약 시간 10분 전까지 와 주세요. 변경은 문의하기로 알려 주세요.</p>
          <dl><dt>날짜</dt><dd>${esc(b.date)}</dd><dt>시간</dt><dd>${esc(b.time)}</dd><dt>예약자</dt><dd>${esc(b.name)}</dd><dt>연락처</dt><dd>${esc(b.phone)}</dd></dl>
          <div class="row" style="justify-content:center"><a class="btn" href="#/">홈으로</a>${API.getUser() ? `<a class="btn ghost" href="#/me?tab=bookings">내 예약 보기</a>` : ""}</div></div></div>`;
        window.scrollTo(0, 0);
      } catch (err) {
        $(".form-error", f).textContent = err.message;
        btn.disabled = false; btn.textContent = "예약하기";
        drawSlots(); // 방금 찬 시간을 다시 반영
      }
    });
    drawCal();
  }

  Views.booking = { show };
})();
