/* =========================================================
   실제 서버(Supabase) 연결용 API — PART 2
   ---------------------------------------------------------
   js/api.js(가짜)와 "함수 이름·돌려주는 모양"이 똑같아요.
   index.html 에서 api.js 줄을 지우고 이 파일과 supabase-js 를 켜면 끝이에요.

   ✅ 여기에는 "공개용" 값만 써요: SUPABASE_URL, SUPABASE_ANON_KEY
      (anon 키는 원래 공개용이에요. 데이터는 DB의 RLS 규칙이 지켜요)
   ⛔ service_role 키, PG 시크릿 키, Resend 키는 절대 여기에 쓰지 마세요.
      그런 일은 api/ 폴더의 서버 함수가 해요.

   검색 문서(docs)와 매장 목록(stores)은 자주 안 바뀌어서
   계속 js/mock-data.js 에서 읽어요. (그래서 mock-data.js 는 남겨 두세요)
   ========================================================= */
(function () {
  const cfg = (window.APP_CONFIG = window.APP_CONFIG || {});
  const GUEST_CART = "ss_guest_cart_v1";
  let sb = null;          // supabase 클라이언트
  let me = null;          // { id, email, nickname, bio, avatar, created_at }
  let cartCount = 0;
  const authListeners = [], notiListeners = [];

  // ---------- 에러를 한국어로 ----------
  function ko(err) {
    const m = (err && (err.message || err.error_description)) || String(err);
    const map = [
      [/Invalid login credentials/i, "이메일 또는 비밀번호가 맞지 않아요."],
      [/User already registered/i, "이미 가입된 이메일이에요. 로그인해 주세요."],
      [/Email not confirmed/i, "이메일 인증이 아직 안 됐어요. 메일함의 인증 링크를 눌러 주세요."],
      [/Password should be at least/i, "비밀번호는 8자 이상이에요."],
      [/rate limit/i, "요청이 너무 많아요. 잠시 후 다시 시도해 주세요."],
      [/row-level security/i, "권한이 없어요. (본인 것만 바꿀 수 있어요)"],
      [/Failed to fetch|NetworkError/i, "서버에 연결하지 못했어요. 인터넷 연결을 확인해 주세요."],
      [/Payload too large|exceeded the maximum/i, "5MB 이하 이미지만 올릴 수 있어요."]
    ];
    for (const [re, msg] of map) if (re.test(m)) return new Error(msg);
    return new Error(m);
  }
  const must = ({ data, error }) => { if (error) throw ko(error); return data; };
  const need = () => { if (!me) throw new Error("로그인이 필요해요."); return me; };

  // ---------- 시작: 설정 읽기 → 클라이언트 만들기 → 로그인 상태 복구 ----------
  async function init() {
    // 배포(Vercel)에서는 /api/config 가 공개용 값을 내려줘요. 로컬에서는 js/config.js 값을 써요.
    if (!cfg.SUPABASE_URL) {
      try { Object.assign(cfg, await (await fetch("/api/config")).json()); } catch (e) { /* 로컬 */ }
    }
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
      console.error("SUPABASE_URL / SUPABASE_ANON_KEY 가 없어요. backend/GUIDE.md 5단계를 확인해 주세요.");
      return;
    }
    sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    const { data } = await sb.auth.getSession();
    await setUser(data.session && data.session.user);
    sb.auth.onAuthStateChange((_e, session) => {
      const id = session && session.user && session.user.id;
      if ((me && me.id) !== id) setUser(session && session.user).then(emit);
    });
  }
  async function setUser(user) {
    if (!user) { me = null; stopRealtime(); await refreshCartCount(); return; }
    const { data: p } = await sb.from("profiles").select("*").eq("id", user.id).single();
    me = { id: user.id, email: user.email, nickname: p ? p.nickname : user.email, bio: p ? p.bio : "", avatar: p ? p.avatar_url : "", created_at: p ? p.created_at : user.created_at };
    await mergeGuestCart();
    await refreshCartCount();
    startRealtime();
  }
  const emit = () => authListeners.forEach((cb) => cb(me));

  // ---------- 알림 실시간 (Supabase Realtime) ----------
  let channel = null;
  function startRealtime() {
    stopRealtime();
    channel = sb.channel("noti-" + me.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: "user_id=eq." + me.id },
        () => notiListeners.forEach((cb) => cb()))
      .subscribe();
  }
  function stopRealtime() { if (channel) { sb.removeChannel(channel); channel = null; } }

  // ---------- 장바구니: 로그인 전에는 브라우저, 로그인 후에는 DB ----------
  const guestCart = () => { try { return JSON.parse(localStorage.getItem(GUEST_CART)) || []; } catch (e) { return []; } };
  const saveGuest = (c) => localStorage.setItem(GUEST_CART, JSON.stringify(c));
  async function mergeGuestCart() {
    const g = guestCart(); if (!g.length) return;
    for (const c of g) await API.addToCart(c.product_id, c.qty);
    localStorage.removeItem(GUEST_CART);
  }
  async function refreshCartCount() {
    if (!me) { cartCount = guestCart().reduce((s, c) => s + c.qty, 0); return; }
    const rows = must(await sb.from("carts").select("qty"));
    cartCount = rows.reduce((s, c) => s + c.qty, 0);
  }
  let productsCache = null;
  async function products() { if (!productsCache) productsCache = must(await sb.from("products").select("id,name,price,emoji,descr").order("id")).map((p) => ({ ...p, desc: p.descr })); return productsCache; }

  const postOut = (p) => ({ ...p, author: p.profiles ? p.profiles.nickname : "알 수 없음", likes: (p.post_likes || []).map((l) => l.user_id), images: p.images || [] });
  const POST_COLS = "*, profiles:user_id(nickname), post_likes(user_id)";

  const API = {
    mode: "supabase",
    ready: null,

    // --- 인증 (2-4) ---
    getUser: () => me,
    onAuthChange(cb) { authListeners.push(cb); },
    async signUp({ email, password, nickname }) {
      const data = must(await sb.auth.signUp({ email: email.trim(), password, options: { data: { nickname }, emailRedirectTo: location.origin } }));
      if (!data.session) throw new Error("인증 메일을 보냈어요. 메일함에서 링크를 누른 뒤 로그인해 주세요.");
      await setUser(data.user); emit(); return me;
    },
    async signIn({ email, password }) {
      const data = must(await sb.auth.signInWithPassword({ email: email.trim(), password }));
      await setUser(data.user); emit(); return me;
    },
    async signInWithProvider(provider) {   // "kakao" | "google" — Supabase 대시보드에서 켜야 해요
      must(await sb.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin } }));
    },
    async signOut() { await sb.auth.signOut(); await setUser(null); emit(); },

    // --- 프로필 (2-3) ---
    async updateProfile({ nickname, bio, avatar }) {
      const u = need();
      must(await sb.from("profiles").update({ nickname, bio, avatar_url: avatar }).eq("id", u.id));
      Object.assign(me, { nickname, bio, avatar }); emit(); return me;
    },

    // --- 검색 (프론트만) ---
    async getDocs() { return window.MOCK.docs; },

    // --- 이미지 업로드 (2-7) → 공개 URL 반환 ---
    async uploadImage(file) {
      const u = need();
      const safe = file.name.replace(/[^\w.-]/g, "_").slice(-60);
      const path = `${u.id}/${Date.now()}-${safe}`;
      must(await sb.storage.from("uploads").upload(path, file, { contentType: file.type, upsert: false }));
      return sb.storage.from("uploads").getPublicUrl(path).data.publicUrl;
    },

    // --- 게시판 (2-6) ---
    async listPosts({ page = 1, size = 10 } = {}) {
      const { data, error, count } = await sb.from("posts").select("id,title,views,images,created_at,user_id, profiles:user_id(nickname)", { count: "exact" })
        .order("created_at", { ascending: false }).range((page - 1) * size, page * size - 1);
      if (error) throw ko(error);
      return { items: data.map(postOut), total: count || 0 };
    },
    async getPost(id, { countView = false } = {}) {
      if (countView) await sb.rpc("increment_post_views", { p_post_id: id });
      const { data, error } = await sb.from("posts").select(POST_COLS).eq("id", id).maybeSingle();
      if (error) throw ko(error);
      if (!data) throw new Error("글을 찾을 수 없어요. 삭제되었을 수 있어요.");
      return postOut(data);
    },
    async createPost({ title, body, images }) {
      const u = need();
      return must(await sb.from("posts").insert({ user_id: u.id, title, body, images }).select().single());
    },
    async updatePost(id, { title, body, images }) {
      const rows = must(await sb.from("posts").update({ title, body, images, updated_at: new Date().toISOString() }).eq("id", id).select());
      if (!rows.length) throw new Error("본인 글만 수정할 수 있어요.");
      return rows[0];
    },
    async deletePost(id) {
      const rows = must(await sb.from("posts").delete().eq("id", id).select("id"));
      if (!rows.length) throw new Error("본인 글만 삭제할 수 있어요.");
    },
    async toggleLike(id) {
      const u = need();
      const has = must(await sb.from("post_likes").select("post_id").eq("post_id", id).eq("user_id", u.id)).length > 0;
      if (has) must(await sb.from("post_likes").delete().eq("post_id", id).eq("user_id", u.id));
      else must(await sb.from("post_likes").insert({ post_id: id, user_id: u.id }));
      const { count } = await sb.from("post_likes").select("*", { count: "exact", head: true }).eq("post_id", id);
      return { liked: !has, count: count || 0 };
    },
    async listMyPosts() { const u = need(); return must(await sb.from("posts").select("id,title,views,created_at").eq("user_id", u.id).order("created_at", { ascending: false })); },
    async listLikedPosts() {
      const u = need();
      const rows = must(await sb.from("post_likes").select("posts(id,title,created_at, profiles:user_id(nickname))").eq("user_id", u.id).order("created_at", { ascending: false }));
      return rows.filter((r) => r.posts).map((r) => postOut(r.posts));
    },

    // --- 알림 (2-5) ---
    async listNotifications() {
      if (!me) return [];
      return must(await sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(30));
    },
    async markRead(id) { must(await sb.from("notifications").update({ read: true }).eq("id", id)); },
    async markAllRead() { const u = need(); must(await sb.from("notifications").update({ read: true }).eq("user_id", u.id).eq("read", false)); },
    onNotification(cb) { notiListeners.push(cb); },

    // --- 문의 (2-1): 서버 함수가 저장 + 관리자 메일 발송 ---
    async createInquiry(payload) {
      const res = await fetch("/api/inquiry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "문의를 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
      return out;
    },

    // --- 매장 (2-2): 정적 정보 ---
    async listStores() { return window.MOCK.stores; },

    // --- 상품·장바구니 (2-10) ---
    listProducts: () => products(),
    cartCount: () => cartCount,
    async getCart() {
      const list = await products();
      const rows = me ? must(await sb.from("carts").select("product_id,qty")) : guestCart();
      return rows.map((c) => ({ ...c, product: list.find((p) => p.id === c.product_id) })).filter((c) => c.product);
    },
    async addToCart(productId, qty = 1) {
      if (!me) { const g = guestCart(); const c = g.find((x) => x.product_id === productId); if (c) c.qty = Math.min(99, c.qty + qty); else g.push({ product_id: productId, qty }); saveGuest(g); return refreshCartCount(); }
      const cur = must(await sb.from("carts").select("qty").eq("product_id", productId).maybeSingle());
      must(await sb.from("carts").upsert({ user_id: me.id, product_id: productId, qty: Math.min(99, (cur ? cur.qty : 0) + qty) }));
      await refreshCartCount();
    },
    async updateCartQty(productId, qty) {
      qty = Math.max(1, Math.min(99, qty));
      if (!me) { const g = guestCart(); const c = g.find((x) => x.product_id === productId); if (c) c.qty = qty; saveGuest(g); return refreshCartCount(); }
      must(await sb.from("carts").update({ qty }).eq("product_id", productId)); await refreshCartCount();
    },
    async removeFromCart(ids) {
      if (!me) { saveGuest(guestCart().filter((c) => !ids.includes(c.product_id))); return refreshCartCount(); }
      must(await sb.from("carts").delete().in("product_id", ids)); await refreshCartCount();
    },

    // --- 쿠폰 (2-9): DB 함수가 검사 ---
    async validateCoupon(code, subtotal) {
      need();
      if (!(code || "").trim()) throw new Error("쿠폰 코드를 입력해 주세요.");
      const rows = must(await sb.rpc("validate_coupon", { p_code: code, p_subtotal: subtotal }));
      return rows[0];
    },

    // --- 주문·결제 (2-8, 2-10) ---
    async createOrder({ productIds, couponCode, shipping, method }) {
      need();
      const cart = await API.getCart();
      const items = cart.filter((c) => productIds.includes(c.product_id)).map((c) => ({ product_id: c.product_id, qty: c.qty }));
      const o = must(await sb.rpc("create_order", { p_items: items, p_coupon: couponCode || "", p_shipping: shipping, p_method: method }));
      return o;
    },
    // 토스페이먼츠 결제창 띄우기 (shop.js가 이 함수가 있으면 가짜 결제창 대신 이걸 써요)
    async requestPayment(order) {
      if (!cfg.PG_CLIENT_KEY) throw new Error("PG_CLIENT_KEY 가 없어요. backend/GUIDE.md 8단계를 확인해 주세요.");
      if (!window.TossPayments) await new Promise((ok, no) => { const s = document.createElement("script"); s.src = "https://js.tosspayments.com/v2/standard"; s.onload = ok; s.onerror = () => no(new Error("결제 모듈을 불러오지 못했어요.")); document.head.appendChild(s); });
      const toss = window.TossPayments(cfg.PG_CLIENT_KEY);
      const payment = toss.payment({ customerKey: me.id });
      const methodMap = { card: "CARD", kakaopay: "CARD", naverpay: "CARD", tosspay: "CARD" }; // 간편결제는 카드 결제창 안에서 선택돼요
      await payment.requestPayment({
        method: methodMap[order.method] || "CARD",
        amount: { currency: "KRW", value: order.total },
        orderId: order.id,
        orderName: "심플 검색 주문",
        successUrl: location.origin + "/?pay=success",   // 돌아오면 app.js 가 confirmPayment 를 불러요
        failUrl: location.origin + "/?pay=fail"
      });
    },
    // 결제 승인: 반드시 서버가 금액을 다시 확인해요
    async confirmPayment({ orderId, amount, paymentKey }) {
      const { data } = await sb.auth.getSession();
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + (data.session ? data.session.access_token : "") },
        body: JSON.stringify({ orderId, amount, paymentKey })
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || "결제 승인에 실패했어요.");
      await refreshCartCount();
      return out;
    },
    async failPayment() { /* 실패 기록은 서버/PG 쪽에 남아요 */ },
    async getOrder(id) {
      const o = must(await sb.from("orders").select("*, items:order_items(*)").eq("id", id).maybeSingle());
      if (!o) throw new Error("주문을 찾을 수 없어요.");
      return o;
    },
    async listMyOrders() { need(); return must(await sb.from("orders").select("*, items:order_items(*)").order("created_at", { ascending: false })); },

    // --- 예약 (2-11) ---
    async getSlots(date) { return must(await sb.rpc("get_slots", { p_date: date })); },
    async createBooking({ date, time, name, phone, memo }) {
      const b = must(await sb.rpc("create_booking", { p_date: date, p_time: time, p_name: name, p_phone: phone, p_memo: memo || "" }));
      return { ...b, date, time };
    },
    async listMyBookings() {
      need();
      const rows = must(await sb.from("bookings").select("*, slots(date,time)").order("created_at", { ascending: false }));
      return rows.map((b) => ({ ...b, date: b.slots.date, time: b.slots.time.slice(0, 5) }));
    }
  };

  API.ready = init().catch((e) => console.error(e));
  window.API = API;
})();
