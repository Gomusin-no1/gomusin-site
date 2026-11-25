// GET /api/config — 화면에 필요한 "공개용" 값만 내려줘요.
// ⛔ 여기에 SUPABASE_SERVICE_ROLE_KEY, PG_SECRET_KEY, RESEND_API_KEY 를 절대 넣지 마세요.
module.exports = (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json({
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
    KAKAO_MAP_KEY: process.env.KAKAO_MAP_KEY || "",
    PG_CLIENT_KEY: process.env.PG_CLIENT_KEY || ""
  });
};
