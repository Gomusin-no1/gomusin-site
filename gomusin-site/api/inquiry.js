// POST /api/inquiry — 2-1 문의 폼: 검사 → inquiries 저장 → 관리자에게 메일(Resend)
const { db } = require("./_supabase");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST만 받아요." });
  const { name = "", phone = "", message = "", agree, website } = req.body || {};

  // 스팸 방지 허니팟: 사람에겐 안 보이는 칸이 채워져 있으면 봇이에요. 성공한 척하고 무시.
  if (website) return res.status(200).json({ ok: true });

  if (!agree) return res.status(400).json({ error: "개인정보 수집·이용에 동의해 주세요." });
  if (name.trim().length < 2) return res.status(400).json({ error: "이름을 2자 이상 입력해 주세요." });
  if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.trim())) return res.status(400).json({ error: "휴대폰 번호 형식이 아니에요." });
  if (message.trim().length < 10) return res.status(400).json({ error: "문의 내용을 10자 이상 적어 주세요." });

  try {
    const [row] = await db("inquiries", { method: "POST", body: { name: name.trim(), phone: phone.trim(), message: message.trim() }, prefer: "return=representation" });

    // 관리자 알림 메일 (RESEND_API_KEY 가 있을 때만)
    if (process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.MAIL_FROM || "onboarding@resend.dev",
          to: process.env.ADMIN_EMAIL,
          subject: `[상담 신청] ${name.trim()}님`,
          text: `이름: ${name}\n연락처: ${phone}\n\n${message}`
        })
      }).catch(() => {}); // 메일이 실패해도 문의 저장은 성공으로 처리
    }
    return res.status(200).json({ ok: true, id: row.id });
  } catch (e) {
    return res.status(500).json({ error: "문의를 저장하지 못했어요. 잠시 후 다시 시도해 주세요." });
  }
};
