// POST /api/payments/confirm — 2-8 결제 승인 (토스페이먼츠)
// 1) 로그인한 사람의 주문인지 확인  2) 주문 금액과 결제 금액이 같은지 "서버에서" 확인
// 3) 토스에 승인 요청(시크릿 키 사용)  4) 주문 상태·쿠폰 사용·장바구니·알림 처리
const { db, getUser } = require("../_supabase");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 받아요." });
  const { paymentKey, orderId, amount } = req.body || {};
  if (!paymentKey || !orderId || !amount) return res.status(400).json({ error: "결제 정보가 빠졌어요." });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "로그인이 필요해요." });

  try {
    const [order] = await db(`orders?id=eq.${encodeURIComponent(orderId)}&select=*,order_items(product_id)`);
    if (!order || order.user_id !== user.id) return res.status(404).json({ error: "주문을 찾을 수 없어요." });
    if (order.status === "결제완료") return res.status(200).json(order);               // 새로고침해도 두 번 승인 안 함
    if (order.total !== Number(amount)) return res.status(400).json({ error: "결제 금액이 주문 금액과 달라요." }); // ← 금액 조작 차단

    // 토스페이먼츠 승인 API (시크릿 키는 Basic 인증, 뒤에 ':' 붙여서 base64)
    const auth = Buffer.from(process.env.PG_SECRET_KEY + ":").toString("base64");
    const r = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount: order.total })
    });
    const pay = await r.json();
    if (!r.ok) {
      await db(`orders?id=eq.${orderId}`, { method: "PATCH", body: { status: "결제실패" } });
      return res.status(400).json({ error: pay.message || "결제 승인에 실패했어요.", code: pay.code });
    }

    const [paid] = await db(`orders?id=eq.${orderId}`, { method: "PATCH", body: { status: "결제완료", payment_key: paymentKey, paid_at: new Date().toISOString() }, prefer: "return=representation" });
    if (order.coupon_code) await db("coupon_uses", { method: "POST", body: { code: order.coupon_code, user_id: user.id, order_id: orderId } }).catch(() => {});
    const ids = order.order_items.map((i) => `"${i.product_id}"`).join(",");
    if (ids) await db(`carts?user_id=eq.${user.id}&product_id=in.(${ids})`, { method: "DELETE" });
    await db("notifications", { method: "POST", body: { user_id: user.id, type: "order", message: `주문이 완료됐어요. 결제금액 ${order.total.toLocaleString("ko-KR")}원`, link: "#/me?tab=orders" } });
    return res.status(200).json(paid);
  } catch (e) {
    return res.status(500).json({ error: "결제 처리 중 문제가 생겼어요. 고객센터로 문의해 주세요." });
  }
};
