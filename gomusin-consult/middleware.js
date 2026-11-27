/* 직원 로그인 (Vercel 서버에서 확인 · 로그인 전에는 화면 · 자료 · 코드가 하나도 안 나가요)
   비밀번호 바꾸기: PIN_HASH 를 sha256(SALT + 새 비밀번호) 로 바꾸면 모든 기기가 다시 로그인해요. */
export const config = { matcher: '/((?!robots\\.txt|favicon\\.ico).*)' };
const SALT = 'f62f54b81b92b6076783c69a7c5ac294';
const PIN_HASH = 'a68e8a812a17469e60cec0a21a9a8353192427f1de345a626637075d1fa64f1c';
const COOKIE = 'gms_k';
const OPEN = ['/manifest.webmanifest', '/robots.txt'];
async function sha(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
function getCookie(req, k) { const c = req.headers.get('cookie') || ''; const m = c.match(new RegExp('(?:^|;\\s*)' + k + '=([^;]+)')); return m ? m[1] : ''; }
const SEC = { 'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
function page(msg) {
  const html = '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noai,noimageai"><title>고무신 상담</title><meta name="theme-color" content="#0E1424"><link rel="apple-touch-icon" href="/assets/icons/apple-180.png">' +
    '<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0E1424;font-family:-apple-system,BlinkMacSystemFont,"Pretendard","Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#fff;padding:16px}' +
    '.b{width:100%;max-width:360px;background:#161E33;border:1px solid #2A3550;border-radius:18px;padding:28px 22px;text-align:center}h1{font-size:20px;margin:0 0 6px}p{margin:0 0 18px;color:#9AA6C2;font-size:14px}' +
    'input{width:100%;height:52px;border-radius:12px;border:1px solid #2A3550;background:#0E1424;color:#fff;font-size:22px;text-align:center;letter-spacing:.2em}button{margin-top:12px;width:100%;height:52px;border:0;border-radius:12px;background:#D4A24C;color:#111;font-size:17px;font-weight:800}.e{color:#FF7A8A;margin-top:12px;font-size:14px;min-height:18px}</style></head>' +
    '<body><form class="b" method="post" action="/__login"><h1>고무신 상담</h1><p>직원 비밀번호를 넣어주세요</p><input name="pin" type="password" inputmode="numeric" autocomplete="current-password" autofocus required><button>들어가기</button><div class="e">' + (msg || '') + '</div></form></body></html>';
  return new Response(html, { status: 401, headers: { ...SEC, 'Content-Type': 'text/html; charset=utf-8' } });
}
export default async function middleware(req) {
  const url = new URL(req.url);
  const token = await sha(PIN_HASH + ':session');
  if (url.pathname === '/__login' && req.method === 'POST') {
    await new Promise((r) => setTimeout(r, 600));
    let pin = '';
    try { const f = await req.formData(); pin = String(f.get('pin') || '').trim(); } catch (e) {}
    if (pin && (await sha(SALT + pin)) === PIN_HASH) {
      return new Response(null, { status: 303, headers: { Location: '/', 'Set-Cookie': COOKIE + '=' + token + '; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax', 'Cache-Control': 'no-store' } });
    }
    return page('비밀번호가 맞지 않아요');
  }
  if (url.pathname === '/__logout') return new Response(null, { status: 303, headers: { Location: '/', 'Set-Cookie': COOKIE + '=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax' } });
  if (OPEN.includes(url.pathname) || url.pathname.startsWith('/assets/icons/')) return;
  if (getCookie(req, COOKIE) === token) return;
  if (url.pathname === '/' || url.pathname.endsWith('.html')) return page('');
  return new Response('로그인이 필요해요', { status: 401, headers: { ...SEC, 'Content-Type': 'text/plain; charset=utf-8' } });
}
