/* =========================================================
   3-12. 장바구니·주문 — 커머스 흐름 [서버 필요]
   3-11. 쿠폰·할인 — 코드 입력·자동 적용 [서버 필요]
   3-10. 결제 — 카드·간편결제 [배포·결제 필요]
   흐름: 상품 담기 → 장바구니(수량·삭제·선택) → 주문서(배송지·결제수단·쿠폰)
        → 결제창 → 성공/실패 화면
   ========================================================= */
window.Views = window.Views || {};
(function () {
  const { $, $$, esc, icon, toast, won, empty, withState, setMeta, setErr, focusFirstError, valid, phoneMask, openModal } = UI;
  const PICK_KEY = "ss_checkout_pick";
  // 상품 썸네일: 브랜드 사진이 있으면 사진, 없으면 깔끔한 글자 타일
  const thumb = (p, cls = "img") => {
    const src = ((window.BRAND || {}).productPhotos || {})[p.id];
    if (src) return `<div class="${cls}"><img src="${esc(src)}" alt="${esc(p.name)}" loading="lazy"></div>`;
    const word = p.name.replace(/\(.*?\)/g, "").trim().split(/\s+/)[0];
    return `<div class="${cls} type" aria-hidden="true"><span>${esc(word)}</span></div>`;
  };
  const METHODS = [["card", "신용·체크카드"], ["kakaopay", "카카오페이"], ["naverpay", "네이버페이"], ["tosspay", "토스페이"]];

  // ---------- 상품 목록 ----------
  function list(page) {
    setMeta("상점", "1인 기업에 필요한 전자책·템플릿·컨설팅");
    page.innerHTML = `<div class="page"><div class="page-head"><h2>상점</h2><a class="btn ghost" href="#/cart">${icon("cart")}장바구니 보기</a></div><div id="prod"></div></div>`;
    const box = $("#prod", page);
    withState(box, API.listProducts, (items) => {
      if (!items.length) { box.innerHTML = empty("판매 중인 상품이 없어요"); return; }
      box.innerHTML = `<div class="grid products">${items.map((p) => `<article class="product">
        ${thumb(p)}
        <div class="body"><h3>${esc(p.name)}</h3><span class="small muted">${esc(p.desc)}</span>
          <span class="price">${won(p.price)}</span>
          <button class="btn sm" data-add="${p.id}">${icon("cart")}담기</button></div></article>`).join("")}</div>`;
      $$("[data-add]", box).forEach((b) => b.addEventListener("click", async () => {
        b.disabled = true;
        try { await API.addToCart(b.dataset.add, 1); App.refreshCart(); toast("장바구니에 담았어요"); }
        catch (e) { toast(e.message, "error"); }
        b.disabled = false;
      }));
    }, "상품을 불러오는 중…");
  }

  // ---------- 장바구니 ----------
  function cart(page) {
    setMeta("장바구니");
    withState(page, API.getCart, (items) => {
      if (!items.length) {
        page.innerHTML = `<div class="page narrow">${empty("장바구니가 비어 있어요", "마음에 드는 상품을 담아 보세요.", `<div class="chips"><a class="btn" href="#/shop">상점 둘러보기</a></div>`)}</div>`;
        return;
      }
      const picked = new Set(items.map((i) => i.product_id));
      page.innerHTML = `<div class="page"><div class="page-head"><h2>장바구니</h2></div>
        <div class="cart-layout">
          <section>
            <div class="row between" style="padding-bottom:10px;border-bottom:1.5px solid var(--color-text)">
              <label class="check"><input type="checkbox" data-all checked><span>전체 선택</span></label>
              <button class="btn ghost sm" data-del-sel>선택 삭제</button>
            </div>
            <div id="items">${items.map((i) => `<div class="cart-item" data-id="${i.product_id}">
              <input type="checkbox" class="check" data-pick checked aria-label="${esc(i.product.name)} 선택" style="width:18px;height:18px;accent-color:var(--color-primary)">
              ${thumb(i.product)}
              <div><div class="name">${esc(i.product.name)}</div><div class="small muted">${won(i.product.price)}</div></div>
              <div class="right">
                <div class="qty" role="group" aria-label="수량"><button data-minus aria-label="수량 줄이기" ${i.qty <= 1 ? "disabled" : ""}>−</button><span aria-live="polite">${i.qty}</span><button data-plus aria-label="수량 늘리기">+</button></div>
                <div class="row" style="gap:8px"><strong data-line>${won(i.product.price * i.qty)}</strong><button class="icon-btn" data-remove aria-label="${esc(i.product.name)} 삭제">${icon("x")}</button></div>
              </div></div>`).join("")}</div>
          </section>
          <aside class="card summary" aria-label="결제 예정 금액">
            <h3>결제 예정 금액</h3>
            <dl><dt>선택 상품</dt><dd data-cnt></dd><dt>상품 금액</dt><dd data-sub></dd><dt>배송비</dt><dd>무료</dd><dt class="total">합계</dt><dd class="total" data-total></dd></dl>
            <button class="btn block" data-order>선택 상품 주문하기</button>
            <p class="hint">쿠폰은 다음 단계(주문서)에서 적용할 수 있어요.</p>
          </aside></div></div>`;
      const recalc = () => {
        const sel = items.filter((i) => picked.has(i.product_id));
        const sub = sel.reduce((s, i) => s + i.product.price * i.qty, 0);
        $("[data-cnt]", page).textContent = sel.reduce((s, i) => s + i.qty, 0) + "개";
        $("[data-sub]", page).textContent = won(sub); $("[data-total]", page).textContent = won(sub);
        $("[data-order]", page).disabled = !sel.length;
        $("[data-all]", page).checked = sel.length === items.length;
        $("[data-del-sel]", page).disabled = !sel.length;
      };
      recalc();
      $("[data-all]", page).addEventListener("change", (e) => {
        $$("[data-pick]", page).forEach((c) => (c.checked = e.target.checked));
        items.forEach((i) => (e.target.checked ? picked.add(i.product_id) : picked.delete(i.product_id))); recalc();
      });
      $("#items", page).addEventListener("change", (e) => {
        if (!e.target.matches("[data-pick]")) return;
        const id = e.target.closest(".cart-item").dataset.id;
        e.target.checked ? picked.add(id) : picked.delete(id); recalc();
      });
      $("#items", page).addEventListener("click", async (e) => {
        const row = e.target.closest(".cart-item"); if (!row) return;
        const it = items.find((i) => i.product_id === row.dataset.id);
        if (e.target.closest("[data-plus],[data-minus]")) {
          const q = it.qty + (e.target.closest("[data-plus]") ? 1 : -1);
          if (q < 1 || q > 99) return;
          it.qty = q; $(".qty span", row).textContent = q; $("[data-minus]", row).disabled = q <= 1;
          $("[data-line]", row).textContent = won(it.product.price * q); recalc();
          await API.updateCartQty(it.product_id, q); App.refreshCart();
        } else if (e.target.closest("[data-remove]")) {
          await API.removeFromCart([it.product_id]); App.refreshCart(); toast("상품을 뺐어요"); cart(page);
        }
      });
      $("[data-del-sel]", page).addEventListener("click", async () => { await API.removeFromCart([...picked]); App.refreshCart(); toast("선택한 상품을 뺐어요"); cart(page); });
      $("[data-order]", page).addEventListener("click", () => {
        sessionStorage.setItem(PICK_KEY, JSON.stringify([...picked]));
        App.requireLogin(() => (location.hash = "#/checkout"));
      });
    }, "장바구니를 불러오는 중…");
  }

  // ---------- 주문서 ----------
  function checkout(page) {
    setMeta("주문서");
    if (!API.getUser()) {
      page.innerHTML = `<div class="page narrow">${empty("로그인이 필요해요", "주문하려면 먼저 로그인해 주세요.", `<div class="chips"><button class="btn" data-login>로그인</button></div>`)}</div>`;
      $("[data-login]", page).onclick = () => Views.account.openAuth("login", () => checkout(page));
      return;
    }
    let pick = []; try { pick = JSON.parse(sessionStorage.getItem(PICK_KEY)) || []; } catch (e) {}
    withState(page, API.getCart, (all) => {
      const items = all.filter((i) => pick.includes(i.product_id));
      if (!items.length) { page.innerHTML = `<div class="page narrow">${empty("주문할 상품이 없어요", "장바구니에서 상품을 선택해 주세요.", `<div class="chips"><a class="btn" href="#/cart">장바구니로</a></div>`)}</div>`; return; }
      const sub = items.reduce((s, i) => s + i.product.price * i.qty, 0);
      let coupon = null;
      const u = API.getUser();
      page.innerHTML = `<div class="page"><a class="back" href="#/cart">${icon("left")}장바구니로</a><div class="page-head"><h2>주문서</h2></div>
        <form class="cart-layout" novalidate>
          <div class="stack">
            <section class="card"><h3>주문 상품 ${items.length}종</h3>
              <ul class="list">${items.map((i) => `<li><span>${esc(i.product.name)} × ${i.qty}</span><strong>${won(i.product.price * i.qty)}</strong></li>`).join("")}</ul></section>
            <section class="card"><h3>배송지</h3>
              <label class="field"><span>받는 분<b class="req">*</b></span><input class="input" name="receiver" value="${esc(u.nickname)}" autocomplete="name"><span class="err"></span></label>
              <label class="field"><span>연락처<b class="req">*</b></span><input class="input" name="phone" inputmode="numeric" placeholder="010-1234-5678" autocomplete="tel"><span class="err"></span></label>
              <label class="field"><span>주소<b class="req">*</b></span><input class="input" name="address" placeholder="도로명 주소" autocomplete="street-address"><span class="err"></span></label>
              <label class="field"><span>상세 주소</span><input class="input" name="address2" placeholder="동·호수"></label>
              <span class="hint">실서비스에서는 '주소 검색' 버튼(다음 우편번호 서비스, 무료)을 붙이면 편해요.</span></section>
            <section class="card"><h3>결제 수단</h3>
              <fieldset class="radio-cards"><legend class="sr-only">결제 수단</legend>${METHODS.map(([k, l], i) => `<label><input type="radio" name="method" value="${k}" ${i === 0 ? "checked" : ""}>${l}</label>`).join("")}</fieldset></section>
          </div>
          <aside class="card summary">
            <h3>쿠폰</h3>
            <div class="field" style="margin-bottom:8px"><div class="coupon-row"><input class="input" name="coupon" placeholder="쿠폰 코드" aria-label="쿠폰 코드" autocomplete="off"><button type="button" class="btn" data-apply>적용</button></div><span class="err"></span>
            <div data-applied></div>
            <span class="hint">테스트: WELCOME10 · SAVE3000 · OLD2025(만료) · ONCE5000(사용함)</span></div>
            <hr class="divider">
            <dl><dt>상품 금액</dt><dd>${won(sub)}</dd><dt>배송비</dt><dd>무료</dd>
              <dt class="discount" data-dl hidden>쿠폰 할인</dt><dd class="discount" data-dd hidden></dd>
              <dt class="total">최종 결제 금액</dt><dd class="total" data-total>${won(sub)}</dd></dl>
            <label class="check small" style="margin-bottom:14px"><input type="checkbox" name="agree"><span>주문 내용을 확인했으며 결제에 동의해요. (필수)</span></label>
            <span class="err" data-agree-err></span>
            <button class="btn block" type="submit" data-pay>${won(sub)} 결제하기</button>
          </aside></form></div>`;
      const f = $("form", page);
      phoneMask(f.elements.phone);
      const total = () => sub - (coupon ? coupon.discount : 0);
      const paint = () => {
        $("[data-dl]", page).hidden = $("[data-dd]", page).hidden = !coupon;
        if (coupon) $("[data-dd]", page).textContent = "−" + won(coupon.discount);
        $("[data-total]", page).textContent = won(total());
        $("[data-pay]", page).textContent = won(total()) + " 결제하기";
        $("[data-applied]", page).innerHTML = coupon ? `<div class="applied"><span>${esc(coupon.code)} · ${esc(coupon.label)}</span><button type="button" data-remove-coupon>취소</button></div>` : "";
        const rm = $("[data-remove-coupon]", page); rm && rm.addEventListener("click", () => { coupon = null; paint(); toast("쿠폰 적용을 취소했어요"); });
      };
      const apply = async () => {
        const btn = $("[data-apply]", page); btn.disabled = true; btn.textContent = "확인 중";
        try { coupon = await API.validateCoupon(f.elements.coupon.value, sub); setErr(f, "coupon", ""); f.elements.coupon.value = ""; toast(won(coupon.discount) + " 할인이 적용됐어요"); }
        catch (e) { coupon = null; setErr(f, "coupon", e.message); }
        btn.disabled = false; btn.textContent = "적용"; paint();
      };
      $("[data-apply]", page).addEventListener("click", apply);
      f.elements.coupon.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); apply(); } });

      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const v = (n) => f.elements[n].value.trim();
        const errs = {
          receiver: v("receiver") ? "" : "받는 분 이름을 입력해 주세요.",
          phone: valid.phone(v("phone")) ? "" : v("phone") ? "휴대폰 번호 형식이 아니에요." : "연락처를 입력해 주세요.",
          address: v("address").length >= 5 ? "" : "주소를 5자 이상 입력해 주세요."
        };
        Object.entries(errs).forEach(([k, msg]) => setErr(f, k, msg));
        $("[data-agree-err]", page).textContent = f.elements.agree.checked ? "" : "결제 동의에 체크해 주세요.";
        if (Object.values(errs).some(Boolean)) { focusFirstError(f); return; }
        if (!f.elements.agree.checked) { f.elements.agree.focus(); return; }
        const btn = $("[data-pay]", page); btn.disabled = true; btn.textContent = "주문 만드는 중…";
        try {
          const order = await API.createOrder({
            productIds: items.map((i) => i.product_id), couponCode: coupon ? coupon.code : null,
            shipping: { receiver: v("receiver"), phone: v("phone"), address: v("address") + " " + v("address2") },
            method: f.elements.method.value
          });
          // 실제 서버 모드면 토스페이먼츠 결제창으로, 아니면 테스트 결제창으로
          if (API.requestPayment) await API.requestPayment(order); else openPayWindow(order);
        } catch (err) { toast(err.message, "error"); }
        btn.disabled = false; paint();
      });
    }, "주문서를 준비하는 중…");
  }

  // ---------- 결제창 ----------
  // PART 1: 가짜 결제창. PART 2: 토스페이먼츠 SDK의 requestPayment()로 바꿔요 (backend/GUIDE.md 8단계)
  function openPayWindow(order) {
    const label = (METHODS.find((m) => m[0] === order.method) || [])[1];
    let finished = false;
    const m = openModal(`<div class="pg-window">
      <h2>테스트 결제창</h2>
      <p class="muted small">${esc(label)} · 주문번호 ${esc(order.id)}</p>
      <div class="amount">${won(order.total)}</div>
      <div class="stack"><button class="btn block" data-ok>결제 승인 (성공 테스트)</button>
      <button class="btn ghost block" data-fail>결제 실패 테스트</button></div>
      <p class="hint">실제 돈은 나가지 않아요. 진짜 결제창은 PG 연동 후 이 자리에 떠요.</p></div>`, {
      label: "결제창",
      onClose: () => { if (!finished) fail("USER_CANCEL", "결제를 취소했어요."); }
    });
    const fail = async (code, msg) => {
      finished = true;
      await API.failPayment(order.id).catch(() => {});
      location.hash = `#/pay/result?status=fail&order=${order.id}&code=${code}&message=${encodeURIComponent(msg)}`;
    };
    $("[data-ok]", m.el).addEventListener("click", async (e) => {
      e.target.disabled = true; e.target.textContent = "승인 중…";
      try {
        // 서버에서 금액을 다시 확인하고 승인해요 (실서비스: /api/payments/confirm)
        await API.confirmPayment({ orderId: order.id, amount: order.total });
        finished = true; m.close(); App.refreshCart();
        location.hash = `#/pay/result?status=success&order=${order.id}`;
      } catch (err) { finished = true; m.close(); fail("CONFIRM_FAILED", err.message); }
    });
    $("[data-fail]", m.el).addEventListener("click", () => { finished = true; m.close(); fail("CARD_DECLINED", "카드사에서 결제를 거절했어요. 한도나 카드 정보를 확인해 주세요."); });
  }

  // ---------- 결제 결과 ----------
  function result(page, q) {
    const ok = q.get("status") === "success";
    setMeta(ok ? "결제 완료" : "결제 실패");
    if (!ok) {
      page.innerHTML = `<div class="page narrow"><div class="done fail card">${icon("alert")}
        <h2>결제에 실패했어요</h2><p class="muted">${esc(q.get("message") || "다시 시도해 주세요.")}</p>
        <p class="small muted">오류 코드: ${esc(q.get("code") || "-")}</p>
        <div class="row" style="justify-content:center"><a class="btn" href="#/checkout">다시 결제하기</a><a class="btn ghost" href="#/cart">장바구니로</a></div></div></div>`;
      return;
    }
    withState(page, () => API.getOrder(q.get("order")), (o) => {
      page.innerHTML = `<div class="page narrow"><div class="done card">${icon("check")}
        <h2>결제가 완료됐어요</h2><p class="muted">주문해 주셔서 감사해요. 주문 내역은 마이페이지에서 볼 수 있어요.</p>
        <dl><dt>주문번호</dt><dd>${esc(o.id)}</dd><dt>상품</dt><dd>${esc(o.items[0].name)}${o.items.length > 1 ? " 외 " + (o.items.length - 1) + "건" : ""}</dd>
          ${o.discount ? `<dt>할인</dt><dd>−${won(o.discount)}</dd>` : ""}<dt>결제금액</dt><dd>${won(o.total)}</dd><dt>배송지</dt><dd>${esc(o.shipping.address)}</dd></dl>
        <div class="row" style="justify-content:center"><a class="btn" href="#/me?tab=orders">주문 내역 보기</a><a class="btn ghost" href="#/shop">계속 쇼핑하기</a></div></div></div>`;
    });
  }

  Views.shop = { list, cart, checkout, result };
})();
