/* 직원별 로그인 (Vercel 서버에서 확인 · 로그인 전에는 화면 · 자료 · 코드가 하나도 안 나가요)
   - 직원마다 비밀번호가 따로 있어요. 한 번 로그인하면 그 기기에서는 계속 자동 로그인돼요.
   - 직원을 빼면(on: false 또는 줄 삭제) 그 직원 기기는 바로 다음 화면부터 로그인 화면으로 돌아가요.
   - 비밀번호는 sha256(SALT + 비밀번호) 로만 들어 있어요. */
export const config = { matcher: '/((?!robots\\.txt|favicon\\.ico).*)' };
const SALT = 'f62f54b81b92b6076783c69a7c5ac294';
const STAFF = [
  { id: 'owner', name: '사장님', store: 'all', role: 'admin', pin: '067b824a17eb31f0468e84e0269dc25e3209deecf9df1f6aa77d8f3bc55653c7', on: true },
  { id: 'bp1', name: '부평본점 직원', store: 'bupyeong', role: 'staff', pin: '6992c0cfb00d3a6f5e55ca6c6c74f192c4144446fbb2a72859a2a988d6963b17', on: true },
  { id: 'sg1', name: '숭의점 직원', store: 'sungui', role: 'staff', pin: '6f797a5f65f3d7ec358876bb7996241b0d21729edc5dc587aadb33372d1b85fd', on: true },
  { id: 'gs1', name: '간석점 직원', store: 'ganseok', role: 'staff', pin: 'b50ba050016eeb8e2f28c46b6b8e2f4f7cd527a05e26ce56927ce11f26d408b3', on: true }
];
const COOKIE = 'gms_k', NAMEC = 'gms_n', AGE = 34560000; /* 400일 */
const OPEN = ['/manifest.webmanifest', '/robots.txt'];
async function sha(t) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
function getCookie(req, k) { const c = req.headers.get('cookie') || ''; const m = c.match(new RegExp('(?:^|;\\s*)' + k + '=([^;]+)')); return m ? m[1] : ''; }
const SEC = { 'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' };
function page(msg) {
  const html = '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noai,noimageai"><title>고무신 상담</title><meta name="theme-color" content="#0E1424"><link rel="manifest" href="/manifest.webmanifest"><meta name="apple-mobile-web-app-capable" content="yes"><link rel="apple-touch-icon" href="/assets/icons/apple-180.png">' +
    '<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0E1424;font-family:-apple-system,BlinkMacSystemFont,"Pretendard","Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#fff;padding:16px}' +
    '.b{width:100%;max-width:360px;background:#161E33;border:1px solid #2A3550;border-radius:18px;padding:28px 22px;text-align:center}h1{font-size:20px;margin:0 0 6px}p{margin:0 0 18px;color:#9AA6C2;font-size:14px;line-height:1.5}' +
    'input{width:100%;height:52px;border-radius:12px;border:1px solid #2A3550;background:#0E1424;color:#fff;font-size:22px;text-align:center;letter-spacing:.2em}button{margin-top:12px;width:100%;height:52px;border:0;border-radius:12px;background:#D4A24C;color:#111;font-size:17px;font-weight:800}.e{color:#FF7A8A;margin-top:12px;font-size:14px;min-height:18px}</style></head>' +
    '<body><form class="b" method="post" action="/__login"><h1>고무신 상담</h1><p>내 직원 비밀번호를 넣어주세요<br>한 번 넣으면 이 기기에서는 계속 자동으로 들어가요</p><input name="pin" type="password" inputmode="numeric" autocomplete="current-password" autofocus required><button>들어가기</button><div class="e">' + (msg || '') + '</div></form></body></html>';
  return new Response(html, { status: 401, headers: { ...SEC, 'Content-Type': 'text/html; charset=utf-8' } });
}
function cookies(u, tok) {
  const nm = encodeURIComponent(JSON.stringify({ n: u.name, s: u.store, r: u.role }));
  return [COOKIE + '=' + u.id + '.' + tok + '; Path=/; Max-Age=' + AGE + '; HttpOnly; Secure; SameSite=Lax', NAMEC + '=' + nm + '; Path=/; Max-Age=' + AGE + '; Secure; SameSite=Lax'];
}
function ip(req) { return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim(); }
export default async function middleware(req) {
  const url = new URL(req.url);
  if (url.pathname === '/__login' && req.method === 'POST') {
    await new Promise((r) => setTimeout(r, 700));
    let pin = '';
    try { const f = await req.formData(); pin = String(f.get('pin') || '').trim(); } catch (e) {}
    const h = pin ? await sha(SALT + pin) : '';
    const u = STAFF.find((x) => x.on && x.pin === h);
    if (u) {
      console.log('[로그인]', u.id, u.name, u.store, ip(req), req.headers.get('user-agent') || '');
      const hd = new Headers({ Location: '/', 'Cache-Control': 'no-store' });
      cookies(u, await sha(u.pin + ':' + u.id)).forEach((c) => hd.append('Set-Cookie', c));
      return new Response(null, { status: 303, headers: hd });
    }
    console.log('[로그인 실패]', ip(req));
    return page('비밀번호가 맞지 않아요');
  }
  if (url.pathname === '/__logout') { const hd = new Headers({ Location: '/' }); hd.append('Set-Cookie', COOKIE + '=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'); hd.append('Set-Cookie', NAMEC + '=; Path=/; Max-Age=0; Secure; SameSite=Lax'); return new Response(null, { status: 303, headers: hd }); }
  if (OPEN.includes(url.pathname) || url.pathname.startsWith('/assets/icons/')) return;
  const ck = getCookie(req, COOKIE), dot = ck.indexOf('.');
  const u = dot > 0 ? STAFF.find((x) => x.on && x.id === ck.slice(0, dot)) : null;
  if (u && ck.slice(dot + 1) === (await sha(u.pin + ':' + u.id))) {
    if (url.pathname === '/' || url.pathname === '/index.html') console.log('[접속]', u.id, u.name, ip(req));
    return;
  }
  if (url.pathname === '/' || url.pathname.endsWith('.html')) return page('');
  return new Response('로그인이 필요해요', { status: 401, headers: { ...SEC, 'Content-Type': 'text/plain; charset=utf-8' } });
}
