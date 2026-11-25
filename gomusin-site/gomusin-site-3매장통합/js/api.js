/* =========================================================
   가짜 API (PART 1 전용)
   ---------------------------------------------------------
   화면 코드는 오직 window.API 의 함수만 불러요.
   PART 2에서는 이 파일 대신 js/api-supabase.js 를 넣으면
   "같은 이름의 함수"가 실제 서버와 통신해요. 화면 코드는 그대로예요.

   데이터는 이 브라우저의 localStorage 에만 저장돼요.
   주소 끝에 ?mockError=1 을 붙이면 일부러 에러를 내서
   "에러 화면"을 확인할 수 있어요.
   ========================================================= */
(function () {
  const DB_KEY = "ss_db_v1";
  const SESSION_KEY = "ss_session_v1";
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const uid = (p) => p + Math.random().toString(36).slice(2, 9);
  const now = () => new Date().toISOString();
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const failMode = /[?&]mockError=1/.test(location.search);

  function load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* 저장소를 못 쓰면 새로 시작 */ }
    const m = clone(window.MOCK);
    return {
      users: m.users, posts: m.posts, notifications: m.notifications, orders: m.orders,
      couponUses: m.couponUses, inquiries: [], bookings: seedBookings(), cart: []
    };
  }
  // 예약이 일부 찬 상태를 흉내내요 (오늘부터 2주 동안 몇 칸)
  function seedBookings() {
    const list = [];
    const t = window.MOCK.slotTimes;
    for (let d = 0; d < 21; d++) {
      const day = new Date(); day.setDate(day.getDate() + d);
      const key = ymd(day);
      t.forEach((time, i) => { if ((d * 3 + i * 5) % 7 === 0) list.push({ id: uid("b"), user_id: "u2", date: key, time, name: "예약자", phone: "010-0000-0000", status: "확정" }); });
    }
    return list;
  }
  function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }

  let db = load();
  function save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
    catch (e) { throw new Error("브라우저 저장 공간이 가득 찼어요. 이미지 수를 줄여 주세요."); }
  }

  // 모든 호출은 서버처럼 약간 기다린 뒤 응답해요 (로딩 화면 확인용)
  async function call(fn, ms = 350) {
    await wait(ms);
    if (failMode) throw new Error("서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
    return fn();
  }

  // ---------- 로그인 ----------
  const listeners = [];
  function getSessionSync() {
    try { const id = localStorage.getItem(SESSION_KEY); return db.users.find((u) => u.id === id) || null; } catch (e) { return null; }
  }
  function publicUser(u) { if (!u) return null; const { password, ...rest } = u; return rest; }
  function emit() { const u = publicUser(getSessionSync()); listeners.forEach((cb) => cb(u)); }
  function me() { const u = getSessionSync(); if (!u) throw new Error("로그인이 필요해요."); return u; }

  const API = {
    mode: "mock",

    // --- 인증 ---
    getUser() { return publicUser(getSessionSync()); },
    onAuthChange(cb) { listeners.push(cb); },
    signUp({ email, password, nickname }) {
      return call(() => {
        email = email.trim().toLowerCase();
        if (db.users.some((u) => u.email === email)) throw new Error("이미 가입된 이메일이에요. 로그인해 주세요.");
        const u = { id: uid("u"), email, password, nickname: nickname || email.split("@")[0], bio: "", avatar: "", created_at: now() };
        db.users.push(u);
        db.notifications.push({ id: uid("n"), user_id: u.id, type: "system", message: "회원가입을 환영해요! 첫 구매 쿠폰 WELCOME10 을 써 보세요.", read: false, link: "#/shop", created_at: now() });
        save(); localStorage.setItem(SESSION_KEY, u.id); emit();
        return publicUser(u);
      }, 500);
    },
    signIn({ email, password }) {
      return call(() => {
        const u = db.users.find((x) => x.email === email.trim().toLowerCase());
        if (!u || u.password !== password) throw new Error("이메일 또는 비밀번호가 맞지 않아요.");
        localStorage.setItem(SESSION_KEY, u.id); emit();
        return publicUser(u);
      }, 500);
    },
    signInWithProvider(provider) {
      return call(() => { throw new Error((provider === "kakao" ? "카카오" : "구글") + " 로그인은 PART 2에서 Supabase와 연결하면 사용할 수 있어요. 지금은 이메일로 로그인해 주세요."); });
    },
    signOut() { return call(() => { localStorage.removeItem(SESSION_KEY); emit(); }, 150); },

    // --- 프로필 (마이페이지) ---
    updateProfile({ nickname, bio, avatar }) {
      return call(() => {
        const u = me();
        if (nickname !== undefined) u.nickname = nickname;
        if (bio !== undefined) u.bio = bio;
        if (avatar !== undefined) u.avatar = avatar;
        save(); emit();
        return publicUser(u);
      });
    },
    getNickname(userId) { const u = db.users.find((x) => x.id === userId); return u ? u.nickname : "알 수 없음"; },

    // --- 검색 ---
    getDocs() { return call(() => clone(window.MOCK.docs), 200); },

    // --- 이미지 업로드 (가짜: 작게 줄인 이미지를 브라우저에 저장) ---
    uploadImage(file, { max = 1200 } = {}) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("이미지를 읽지 못했어요."));
        reader.onload = () => {
          const img = new Image();
          img.onerror = () => reject(new Error("이미지 파일이 손상됐어요."));
          img.onload = () => {
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            const c = document.createElement("canvas");
            c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
            c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
            call(() => c.toDataURL("image/jpeg", 0.8), 400).then(resolve, reject);
          };
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
    },

    // --- 게시판 ---
    listPosts({ page = 1, size = 10 } = {}) {
      return call(() => {
        const all = db.posts.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
        const items = all.slice((page - 1) * size, page * size).map((p) => ({ ...clone(p), author: API.getNickname(p.user_id) }));
        return { items, total: all.length };
      });
    },
    getPost(id, { countView = false } = {}) {
      return call(() => {
        const p = db.posts.find((x) => x.id === id);
        if (!p) throw Object.assign(new Error("글을 찾을 수 없어요. 삭제되었을 수 있어요."), { code: 404 });
        if (countView) { p.views++; save(); }
        return { ...clone(p), author: API.getNickname(p.user_id) };
      });
    },
    createPost({ title, body, images }) {
      return call(() => {
        const u = me();
        const p = { id: uid("p"), user_id: u.id, title, body, images: images || [], views: 0, likes: [], created_at: now(), updated_at: now() };
        db.posts.push(p); save();
        return clone(p);
      }, 500);
    },
    updatePost(id, { title, body, images }) {
      return call(() => {
        const u = me(); const p = db.posts.find((x) => x.id === id);
        if (!p) throw new Error("글을 찾을 수 없어요.");
        if (p.user_id !== u.id) throw new Error("본인 글만 수정할 수 있어요.");
        Object.assign(p, { title, body, images, updated_at: now() }); save();
        return clone(p);
      }, 500);
    },
    deletePost(id) {
      return call(() => {
        const u = me(); const p = db.posts.find((x) => x.id === id);
        if (!p || p.user_id !== u.id) throw new Error("본인 글만 삭제할 수 있어요.");
        db.posts = db.posts.filter((x) => x.id !== id); save();
      });
    },
    toggleLike(id) {
      return call(() => {
        const u = me(); const p = db.posts.find((x) => x.id === id);
        const i = p.likes.indexOf(u.id);
        if (i >= 0) p.likes.splice(i, 1); else p.likes.push(u.id);
        save(); return { liked: i < 0, count: p.likes.length };
      }, 150);
    },
    listMyPosts() { return call(() => { const u = me(); return clone(db.posts.filter((p) => p.user_id === u.id)).sort((a, b) => b.created_at.localeCompare(a.created_at)); }); },
    listLikedPosts() { return call(() => { const u = me(); return clone(db.posts.filter((p) => p.likes.includes(u.id))).map((p) => ({ ...p, author: API.getNickname(p.user_id) })); }); },

    // --- 알림 ---
    listNotifications() {
      return call(() => { const u = getSessionSync(); if (!u) return []; return clone(db.notifications.filter((n) => n.user_id === u.id)).sort((a, b) => b.created_at.localeCompare(a.created_at)); }, 200);
    },
    markRead(id) { return call(() => { const n = db.notifications.find((x) => x.id === id); if (n) { n.read = true; save(); } }, 100); },
    markAllRead() { return call(() => { const u = me(); db.notifications.forEach((n) => { if (n.user_id === u.id) n.read = true; }); save(); }, 150); },
    _notify(userId, type, message, link) { db.notifications.push({ id: uid("n"), user_id: userId, type, message, read: false, link, created_at: now() }); save(); notiListeners.forEach((cb) => cb()); },
    onNotification(cb) { notiListeners.push(cb); },

    // --- 문의 ---
    createInquiry({ name, phone, message, agree, website }) {
      return call(() => {
        if (website) return { id: "ignored" }; // 허니팟: 봇이면 조용히 무시
        if (!agree) throw new Error("개인정보 수집에 동의해 주세요.");
        const q = { id: uid("q"), name, phone, message, created_at: now() };
        db.inquiries.push(q); save();
        return q;
      }, 700);
    },

    // --- 매장 ---
    listStores() { return call(() => clone(window.MOCK.stores), 200); },

    // --- 상품·장바구니 ---
    listProducts() { return call(() => clone(window.MOCK.products), 250); },
    getCart() {
      return call(() => db.cart.map((c) => ({ ...c, product: window.MOCK.products.find((p) => p.id === c.product_id) })).filter((c) => c.product), 150);
    },
    cartCount() { return db.cart.reduce((s, c) => s + c.qty, 0); },
    addToCart(productId, qty = 1) {
      return call(() => { const c = db.cart.find((x) => x.product_id === productId); if (c) c.qty = Math.min(99, c.qty + qty); else db.cart.push({ product_id: productId, qty }); save(); }, 150);
    },
    updateCartQty(productId, qty) {
      return call(() => { const c = db.cart.find((x) => x.product_id === productId); if (c) c.qty = Math.max(1, Math.min(99, qty)); save(); }, 100);
    },
    removeFromCart(productIds) { return call(() => { db.cart = db.cart.filter((c) => !productIds.includes(c.product_id)); save(); }, 150); },

    // --- 쿠폰 ---
    // 실제 서비스에서는 서버가 다시 검사해요. 화면 검사는 안내용이에요.
    validateCoupon(code, subtotal) {
      return call(() => {
        code = (code || "").trim().toUpperCase();
        if (!code) throw new Error("쿠폰 코드를 입력해 주세요.");
        const c = window.MOCK.coupons.find((x) => x.code === code);
        if (!c) throw new Error("존재하지 않는 쿠폰 코드예요.");
        if (new Date(c.expires_at) < new Date()) throw new Error("기간이 만료된 쿠폰이에요.");
        if (subtotal < c.min_order) throw new Error(c.min_order.toLocaleString() + "원 이상 주문할 때 쓸 수 있어요. (현재 " + subtotal.toLocaleString() + "원)");
        const u = getSessionSync();
        if (u && db.couponUses.some((x) => x.code === code && x.user_id === u.id)) throw new Error("이미 사용한 쿠폰이에요.");
        const discount = c.type === "rate" ? Math.floor(subtotal * c.amount / 100) : Math.min(c.amount, subtotal);
        return { code, label: c.label, discount };
      }, 300);
    },

    // --- 주문·결제 ---
    createOrder({ productIds, couponCode, shipping, method }) {
      return call(async () => {
        const u = me();
        const items = db.cart.filter((c) => productIds.includes(c.product_id)).map((c) => {
          const p = window.MOCK.products.find((x) => x.id === c.product_id);
          return { product_id: p.id, name: p.name, qty: c.qty, price: p.price };
        });
        if (!items.length) throw new Error("결제할 상품을 선택해 주세요.");
        const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
        let discount = 0;
        if (couponCode) { const v = await API.validateCoupon(couponCode, subtotal); discount = v.discount; }
        const o = { id: uid("o"), user_id: u.id, items, subtotal, discount, total: subtotal - discount, coupon: couponCode || null, shipping, method, status: "결제대기", created_at: now() };
        db.orders.push(o); save();
        return clone(o);
      }, 400);
    },
    // 진짜 결제에서는 서버(/api/payments/confirm)가 금액을 다시 확인하고 승인해요
    confirmPayment({ orderId, amount }) {
      return call(() => {
        const o = db.orders.find((x) => x.id === orderId);
        if (!o) throw new Error("주문을 찾을 수 없어요.");
        if (o.total !== amount) throw new Error("결제 금액이 주문 금액과 달라요.");
        o.status = "결제완료"; o.paid_at = now();
        if (o.coupon) db.couponUses.push({ code: o.coupon, user_id: o.user_id, order_id: o.id });
        db.cart = db.cart.filter((c) => !o.items.some((i) => i.product_id === c.product_id));
        save();
        API._notify(o.user_id, "order", "주문이 완료됐어요. 결제금액 " + o.total.toLocaleString() + "원", "#/me?tab=orders");
        return clone(o);
      }, 800);
    },
    failPayment(orderId) { return call(() => { const o = db.orders.find((x) => x.id === orderId); if (o) { o.status = "결제실패"; save(); } }, 200); },
    getOrder(id) { return call(() => { const o = db.orders.find((x) => x.id === id); if (!o) throw new Error("주문을 찾을 수 없어요."); return clone(o); }, 200); },
    listMyOrders() { return call(() => { const u = me(); return clone(db.orders.filter((o) => o.user_id === u.id)).sort((a, b) => b.created_at.localeCompare(a.created_at)); }); },

    // --- 예약 ---
    getSlots(date) {
      return call(() => window.MOCK.slotTimes.map((time) => {
        const used = db.bookings.filter((b) => b.date === date && b.time === time && b.status !== "취소").length;
        return { time, left: Math.max(0, window.MOCK.slotCapacity - used) };
      }), 300);
    },
    createBooking({ date, time, name, phone, memo }) {
      return call(() => {
        const used = db.bookings.filter((b) => b.date === date && b.time === time && b.status !== "취소").length;
        if (used >= window.MOCK.slotCapacity) throw new Error("방금 다른 분이 예약했어요. 다른 시간을 골라 주세요.");
        const u = getSessionSync();
        const b = { id: uid("b"), user_id: u ? u.id : null, date, time, name, phone, memo, status: "확정", created_at: now() };
        db.bookings.push(b); save();
        if (u) API._notify(u.id, "booking", "예약이 확정됐어요: " + date + " " + time, "#/me?tab=bookings");
        return clone(b);
      }, 600);
    },
    listMyBookings() { return call(() => { const u = me(); return clone(db.bookings.filter((b) => b.user_id === u.id)).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)); }); },

    // 테스트 데이터 초기화
    resetAll() { localStorage.removeItem(DB_KEY); localStorage.removeItem(SESSION_KEY); location.reload(); }
  };
  const notiListeners = [];
  window.API = API;
})();
