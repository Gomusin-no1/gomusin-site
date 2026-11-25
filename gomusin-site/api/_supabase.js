// 서버 전용 도우미: service_role 키로 Supabase에 접근해요. (RLS를 건너뛰는 관리자 키라서 서버에서만!)
// 파일 이름이 _ 로 시작하면 Vercel이 주소로 공개하지 않아요.
const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function db(path, { method = "GET", body, prefer } = {}) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error((data && data.message) || `DB 오류 (${res.status})`);
  return data;
}

// 화면이 보낸 로그인 토큰으로 "누구인지" 확인해요
async function getUser(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer /, "");
  if (!token) return null;
  const res = await fetch(`${URL}/auth/v1/user`, { headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
  return res.ok ? res.json() : null;
}

module.exports = { db, getUser };
