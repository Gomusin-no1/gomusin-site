/* =========================================================
   고무신 상담 · 화면
   순서: 처음 화면 → 통신사 → 모델 목록 → 구매 안내서 (색상 · 용량 · 스펙) → 상담 계산
   ========================================================= */
(function () {
  'use strict';
  var G = window.GC, DB = G.DB, won = G.won, num = G.num, esc = G.esc, n0 = G.n0;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var app, S = {}, mode = 'wireless', adminTab = 'subsidy';
  var listMaker = '전체', listQ = '';
  var JOIN = [['new', '신규'], ['mnp', '번호이동'], ['change', '기기변경']];
  var MONTHS = [[0, '일시불'], [12, '12개월'], [24, '24개월'], [30, '30개월'], [36, '36개월'], [48, '48개월']];
  var MODES = { wireless: '휴대폰 상담', used: '중고폰 상담', mvno: '알뜰폰 상담' };
  var ROOT = { wireless: 'phone', mvno: 'mvno' };
  var SPEC_L = [['display', '화면'], ['cpu', '칩셋'], ['ram', '메모리'], ['camera', '뒤 카메라'], ['front', '앞 카메라'], ['battery', '배터리'], ['charge', '충전'], ['weight', '무게'], ['water', '방수 · 방진'], ['pen', 'S펜'], ['security', '보안'], ['net', '통신'], ['sim', '유심'], ['os', '운영체제'], ['note', '안내']];

  function toast(m) { var t = $('#toast'); t.textContent = m; t.className = 'on'; clearTimeout(toast.t); toast.t = setTimeout(function () { t.className = ''; }, 2200); }
  function minus(v) { return v ? '-' + num(v) + '원' : '0원'; }
  function today() { var k = G.kst().date; return k.slice(0, 4) + '년 ' + Number(k.slice(5, 7)) + '월 ' + Number(k.slice(8, 10)) + '일'; }

  /* ---------- 상담 상태 ---------- */
  function carriersFor(m) {
    var all = DB.data.carriers;
    if (m === 'mvno') return all.filter(function (c) { return c.mvno; });
    if (m === 'wireless') return all.filter(function (c) { return !c.mvno; });
    return all;
  }
  function newState(m) {
    var car = carriersFor(m)[0];
    var plans = car ? DB.plansOf(car.id) : [];
    return {
      mode: m, carrier: car ? car.id : '', join: m === 'mvno' ? 'new' : 'mnp', subMode: m === 'wireless' ? 'common' : 'select', view: 'consult',
      device: '', color: '', plan: plans[0] ? plans[0].id : '', extra: 0, pass: '', passAmt: 0, usedOff: 0, etc: 0,
      light: '', lightAmt: 0, lightTier: 0, swap: '', cashMode: 'none', cash: 0, months: 24,
      bundle: '', bundleAmt: 0, bundleN: 0, bundleNet: '', bundleTotal: 0, bundleOne: false, bundleTeen: false, bundleBase: false, bundleLong: 0, bundleOpt: '', bundleAdds: [], welfare: '', military: false, promo: 0, dual: false, card: '', cardTier: 0,
      addons: [], usim: true, changePlan: '', customer: '', phone: '', memo: ''
    };
  }
  function setCarrier(s, cid) {
    if (s.carrier === cid) return;
    s.carrier = cid;
    var p = DB.plansOf(cid)[0]; s.plan = p ? p.id : ''; s.planAuto = true;
    s.bundle = ''; s.bundleAmt = 0; s.card = ''; s.light = ''; s.changePlan = '';
  }
  function st() { return S[mode]; }
  /* 기본 요금제: 처음엔 가장 비싼 요금제, 갤럭시 A · M 모델은 통신사별 중저가 요금제 */
  function isLowModel(md) { return !!md && (/갤럭시\s*[AM]\d/i.test(md.name || '') || md.low === true); }
  function defaultPlan(cid, md) {
    var list = DB.plansOf(cid), car = DB.carrier(cid) || {};
    if (!list.length) return '';
    if (!car.mvno && isLowModel(md)) {
      var want = n0(((DB.data.lowPlanFee || {})[cid]) || ({ skt: 45000, kt: 50000, lgu: 47000 })[cid]);
      var hit = list.find(function (p) { return n0(p.fee) === want; }) || list.slice().reverse().find(function (p) { return n0(p.fee) >= want; });
      if (hit) return hit.id;
    }
    return list[0].id;
  }
  function saveDraft() { try { sessionStorage.setItem('gms-draft2', JSON.stringify(S)); } catch (e) {} }
  function loadDraft() { try { var d = JSON.parse(sessionStorage.getItem('gms-draft2') || 'null'); if (d) S = d; } catch (e) {} }

  /* ---------- 단말기 그림 (직접 그린 그림, 색상에 맞춰 칠해져요) ---------- */
  function shade(hex, f) {
    var h = String(hex || '#9CA3AF').replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16); if (isNaN(n)) n = 0x9CA3AF;
    var c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (v) { var t = f < 0 ? 0 : 255; return Math.round((t - v) * Math.abs(f) + v); });
    return '#' + ((1 << 24) + (c[0] << 16) + (c[1] << 8) + c[2]).toString(16).slice(1);
  }
  var svgN = 0;
  function phoneSVG(m, hex, w) {
    if (m && m.img) return '<img class="ph-img" src="' + esc(m.img) + '" alt="" style="width:' + w + 'px">';
    var form = (m && m.form) || 'bar', cam = (m && m.cam) || 's';
    hex = hex || '#9CA3AF';
    var id = 'pg' + (++svgN), dk = shade(hex, -0.28), lt = shade(hex, 0.32), bump = shade(hex, -0.1);
    var defs = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + lt + '"/><stop offset=".5" stop-color="' + hex + '"/><stop offset="1" stop-color="' + dk + '"/></linearGradient></defs>';
    function lens(x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (r + 3) + '" fill="' + dk + '"/><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#0E1116"/><circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.45) + '" fill="#26324A"/><circle cx="' + (x - r * 0.35) + '" cy="' + (y - r * 0.35) + '" r="' + (r * 0.18) + '" fill="#fff" opacity=".55"/>'; }
    function flash(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#F5F1E6" stroke="' + dk + '"/>'; }
    function cams(ox, oy) {
      if (cam === 'p') return '<rect x="' + (ox + 6) + '" y="' + (oy + 10) + '" width="60" height="60" rx="16" fill="' + bump + '" stroke="' + dk + '"/>' + lens(ox + 22, oy + 26, 10) + lens(ox + 22, oy + 54, 10) + lens(ox + 50, oy + 40, 10) + flash(ox + 50, oy + 18);
      if (cam === 'b') return '<rect x="' + (ox + 8) + '" y="' + (oy + 10) + '" width="30" height="58" rx="15" fill="' + bump + '" stroke="' + dk + '"/>' + lens(ox + 23, oy + 25, 9) + lens(ox + 23, oy + 53, 9) + flash(ox + 46, oy + 20);
      if (cam === 'one' || cam === 'd') return '<rect x="' + (ox + 4) + '" y="' + (oy + 10) + '" width="' + (cam === 'd' ? 80 : 92) + '" height="28" rx="14" fill="' + bump + '" stroke="' + dk + '"/>' + lens(ox + 20, oy + 24, 9) + (cam === 'd' ? lens(ox + 46, oy + 24, 9) : '') + flash(ox + (cam === 'd' ? 68 : 44), oy + 24);
      var r = cam === 'a' ? 8 : 10, g = cam === 'a' ? 24 : 28;
      return lens(ox + 22, oy + 26, r) + lens(ox + 22, oy + 26 + g, r) + lens(ox + 22, oy + 26 + g * 2, r) + (cam === 'u' ? lens(ox + 48, oy + 26, 7) : '') + flash(ox + 48, oy + (cam === 'u' ? 50 : 26));
    }
    var body = '', vb = '0 0 120 240';
    if (form === 'sim') {
      body = '<path d="M30 40h44l18 18v130a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8V48a8 8 0 0 1 8-8z" fill="#E5E7EB" stroke="#9CA3AF" stroke-width="2"/><rect x="38" y="96" width="44" height="54" rx="6" fill="#D4A94F" stroke="#A47C2C"/><path d="M38 114h44M38 132h44M60 96v54" stroke="#A47C2C"/>';
    } else if (form === 'fold') {
      vb = '0 0 228 240';
      body = '<rect x="6" y="8" width="104" height="224" rx="14" fill="url(#' + id + ')" stroke="' + dk + '" stroke-width="2"/><rect x="118" y="8" width="104" height="224" rx="14" fill="url(#' + id + ')" stroke="' + dk + '" stroke-width="2"/><rect x="108" y="14" width="12" height="212" rx="4" fill="' + dk + '"/>' + cams(122, 6);
    } else if (form === 'flip') {
      body = '<rect x="10" y="4" width="100" height="232" rx="20" fill="url(#' + id + ')" stroke="' + dk + '" stroke-width="2"/><rect x="18" y="12" width="84" height="98" rx="14" fill="#0E1116"/><rect x="10" y="117" width="100" height="6" fill="' + dk + '" opacity=".6"/>' + lens(36, 32, 9) + lens(36, 60, 9) + '<rect x="58" y="80" width="36" height="6" rx="3" fill="#2A3242"/>';
    } else {
      body = '<rect x="10" y="4" width="100" height="232" rx="20" fill="url(#' + id + ')" stroke="' + dk + '" stroke-width="2"/>' + cams(12, 6);
    }
    return '<svg class="ph" viewBox="' + vb + '" style="width:' + w + 'px" role="img" aria-label="단말기 그림">' + defs + body + '<rect x="0" y="0" width="0" height="0"/></svg>';
  }

  /* ---------- 상단 ---------- */
  function header(r) {
    var nav = [['home', '처음'], ['phone', '휴대폰'], ['wired', '인터넷 · TV'], ['mvno', '알뜰폰'], ['used', '중고폰'], ['records', '상담기록']];
    $('#nav').innerHTML = nav.map(function (n) { return '<a href="#/' + n[0] + '" class="' + (r === n[0] ? 'on' : '') + '">' + n[1] + '</a>'; }).join('');
    var sel = $('#store');
    var SO = { bupyeong: 1, sungui: 2, ganseok: 3 };
    sel.innerHTML = DB.data.stores.slice().sort(function (a, b) { return (SO[a.id] || 9) - (SO[b.id] || 9); }).map(function (s) { return '<option value="' + s.id + '"' + (DB.prefs.store === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>'; }).join('');
    var b = DB.subsidyBase();
    $('#basetime').innerHTML = '';
  }
  function steps(n, m, cid) {
    var root = ROOT[m] || 'phone';
    var L = [['#/home', '상품 고르기'], ['#/' + root, '통신사'], ['#/' + root + '/' + (cid || ''), '모델'], ['', '구매 안내서 · 상담']];
    return '<ol class="steps">' + L.map(function (x, i) {
      var cls = i + 1 < n ? 'done' : i + 1 === n ? 'on' : '';
      var inner = '<span class="no">' + (i + 1 < n ? '✓' : i + 1) + '</span>' + x[1];
      return '<li class="' + cls + '">' + (i + 1 < n && x[0] ? '<a href="' + x[0] + '">' + inner + '</a>' : '<span>' + inner + '</span>') + '</li>';
    }).join('') + '</ol>';
  }
  function hint(t) { return '<div class="hint"><b class="hl">도움말</b><span>' + t + '</span></div>'; }

  /* =========================================================
     1. 처음 화면
     ========================================================= */
  function renderHome() {
    var D = DB.data;
    var d0 = new Date(), iso = d0.getFullYear() + '-' + ('0' + (d0.getMonth() + 1)).slice(-2) + '-' + ('0' + d0.getDate()).slice(-2);
    var todayN = (DB.records || []).filter(function (x) { return (x.store || 'bupyeong') === DB.prefs.store && String(x.at || x.date || x.savedAt || '').indexOf(iso) === 0; }).length;
    var stName = (DB.store(DB.prefs.store) || {}).name || '';
    var h = '<div class="home-hero"><div class="hh-l"><div class="date">' + today() + (stName ? ' · ' + esc(stName) : '') + '</div><h1>무엇을 상담할까요?</h1><div class="sub">큰 칸 하나를 누르면 다음 단계로 넘어가요.</div></div>' +
      '</div>';
    h += '<div class="home-tiles">';
    h += tile('#/phone', 'p', '휴대폰', 'SKT · KT · LG U+', '새 휴대폰 · 번호이동 · 기기변경');
    h += tile('#/wired', 'w', '인터넷 · TV', '인터넷 · IPTV · 결합', '휴대폰과 묶으면 얼마나 싸지는지');
    h += tile('#/mvno', 'm', '알뜰폰', DB.data.carriers.filter(function (c) { return c.mvno; }).length + '개 알뜰폰 회사', '유심 요금제 · 저렴한 요금');
    h += tile('#/used', 'u', '중고폰', '매장 중고폰 재고', '등급 · 배터리 · 판매가');
    h += '</div>';
    h += '<div class="home-low">';
    h += '<section class="card"><div class="card-h"><h2>처음 쓰는 분은 이렇게</h2></div><ol class="howto"><li><b>휴대폰</b>을 눌러요.</li><li>고객님이 쓸 <b>통신사</b>를 눌러요.</li><li>원하는 <b>모델</b>을 눌러요.</li><li><b>색상 · 용량</b>을 고르고 아래 <b>요금제</b>를 고르면 매달 내는 돈이 바로 나와요.</li><li><b>상담 저장</b> 또는 <b>견적서 인쇄</b>로 마무리해요.</li></ol></section>';
    h += '<section class="card"><div class="card-h"><h2>바로 가기</h2></div><div class="quick"><a class="btn" href="#/records">상담 기록</a><a class="btn" href="#/used">중고폰</a></div><div style="margin-top:14px;text-align:right"><a href="#/admin" class="adm-link" style="font-size:12px;color:#9AA3B5;text-decoration:none">사장님 메뉴</a>' + (window.GMS_ME ? ' <span style="font-size:12px;color:#9AA3B5">· ' + esc(window.GMS_ME.n) + ' · <a href="/__logout" style="color:#9AA3B5">로그아웃</a></span>' : '') + '</div></section>';
    h += '</div>';
    app.innerHTML = '<div class="wrap">' + h + '</div>';
    function tile(href, k, t, s1, s2) { return '<a class="tile t-' + k + '" href="' + href + '"><div class="ic">' + icon(k) + '</div><div class="tt">' + t + '</div><div class="s1">' + s1 + '</div><div class="s2">' + s2 + '</div><div class="go">시작하기 →</div></a>'; }
  }
  function icon(k) {
    var a = 'width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
    if (k === 'p') return '<svg ' + a + '><rect x="11" y="3" width="18" height="34" rx="4"/><path d="M17 32h6"/></svg>';
    if (k === 'w') return '<svg ' + a + '><rect x="4" y="8" width="32" height="20" rx="3"/><path d="M14 34h12M20 28v6"/></svg>';
    if (k === 'm') return '<svg ' + a + '><path d="M12 4h12l6 6v24a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><rect x="15" y="16" width="10" height="12" rx="2"/></svg>';
    return '<svg ' + a + '><rect x="11" y="3" width="18" height="34" rx="4"/><path d="M15 14l10 10M25 14L15 24" /></svg>';
  }

  /* =========================================================
     2. 통신사 고르기
     ========================================================= */
  function renderCarriers(m) {
    var h = steps(2, m);
    var root = ROOT[m];
    h += '<div class="page-h"><h1>' + (m === 'mvno' ? '알뜰폰 회사를 골라 주세요' : '통신사를 골라 주세요') + '</h1></div>';
    if (m === 'wireless') {
      h += '<div class="car-grid">';
      carriersFor('wireless').forEach(function (c) {
        var nMod = DB.data.models.filter(function (x) { return !x.special && (!x.only || x.only === c.id); }).length;
        h += '<a class="car c-' + c.id + '" href="#/phone/' + c.id + '"><div class="nm">' + esc(c.name) + '</div><div class="ds">모델 ' + nMod + '종 · 요금제 ' + DB.plansOf(c.id).length + '개</div><div class="go">누르기 →</div></a>';
      });
      h += '<a class="car c-mvno" href="#/mvno"><div class="nm">알뜰폰</div><div class="ds">' + carriersFor('mvno').length + '개 회사 · 유심 요금제</div><div class="go">누르기 →</div></a>';
      h += '</div>';
      h += hint('고객님이 <b>새로 쓸 통신사</b>를 누르세요. 번호이동이면 옮겨 갈 통신사예요.');
    } else {
      h += '<div class="car-grid mv">';
      carriersFor('mvno').forEach(function (c) {
        var ps = DB.plansOf(c.id), lo = ps.length ? ps[ps.length - 1].fee : 0;
        h += '<a class="car c-mv" href="#/mvno/' + c.id + '"><div class="nm">' + esc(c.name) + '</div><div class="ds">' + esc(c.net || '') + (ps.length ? ' · 월 ' + num(lo) + '원부터' : '') + '</div><div class="go">누르기 →</div></a>';
      });
      h += '</div>';
      h += hint('알뜰폰은 <b>공시지원금이 없어요</b>. 대신 요금이 싸요. 고객님이 쓸 회사를 누르세요.');
    }
    app.innerHTML = '<div class="wrap">' + h + '</div>';
  }

  /* =========================================================
     3. 모델 목록
     ========================================================= */
  function modelsFor(m, cid) {
    return DB.data.models.filter(function (x) { return !x.only || x.only === cid || m === 'mvno' && !x.only; });
  }
  function maxSubsidy(mid, cid) {
    var best = 0;
    DB.skus(mid).forEach(function (d) { var a = (DB.data.subsidy[d.id] || {})[cid]; if (a) best = Math.max(best, Math.max.apply(null, a.map(n0))); });
    return best;
  }
  function renderModels(m, cid) {
    var car = DB.carrier(cid); if (!car) { location.hash = '#/' + ROOT[m]; return; }
    var s = st(); setCarrier(s, cid);
    var fav = DB.prefs.fav || [];
    var makers = ['전체', '즐겨찾기', '삼성', '애플', '기타', '유심만'];
    var h = steps(3, m, cid);
    h += '<div class="page-h"><h1><span class="cbadge c-' + (car.mvno ? 'mv' : cid) + '">' + esc(car.name) + '</span> 모델을 골라 주세요</h1>';
    h += '<div class="tools-r"><div class="seg mk">' + makers.map(function (x) { return '<button data-lmk="' + x + '" class="' + (listMaker === x ? 'on' : '') + '">' + (x === '즐겨찾기' ? '★ ' : '') + x + '</button>'; }).join('') + '</div><input class="search" id="mq" placeholder="모델 찾기 (예: S26, 아이폰)" value="' + esc(listQ) + '"></div></div>';
    h += '<div class="mgrid" id="mgrid"></div>';
    h += hint('모델 칸을 누르면 <b>색상 · 용량 · 스펙</b>이 나오는 구매 안내서로 넘어가요. ★을 누르면 즐겨찾기에 들어가요.');
    app.innerHTML = '<div class="wrap">' + h + '</div>';
    drawModels(m, cid, fav);
    $('#mq').oninput = function (e) { listQ = e.target.value; drawModels(m, cid, DB.prefs.fav || []); };
  }
  /* 모델 검색: 이름 · 모델코드(SM- 없이, 끝 N/K/S 있어도) */
  function modelHit(x, raw) {
    var q = String(raw || '').toLowerCase().replace(/[\s\-_]/g, ''); if (!q) return true;
    var hay = (x.name + x.id + (x.code || '')).toLowerCase().replace(/[\s\-_]/g, '');
    if (hay.indexOf(q) >= 0) return true;
    var q2 = q.replace(/^sm/, '').replace(/^([a-z]\d{3})[a-z]{1,2}$/, '$1');
    return !!x.code && String(x.code).toLowerCase().replace(/[\s\-_]/g, '').indexOf(q2) >= 0;
  }
  /* 요금제 검색: 낱말마다 따로 맞춰요 · 숫자는 이름 속 숫자 또는 월정액(115 → 115,000원) */
  function planHit(p, raw, extra) {
    var q = String(raw || '').toLowerCase().trim(); if (!q) return true;
    q = q.replace(/([^\d.\s])(\d)/g, '$1 $2').replace(/(\d)([^\d.\s,])/g, '$1 $2').replace(/,/g, '');
    var hay = (p.name + ' ' + (p.data || '') + ' ' + (extra || '')).toLowerCase(), hns = hay.replace(/\s/g, '');
    return q.split(/\s+/).filter(Boolean).every(function (t) {
      if (/^\d+(\.\d+)?$/.test(t)) {
        var v = parseFloat(t);
        if (new RegExp('(^|[^0-9.])' + t.replace('.', '\\.') + '(?![0-9])').test(hay)) return true;
        return n0(p.fee) === Math.round(v * 1000) || n0(p.fee) === v;
      }
      if (t === 'gb' || t === 'g') return true;
      return hns.indexOf(t) >= 0;
    });
  }
  function drawModels(m, cid, fav) {
    var q = listQ.trim().toLowerCase().replace(/\s/g, '');
    var list = modelsFor(m, cid).filter(function (x) {
      var mk = x.special ? '유심만' : x.maker;
      if (listMaker === '즐겨찾기' && fav.indexOf(x.id) < 0) return false;
      if (listMaker !== '전체' && listMaker !== '즐겨찾기' && mk !== listMaker) return false;
      return modelHit(x, q);
    });
    if (m === 'mvno') list.sort(function (a, b) { return (b.special ? 1 : 0) - (a.special ? 1 : 0); });
    var root = ROOT[m];
    $('#mgrid').innerHTML = list.map(function (x) {
      var cols = DB.colors(x), sk = DB.skus(x.id), lo = sk.length ? Math.min.apply(null, sk.map(function (d) { return d.price; })) : 0;
      var sub = m === 'mvno' ? 0 : maxSubsidy(x.id, cid), sp = x.specs || {};
      var line = x.special ? (sp.note || '') : [sp.display && sp.display.split(' · ')[0], sp.cpu, sp.battery].filter(Boolean).join(' · ');
      var isNew = x.release >= '2026-08';
      return '<div class="mcard"><a href="#/' + root + '/' + cid + '/' + x.id + '" class="mlink"><div class="mimg">' + phoneSVG(x, cols[0] && cols[0].hex, x.form === 'fold' ? 120 : 64) + '</div>' +
        '<div class="mtags">' + (isNew ? '<span class="tag">신제품</span>' : '') + (x.only ? '<span class="tag k">' + esc(DB.carrier(x.only).name) + ' 전용</span>' : '') + '</div>' +
        '<div class="mn">' + esc(x.name) + '</div>' +
        (x.special ? '' : '<div class="mp num">출고가 ' + num(lo) + '원' + (sk.length > 1 ? '~' : '') + '</div>') +
        (sub ? '<div class="msub num">공통지원금 최대 ' + num(sub) + '원</div>' : '') +
        '<div class="ms">' + esc(line) + '</div>' +
        (cols.length ? '<div class="dots">' + cols.map(function (c) { return '<i style="background:' + esc(c.hex) + '" title="' + esc(c.name) + '"></i>'; }).join('') + '<span>' + cols.length + '색</span></div>' : '') +
        '</a><button class="fav' + (fav.indexOf(x.id) >= 0 ? ' on' : '') + '" data-fav="' + x.id + '" aria-label="즐겨찾기">★</button></div>';
    }).join('') || '<div class="empty-note card">맞는 모델이 없어요.</div>';
  }

  /* =========================================================
     4. 구매 안내서 + 상담
     ========================================================= */
  function renderGuide(m, cid, mid) {
    if (!mid) return renderEmptyGuide(m, cid);
    var car = DB.carrier(cid), md = DB.model(mid);
    if (!car || !md) { location.hash = '#/' + ROOT[m]; return; }
    var s = st(); setCarrier(s, cid);
    var sk = DB.skus(mid), cols = DB.colors(md);
    var dev = DB.device(s.device);
    if (!dev || dev.model !== mid) { s.device = sk[0] ? sk[0].id : ''; s.priceEdit = null; s.extra = 0; dev = DB.device(s.device); }
    if (s.planModel !== mid) { s.planModel = mid; s.planAuto = true; }
    if (s.planAuto !== false || !s.plan) { var dp = defaultPlan(cid, md); if (dp) s.plan = dp; s.planAuto = true; }
    if (!cols.find(function (c) { return c.name === s.color; })) s.color = cols[0] ? cols[0].name : '';
    var col = cols.find(function (c) { return c.name === s.color; }) || {};
    var r = G.calc(s), mv = !!car.mvno, special = md.special;
    if ((mv || special) && s.view !== 'plans') s.view = 'consult';
    var fav = (DB.prefs.fav || []).indexOf(mid) >= 0;
    var sp = md.specs || {};

    var h = steps(4, m, cid);
    h += '<section class="card guide"><div class="guide-h"><div><div class="date">' + today() + '</div><h1>고무신모바일 구매 안내서</h1></div><div class="r"><span class="cbadge c-' + (mv ? 'mv' : cid) + '">' + esc(car.name) + '</span><button class="btn sm" data-act="pickModel">다른 모델</button></div></div>';
    h += '<div class="guide-b">';
    h += '<div class="sw">' + (cols.length ? '<div class="sw-l">색상</div>' : '') + cols.map(function (c) { return '<button data-color="' + esc(c.name) + '" class="' + (c.name === s.color ? 'on' : '') + '" title="' + esc(c.name) + '"><i style="background:' + esc(c.hex) + '"></i></button>'; }).join('') + '</div>';
    h += '<div class="gimg" data-act="pickModel" title="눌러서 다른 모델 고르기">' + phoneSVG(md, col.hex, md.form === 'fold' ? 260 : 136) + (col.name ? '<div class="cname">' + esc(col.name) + '</div>' : '') + (md.colorNote ? '<div class="cnote">' + esc(md.colorNote) + '</div>' : '') + (md.img || md.special ? '' : '<div class="cnote">그림은 색상 안내용이에요. 실제 모양과 달라요.</div>') + '</div>';
    h += '<div class="ginfo"><div class="mk">' + esc(md.maker) + (md.release ? ' · ' + esc(md.release) + ' 출시' : '') + (md.only ? ' · <b>' + esc(DB.carrier(md.only).name) + ' 전용</b>' : '') + '</div><h2>' + esc(md.name) + '</h2>';
    if (!special) {
      h += '<div class="lb">저장 용량</div><div class="caps">' + sk.map(function (d) { return '<button data-cap="' + d.id + '" class="' + (d.id === s.device ? 'on' : '') + '"><b>' + esc(d.cap) + '</b><span class="num">' + num(d.price) + '원</span></button>'; }).join('') + '</div>';
      h += '<div class="gprice"><span>출고가</span><b class="num">' + won(r.price) + '</b>' + (!mv ? '<span class="gsub num">공통지원금 ' + (r.plan ? esc(r.plan.name) + ' 기준 ' : '') + num(DB.subsidy(s.device, cid, s.plan)) + '원</span>' : '') + '</div>';
      if (md.priceNote) h += '<div class="cnote l">' + esc(md.priceNote) + '</div>';
    }
    h += '<table class="spec-t">' + SPEC_L.filter(function (x) { return sp[x[0]]; }).map(function (x) { return '<tr><th>' + x[1] + '</th><td>' + esc(sp[x[0]]) + '</td></tr>'; }).join('') + (dev && dev.cap ? '<tr><th>저장 공간</th><td>' + esc(dev.cap) + '</td></tr>' : '') + '</table>';
    h += '</div></div>';
    h += '<div class="gtools">' +
      tool('save', '저장 · 불러오기', '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>') +
      tool('fav', fav ? '즐겨찾기 해제' : '즐겨찾기', '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z"' + (fav ? ' fill="currentColor"' : '') + '/>') +
      tool('share', '출력 · 공유', '<path d="M6 9V3h12v6M6 17H4v-7h16v7h-2"/><rect x="6" y="14" width="12" height="7"/>') +
      tool('fee', '할부 · 위약금', '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h8"/>') +
      (mv || special ? '' : tool('cmp', '공통 · 선택 비교', '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>')) +
      '</div></section>';

    /* 탭 */
    var tabs = mv ? [['consult', '알뜰폰 상담'], ['plans', '요금제 비교']] : special ? [['consult', '선택약정 25% 상담'], ['plans', '요금제 비교']] : [['common', '공통지원금'], ['select', '선택약정 25%'], ['plans', '요금제 비교']];
    var cur = s.view === 'plans' ? 'plans' : (mv || special) ? 'consult' : s.subMode;
    h += '<div class="gtabs" id="gtabs">' + tabs.map(function (t) { return '<button data-gtab="' + t[0] + '" class="' + (cur === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>';
    if (s.view === 'plans') {
      h += plansTable(s, cid, mv || special);
      h += hint('줄을 누르면 그 요금제로 상담 화면이 열려요. <b>초록 글씨</b>가 더 싼 쪽이에요.');
    } else {
      h += '<div class="card planbar"><div class="lb"><span class="step">5</span>요금제</div><button class="picker" data-act="pickPlan"><span class="t' + (r.plan ? '' : ' empty') + '">' + (r.plan ? esc(r.plan.name) : '눌러서 선택') + '</span>' + (r.plan ? '<span class="v num">월 ' + num(r.plan.fee) + '원 · ' + esc(r.plan.data) + '</span>' : '') + '</button>' +
        '<div class="pb-n">' + (mv ? '알뜰폰은 공시지원금 없이 단말기 할부 + 요금제로 계산해요.' : special ? '폰을 사지 않으면 선택약정 25% 할인만 받을 수 있어요.' : s.subMode === 'common' ? '공통지원금: 단말기 값에서 한 번에 빠져요.' : '선택약정: 24개월 동안 요금에서 25%씩 빠져요.') + '</div></div>';
      h += hint('<b>노란 칸</b>은 직접 입력해요. 나머지는 자동으로 계산돼요. 오른쪽 <b>빨간 숫자</b>가 고객님이 매달 내는 돈이에요.');
      h += consultCols(s, r);
    }
    app.innerHTML = '<div class="wrap">' + h + '</div>' + (s.view === 'plans' ? '' : mbar(r));
    function tool(k, t, path) { return '<button class="gtool" data-tool="' + k + '"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg><span>' + t + '</span></button>'; }
  }
  /* 모델을 아직 안 고른 구매 안내서: 휴대폰 칸을 누르면 모델 선택 창 */
  function renderEmptyGuide(m, cid) {
    var car = DB.carrier(cid); if (!car) { location.hash = '#/' + ROOT[m]; return; }
    var s = st(); setCarrier(s, cid);
    s.device = ''; s.priceEdit = null; s.view = 'consult';
    var mv = !!car.mvno, r = G.calc(s);
    var h = steps(3, m, cid);
    h += '<section class="card guide"><div class="guide-h"><div><div class="date">' + today() + '</div><h1>고무신모바일 구매 안내서</h1></div><div class="r"><span class="cbadge c-' + (mv ? 'mv' : cid) + '">' + esc(car.name) + '</span></div></div>';
    h += '<button class="pick-empty" data-act="pickModel"><svg viewBox="0 0 64 100" width="72" height="112" fill="none" stroke="currentColor" stroke-width="5"><rect x="4" y="4" width="56" height="92" rx="10"/><rect x="13" y="14" width="38" height="58" rx="4"/><circle cx="32" cy="84" r="4" fill="currentColor" stroke="none"/></svg><b>단말기를 선택해 주세요</b><small>여기를 누르면 모델 목록이 열려요</small></button></section>';
    var tabs = mv ? [['consult', '알뜰폰 상담']] : [['common', '공통지원금'], ['select', '선택약정 25%']];
    var cur = mv ? 'consult' : s.subMode;
    h += '<div class="gtabs" id="gtabs">' + tabs.map(function (t) { return '<button data-gtab="' + t[0] + '" class="' + (cur === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div>';
    h += '<div class="card planbar"><div class="lb"><span class="step">5</span>요금제</div><button class="picker" data-act="pickPlan"><span class="t' + (r.plan ? '' : ' empty') + '">' + (r.plan ? esc(r.plan.name) : '눌러서 선택') + '</span>' + (r.plan ? '<span class="v num">월 ' + num(r.plan.fee) + '원 · ' + esc(r.plan.data) + '</span>' : '') + '</button><div class="pb-n">먼저 위의 휴대폰 칸을 눌러 모델을 골라 주세요.</div></div>';
    h += consultCols(s, r);
    app.innerHTML = '<div class="wrap">' + h + '</div>' + mbar(r);
  }

  /* 단말기 선택 창: 왼쪽 제조사 탭 + 한 줄씩 보는 목록 (용량별) */
  function pickModel() {
    var m = mode, s = st(), cid = s.carrier, car = DB.carrier(cid) || {}, mv = !!car.mvno;
    var tabs = [['즐겨찾기', '★ 즐겨찾기'], ['삼성', '삼성'], ['애플', '애플'], ['기타', '기타'], ['유심만', '단말기<br>미구매'], ['중고폰', '중고폰']];
    var cur = DB.device(s.device), tab = cur ? (cur.special ? '유심만' : (cur.maker === '삼성' || cur.maker === '애플') ? cur.maker : '기타') : (listMaker && listMaker !== '전체' ? listMaker : '삼성');
    var sort = 'base', q = '', subOnly = false, openSpec = '';
    var plan = DB.plan(s.plan);
    var body = '<div class="dp">' +
      '<nav class="dp-tabs">' + tabs.map(function (t) { return '<button data-dt="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</nav>' +
      '<div class="dp-main"><div class="dp-top"><select class="sel dp-sort"><option value="base">기본 정렬순</option><option value="new">최신 출시순</option><option value="hi">출고가 높은 순</option><option value="lo">출고가 낮은 순</option>' + (mv ? '' : '<option value="sub">공통지원금 많은 순</option>') + '</select>' +
      '<input class="search" placeholder="모델명 · 모델코드 검색 (예: 폴드7, SM-F966)">' + (mv ? '' : '<label class="chk"><input type="checkbox" class="dp-subonly">공통지원금 있는 것만</label>') + '</div>' +
      '<div class="dp-head"><span>기기명</span><span class="r">출고가</span><span class="hide-s">요금제 기준</span><span class="r">지원금 <small>(24개월)</small></span><span class="c">스펙</span></div>' +
      '<div class="dp-list"></div></div></div>';
    var md = modal(esc(car.name || '') + ' 단말기 선택', body, { size: 'wide dp-modal' }), list = $('.dp-list', md);
    function draw() {
      var fav = DB.prefs.fav || [], qq = q.replace(/[\s\-_]/g, '');
      if (tab === '중고폰') return drawUsed(qq);
      $$('[data-dt]', md).forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-dt') === tab); });
      var models = modelsFor(m, cid).filter(function (x) {
        var k = x.special ? '유심만' : (x.maker === '삼성' || x.maker === '애플') ? x.maker : '기타';
        if (!qq) { if (tab === '즐겨찾기') { if (fav.indexOf(x.id) < 0) return false; } else if (k !== tab) return false; }
        return modelHit(x, qq);
      });
      var rows = [];
      models.forEach(function (x, mi) { DB.skus(x.id).forEach(function (d, di) { rows.push({ m: x, d: d, o: mi * 10 + di, sub: mv || x.special ? 0 : DB.subsidy(d.id, cid, s.plan) }); }); });
      if (subOnly) rows = rows.filter(function (r) { return r.sub > 0; });
      if (sort === 'new') rows.sort(function (a, b) { return (b.m.release || '').localeCompare(a.m.release || '') || a.o - b.o; });
      if (sort === 'hi') rows.sort(function (a, b) { return b.d.price - a.d.price; });
      if (sort === 'lo') rows.sort(function (a, b) { return a.d.price - b.d.price; });
      if (sort === 'sub') rows.sort(function (a, b) { return b.sub - a.sub; });
      var selM = plan && !mv ? Math.round(plan.fee * 0.25 / 10) * 10 : 0;
      list.innerHTML = rows.map(function (r) {
        var x = r.m, d = r.d, on = fav.indexOf(x.id) >= 0, sp = x.specs || {};
        var line = [x.code ? x.code + (d.cap ? '_' + d.cap.replace('GB', '').replace('TB', 'T') : '') : d.cap, x.release ? x.release.replace('-', '.') + ' 출시' : '', sp.net].filter(Boolean).join(' · ');
        var h = '<div class="dp-row' + (s.device === d.id ? ' on' : '') + '" data-sku="' + d.id + '">' +
          '<div class="dp-name"><button class="sfav' + (on ? ' on' : '') + '" data-mfav="' + x.id + '" aria-label="즐겨찾기">★</button><div><b>' + esc(x.special ? x.name : d.name) + (x.release >= '2026-08' ? ' <span class="tag">신제품</span>' : '') + (x.only ? ' <span class="tag k">' + esc(DB.carrier(x.only).name) + ' 전용</span>' : '') + '</b><small>' + esc(x.special ? (sp.note || '') : line) + '</small></div></div>' +
          '<div class="r num b">' + (x.special ? '-' : num(d.price)) + '</div>' +
          '<div class="hide-s dp-plan">' + (plan ? esc(plan.name) : '-') + '</div>' +
          '<div class="r dp-sub num">' + (mv || x.special ? (selM ? '<span>선약 <b class="pink">' + num(selM * 24) + '원</b></span>' : '-') :
            '<span>공통 <b class="blue">' + (r.sub ? num(r.sub) + '원' : '0원') + '</b></span><span>선약 <b class="pink">' + num(selM * 24) + '원</b></span><small>(월 ' + num(selM) + '원)</small>') + '</div>' +
          '<div class="c"><button class="dp-spec' + (openSpec === d.id ? ' on' : '') + '" data-spec="' + d.id + '" aria-label="스펙 보기"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg></button></div></div>';
        if (openSpec === d.id) h += '<div class="dp-specs">' + SPEC_L.filter(function (k) { return sp[k[0]]; }).map(function (k) { return '<div><span>' + k[1] + '</span><b>' + esc(sp[k[0]]) + '</b></div>'; }).join('') + '</div>';
        return h;
      }).join('') || '<div class="empty-note">' + (tab === '즐겨찾기' ? '즐겨찾기한 단말기가 없어요. 목록에서 ★을 눌러 넣어요.' : '맞는 단말기가 없어요.') + '</div>';
    }
    function drawUsed(qq) {
      $$('[data-dt]', md).forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-dt') === '중고폰'); });
      var rows = DB.data.usedStock.filter(function (u) { return !qq || u.name.toLowerCase().replace(/[\s\-_]/g, '').indexOf(qq) >= 0; });
      rows.sort(function (a, b) { return (b.store === DB.prefs.store) - (a.store === DB.prefs.store); });
      if (sort === 'hi') rows.sort(function (a, b) { return b.price - a.price; });
      if (sort === 'lo') rows.sort(function (a, b) { return a.price - b.price; });
      list.innerHTML = rows.map(function (u) {
        return '<div class="dp-row" data-used="' + u.id + '"><div class="dp-name"><span class="tag ' + (u.grade === 'S' ? 'g' : u.grade === 'A' ? 'k' : 'y') + '">' + esc(u.grade) + '급</span><div><b>' + esc(u.name) + '</b><small>' + esc([u.color, '배터리 ' + n0(u.battery) + '%', DB.store(u.store).name].filter(Boolean).join(' · ')) + '</small></div></div>' +
          '<div class="r num b">' + num(u.price) + '</div><div class="hide-s dp-plan">' + (plan ? esc(plan.name) : '-') + '</div><div class="r dp-sub num"><span>선약 <b class="pink">' + num((plan && !mv ? Math.round(plan.fee * 0.25 / 10) * 10 : 0) * 24) + '원</b></span></div><div class="c"></div></div>';
      }).join('') || '<div class="empty-note">등록된 중고폰이 없어요. [관리 → 중고폰 재고]에서 등록해요.</div>';
    }
    draw();
    md.addEventListener('click', function (e) {
      var ur = e.target.closest('[data-used]');
      if (ur) { if (!S.used) S.used = newState('used'); S.used.device = ur.getAttribute('data-used'); S.used.priceEdit = null; S.used.subMode = 'select'; if (carriersFor('used').find(function (c) { return c.id === cid; })) { S.used.carrier = cid; S.used.plan = s.plan; } closeModal(); location.hash = '#/used'; return; }
      var t = e.target.closest('[data-dt]'); if (t) { tab = listMaker = t.getAttribute('data-dt'); openSpec = ''; draw(); list.scrollTop = 0; return; }
      var f = e.target.closest('[data-mfav]'); if (f) { e.stopPropagation(); toggleFav(f.getAttribute('data-mfav')); draw(); return; }
      var sp = e.target.closest('[data-spec]'); if (sp) { var id = sp.getAttribute('data-spec'); openSpec = openSpec === id ? '' : id; draw(); return; }
      var row = e.target.closest('[data-sku]');
      if (row) { var d = DB.device(row.getAttribute('data-sku')); if (!d) return; s.device = d.id; s.priceEdit = null; closeModal(); var h = '#/' + ROOT[m] + '/' + cid + '/' + d.model; if (location.hash === h) render(); else location.hash = h; }
    });
    $('.dp-sort', md).onchange = function (e) { sort = e.target.value; draw(); };
    $('.search', md).oninput = function (e) { q = e.target.value.trim().toLowerCase(); draw(); };
    $('.search', md).onkeydown = function (e) { if (e.key === 'Enter') { var r1 = $('[data-sku],[data-used]', list); if (r1) r1.click(); } };
    var so = $('.dp-subonly', md); if (so) so.onchange = function (e) { subOnly = e.target.checked; draw(); };
  }

  function mbar(r) { return '<div class="mbar"><div><div class="lb">매달 내는 돈</div><div class="m num" data-o="monthly2">' + num(r.monthly) + '원</div></div><button class="btn" data-act="toTotal">자세히</button></div>'; }

  /* 요금제 비교 표 (이 모델 기준) */
  function plansTable(s, cid, noSub) {
    var h = '<section class="card"><div class="tbl-wrap"><table class="tbl ptbl"><thead><tr><th>요금제</th><th class="r">월정액</th><th class="hide-m">데이터</th>' +
      (noSub ? '<th class="r">매달 내는 돈</th>' : '<th class="r">공통지원금</th><th class="r">공통지원금 선택 시<br>매달</th><th class="r">선택약정 선택 시<br>매달</th><th class="r hide-m">24개월 차이</th>') + '</tr></thead><tbody>';
    h += DB.plansOf(cid).map(function (p) {
      if (noSub) { var r0 = G.calc(s, { plan: p.id }); return '<tr data-prow="' + p.id + '" data-psub="select" class="' + (s.plan === p.id ? 'on' : '') + '"><td class="b">' + esc(p.name) + '</td><td class="r">' + num(p.fee) + '</td><td class="hide-m">' + esc(p.data) + '</td><td class="r b red">' + num(r0.monthly) + '</td></tr>'; }
      var rc = G.calc(s, { plan: p.id, subMode: 'common' }), rs = G.calc(s, { plan: p.id, subMode: 'select' });
      var better = rc.total24 <= rs.total24 ? 'common' : 'select';
      return '<tr data-prow="' + p.id + '" data-psub="' + better + '" class="' + (s.plan === p.id ? 'on' : '') + '"><td class="b">' + esc(p.name) + '</td><td class="r">' + num(p.fee) + '</td><td class="hide-m">' + esc(p.data) + '</td><td class="r blue">' + (rc.common ? '-' + num(rc.common) : '-') + '</td>' +
        '<td class="r' + (better === 'common' ? ' best' : '') + '">' + num(rc.monthly) + '</td><td class="r' + (better === 'select' ? ' best' : '') + '">' + num(rs.monthly) + '</td><td class="r hide-m">' + num(Math.abs(rc.total24 - rs.total24)) + '</td></tr>';
    }).join('');
    return h + '</tbody></table></div></section>';
  }

  /* =========================================================
     상담 계산 화면 (A 단말기 · B 요금 · 합계)
     ========================================================= */
  function consultCols(s, r) {
    var D = DB.data, mv = r.mvno, used = s.mode === 'used';
    var more = DB.prefs.more ? ' more-on' : '';
    var plans = DB.plansOf(s.carrier);
    var h = '<div class="cols' + more + '" id="cols">';

    var passes = D.passes || [], lights = (D.lightCards || []).filter(function (x) { return x.carrier === s.carrier; });
    var swaps = (D.addons || []).filter(function (a) { return a.kind === '폰교체'; });
    h += '<section class="card"><div class="card-h"><span class="badge a">A</span><h2>단말기 할부</h2></div><div class="rows">';
    h += row('가입 유형', '<div class="seg sm">' + JOIN.map(function (j) { return '<button data-set="join" data-v="' + j[0] + '" class="' + (s.join === j[0] ? 'on' : '') + '">' + j[1] + '</button>'; }).join('') + '</div>');
    h += row(used ? '판매가' : '출고가', '<span class="num" data-o="price">' + won(r.price) + '</span>', '', used ? '' : '<small>자동</small>');
    if (!used && !mv && r.subMode !== 'select') h += row('공통지원금', '<span class="num" data-o="common">' + minus(r.common) + '</span>', 'minus', '<small>' + (r.subMode === 'select' ? '선택약정 중' : '자동') + '</small>');
    if (!used && !mv) h += row('추가지원금', numIn('extra', s.extra, true), '', '<small>직접 입력</small>');
    if (!used && !mv) h += row('프리미엄패스', '<select class="sel' + (s.pass ? ' w-s' : '') + '" data-k="pass"><option value="">미적용</option>' + passes.map(function (p) { return opt(p.id, p.name, s.pass); }).join('') + '</select>' + (s.pass ? numIn('passAmt', s.passAmt, true, 'w-s') : ''), '', '<small>24개월 약정</small>', true, !!s.pass);
    h += row('중고폰 할인', numIn('usedOff', s.usedOff, true), '', '<small>쓰던 폰 반납</small>', true, s.usedOff > 0);
    h += row(used ? '매장 할인' : '기타지원', numIn('etc', s.etc, true), '', '', true, s.etc > 0);
    if (!used && !mv) h += row('라이트할부카드', '<button class="sel selbtn' + (s.light ? ' w-s' : '') + '" data-act="pickLight">' + (r.light ? '[' + esc(r.light.issuer || '') + '] ' + esc(r.light.name) : '미적용') + '</button>' + (r.light && !r.lightTiers.length ? numIn('lightAmt', s.lightAmt, true, 'w-s') : ''), '', r.lightMon ? '<small class="num">월 ' + minus(r.lightMon) + '</small>' : '<small>카드로 할부 결제</small>', true, !!s.light);
    if (!used && !mv && r.light && r.lightTiers.length) h += row('카드 전월 실적', '<select class="sel" data-k="lightTier">' + r.lightTiers.map(function (t, i) { return opt(i, num(t[0] / 10000) + '만원 이상 → 월 -' + num(t[1]), String(s.lightTier || 0)); }).join('') + '</select>', '', '', true, true);
    if (!mv) h += row('폰교체 프로그램', '<select class="sel" data-k="swap"><option value="">미적용</option>' + swaps.map(function (p) { return opt(p.id, p.name + ' (월 ' + num(p.fee) + '원)', s.swap); }).join('') + '</select>', '', '', true, !!s.swap);
    h += row('수납금', '<div class="seg sm">' + [['none', '미적용'], ['full', '완납'], ['part', '부분']].map(function (c) { return '<button data-set="cashMode" data-v="' + c[0] + '" class="' + (s.cashMode === c[0] ? 'on' : '') + '">' + c[1] + '</button>'; }).join('') + '</div>', '', '<small>현금으로 낸 돈</small>');
    if (s.cashMode === 'part') h += row('부분 납부 금액', numIn('cash', s.cash, true));
    if (s.cashMode === 'full') h += row('완납 금액', '<span class="num" data-o="cash">' + minus(r.cash) + '</span>', 'minus');
    h += row('할부 개월', '<select class="sel" data-k="months">' + MONTHS.map(function (m) { return opt(m[0], m[1], String(s.months)); }).join('') + '</select>');
    h += '<div class="row sum"><div class="k">할부원금</div><div class="v"><span class="num" data-o="principal">' + won(r.principal) + '</span></div></div>';
    h += row('할부수수료', '<span class="num" data-o="instFee">' + won(r.instFee) + '</span>', '', '<small>연 ' + r.rate + '%</small>');
    h += '<div class="row big a"><div class="k">월 할부금</div><div class="v"><span class="num" data-o="instMonthly">' + won(r.instMonthly - (r.lightMon || 0)) + '</span>' + (r.lightMon ? '<small style="display:block;font-size:12px;color:var(--sub)">라이트할부 월 ' + minus(r.lightMon) + ' 반영</small>' : '') + '</div></div>';
    h += '</div><button class="more-btn" data-act="more">' + (DB.prefs.more ? '간단히 보기 ▲' : '할인 항목 더 보기 ▼') + '</button></section>';

    var wel = D.welfare || [];
    h += '<section class="card"><div class="card-h"><span class="badge b">B</span><h2>월 요금</h2></div><div class="rows">';
    var pf = (DB.prefs.planFav || []), plansF = plans.filter(function (p) { return pf.indexOf(p.id) >= 0; }).concat(plans.filter(function (p) { return pf.indexOf(p.id) < 0; }));
    h += row('월정액', '<select class="sel" data-k="plan">' + plansF.map(function (p) { return '<option value="' + p.id + '"' + (s.plan === p.id ? ' selected' : '') + '>' + (pf.indexOf(p.id) >= 0 ? '★ ' : '') + esc(p.name) + ' · ' + num(p.fee) + '원</option>'; }).join('') + '</select>', '', r.plan ? '<small>' + esc(r.plan.data || '') + ' · <b class="num">' + won(r.fee) + '</b></small>' : '');
    if (!mv && r.subMode === 'select') h += row('선택약정', '<span class="num" data-o="selectOff">' + minus(r.selectOff) + '</span>', 'minus', '<small>' + (r.subMode === 'select' ? '25% 할인' : '미적용') + '</small>');
    if (!mv) h += row('결합 할인', '<button class="sel selbtn' + (s.bundle ? ' w-s' : '') + '" data-act="pickBundle">' + (s.bundle ? esc((D.bundles.find(function (b) { return b.id === s.bundle; }) || {}).name || '선택') : '미적용') + '</button>' + (s.bundle && !r.bAuto ? numIn('bundleAmt', s.bundleAmt, true, 'w-s') : ''), '', s.bundle ? (r.bAuto ? '<small class="num" data-o="bundleOff">' + minus(r.bundleOff) + '</small><small>' + esc(r.bAuto.note) + '</small>' : '<small>직접 입력</small>') : '');
    if (!mv) h += row('복지 할인', '<button class="sel selbtn' + (s.welfare ? ' w-s' : '') + '" data-act="pickWelfare">' + (s.welfare ? esc((wel.find(function (w) { return w.id === s.welfare; }) || {}).name || '선택') : '미적용') + '</button>', '', s.welfare ? '<small class="num" data-o="welOff">' + minus(r.welOff) + '</small>' : '');
    if (!mv) h += row('청구할인카드', '<button class="sel selbtn" data-act="pickCard">' + (r.card ? '[' + esc(r.card.issuer) + '] ' + esc(r.card.name) : '미적용') + '</button>');
    if (!mv && r.card) h += row('카드 전월 실적', '<select class="sel" data-k="cardTier">' + r.cardTiers.map(function (t, i) { return opt(i, num(t[0] / 10000) + '만원 이상 → 월 -' + num(t[1]), String(s.cardTier)); }).join('') + '</select>');
    if (!mv) h += row('군인 할인제도', '<button class="sel selbtn' + (s.military ? ' w-s' : '') + '" data-act="pickMilitary">' + (s.military ? '적용 (월정액 ' + r.milRate + '%)' : '미적용') + '</button>', '', s.military ? '<small class="num" data-o="milOff">' + minus(r.milOff) + '</small>' : '', true, s.military);
    if (!mv && ((D.famDisc || {})[s.carrier] || []).length) h += row('가족 할인', '<button class="sel selbtn' + (s.fam ? ' w-s' : '') + '" data-act="pickFam">' + (r.famD ? esc(r.famD.name) : '미적용') + '</button>', '', s.fam ? '<small class="num" data-o="famOff">' + minus(r.famOff) + '</small>' : '', true, !!s.fam);
    if (!mv) { var dI = (D.dualInfo || {})[s.carrier] || { name: '듀얼번호' }; h += row(esc(dI.name || '듀얼번호'), '<button class="sel selbtn' + (s.dual ? ' w-s' : '') + '" data-act="pickDual">' + (s.dual ? '적용 (월 ' + num(r.dual) + '원)' : '미적용') + '</button>', '', s.dual ? '<small class="num" data-o="dual">+' + num(r.dual) + '원</small>' : '<small>번호 하나 더</small>', true, s.dual); }
    h += row('프로모션', numIn('promo', s.promo, true), '', '<small>월 할인</small>', true, s.promo > 0);
    h += '<div class="row big b"><div class="k">월 요금</div><div class="v"><span class="num" data-o="planNet">' + won(r.planMonthly - r.cardOff) + '</span></div></div>';
    h += '</div><button class="more-btn" data-act="more">' + (DB.prefs.more ? '간단히 보기 ▲' : '할인 항목 더 보기 ▼') + '</button></section>';

    h += '<section class="card total-card"><div class="total"><div class="grid-t"><div>';
    h += '<div class="hero"><div class="lb">매달 내는 돈 (예상)</div><div class="big num" data-o="monthly">' + num(r.monthly) + '<small>원</small></div>';
    h += '<div class="eq num"><b class="a">A</b> <span data-o="eqA">' + num(r.instMonthly) + '</span> + <b class="b">B</b> <span data-o="eqB">' + num(r.planMonthly - r.cardOff) + '</span> + <b>C</b> <span data-o="eqC">' + num(r.addonFee) + '</span></div></div>';
    h += '<div class="subhead">C · 따로 내는 돈</div><div class="rows">';
    var cIns = r.addons.filter(function (a) { return a.kind === '보험'; })[0], cAdd = r.addons.filter(function (a) { return a.kind === '부가'; });
    h += row('유심', '<select class="sel" data-k="usim"><option value="">미적용</option>' + r.usims.map(function (u) { return '<option value="' + u.id + '"' + (r.usimItem && r.usimItem.id === u.id ? ' selected' : '') + '>' + esc(u.name) + ' · ' + num(u.fee) + '원</option>'; }).join('') + '</select>', '', '<small>첫 달 1회</small>');
    h += row('휴대폰보험', '<button class="sel selbtn" data-act="pickIns">' + (cIns ? esc(cIns.name) + ' · 월 ' + num(cIns.fee) + '원' : '미가입') + '</button>', '', cIns ? '<small>' + esc(cIns.grp || '') + '</small>' : '');
    h += row('부가서비스', '<button class="sel selbtn" data-act="pickAddon">' + (cAdd.length ? esc(cAdd[0].name) + (cAdd.length > 1 ? ' 외 ' + (cAdd.length - 1) + '개' : '') + ' · 월 ' + num(cAdd.reduce(function (t, a) { return t + n0(a.fee); }, 0)) + '원' : '미적용') + '</button>', '', cAdd.length ? '<small>' + cAdd.length + '개 선택</small>' : '');
    h += '</div></div><div>';
    h += '<div id="cmpBox">' + cmpHTML(s, r) + '</div>';
    h += '<div id="acBox">' + acHTML(s, plans) + '</div>';
    h += '<div class="acts"><button class="btn pri lg full" data-act="save">상담 저장</button><button class="btn" data-act="print">견적서 인쇄</button><button class="btn" data-act="copy">문자로 복사</button><button class="btn full red" data-act="reset">새 상담 (지우기)</button></div>';
    h += '</div></div></div></section>';
    return h + '</div>';
  }

  /* 중고폰 상담 (선택 바 + 계산) */
  function renderConsult() {
    var s = st(), r = G.calc(s);
    var cars = carriersFor(s.mode);
    var devName = r.dev ? r.dev.name + ' (' + r.dev.grade + '급)' : '';
    var h = '<div class="page-h"><h1>' + MODES[s.mode] + '</h1><div class="sub">중고폰은 공시지원금 없이 선택약정 25%로 계산해요.</div></div>';
    h += '<div class="card pick">';
    h += '<div><div class="lb"><span class="step">1</span>통신사</div><select class="sel" data-k="carrier" style="width:100%">' + cars.map(function (c) { return opt(c.id, c.name, s.carrier); }).join('') + '</select></div>';
    h += '<div><div class="lb"><span class="step">2</span>중고폰</div><button class="picker" data-act="pickDevice"><span class="t' + (devName ? '' : ' empty') + '">' + (devName ? esc(devName) : '눌러서 선택') + '</span>' + (r.dev ? '<span class="v num">' + num(r.price) + '원</span>' : '') + '</button></div>';
    h += '<div><div class="lb"><span class="step">3</span>요금제</div><button class="picker" data-act="pickPlan"><span class="t' + (r.plan ? '' : ' empty') + '">' + (r.plan ? esc(r.plan.name) : '눌러서 선택') + '</span>' + (r.plan ? '<span class="v num">' + num(r.plan.fee) + '원</span>' : '') + '</button></div>';
    h += '<div><div class="lb"><span class="step">4</span>지원 방식</div><div class="locked">' + (r.mvno ? '알뜰폰은 지원금 없음' : '선택약정 25%만 가능') + '</div></div>';
    h += '</div>';
    h += hint('① 통신사 → ② 중고폰 → ③ 요금제 순서로 고르면 아래에 매달 내는 돈이 나와요.');
    h += consultCols(s, r);
    app.innerHTML = '<div class="wrap">' + h + '</div>' + mbar(r);
  }

  function cmpHTML(s, r) {
    if (r.mvno || s.mode === 'used' || r.special || !r.dev || !r.plan) return '';
    var rc = G.calc(s, { subMode: 'common' }), rs = G.calc(s, { subMode: 'select' });
    var cheap = rc.total24 <= rs.total24 ? 'common' : 'select';
    var h = '<div class="subhead">' + (s.subMode === 'select' ? '선택약정 25%' : '공통지원금') + ' (24개월 합계)</div><div class="cmp one">';
    [['common', '공통지원금', rc], ['select', '선택약정 25%', rs]].filter(function (x) { return x[0] === (s.subMode === 'select' ? 'select' : 'common'); }).forEach(function (x) {
      h += '<button data-set="subMode" data-v="' + x[0] + '" class="' + (s.subMode === x[0] ? 'on' : '') + '"><div class="n">' + x[1] + (cheap === x[0] ? ' <span class="tag">더 저렴</span>' : '') + '</div><div class="m num">월 ' + num(x[2].monthly) + '원</div><div class="d num">24개월 ' + num(x[2].total24) + '원</div></button>';
    });
    return h + '</div>';
  }
  function acHTML(s, plans) {
    var ac = G.afterChange(s, s.changePlan);
    var h = '<div class="subhead">7개월째 요금제를 바꾸면</div><div class="rows">';
    h += row('바꿀 요금제', '<select class="sel" data-k="changePlan"><option value="">선택 안 함</option>' + plans.map(function (p) { return opt(p.id, p.name + ' ' + num(p.fee), s.changePlan); }).join('') + '</select>');
    h += row('바뀐 뒤 매달', ac ? '<span class="num" style="color:var(--red)">' + won(ac.monthly) + '</span>' : '<span class="num" style="color:var(--mute)">-</span>', '', ac ? '<small class="num">지금보다 ' + (ac.diff <= 0 ? '' : '+') + num(ac.diff) + '원</small>' : '');
    return h + '</div>';
  }

  function row(k, v, cls, ksub, adv, usedFlag) {
    return '<div class="row' + (adv ? ' adv' : '') + (usedFlag ? ' used' : '') + '"><div class="k">' + k + (ksub || '') + '</div><div class="v ' + (cls || '') + '">' + v + '</div></div>';
  }
  function opt(v, t, cur) { return '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(t) + '</option>'; }
  function numIn(k, v, manual, cls) { return '<input class="in ' + (manual ? 'manual ' : '') + (cls || '') + '" inputmode="numeric" data-k="' + k + '" data-num="1" value="' + (n0(v) ? num(v) : '') + '" placeholder="0">'; }

  function refresh() {
    var s = st(), r = G.calc(s);
    var out = {
      price: won(r.price), common: minus(r.common), cash: minus(r.cash), principal: won(r.principal), instFee: won(r.instFee), instMonthly: won(r.instMonthly),
      selectOff: minus(r.selectOff), welOff: minus(r.welOff), milOff: minus(r.milOff), famOff: minus(r.famOff || 0), dual: r.dual ? '+' + num(r.dual) + '원' : '0원',
      planNet: won(r.planMonthly - r.cardOff), monthly: num(r.monthly), monthly2: num(r.monthly) + '원',
      eqA: num(r.instMonthly), eqB: num(r.planMonthly - r.cardOff), eqC: num(r.addonFee)
    };
    $$('[data-o]').forEach(function (el) {
      var k = el.getAttribute('data-o'); if (!(k in out)) return;
      if (k === 'monthly') el.innerHTML = out[k] + '<small>원</small>'; else el.textContent = out[k];
    });
    var cb = $('#cmpBox'); if (cb) cb.innerHTML = cmpHTML(s, r);
    var ab = $('#acBox'); if (ab) ab.innerHTML = acHTML(s, DB.plansOf(s.carrier));
    saveDraft();
  }

  /* ---------- 선택 창 ---------- */
  function modal(title, body, opts) {
    opts = opts || {};
    closeModal();
    var bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal';
    bg.innerHTML = '<div class="modal ' + (opts.size || '') + '"><div class="modal-h"><h3>' + title + '</h3><button class="x" data-close aria-label="닫기">×</button></div>' + body + '</div>';
    bg.addEventListener('click', function (e) { if (e.target === bg || e.target.hasAttribute('data-close')) closeModal(); });
    document.body.appendChild(bg);
    var f = $('.search', bg); if (f && window.innerWidth > 760) f.focus();
    return bg;
  }
  function closeModal() { var m = $('#modal'); if (m) m.remove(); }

  function pickDevice() {
    var s = st(), maker = '전체', q = '';
    var body = '<div class="modal-tools"><div class="seg" style="width:auto">' + ['전체', 'S', 'A', 'B', 'C'].map(function (m) { return '<button data-mk="' + m + '" class="' + (m === '전체' ? 'on' : '') + '" style="padding:0 16px">' + (m !== '전체' ? m + '급' : m) + '</button>'; }).join('') + '</div><input class="search" placeholder="모델명 검색"></div>' +
      '<div class="modal-b one"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>모델명</th><th>등급</th><th class="r">배터리</th><th class="hide-m">색상</th><th class="hide-m">보유 매장</th><th class="r">판매가</th></tr></thead><tbody></tbody></table></div></div>';
    var m = modal('중고폰 선택', body), tbody = $('tbody', m);
    function draw() {
      var list = DB.data.usedStock.filter(function (d) { return (maker === '전체' || d.grade === maker) && (!q || d.name.toLowerCase().indexOf(q) >= 0); });
      list.sort(function (a, b) { return (b.store === DB.prefs.store) - (a.store === DB.prefs.store); });
      tbody.innerHTML = list.map(function (d) { return '<tr data-id="' + d.id + '" class="' + (s.device === d.id ? 'on' : '') + '"><td class="b">' + esc(d.name) + '</td><td><span class="tag ' + (d.grade === 'S' ? 'g' : d.grade === 'A' ? 'k' : 'y') + '">' + esc(d.grade) + '급</span></td><td class="r">' + n0(d.battery) + '%</td><td class="hide-m">' + esc(d.color) + '</td><td class="hide-m">' + esc(DB.store(d.store).name) + '</td><td class="r b">' + num(d.price) + '</td></tr>'; }).join('') || '<tr><td colspan="6" class="empty-note">맞는 중고폰이 없어요. [관리 → 중고폰 재고]에서 등록해요.</td></tr>';
    }
    draw();
    $$('[data-mk]', m).forEach(function (b) { b.onclick = function () { maker = b.getAttribute('data-mk'); $$('[data-mk]', m).forEach(function (x) { x.classList.toggle('on', x === b); }); draw(); }; });
    $('.search', m).oninput = function (e) { q = e.target.value.trim().toLowerCase(); draw(); };
    tbody.addEventListener('click', function (e) { var tr = e.target.closest('tr[data-id]'); if (!tr) return; s.device = tr.getAttribute('data-id'); s.priceEdit = null; s.subMode = 'select'; closeModal(); render(); });
  }

  /* ---------- 요금제 그룹 (이름으로 자동 분류, 관리에서 grp로 직접 지정 가능) ---------- */
  var PSEG = [['adult', '성인'], ['young', '청년'], ['teen', '청소년'], ['kids', '키즈'], ['senior', '어르신'], ['army', '현역병사'], ['welfare', '복지'], ['voice', '음성 전용'], ['foreign', '외국인'], ['device', '스마트기기 · 워치']];
  var PSEG_FLAT = { voice: 1, foreign: 1, device: 1 };
  function gName(nt, sg, cid) { if (PSEG_FLAT[sg[0]]) return sg[1]; return nt + ' ' + (sg[0] === 'young' ? (cid === 'lgu' ? '유쓰' : cid === 'kt' ? 'Y청년' : '청년') : sg[1]); }
  function planNet(p) { return p.net || (/LTE|T플랜|T끼리|손누리|소리누리|복지 1|복지 2|표준/.test(p.name) ? 'LTE' : '5G'); }
  function planSeg(p) {
    if (p.seg) return p.seg;
    var n = p.name;
    if (/병사|군인/.test(n)) return 'army';
    if (/복지|손누리|소리누리/.test(n)) return 'welfare';
    if (/시니어|어르신|실버|65\+덤|75\+덤/.test(n)) return 'senior';
    if (/키즈|ZEM|주니어|어린이/.test(n)) return 'kids';
    if (/청소년|틴|스쿨덤/.test(n)) return 'teen';
    if (/청년|유쓰|\bY\b|Y덤/.test(n)) return 'young';
    return 'adult';
  }
  function planGroup(p, cid) { var sg = PSEG.find(function (x) { return x[0] === planSeg(p); }) || PSEG[0]; return gName(planNet(p), sg, cid); }
  function selOff(fee) { return Math.round(n0(fee) * 0.25 / 10) * 10; }
  function pickPlan() {
    var s = st(), car = DB.carrier(s.carrier) || {}, mv = !!car.mvno;
    var showSub = !mv && s.mode !== 'used' && s.device && !(DB.device(s.device) || {}).special;
    var all = DB.plansOf(s.carrier), fav = DB.prefs.planFav = DB.prefs.planFav || [];
    var GC = {}; all.forEach(function (p) { GC[p.id] = planGroup(p, s.carrier); });
    var order = []; ['5G', 'LTE'].forEach(function (nt) { PSEG.forEach(function (sg) { var g = gName(nt, sg, s.carrier); if (order.indexOf(g) < 0 && all.some(function (p) { return GC[p.id] === g; })) order.push(g); }); });
    var favHere = all.filter(function (p) { return fav.indexOf(p.id) >= 0; }).length;
    var curP = DB.plan(s.plan), grp = favHere ? 'fav' : curP ? planGroup(curP, s.carrier) : (order[0] || 'all'), q = '', sort = 'base', fData = '', fSub = '', open = '';
    if (mv && !favHere) grp = 'all';
    var head = '<div class="pp-top"><button class="pp-tb" data-pp="tier">' + svgI('tier') + '지급구간</button><button class="pp-tb" data-pp="cmp">' + svgI('cmp') + '요금제 비교</button><span class="pp-note">부가세 포함 · ' + (showSub ? '지원금은 ' + esc((DB.device(s.device) || {}).name || '') + ' 기준' : '단말기를 고르면 지원금이 보여요') + '</span></div>';
    var body = head + '<div class="pp"><div class="pp-l" data-g></div><div class="pp-r"><div class="pp-bar"><select class="sel pp-sort" data-sort><option value="base">기본정렬순</option><option value="hi">요금 높은순</option><option value="lo">요금 낮은순</option>' + (showSub ? '<option value="sub">지원금 많은순</option>' : '') + '</select><div class="pp-s"><input class="search" data-q placeholder="요금제 이름 검색 (예: 라이트, 시니어, 5GB)"><button class="ag-x" data-qx aria-label="지우기">×</button></div></div>' +
      '<div class="pp-f"><label>데이터 <select class="sel" data-fd><option value="">전체</option><option value="unl">무제한</option><option value="big">15GB 이상</option><option value="small">15GB 미만</option></select></label>' + (showSub ? '<label>지원금 <select class="sel" data-fs><option value="">전체</option><option value="y">공통지원금 있는 것</option></select></label>' : '') + '</div>' +
      '<div class="pp-list"><div class="pp-hd"><span></span><span>요금제명</span><span class="r">월정액</span><span class="r">' + (mv ? '' : '지원금 (24개월)') + '</span><span></span></div><div data-list></div></div></div></div>';
    var m = modal(esc(car.name || '') + ' 요금제', body);
    m.querySelector('.modal').classList.add('pp-modal');
    function gb(p) { var d = String(p.data || ''); if (/무제한/.test(d)) return 999; var x = parseFloat(d); if (isNaN(x)) return 0; return /MB/i.test(d) ? x / 1000 : x; }
    function inG(p, g) { return g === 'all' ? true : g === 'fav' ? fav.indexOf(p.id) >= 0 : GC[p.id] === g; }
    function drawG() {
      var gs = [['fav', '★ 즐겨찾기']].concat(mv ? [] : order.map(function (g) { return [g, g]; })).concat([['all', '전체']]);
      $('[data-g]', m).innerHTML = gs.map(function (x) { var c = all.filter(function (p) { return inG(p, x[0]); }).length; return '<button data-grp="' + esc(x[0]) + '" class="' + (grp === x[0] ? 'on' : '') + '">' + esc(x[1]) + '<small>' + c + '</small></button>'; }).join('');
    }
    function drawL() {
      var nq = q.trim();
      var rows = all.filter(function (p) {
        if (nq) { if (!planHit(p, nq, GC[p.id])) return false; } else if (!inG(p, grp)) return false;
        var g = gb(p);
        if (fData === 'unl' && g < 999) return false; if (fData === 'big' && g < 15) return false; if (fData === 'small' && g >= 15) return false;
        if (fSub && !DB.subsidy(s.device, s.carrier, p.id)) return false;
        return true;
      });
      if (sort === 'hi') rows.sort(function (a, b) { return b.fee - a.fee; });
      else if (sort === 'lo') rows.sort(function (a, b) { return a.fee - b.fee; });
      else if (sort === 'sub') rows.sort(function (a, b) { return DB.subsidy(s.device, s.carrier, b.id) - DB.subsidy(s.device, s.carrier, a.id); });
      rows = rows.map(function (p, i) { return [p, i]; }).sort(function (a, b) { return ((fav.indexOf(b[0].id) >= 0) - (fav.indexOf(a[0].id) >= 0)) || a[1] - b[1]; }).map(function (x) { return x[0]; });
      $('[data-list]', m).innerHTML = rows.map(function (p) {
        var on = fav.indexOf(p.id) >= 0, so = selOff(p.fee), rs = showSub && planSeg(p) !== 'device', c = rs ? DB.subsidy(s.device, s.carrier, p.id) : 0;
        var feat = '<span class="ic-call">' + esc(p.call || '기본 제공') + '</span><span class="ic-sms">' + esc(p.sms || '기본 제공') + '</span><span class="ic-data">' + esc(p.data || '-') + '</span>';
        var sub = mv ? '' : '<div class="pp-sub">' + (rs ? '<div><em>공통</em><b class="num' + (c >= so * 24 ? ' hi' : '') + '">' + num(c) + '원</b></div>' : '') + '<div><em>선약</em><b class="num' + (!rs || so * 24 > c ? ' hi' : '') + '">' + num(so * 24) + '원</b></div><small class="num">(월 ' + num(so) + '원)</small></div>';
        return '<div class="pp-row' + (s.plan === p.id ? ' cur' : '') + '" data-pick="' + p.id + '"><button class="ao-star' + (on ? ' on' : '') + '" data-pfav="' + p.id + '" title="즐겨찾기">' + (on ? '★' : '☆') + '</button>' +
          '<div class="pp-nm"><b>' + esc(p.name) + (s.plan === p.id ? '<span class="ao-b fit">지금 선택</span>' : '') + '</b><div class="pp-ft">' + feat + '</div></div>' +
          '<div class="pp-fee"><b class="num">' + num(p.fee) + '원</b>' + (mv ? '' : '<small class="num">선택약정 반영 시 ' + num(p.fee - so) + '원</small>') + '</div>' + sub +
          '<button class="pp-dt" data-pdt="' + p.id + '" title="상세">' + svgI('zoom') + '</button>' +
          (open === p.id ? '<div class="pp-desc">' + esc(p.desc || '') + '<br>구간: ' + n0(p.tier) + '구간 · ' + esc(planGroup(p, s.carrier)) + '</div>' : '') + '</div>';
      }).join('') || '<div class="empty-note">' + (grp === 'fav' && !q ? '☆를 누르면 즐겨찾기에 들어가요.' : '맞는 요금제가 없어요.') + '</div>';
    }
    m.addEventListener('click', function (e) {
      var t = e.target;
      var f = t.closest('[data-pfav]'); if (f) { e.stopPropagation(); var id = f.getAttribute('data-pfav'), k = fav.indexOf(id); if (k >= 0) fav.splice(k, 1); else fav.push(id); DB.savePrefs(); drawG(); drawL(); return; }
      var d = t.closest('[data-pdt]'); if (d) { e.stopPropagation(); open = open === d.getAttribute('data-pdt') ? '' : d.getAttribute('data-pdt'); drawL(); return; }
      var g = t.closest('[data-grp]'); if (g) { grp = g.getAttribute('data-grp'); q = ''; $('[data-q]', m).value = ''; drawG(); drawL(); return; }
      if (t.closest('[data-qx]')) { q = ''; $('[data-q]', m).value = ''; drawL(); return; }
      var pp = t.closest('[data-pp]'); if (pp) { if (pp.getAttribute('data-pp') === 'tier') tierModal(s); else { s.view = 'plans'; closeModal(); render(); } return; }
      var r = t.closest('[data-pick]'); if (r) { s.plan = r.getAttribute('data-pick'); s.planAuto = false; closeModal(); render(); }
    });
    var qT = 0; $('[data-q]', m).addEventListener('input', function (e) { var v = e.target.value.trim(); clearTimeout(qT); qT = setTimeout(function () { q = v; drawL(); }, 90); });
    $('[data-sort]', m).onchange = function (e) { sort = e.target.value; drawL(); };
    $('[data-fd]', m).onchange = function (e) { fData = e.target.value; drawL(); };
    var fs = $('[data-fs]', m); if (fs) fs.onchange = function (e) { fSub = e.target.value; drawL(); };
    drawG(); drawL();
    var cur = $('.pp-row.cur', m); if (cur) cur.scrollIntoView({ block: 'center' });
  }
  function svgI(k) {
    var a = 'width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
    if (k === 'tier') return '<svg ' + a + '><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>';
    if (k === 'cmp') return '<svg ' + a + '><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';
    return '<svg ' + a + '><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>';
  }
  function tierModal(s) {
    var car = DB.carrier(s.carrier) || {}, dev = DB.device(s.device), all = DB.plansOf(s.carrier);
    var arr = dev ? ((DB.data.subsidy[dev.id] || {})[s.carrier] || []) : [];
    var rows = [1, 2, 3, 4, 5].map(function (t) {
      var ps = all.filter(function (p) { return n0(p.tier) === t; }), fees = ps.map(function (p) { return p.fee; });
      var range = fees.length ? num(Math.min.apply(null, fees)) + ' ~ ' + num(Math.max.apply(null, fees)) + '원' : '-';
      var cur = DB.plan(s.plan), on = cur && n0(cur.tier) === t;
      return '<tr class="' + (on ? 'on' : '') + '"><td><b>' + t + '구간</b>' + (on ? ' <span class="ao-b fit">지금 요금제</span>' : '') + '</td><td class="num">' + range + '</td><td class="num">' + ps.length + '개</td><td class="r num b">' + (dev ? num(n0(arr[t - 1])) + '원' : '-') + '</td></tr>';
    }).join('');
    var h = '<div class="ins-info">' + esc(car.name || '') + (dev ? ' · ' + esc(dev.name) : ' · 단말기를 고르면 금액이 보여요') + ' · 공통지원금은 요금제 구간에 따라 달라요</div><div class="ins-body"><table class="ins-t"><thead><tr><th>구간</th><th>월정액 범위</th><th>요금제 수</th><th class="r">공통지원금</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="modal-f"><span class="ao-sum" style="font-weight:600;color:var(--sub)">구간 기준: 1구간 85,000원↑ · 2구간 68,000원↑ · 3구간 55,000원↑ · 4구간 47,000원↑ · 5구간 그 아래</span></div>';
    var prev = $('#modal'); if (prev) prev.style.display = 'none';
    var bg = document.createElement('div'); bg.className = 'modal-bg'; bg.id = 'modal2';
    bg.innerHTML = '<div class="modal sm" style="max-width:720px"><div class="modal-h"><h3>지급구간</h3><button class="x" data-close2 aria-label="닫기">×</button></div>' + h + '</div>';
    bg.addEventListener('click', function (e) { if (e.target === bg || e.target.hasAttribute('data-close2')) { bg.remove(); if (prev) prev.style.display = ''; } });
    document.body.appendChild(bg);
  }

  function pickList(title, items, cur, onPick) {
    var body = '<div class="list">' + items.map(function (x) { return '<button class="li' + (cur === x.id ? ' on' : '') + '" data-id="' + x.id + '"><div><div class="nm">' + esc(x.name) + '</div><div class="ds">' + esc(x.desc || '') + '</div></div><div class="am num">' + esc(x.amt || '') + '</div></button>'; }).join('') + '</div>' +
      '<div class="modal-f"><button class="btn" data-id="">미적용</button></div>';
    var m = modal(title, '<div style="overflow:auto">' + body + '</div>', { size: 'sm' });
    $$('[data-id]', m).forEach(function (b) { b.onclick = function () { onPick(b.getAttribute('data-id')); closeModal(); render(); }; });
  }
  /* ---------- 할인 선택 창 (카드 · 결합 · 복지 · 군인) ---------- */
  var CARD_SORT = [['base', '기본정렬순'], ['fav', '즐겨찾기순'], ['hi', '할인액높은순'], ['promo', '프로모션순'], ['name', '이름순']];
  function cardArt(c) {
    var col = c.color || '#3D3F45', lt = /^#(F|E|D[0-9A-F])/i.test(col);
    return '<span class="dc-art" style="background:linear-gradient(135deg,' + col + ' 0%,' + col + 'cc 60%,' + col + '99 100%);color:' + (lt ? '#333' : '#fff') + '"><i></i><em>' + esc(c.issuer || '') + '</em></span>';
  }
  function pickCardKind(kind) {
    var s = st(), light = kind === 'light', list = (light ? DB.data.lightCards : DB.data.cards).filter(function (c) { return c.carrier === s.carrier; });
    var favKey = light ? 'lightFav' : 'cardFav', fav = DB.prefs[favKey] = DB.prefs[favKey] || [], sort = 'base';
    var md = DB.model((DB.device(s.device) || {}).model) || {};
    var info = light ? '<div class="dc-info"><b>※ 라이트할부란?</b> 휴대폰 할부금 일부를 카드할부로 결제하고, 카드 사용 실적에 따라 카드사에서 휴대폰 할부를 할인받는 서비스예요.</div>' : '<div class="dc-info"><b>※ 청구할인카드</b> 통신요금을 제휴카드로 자동이체하면 전월 카드 실적에 따라 매달 요금을 할인받아요.</div>';
    var body = info + '<div class="dc-sort">' + CARD_SORT.map(function (x) { return '<button data-cs="' + x[0] + '" class="' + (x[0] === sort ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div><div class="dc-list" data-l></div>' +
      '<div class="modal-f"><button class="btn lg" data-none>미적용</button></div>';
    var m = modal(light ? '라이트할부 카드 선택' : '청구할인 카드 선택', body);
    m.querySelector('.modal').classList.add('dc-modal');
    function maxOff(c) { return Math.max.apply(null, G.tiers(c).map(function (t) { return t[1]; }).concat([0])); }
    function draw() {
      var rows = list.map(function (c, i) { return [c, i]; });
      rows.sort(function (a, b) {
        if (sort === 'fav') return (fav.indexOf(b[0].id) >= 0) - (fav.indexOf(a[0].id) >= 0) || a[1] - b[1];
        if (sort === 'hi') return maxOff(b[0]) - maxOff(a[0]) || a[1] - b[1];
        if (sort === 'promo') return (!!b[0].promo) - (!!a[0].promo) || a[1] - b[1];
        if (sort === 'name') return a[0].name.localeCompare(b[0].name, 'ko');
        return (fav.indexOf(b[0].id) >= 0) - (fav.indexOf(a[0].id) >= 0) || a[1] - b[1];
      });
      var cur = light ? s.light : s.card;
      $('[data-l]', m).innerHTML = rows.map(function (x) {
        var c = x[0], on = fav.indexOf(c.id) >= 0, bad = c.maker && md.maker && c.maker !== md.maker;
        var tl = G.tiers(c).map(function (t) { return '<div><span>전월실적 ' + num(t[0]) + '원 이상</span> <b class="num">' + num(t[1]) + '원</b> 할인</div>'; }).join('');
        var pr = String(c.promo || '').split(',').filter(Boolean).map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('');
        return '<div class="dc-row' + (cur === c.id ? ' on' : '') + (bad ? ' off' : '') + '" data-pick="' + c.id + '"><button class="ao-star' + (on ? ' on' : '') + '" data-cfav="' + c.id + '">' + (on ? '★' : '☆') + '</button>' +
          '<span class="dc-iss">' + esc(c.issuer || '') + '</span>' + cardArt(c) +
          '<div class="dc-nm">' + (c.note ? '<small>* ' + esc(c.note) + (bad ? ' · 이 폰은 안 돼요' : '') + '</small>' : '') + '<b>' + esc(c.name) + '</b>' + (cur === c.id ? '<span class="ao-b fit">지금 선택</span>' : '') + '</div>' +
          '<div class="dc-tiers">' + tl + '</div><div class="dc-pr">' + pr + '</div></div>';
      }).join('') || '<div class="empty-note">이 통신사 카드가 아직 없어요. [관리]에서 넣을 수 있어요.</div>';
    }
    m.addEventListener('click', function (e) {
      var t = e.target, f = t.closest('[data-cfav]');
      if (f) { e.stopPropagation(); var id = f.getAttribute('data-cfav'), k = fav.indexOf(id); if (k >= 0) fav.splice(k, 1); else fav.push(id); DB.savePrefs(); draw(); return; }
      var so = t.closest('[data-cs]'); if (so) { sort = so.getAttribute('data-cs'); $$('[data-cs]', m).forEach(function (b) { b.classList.toggle('on', b === so); }); draw(); return; }
      if (t.closest('[data-none]')) { if (light) { s.light = ''; s.lightAmt = 0; s.lightTier = 0; } else { s.card = ''; s.cardTier = 0; } closeModal(); render(); return; }
      var r = t.closest('[data-pick]'); if (r) { var id2 = r.getAttribute('data-pick'); if (light) { s.light = id2; s.lightTier = 0; s.lightAmt = 0; } else { s.card = id2; s.cardTier = 0; } closeModal(); render(); }
    });
    draw();
  }
  function pickBundleBig() {
    var s = st(), list = DB.data.bundles.filter(function (b) { return b.carrier === s.carrier; });
    var body = '<div class="dg-list">' + list.map(function (b) {
      var tg = String(b.tags || '').split(/[,+]/).map(function (x) { return x.trim(); }).filter(Boolean);
      return '<div class="dg-row' + (s.bundle === b.id ? ' on' : '') + (b.note ? ' old' : '') + '" data-pick="' + b.id + '"><div class="dg-k">' + esc(b.name) + (b.calc ? '<small class="dg-auto">자동 계산</small>' : '') + '</div><div class="dg-v">' + (b.note ? '<div class="dg-note">* ' + esc(b.note) + '</div>' : '') +
        String(b.desc || '').split('\n').map(function (l) { return '<div' + (/^※/.test(l) ? ' class="sm"' : '') + '>' + (/^※/.test(l) ? '' : '▶ ') + esc(l) + '</div>'; }).join('') + '</div>' +
        '<div class="dg-tag">' + tg.map(function (x) { return '<span class="' + (x === '무무선' ? 'mm' : 'ym') + '">' + esc(x) + '</span>'; }).join('') + '</div></div>';
    }).join('') + '</div><div class="modal-f"><button class="btn lg" data-none>미적용</button></div>';
    var m = modal('결합 선택', body); m.querySelector('.modal').classList.add('dg-modal');
    m.addEventListener('click', function (e) {
      if (e.target.closest('[data-none]')) { s.bundle = ''; s.bundleAmt = 0; closeModal(); render(); return; }
      var r = e.target.closest('[data-pick]'); if (!r) return;
      var b = DB.data.bundles.find(function (x) { return x.id === r.getAttribute('data-pick'); });
      if (!b.calc) { s.bundle = b.id; s.bundleAmt = n0(b.value); closeModal(); render(); return; }
      closeModal(); bundleSetup(b);
    });
  }
  /* 결합 인원 · 인터넷 · 가족 요금 합계를 고르면 이 회선 할인을 바로 계산 */
  function bundleSetup(b) {
    var s = st(), car = s.carrier;
    var t = { bundleN: s.bundle === b.id && s.bundleN ? s.bundleN : Math.max(n0(b.minN) || 1, 2), bundleNet: s.bundle === b.id ? s.bundleNet : '', bundleTotal: s.bundle === b.id ? s.bundleTotal : 0, bundleOne: s.bundle === b.id && s.bundleOne, bundleTeen: s.bundle === b.id && s.bundleTeen, bundleBase: s.bundle === b.id && s.bundleBase, bundleLong: s.bundle === b.id ? s.bundleLong : 0, bundleOpt: s.bundle === b.id ? s.bundleOpt : '', bundleAdds: s.bundle === b.id && s.bundleAdds ? s.bundleAdds.slice() : [] };
    if (!t.bundleOpt && b.opts) t.bundleOpt = b.opts[0].k;
    if (!t.bundleNet && b.nets) t.bundleNet = b.nets[0].k;
    function tbl() {
      var h = '';
      if (b.calc === 'perLine') {
        var cols = (b.cuts || [0]).map(function (c, i) { return c === 0 ? (b.cuts.length > 1 ? num(b.cuts[1]) + '원 미만' : '할인') : num(c) + '원 이상'; });
        var keys = Object.keys(b.rows).map(Number).sort(function (x, y) { return x - y; });
        h = '<tr><th>회선 수</th>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>' + keys.map(function (k, i) { var nx = keys[i + 1], lb = nx ? (nx - k > 1 ? k + '~' + (nx - 1) : k) : (k < (b.maxN || k) ? k + '~' + b.maxN : k); return '<tr><td>' + lb + '회선</td>' + b.rows[k].map(function (v) { return '<td>' + (v ? num(v) + '원' : '-') + '</td>'; }).join('') + '</tr>'; }).join('');
      } else if (b.calc === 'group') {
        var ns = [1, 2, 3, 4, 5];
        h = '<tr><th></th>' + ns.map(function (k) { return '<th>' + k + '회선</th>'; }).join('') + '</tr>' + b.nets.map(function (nt) { return '<tr><td>' + esc(nt.l) + '</td>' + ns.map(function (k) { return '<td>' + (nt.t[k] ? num(nt.t[k]) + '원' : '-') + '</td>'; }).join('') + '</tr>'; }).join('');
        h += '<tr><td colspan="6" class="sm">가족 휴대폰 할인 총액이에요. 회선마다 똑같이 나누거나 1회선에 몰아서 받아요.</td></tr>';
      } else if (b.calc === 'total') {
        h = '<tr><th>가족 휴대폰 월정액 합계</th>' + b.nets.map(function (nt) { return '<th>' + esc(nt.l) + '</th>'; }).join('') + '</tr>' + b.cuts.map(function (c, i) { var nx = b.cuts[i + 1]; return '<tr><td>' + (nx ? num(c) + ' ~ ' + num(nx - 1) + '원' : num(c) + '원 이상') + '</td>' + b.nets.map(function (nt) { return '<td>' + (nt.m[i] ? num(nt.m[i]) + '원' : '-') + '</td>'; }).join('') + '</tr>'; }).join('');
        h += '<tr><td colspan="3" class="sm">휴대폰 할인 총액이에요 (인터넷 할인은 따로). 인원수대로 나누거나 1대에 몰아서 받아요.</td></tr>';
      } else if (b.calc === 'tier') {
        h = '<tr><th>내 요금제 월정액</th><th>회선마다 할인</th></tr>' + b.tiers.map(function (x, i) { var nx = b.tiers[i + 1]; return '<tr><td>' + (nx ? (x[0] ? num(x[0]) + '원 이상 ~ ' : '') + num(nx[0]) + '원 미만' : num(x[0]) + '원 이상') + '</td><td>' + (x[1] ? num(x[1]) + '원' : '-') + '</td></tr>'; }).join('');
      } else if (b.calc === 'pct') {
        h = '<tr><th>대상</th><th>할인</th></tr><tr><td>월정액 ' + num(b.minFee) + '원 이상 · 2~' + b.maxN + '번째 회선</td><td>월정액 ' + b.rate + '%</td></tr><tr><td>베이스(첫 번째) 회선</td><td>총액 · 정액 결합으로 따로</td></tr>' + (b.teen ? '<tr><td>청소년 자녀 (' + num(b.teenMinFee) + '원 이상 5G)</td><td>+' + num(b.teen) + '원</td></tr>' : '');
      } else if (b.calc === 'opt') {
        if (b.cuts) h = '<tr><th>선택</th><th>' + num(b.cuts[1]) + '원 미만</th><th>' + num(b.cuts[1]) + '원 이상</th></tr>' + b.opts.map(function (o) { return '<tr><td>' + esc(o.l) + '</td>' + o.amt.map(function (v) { return '<td>' + num(v) + '원</td>'; }).join('') + '</tr>'; }).join('');
        else h = '<tr><th>선택</th><th>할인</th></tr>' + b.opts.map(function (o) { return '<tr><td>' + esc(o.l) + '</td><td>월정액 × ' + o.pct + '%</td></tr>'; }).join('');
        (b.adds || []).forEach(function (a) { h += '<tr><td>' + esc(a.l) + '</td><td colspan="2">+' + num(a.amt) + '원 (대표자 1인)</td></tr>'; });
      }
      return '<table class="bs-t">' + h + '</table>';
    }
    function draw() {
      var tmp = {}; Object.keys(s).forEach(function (k) { tmp[k] = s[k]; }); Object.keys(t).forEach(function (k) { tmp[k] = t[k]; }); tmp.bundle = b.id;
      var r = G.calc(tmp, {}), au = r.bAuto || { amt: 0, note: '' };
      var h = '<div class="bs-desc">' + String(b.desc || '').split('\n').map(function (l) { return '<div' + (/^※/.test(l) ? ' class="sm"' : '') + '>' + esc(l) + '</div>'; }).join('') + '</div>';
      if (b.red) h += '<div class="bs-red">' + esc(b.red) + '</div>';
      if (b.calc !== 'opt') {
      h += '<div class="bs-f"><label>결합 회선 수 (이 손님 포함)</label><div class="bs-n">';
      for (var k = 1; k <= (b.maxN || 5); k++) h += '<button data-n="' + k + '" class="' + (t.bundleN === k ? 'on' : '') + (k < (b.minN || 1) ? ' off' : '') + '">' + k + (k === (b.maxN || 5) && b.maxN > 5 ? '+' : '') + '</button>';
      h += '</div></div>';
      }
      if (b.calc === 'opt' && b.cards) h += '<div class="bs-cards">' + b.opts.map(function (o) { return '<button data-opt="' + o.k + '" class="bs-card' + (t.bundleOpt === o.k ? ' on' : '') + '"><span class="bc-s">' + esc(o.sub || '') + '</span><b>' + esc(o.l) + '</b><span class="bc-v">' + num(Math.floor((r.fee * (o.pct || 0)) / 1000) * 10) + '원 할인</span></button>'; }).join('') + '</div>';
      else if (b.calc === 'opt') h += '<div class="bs-radio">' + b.opts.map(function (o) { return '<label class="bs-ro' + (t.bundleOpt === o.k ? ' on' : '') + '"><input type="radio" name="bsopt" data-opt="' + o.k + '"' + (t.bundleOpt === o.k ? ' checked' : '') + '><span>' + esc(o.l) + '</span><em>' + num((o.amt || [])[r.fee >= (b.cuts || [0, 0])[1] ? 1 : 0] || 0) + '원</em></label>'; }).join('') + '</div>';
      (b.adds || []).forEach(function (a) { var on = t.bundleAdds.indexOf(a.k) >= 0, dis = a.need && t.bundleAdds.indexOf(a.need) < 0; h += '<label class="chk bs-chk bs-add' + (dis ? ' dis' : '') + '"><input type="checkbox" data-add="' + a.k + '"' + (on && !dis ? ' checked' : '') + (dis ? ' disabled' : '') + '> <span><b>' + esc(a.l) + '</b> <small>[' + esc(a.cond) + ']</small></span></label>'; });
      if (b.nets) h += '<div class="bs-f"><label>인터넷</label><div class="bs-n wide">' + b.nets.map(function (nt) { return '<button data-net="' + nt.k + '" class="' + (t.bundleNet === nt.k ? 'on' : '') + '">' + esc(nt.l) + '</button>'; }).join('') + '</div></div>';
      if (b.calc === 'total') h += '<div class="bs-f"><label>가족 휴대폰 월정액 합계</label><div class="bs-in"><input class="num" data-total inputmode="numeric" value="' + (t.bundleTotal ? num(t.bundleTotal) : '') + '" placeholder="' + num(r.fee * t.bundleN) + ' (모두 같은 요금제일 때)"><span>원</span></div></div>';
      if (b.calc === 'group' || b.calc === 'total') h += '<div class="bs-f"><label>받는 방법</label><div class="bs-n wide"><button data-one="0" class="' + (!t.bundleOne ? 'on' : '') + '">회선마다 똑같이 나눠받기</button><button data-one="1" class="' + (t.bundleOne ? 'on' : '') + '">이 회선에 몰아받기</button></div></div>';
      if (b.calc === 'pct') h += '<div class="bs-f"><label>이 회선은</label><div class="bs-n wide"><button data-base="0" class="' + (!t.bundleBase ? 'on' : '') + '">2번째 이후 회선 (25%)</button><button data-base="1" class="' + (t.bundleBase ? 'on' : '') + '">베이스 회선</button></div></div>';
      if (b.teen) h += '<label class="chk bs-chk"><input type="checkbox" data-teen' + (t.bundleTeen ? ' checked' : '') + '> 만 18세 이하 청소년 (+' + num(b.teen) + '원)</label>';
      if (b.longOpts) h += '<div class="bs-f"><label>장기고객 할인</label><select class="sel" data-long>' + b.longOpts.map(function (o) { return '<option value="' + o[0] + '"' + (Number(t.bundleLong) === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></div>';
      h += '<details class="bs-d"' + (b.calc === 'tier' || b.calc === 'pct' ? ' open' : '') + '><summary>금액표 보기</summary>' + tbl() + '<div class="bs-src">출처: ' + esc(b.src || '') + '</div></details>';
      h += '<div class="ml-amt"><span>' + (b.calc === 'opt' ? '결합/요금 할인 합계' : '이 회선 월 할인') + '</span><b class="num">' + num(r.bundleOff) + '원</b></div><div class="bs-note">' + esc(au.note) + (r.bundleOff < au.amt ? ' · 월정액 한도까지만 할인돼요' : '') + '</div>';
      h += '<div class="modal-f two"><button class="btn lg" data-back>다른 결합</button><button class="btn pri lg" data-yes>적용</button></div>';
      return h;
    }
    var m = modal(esc(b.name), '<div data-bs>' + draw() + '</div>'); m.querySelector('.modal').classList.add('ml-modal', 'bs-modal');
    function re() { m.querySelector('[data-bs]').innerHTML = draw(); }
    m.addEventListener('click', function (e) {
      var x;
      if ((x = e.target.closest('[data-n]'))) { t.bundleN = Number(x.getAttribute('data-n')); re(); return; }
      if ((x = e.target.closest('[data-net]'))) { t.bundleNet = x.getAttribute('data-net'); re(); return; }
      if ((x = e.target.closest('[data-one]'))) { t.bundleOne = x.getAttribute('data-one') === '1'; re(); return; }
      if ((x = e.target.closest('button[data-opt]'))) { t.bundleOpt = x.getAttribute('data-opt'); re(); return; }
      if ((x = e.target.closest('[data-base]'))) { t.bundleBase = x.getAttribute('data-base') === '1'; re(); return; }
      if (e.target.closest('[data-back]')) { closeModal(); pickBundleBig(); return; }
      if (e.target.closest('[data-yes]')) { s.bundle = b.id; s.bundleAmt = 0; Object.keys(t).forEach(function (k) { s[k] = t[k]; }); closeModal(); render(); }
    });
    m.addEventListener('change', function (e) {
      if (e.target.matches('[data-teen]')) { t.bundleTeen = e.target.checked; re(); }
      if (e.target.matches('input[data-opt]')) { t.bundleOpt = e.target.getAttribute('data-opt'); re(); }
      if (e.target.matches('[data-add]')) { var ak = e.target.getAttribute('data-add'); t.bundleAdds = t.bundleAdds.filter(function (z) { return z !== ak; }); if (e.target.checked) t.bundleAdds.push(ak); else (b.adds || []).forEach(function (a) { if (a.need === ak) t.bundleAdds = t.bundleAdds.filter(function (z) { return z !== a.k; }); }); re(); }
      if (e.target.matches('[data-long]')) { t.bundleLong = Number(e.target.value); re(); }
      if (e.target.matches('[data-total]')) { t.bundleTotal = n0(String(e.target.value).replace(/[^\d]/g, '')); re(); }
    });
  }
  function pickWelfare() {
    var s = st(), list = DB.data.welfare || [];
    var body = '<div class="dg-list">' + list.map(function (w) {
      return '<div class="dg-row' + (s.welfare === w.id ? ' on' : '') + '" data-pick="' + w.id + '"><div class="dg-k">' + esc(w.name) + '</div><div class="dg-v"><div class="dg-head">' + esc(w.head || w.desc || '') + '</div>' +
        String(w.head ? w.desc || '' : '').split('\n').filter(Boolean).map(function (l) { return '<div>' + esc(l) + '</div>'; }).join('') + '</div></div>';
    }).join('') + '</div><div class="modal-f"><button class="btn lg" data-none>미적용</button></div>';
    var m = modal('복지할인 선택', body); m.querySelector('.modal').classList.add('dg-modal');
    m.addEventListener('click', function (e) {
      if (e.target.closest('[data-none]')) { s.welfare = ''; closeModal(); render(); return; }
      var r = e.target.closest('[data-pick]'); if (r) { s.welfare = r.getAttribute('data-pick'); closeModal(); render(); }
    });
  }
  function pickDual() {
    var s = st(), dI = (DB.data.dualInfo || {})[s.carrier] || {}, r = G.calc(s, { dual: true });
    var lines = function (t) { return String(t || '').split('\n').filter(Boolean).map(function (l) { var m = /^([^:]{1,8}) : (.*)$/.exec(l); return '<div class="ml-t">- ' + (m ? '<b>' + esc(m[1]) + '</b> : ' + esc(m[2]) : esc(l)) + '</div>'; }).join(''); };
    var body = '<div class="ml-box"><div class="ml-l"><b style="color:#E11D48">* ' + esc(dI.name || '듀얼번호') + '란?</b> <span>' + esc(dI.intro || '') + '</span></div>' + (dI.info ? '<div class="ml-l" style="margin-top:12px"><b>■ 서비스 정보 ■</b></div>' + lines(dI.info) : '') + '</div>' +
      (dI.caution ? '<div class="ml-box"><div class="ml-c">※ 유의사항</div>' + lines(dI.caution) + '</div>' : '') +
      '<div class="ml-amt"><span>월 청구 요금</span><b class="num">' + num(r.dual) + '원</b></div>' +
      '<div class="modal-f two"><button class="btn lg" data-none>미적용</button><button class="btn pri lg" data-yes>적용</button></div>';
    var m = modal(esc(dI.name || '듀얼번호'), body); m.querySelector('.modal').classList.add('ml-modal');
    m.addEventListener('click', function (e) {
      if (e.target.closest('[data-none]')) { s.dual = false; closeModal(); render(); return; }
      if (e.target.closest('[data-yes]')) { s.dual = true; closeModal(); render(); }
    });
  }
  function pickFam() {
    var s = st(), list = (DB.data.famDisc || {})[s.carrier] || [], cur = s.fam || (list[0] || {}).id;
    function draw() {
      var f = list.find(function (x) { return x.id === cur; }) || list[0] || {}, r = G.calc(s, { fam: f.id });
      var ln = function (k, v) { return v ? '<div class="ml-l"><b>* ' + k + ' :</b> <span>' + esc(v).replace(/\n/g, '<br>') + '</span></div>' : ''; };
      return (list.length > 1 ? '<div class="seg" style="margin-bottom:10px">' + list.map(function (x) { return '<button data-fid="' + x.id + '" class="' + (x.id === f.id ? 'on' : '') + '">' + esc(x.name) + '</button>'; }).join('') + '</div>' : '') +
        '<div class="ml-box">' + ln('가입 기간', f.period) + ln('가입 대상', f.target) + ln('가입 조건', f.cond) + ln('제공 혜택', f.benefit) + '</div>' +
        (f.opt ? '<div class="ml-box"><label class="chk"><input type="radio" checked> ' + esc(f.opt) + '</label>' + (r.fee < n0(f.minFee) ? '<div class="ml-t" style="color:#E11D48">지금 요금제(' + num(r.fee) + '원)는 조건에 안 맞아요</div>' : '') + '</div>' : '') +
        (f.caution ? '<div class="ml-c" style="text-align:right;font-size:12px;line-height:1.5">※ ' + esc(f.caution) + '</div>' : '') +
        '<div class="ml-amt"><span>월 요금 할인</span><b class="num">' + num(r.famOff) + '원</b></div>' +
        '<div class="modal-f two"><button class="btn lg" data-none>미적용</button><button class="btn pri lg" data-yes>적용</button></div>';
    }
    var m = modal(esc(list.length === 1 ? list[0].name : '가족 할인'), '<div data-fb>' + draw() + '</div>'); m.querySelector('.modal').classList.add('ml-modal');
    m.addEventListener('click', function (e) {
      var b = e.target.closest('[data-fid]'); if (b) { cur = b.getAttribute('data-fid'); m.querySelector('[data-fb]').innerHTML = draw(); return; }
      if (e.target.closest('[data-none]')) { s.fam = ''; closeModal(); render(); return; }
      if (e.target.closest('[data-yes]')) { s.fam = cur; closeModal(); render(); }
    });
  }
  function pickMilitary() {
    var s = st(), mi = (DB.data.military || {})[s.carrier] || {}, r = G.calc(s, { military: true });
    var ln = function (k, v) { return v ? '<div class="ml-l"><b>* ' + k + ' :</b> <span>' + esc(v).replace(/\n/g, '<br>') + '</span></div>' : ''; };
    var body = '<div class="ml-box">' + ln('가입 대상', mi.target) + ln('대상 요금제', mi.plans) + ln('제공 혜택', mi.benefit) + '</div>' +
      '<div class="ml-box">' + (mi.caution ? '<div class="ml-c">※ 주의사항</div>' + String(mi.caution).split('\n').map(function (l) { return '<div class="ml-t">- ' + esc(l) + '</div>'; }).join('') : '') + (mi.docs ? '<div class="ml-l" style="margin-top:12px"><b>* 제출 필요 서류</b></div>' + String(mi.docs).split('\n').map(function (l) { return '<div class="ml-t">- ' + esc(l) + '</div>'; }).join('') : '') + '</div>' +
      '<div class="ml-amt"><span>월 요금 할인</span><b class="num">' + num(r.milOff) + '원</b></div>' +
      '<div class="modal-f two"><button class="btn lg" data-none>미적용</button><button class="btn pri lg" data-yes>적용</button></div>';
    var m = modal(esc(mi.title || '군인 할인제도'), body); m.querySelector('.modal').classList.add('ml-modal');
    m.addEventListener('click', function (e) {
      if (e.target.closest('[data-none]')) { s.military = false; closeModal(); render(); return; }
      if (e.target.closest('[data-yes]')) { s.military = true; closeModal(); render(); }
    });
  }
  function pickBundle() {
    var s = st();
    var items = DB.data.bundles.filter(function (b) { return b.carrier === s.carrier; }).map(function (b) { return { id: b.id, name: b.name + ' (' + b.tags + ')', desc: b.desc, amt: '월 -' + num(b.value) }; });
    pickList('결합 할인 선택', items, s.bundle, function (id) { s.bundle = id; var b = DB.data.bundles.find(function (x) { return x.id === id; }); s.bundleAmt = b ? b.value : 0; });
  }
  function pickCard() {
    var s = st();
    var items = DB.data.cards.filter(function (c) { return c.carrier === s.carrier; }).map(function (c) {
      return { id: c.id, name: '[' + c.issuer + '] ' + c.name, desc: G.tiers(c).map(function (t) { return '전월 ' + num(t[0] / 10000) + '만원 이상 → 월 ' + num(t[1]) + '원'; }).join('\n'), amt: '최대 -' + num(Math.max.apply(null, G.tiers(c).map(function (t) { return t[1]; }).concat([0]))) };
    });
    pickList('청구할인 카드 선택', items, s.card, function (id) { s.card = id; s.cardTier = 0; });
  }
  function carAddons(s, kind) {
    var car = DB.carrier(s.carrier) || {};
    return (DB.data.addons || []).filter(function (a) { return a.kind === kind && (car.mvno ? !a.carrier : (a.carrier === s.carrier || !a.carrier)); });
  }
  function devType(s) {
    var d = DB.device(s.device), m = d ? DB.model(d.model) : null;
    if (!m) return '';
    return m.maker === '애플' ? 'I' : m.form === 'fold' ? 'FO' : m.form === 'flip' ? 'FL' : 'A';
  }
  function insFits(a, t, price) {
    if (!t) return false;
    var dv = String(a.dev || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    if (dv.length && dv.indexOf(t) < 0) return false;
    if (n0(a.minP) && price < n0(a.minP)) return false;
    if (n0(a.maxP) && price >= n0(a.maxP)) return false;
    return true;
  }
  var DEVN = { A: '안드로이드', I: '아이폰', FO: '폴드', FL: '플립' };
  function aoStar(a) { return '<button class="ao-star' + (a.push ? ' on' : '') + '" data-star="' + a.id + '" title="★ 누르면 맨 위에 고정">' + (a.push ? '★' : '☆') + '</button>'; }
  function aoToggle(id) { var a = (DB.data.addons || []).find(function (x) { return x.id === id; }); if (!a) return; a.push = a.push ? '' : '유치'; DB.saveData(); }
  function pinSort(list) { return list.map(function (a, i) { return [a, i]; }).sort(function (x, y) { return ((y[0].push ? 1 : 0) - (x[0].push ? 1 : 0)) || (x[1] - y[1]); }).map(function (x) { return x[0]; }); }
  function grpsOf(list) { var g = []; list.forEach(function (a) { var k = a.grp || '기타'; if (g.indexOf(k) < 0) g.push(k); }); return g; }
  function pickIns() {
    var s = st(), r = G.calc(s), t = devType(s), car = DB.carrier(s.carrier) || {};
    var list = carAddons(s, '보험');
    var sel = s.addons.filter(function (id) { return list.some(function (a) { return a.id === id; }); })[0] || '';
    var hasFit = list.some(function (a) { return insFits(a, t, r.price); });
    var tab = hasFit ? 'fit' : 'all';
    var m = modal('보험 선택 <span class="vat">VAT 포함</span>', '<div class="ins-tabs" data-tabs></div><div class="ins-info">' + esc(car.name || '') + (r.dev ? ' · ' + esc(r.dev.name) + ' · 출고가 ' + num(r.price) + '원' : '') + ' · <b>☆</b>를 누르면 맨 위에 고정돼요</div><div class="ins-body" data-body></div><div class="modal-f"><button class="btn lg" data-none>미적용</button><button class="btn pri lg" data-ok>적용</button></div>');
    function draw() {
      var tabs = [];
      if (hasFit) tabs.push(['fit', '이 폰에 맞음']);
      if (list.some(function (a) { return a.push; })) tabs.push(['star', '★ 고정']);
      tabs.push(['all', '전체']);
      grpsOf(list).forEach(function (g) { tabs.push([g, g]); });
      $('[data-tabs]', m).innerHTML = tabs.map(function (x) { return '<button data-tab="' + esc(x[0]) + '" class="' + (tab === x[0] ? 'on' : '') + '">' + esc(x[1]) + '</button>'; }).join('');
      var rows = list.filter(function (a) { return tab === 'all' ? true : tab === 'fit' ? insFits(a, t, r.price) : tab === 'star' ? a.push : (a.grp || '기타') === tab; });
      rows = pinSort(rows);
      $('[data-body]', m).innerHTML = rows.length ? '<table class="ins-t"><thead><tr><th></th><th>대상</th><th>상품명</th><th>상품설명</th><th class="r">이용료</th></tr></thead><tbody>' + rows.map(function (a) {
        var dv = String(a.dev || '').split(',').map(function (x) { return DEVN[x.trim()] || x.trim(); }).filter(Boolean).join(' · ') || '전체';
        var fit = insFits(a, t, r.price);
        return '<tr data-pick="' + a.id + '" class="' + (a.id === sel ? 'on' : '') + (a.push ? ' pin' : '') + '"><td>' + aoStar(a) + '</td><td class="dv">' + esc(dv) + '</td><td class="nm">' + esc(a.name) + (fit ? '<span class="ao-b fit">이 폰에 맞음</span>' : '') + '</td><td class="ds">' + esc(a.cond || '') + '</td><td class="r num fee">' + num(a.fee) + '원</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="empty-note">이 통신사 보험이 없어요. [관리 → 부가서비스 · 보험]에서 넣어요.</div>';
    }
    m.addEventListener('click', function (e) {
      var st_ = e.target.closest('[data-star]'); if (st_) { e.stopPropagation(); aoToggle(st_.getAttribute('data-star')); draw(); return; }
      var tb = e.target.closest('[data-tab]'); if (tb) { tab = tb.getAttribute('data-tab'); draw(); return; }
      var tr = e.target.closest('[data-pick]'); if (tr) { var id = tr.getAttribute('data-pick'); sel = sel === id ? '' : id; draw(); }
    });
    function done(v) {
      s.addons = s.addons.filter(function (id) { var a = DB.data.addons.find(function (x) { return x.id === id; }); return a && a.kind !== '보험'; });
      if (v) s.addons.push(v);
      closeModal(); render();
    }
    $('[data-none]', m).onclick = function () { done(''); };
    $('[data-ok]', m).onclick = function () { done(sel); };
    draw();
  }
  function pickAddon() {
    var s = st(), car = DB.carrier(s.carrier) || {};
    var list = carAddons(s, '부가');
    var chosen = s.addons.filter(function (id) { return list.some(function (a) { return a.id === id; }); });
    var grp = 'all', q = '', sort = 'base';
    var m = modal('부가서비스 <span class="vat">' + esc(car.name || '') + '</span>', '<div class="ag"><div class="ag-l" data-g></div><div class="ag-r"><div class="ag-s"><input class="search" data-q placeholder="부가서비스 이름 검색 (예: 멜론, 컬러링)"><button class="ag-x" data-qx aria-label="지우기">×</button></div><div class="ag-sort"><button data-sort="base">기본정렬순</button><button data-sort="hi">요금 높은순</button><button data-sort="lo">요금 낮은순</button></div><div class="ag-note">☆를 누르면 맨 위에 고정돼요 · 다음에 열어도 그대로예요</div><div class="ag-list" data-list></div></div></div><div class="modal-f"><span class="ao-sum num" data-sum></span><button class="btn lg" data-none>미적용</button><button class="btn pri lg" data-ok>확인</button></div>');
    function norm(x) { return String(x || '').toLowerCase().replace(/[\s·+\-_]/g, ''); }
    function drawG() {
      var g = [['all', '전체'], ['star', '★ 고정']];
      if (list.some(function (a) { return n0(a.fee) > 0; })) g.push(['paid', '유료']);
      if (list.some(function (a) { return !n0(a.fee); })) g.push(['free', '무료']);
      grpsOf(list).forEach(function (x) { g.push([x, x]); });
      $('[data-g]', m).innerHTML = g.map(function (x) { var c = list.filter(function (a) { return inG(a, x[0]); }).length; return '<button data-grp="' + esc(x[0]) + '" class="' + (grp === x[0] ? 'on' : '') + '">' + esc(x[1]) + '<small>' + c + '</small></button>'; }).join('');
      $$('[data-sort]', m).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-sort') === sort); });
    }
    function inG(a, g) { return g === 'all' ? true : g === 'star' ? !!a.push : g === 'paid' ? n0(a.fee) > 0 : g === 'free' ? !n0(a.fee) : (a.grp || '기타') === g; }
    function drawL() {
      var nq = norm(q);
      var rows = list.filter(function (a) { return nq ? norm(a.name + a.cond + a.grp).indexOf(nq) >= 0 : inG(a, grp); });
      if (sort === 'hi') rows.sort(function (a, b) { return n0(b.fee) - n0(a.fee); }); else if (sort === 'lo') rows.sort(function (a, b) { return n0(a.fee) - n0(b.fee); });
      rows = pinSort(rows);
      $('[data-list]', m).innerHTML = rows.map(function (a) {
        var on = chosen.indexOf(a.id) >= 0, sub = [];
        if (a.cond) sub.push(a.cond);
        sub.push(n0(a.months) ? n0(a.months) + '개월 유지 후 해지 가능' : '계속 유지');
        return '<div class="ag-row' + (on ? ' on' : '') + (a.push ? ' pin' : '') + '" data-pick="' + a.id + '">' + aoStar(a) + '<div class="ag-nm">' + esc(a.name) + '<small>' + esc(a.grp || '') + '</small></div><div class="ag-ds">' + esc(sub.join(' · ')) + '</div><div class="ag-fee num">' + (n0(a.fee) ? num(a.fee) + '원' : '무료') + '</div><div class="ag-ck">' + (on ? '✓' : '') + '</div></div>';
      }).join('') || '<div class="empty-note">' + (q ? '"' + esc(q) + '" 검색 결과가 없어요.' : '여기에 해당하는 부가서비스가 없어요.') + '</div>';
      var tot = 0; chosen.forEach(function (id) { var a = list.find(function (x) { return x.id === id; }); if (a) tot += n0(a.fee); });
      $('[data-sum]', m).textContent = chosen.length ? chosen.length + '개 · 월 ' + num(tot) + '원' : '';
    }
    m.addEventListener('click', function (e) {
      var sb = e.target.closest('[data-star]'); if (sb) { e.stopPropagation(); aoToggle(sb.getAttribute('data-star')); drawG(); drawL(); return; }
      var gb = e.target.closest('[data-grp]'); if (gb) { grp = gb.getAttribute('data-grp'); q = ''; $('[data-q]', m).value = ''; drawG(); drawL(); return; }
      var so = e.target.closest('[data-sort]'); if (so) { sort = so.getAttribute('data-sort'); drawG(); drawL(); return; }
      if (e.target.closest('[data-qx]')) { q = ''; $('[data-q]', m).value = ''; drawL(); return; }
      var row = e.target.closest('[data-pick]'); if (row) { var id = row.getAttribute('data-pick'), k = chosen.indexOf(id); if (k >= 0) chosen.splice(k, 1); else chosen.push(id); drawL(); }
    });
    $('[data-q]', m).addEventListener('input', function (e) { q = e.target.value; drawL(); });
    function done(ids) {
      var keep = s.addons.filter(function (id) { var a = DB.data.addons.find(function (x) { return x.id === id; }); return a && a.kind !== '부가'; });
      s.addons = keep.concat(ids); closeModal(); render();
    }
    $('[data-none]', m).onclick = function () { done([]); };
    $('[data-ok]', m).onclick = function () { done(chosen); };
    drawG(); drawL();
  }

  /* ---------- 구매 안내서 도구 ---------- */
  function toolSave() {
    var s = st(), md = (DB.device(s.device) || {}).model;
    var recs = DB.records.filter(function (x) { return x.state && DB.device(x.state.device) && DB.device(x.state.device).model === md; }).slice(0, 8);
    var body = '<div class="modal-p"><button class="btn pri lg" style="width:100%" data-ok>지금 상담 저장하기</button></div>' +
      '<div class="subhead" style="padding:0 16px">이 모델로 저장한 상담 (눌러서 불러오기)</div><div class="list">' +
      (recs.map(function (x) { return '<button class="li" data-load="' + x.id + '"><div><div class="nm">' + esc(x.state.customer || '이름 없음') + ' · ' + esc(x.device) + '</div><div class="ds">' + esc(x.at) + ' · ' + esc(x.carrier) + ' · ' + esc(x.plan) + '</div></div><div class="am num" style="color:var(--red)">월 ' + num(x.monthly) + '</div></button>'; }).join('') || '<div class="empty-note">아직 없어요.</div>') + '</div>';
    var m = modal('저장 · 불러오기', '<div style="overflow:auto">' + body + '</div>', { size: 'sm' });
    $('[data-ok]', m).onclick = function () { doSave(); };
    $$('[data-load]', m).forEach(function (b) { b.onclick = function () { loadRecord(b.getAttribute('data-load')); closeModal(); }; });
  }
  function toolShare() {
    var m = modal('출력 · 공유', '<div class="modal-p" style="display:grid;gap:8px"><button class="btn pri lg" data-x="print">견적서 인쇄 (종이 · PDF)</button><button class="btn lg" data-x="copy">문자 · 카톡용으로 복사</button></div>', { size: 'sm' });
    $('[data-x="print"]', m).onclick = function () { closeModal(); doPrint(); };
    $('[data-x="copy"]', m).onclick = function () { closeModal(); copySummary(); };
  }
  function toolFee() {
    var s = st(), r = G.calc(s);
    var h = '<div class="modal-p"><div class="subhead">할부원금 ' + won(r.principal) + ' · 연 ' + r.rate + '%</div><table class="tbl"><thead><tr><th>개월</th><th class="r">월 할부금</th><th class="r">수수료 합계</th></tr></thead><tbody>';
    [12, 24, 30, 36, 48].forEach(function (mo) { var x = G.installment(r.principal, mo, r.rate); h += '<tr' + (mo === r.months ? ' class="on"' : '') + '><td class="b">' + mo + '개월</td><td class="r b">' + num(x.monthly) + '</td><td class="r">' + num(x.fee) + '</td></tr>'; });
    h += '</tbody></table>';
    if (r.common) {
      h += '<div class="subhead" style="margin-top:16px">공통지원금 위약금 (중간에 해지하면, 예상)</div><table class="tbl"><thead><tr><th>쓴 기간</th><th class="r">돌려낼 금액</th></tr></thead><tbody>';
      [3, 6, 12, 18].forEach(function (mo) { var left = Math.max(0, 730 - mo * 30.4); h += '<tr><td>' + mo + '개월 사용 후</td><td class="r b">' + num(Math.round(r.common * left / 730 / 10) * 10) + '원</td></tr>'; });
      h += '</tbody></table>';
    } else if (r.selectOff) {
      h += '<div class="help" style="margin-top:16px">선택약정은 중간에 해지하면 그동안 받은 할인 일부를 돌려내야 해요. 정확한 금액은 통신사에서 확인해 주세요.</div>';
    }
    h += '<div class="cnote l" style="margin-top:12px">예상 금액이에요. 실제 금액은 통신사 기준을 따라요.</div></div>';
    modal('할부 · 위약금 계산', '<div style="overflow:auto">' + h + '</div>', { size: 'sm' });
  }

  /* ---------- 저장 · 인쇄 · 복사 ---------- */
  function summaryLines(s, r) {
    var st0 = DB.store(DB.prefs.store);
    var L = ['[고무신모바일 ' + st0.name + '] 상담 안내', G.nowStr(), '',
      '통신사: ' + (r.car.name || '') + ' / ' + (JOIN.find(function (j) { return j[0] === s.join; }) || [0, ''])[1],
      (s.mode === 'used' ? '중고폰: ' : '단말기: ') + (r.dev ? r.dev.name : '-') + (s.color && s.mode !== 'used' ? ' (' + s.color + ')' : ''),
      '요금제: ' + (r.plan ? r.plan.name + ' (' + won(r.plan.fee) + ')' : '-'),
      '지원 방식: ' + (r.subMode === 'common' ? '공통지원금' : r.subMode === 'select' ? '선택약정 25%' : '-'), '',
      '[A 단말기] ' + (s.mode === 'used' ? '판매가 ' : '출고가 ') + won(r.price)];
    [['공통지원금', r.common], ['추가지원금', r.extra], ['프리미엄패스', r.passOff], ['중고폰 할인', r.usedOff], ['기타지원', r.etc], ['라이트할부카드', r.lightOff], ['수납금', r.cash]].forEach(function (x) { if (x[1]) L.push(' - ' + x[0] + ' ' + minus(x[1])); });
    L.push(' 할부원금 ' + won(r.principal) + (r.months ? ' / ' + r.months + '개월' : ' / 일시불'));
    L.push(' 월 할부금 ' + won(r.instMonthly) + (r.lightMon ? ' (라이트할부 월 ' + minus(r.lightMon) + ' → ' + won(r.instMonthly - r.lightMon) + ')' : ''), '');
    L.push('[B 요금] 월정액 ' + won(r.fee));
    [['선택약정', r.selectOff], ['결합 할인', r.bundleOff], ['복지 할인', r.welOff], ['청구할인카드', r.cardOff], ['군인 할인', r.milOff], [r.famD ? r.famD.name : '가족 할인', r.famOff], ['프로모션', r.promo]].forEach(function (x) { if (x[1]) L.push(' - ' + x[0] + ' ' + minus(x[1])); });
    if (r.dual) L.push(' + ' + (((DB.data.dualInfo || {})[s.carrier] || {}).name || '듀얼번호') + ' ' + won(r.dual));
    L.push(' 월 요금 ' + won(r.planMonthly - r.cardOff));
    if (r.addonFee) { L.push('', '[C 보험 · 부가] 월 ' + won(r.addonFee)); r.addons.forEach(function (a) { L.push(' - ' + a.name + ' ' + won(a.fee) + (n0(a.months) ? ' (' + n0(a.months) + '개월 유지)' : '')); }); }
    L.push('', '▶ 매달 내는 돈(예상): ' + won(r.monthly));
    if (r.usim) L.push('▶ ' + (r.usimItem ? r.usimItem.name : '유심') + ' (첫 달 1회): ' + won(r.usim));
    L.push('', '※ 예상 금액이며 실제 청구 금액과 다를 수 있어요.', '문의 ' + st0.name + ' ' + st0.phone + ' / 대표 ' + DB.data.mainPhone);
    return L;
  }
  function copySummary() { G.copyText(summaryLines(st(), G.calc(st())).join('\n')).then(function (ok) { toast(ok ? '복사했어요. 문자나 카톡에 붙여넣기 하세요' : '복사가 안 됐어요'); }); }
  function doSave() {
    var s = st();
    var body = '<div class="modal-p"><div class="form">' +
      '<div class="field"><label>고객 이름</label><input id="f-name" value="' + esc(s.customer) + '"></div>' +
      '<div class="field"><label>전화번호</label><input id="f-phone" inputmode="tel" value="' + esc(s.phone) + '"></div>' +
      '<div class="field full"><label>상담 직원</label><input id="f-staff" value="' + esc(DB.prefs.staff || '') + '"></div>' +
      '<div class="field full"><label>메모</label><textarea id="f-memo">' + esc(s.memo) + '</textarea></div></div></div>' +
      '<div class="modal-f"><button class="btn" data-close>취소</button><button class="btn pri" data-ok>저장</button></div>';
    var m = modal('상담 저장', body, { size: 'sm' });
    $('[data-ok]', m).onclick = function () {
      s.customer = $('#f-name').value.trim(); s.phone = $('#f-phone').value.trim(); s.memo = $('#f-memo').value;
      DB.prefs.staff = $('#f-staff').value.trim(); DB.savePrefs();
      var r = G.calc(s);
      DB.records.unshift({ id: G.uid(), at: G.nowStr(), store: DB.prefs.store, staff: DB.prefs.staff, state: G.clone(s), monthly: r.monthly, carrier: r.car.name, device: r.dev ? r.dev.name + (s.color && s.mode !== 'used' ? ' ' + s.color : '') : '', plan: r.plan ? r.plan.name : '' });
      if (DB.records.length > 2000) DB.records.length = 2000;
      DB.saveRecords(); closeModal(); toast('상담을 저장했어요'); saveDraft();
    };
  }
  function loadRecord(id) {
    var x = DB.records.find(function (y) { return y.id === id; }); if (!x) return;
    var st0 = G.clone(x.state); if (st0.mode === 'wireless' && !ROOT.wireless) st0.mode = 'wireless';
    S[st0.mode] = st0;
    var d = DB.device(st0.device);
    if (st0.mode === 'used') location.hash = '#/used';
    else if (d) location.hash = '#/' + ROOT[st0.mode] + '/' + st0.carrier + '/' + d.model;
    else location.hash = '#/' + (ROOT[st0.mode] || 'phone') + '/' + st0.carrier;
    toast('상담을 불러왔어요');
  }
  function doPrint() {
    var s = st(), r = G.calc(s), st0 = DB.store(DB.prefs.store);
    var tr = function (k, v) { return '<tr><th>' + k + '</th><td class="r">' + v + '</td></tr>'; };
    var a = tr(s.mode === 'used' ? '판매가' : '출고가', won(r.price));
    [['공통지원금', r.common], ['추가지원금', r.extra], ['프리미엄패스', r.passOff], ['중고폰 할인', r.usedOff], ['기타지원', r.etc], ['라이트할부카드', r.lightOff], ['수납금', r.cash]].forEach(function (x) { if (x[1]) a += tr(x[0], minus(x[1])); });
    a += tr('할부원금', won(r.principal)) + tr('할부 개월', r.months ? r.months + '개월 (연 ' + r.rate + '%)' : '일시불') + tr('월 할부금', won(r.instMonthly)) + (r.lightMon ? tr('라이트할부 월 할인', minus(r.lightMon)) : '');
    var b = tr('요금제', r.plan ? esc(r.plan.name) : '-') + tr('월정액', won(r.fee));
    [['선택약정', r.selectOff], ['결합 할인', r.bundleOff], ['복지 할인', r.welOff], ['청구할인카드', r.cardOff], ['군인 할인', r.milOff], [r.famD ? r.famD.name : '가족 할인', r.famOff], ['프로모션', r.promo]].forEach(function (x) { if (x[1]) b += tr(x[0], minus(x[1])); });
    if (r.dual) b += tr(esc(((DB.data.dualInfo || {})[s.carrier] || {}).name || '듀얼번호'), '+' + won(r.dual));
    b += tr('월 요금', won(r.planMonthly - r.cardOff));
    $('#print').innerHTML = '<h1>' + today() + ' 고무신모바일 구매 안내서</h1><div class="meta">고무신모바일 ' + esc(st0.name) + ' · ' + esc(st0.phone) + ' · ' + G.nowStr() + (s.customer ? ' · 고객 ' + esc(s.customer) : '') + (DB.prefs.staff ? ' · 상담 ' + esc(DB.prefs.staff) : '') + '</div>' +
      '<table>' + tr('통신사 / 가입 유형', esc(r.car.name || '') + ' / ' + (JOIN.find(function (j) { return j[0] === s.join; }) || [0, ''])[1]) + tr(s.mode === 'used' ? '중고폰' : '단말기', r.dev ? esc(r.dev.name) + (s.color && s.mode !== 'used' ? ' · ' + esc(s.color) : '') : '-') + '</table>' +
      '<table><tr><th colspan="2">A. 단말기 할부</th></tr>' + a + '</table><table><tr><th colspan="2">B. 월 요금</th></tr>' + b + '</table>' +
      '<table>' + (r.addonFee ? tr('C. 부가 · 보험 (월)', won(r.addonFee)) : '') + (r.usim ? tr('유심비 (첫 달 1회)', won(r.usim)) : '') + '<tr><th>매달 내는 돈 (예상)</th><td class="r tot">' + won(r.monthly) + '</td></tr></table>' +
      '<div class="note">' + esc(DB.data.cautions || '') + '\n※ 이 안내서는 매장 상담용 예상 금액이며 통신사 공식 서류가 아닙니다.</div>';
    window.print();
  }

  /* =========================================================
     인터넷 · TV 상담
     ========================================================= */
  var W = null;
  var SPEEDS = ['100M', '500M', '1G'];
  function stbList(tv, w) {
    if (!tv.stbs) return [{ name: '셋톱박스', fee: n0(w.stb) }];
    return String(tv.stbs).split(',').map(function (x) { var i = x.lastIndexOf(':'); return { name: x.slice(0, i).trim(), fee: n0(x.slice(i + 1)) }; }).filter(function (x) { return x.name; });
  }
  function tvLabel(t) { return t.name + (t.ch ? ' · ' + t.ch + '개 채널' : ''); }

  /* TV 선택 창: 요금제마다 셋톱박스 칸을 눌러 고르기 */
  function pickTV() {
    var w = DB.data.wired[W.carrier], selTv = W.tv, selStb = W.stb || 0;
    var body = '<div class="tvp-note">※ 셋톱박스는 매장마다 재고가 다를 수 있어요. 재고를 확인하고 상담해요. <b>부가세 포함</b> · 월 요금</div><div class="tvp-list">' + w.tv.map(function (t) {
      var stbs = stbList(t, w);
      return '<section class="tvp" data-tvp="' + t.id + '"><h4><span>' + esc(tvLabel(t)) + '</span><b class="num">' + num(t.fee != null ? t.fee : (t.fees || [])[W.speed]) + '원</b></h4>' +
        '<div class="tvp-stb">' + stbs.map(function (x, i) { return '<button data-tv="' + t.id + '" data-stb="' + i + '"><span>' + esc(x.name) + '</span><small class="num">' + (x.fee ? num(x.fee) + '원' : '0원') + '</small></button>'; }).join('') + '</div>' +
        '<div class="tvp-desc">' + (t.note ? '<em>※ ' + esc(t.note) + '</em>' : '') + (t.desc ? '<span>▶ ' + esc(t.desc) + '</span>' : '') + '</div></section>';
    }).join('') + '</div><div class="tvp-foot"><button class="btn" data-tvoff>미적용</button><button class="btn pri" data-tvok>적용</button></div>';
    var md = modal(esc(w.name) + ' TV 선택', body, { size: 'tvp-modal' });
    function mark() { $$('[data-stb]', md).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tv') === selTv && Number(b.getAttribute('data-stb')) === selStb); }); $$('[data-tvp]', md).forEach(function (s) { s.classList.toggle('on', s.getAttribute('data-tvp') === selTv); }); }
    mark();
    var on = $('.tvp.on', md); if (on) on.scrollIntoView({ block: 'center' });
    md.addEventListener('click', function (e) {
      var b = e.target.closest('[data-stb]'); if (b) { selTv = b.getAttribute('data-tv'); selStb = Number(b.getAttribute('data-stb')); mark(); return; }
      if (e.target.closest('[data-tvoff]')) { W.tv = ''; W.stb = 0; closeModal(); renderWired(); return; }
      if (e.target.closest('[data-tvok]')) { if (!selTv) { toast('셋톱박스 칸을 하나 눌러 주세요'); return; } W.tv = selTv; W.stb = selStb; closeModal(); renderWired(); }
    });
  }

  function wcalc() {
    var w = DB.data.wired[W.carrier], sp = W.speed;
    var tv = w.tv.find(function (x) { return x.id === W.tv; });
    var stbs = tv ? stbList(tv, w) : [], stbSel = tv ? (stbs[W.stb] || stbs[0] || null) : null;
    var inet = n0(w.fees[sp]), tvFee = tv ? (tv.fee != null ? n0(tv.fee) : n0((tv.fees || [])[sp])) : 0, stb = stbSel ? n0(stbSel.fee) : 0, wifi = W.wifi ? n0(w.wifi[sp]) : 0, tel = W.tel ? n0(w.tel) : 0;
    var before = inet + tvFee + stb + wifi + tel;
    var noB = !!(tv && tv.noBundle);
    var inetOff = W.bundle && !noB ? n0(w.bundleOff[sp]) : 0, mobOff = W.bundle && !noB ? n0(W.mobileOff) : 0;
    var after = Math.max(0, before - inetOff - mobOff);
    var mob = W.addMobile && S.wireless ? G.calc(S.wireless).monthly : 0;
    var ins = w.install || { inet: [0, 0], tv: [0, 0] }, insT = function (d) { return n0(ins.inet[d]) + (tv ? n0(ins.tv[d]) : 0); };
    return { w: w, ins: ins, install: [insT(0), insT(1)], tv: tv, stbSel: stbSel, noB: noB, inet: inet, tvFee: tvFee, stb: stb, wifi: wifi, tel: tel, before: before, inetOff: inetOff, mobOff: mobOff, after: after, mob: mob };
  }
  function renderWired() {
    if (!W) W = { carrier: 'kt', speed: 1, tv: '', stb: 0, day: 0, wifi: true, tel: false, bundle: true, mobileOff: 0, gift: 0, addMobile: false };
    var D = DB.data, x = wcalc(), w = x.w;
    var h = '<div class="page-h"><h1>인터넷 · TV 상담</h1><div class="sub">3년 약정 · 부가세 포함 · 한 달 요금이에요.</div></div>';
    h += '<div class="card car-row">' + ['kt', 'skt', 'lgu'].map(function (c) { return '<button data-w="carrier" data-v="' + c + '" class="car-b c-' + c + (W.carrier === c ? ' on' : '') + '">' + esc(D.wired[c].name) + '</button>'; }).join('') + '</div>';
    h += hint('① 회사 → ② 인터넷 속도 → ③ TV를 고르면 오른쪽에 매달 요금이 나와요. 휴대폰과 묶으면 <b>결합 할인</b>이 빠져요.');
    h += '<div class="wired-cols"><section class="card"><div class="card-h"><span class="badge a">1</span><h2>상품 고르기</h2></div><div class="rows">';
    h += row('인터넷 속도', '<div class="seg sm">' + SPEEDS.map(function (s, i) { return '<button data-w="speed" data-v="' + i + '" class="' + (W.speed === i ? 'on' : '') + '">' + s + '</button>'; }).join('') + '</div>', '', '<small>' + esc(w.inet[W.speed]) + '</small>');
    h += row('인터넷 요금', '<span class="num">' + won(x.inet) + '</span>');
    h += row('TV', '<button class="sel selbtn" data-act="pickTV">' + (x.tv ? esc(tvLabel(x.tv)) : 'TV 안 함 (눌러서 선택)') + '</button>');
    if (x.tv) h += row('TV 요금', '<span class="num">' + won(x.tvFee) + '</span>');
    if (x.tv) h += row('셋톱박스', '<span class="num">' + won(x.stb) + '</span>', '', '<small>' + esc(x.stbSel ? x.stbSel.name : '') + '</small>');
    if (x.noB) h += '<div class="cnote l" style="padding:4px 16px;color:var(--red)">이 TV 요금제는 결합 할인이 안 돼요.</div>';
    h += row('와이파이', '<label class="chk"><input type="checkbox" data-wk="wifi"' + (W.wifi ? ' checked' : '') + '>공유기 빌리기</label><span class="num">' + (W.wifi ? (x.wifi ? won(x.wifi) : '무료') : '0원') + '</span>');
    h += row('인터넷 전화', '<label class="chk"><input type="checkbox" data-wk="tel"' + (W.tel ? ' checked' : '') + '>사용</label><span class="num">' + won(x.tel) + '</span>');
    h += row('휴대폰 결합', '<label class="chk"><input type="checkbox" data-wk="bundle"' + (W.bundle ? ' checked' : '') + '>' + esc(w.bundleName) + '</label>', '', '<small>인터넷 -' + num(w.bundleOff[W.speed]) + '원</small>');
    if (W.bundle) h += row('휴대폰 할인 합계', '<input class="in manual" inputmode="numeric" data-wk="mobileOff" value="' + (W.mobileOff ? num(W.mobileOff) : '') + '" placeholder="0">', '', '<small>' + esc(w.mobileHint) + '</small>');
    h += row('사은품 (현금)', '<input class="in manual" inputmode="numeric" data-wk="gift" value="' + (W.gift ? num(W.gift) : '') + '" placeholder="0">', '', '<small>직접 입력</small>');
    h += row('휴대폰 상담 더하기', '<label class="chk"><input type="checkbox" data-wk="addMobile"' + (W.addMobile ? ' checked' : '') + '>휴대폰 상담 금액 포함</label>');
    h += '</div></section>';
    h += '<section class="card"><div class="card-h"><span class="badge t">=</span><h2>결합 전 · 후</h2></div>';
    var insBox = '<div class="inst"><div class="inst-h"><b>설치비</b><span>한 번만 내요 · 부가세 포함</span></div><table class="inst-t"><thead><tr><th></th><th' + (W.day === 0 ? ' class="on"' : '') + ' data-w="day" data-v="0">평일 낮</th><th' + (W.day === 1 ? ' class="on"' : '') + ' data-w="day" data-v="1">주말 · 공휴일<br><small>평일 야간</small></th></tr></thead><tbody>' +
      '<tr><td>인터넷</td><td class="num">' + num(x.ins.inet[0]) + '</td><td class="num">' + num(x.ins.inet[1]) + '</td></tr>' +
      (x.tv ? '<tr><td>TV 1대</td><td class="num">' + num(x.ins.tv[0]) + '</td><td class="num">' + num(x.ins.tv[1]) + '</td></tr>' : '') +
      '<tr class="sum"><td>합계</td><td class="num">' + num(x.install[0]) + '원</td><td class="num">' + num(x.install[1]) + '원</td></tr></tbody></table>' +
      '<div class="inst-n">' + esc(x.ins.hours || '') + (x.ins.src ? ' · 출처: ' + esc(x.ins.src) : '') + '</div></div>';
    h += '<div class="vs"><div><div class="lb">결합 전 (월)</div><div class="m num">' + num(x.before) + '원</div></div><div><div class="lb">결합 후 (월)</div><div class="m num">' + num(x.after) + '원</div></div></div><div class="rows">';
    h += row('인터넷 결합 할인', '<span class="num">' + minus(x.inetOff) + '</span>', 'minus');
    if (x.mobOff) h += row('휴대폰 결합 할인', '<span class="num">' + minus(x.mobOff) + '</span>', 'minus');
    h += row('3년 할인 합계', '<span class="num">' + minus((x.inetOff + x.mobOff) * 36) + '</span>', 'minus');
    if (W.gift) h += row('사은품', '<span class="num">' + won(W.gift) + '</span>', 'minus');
    if (W.addMobile) h += row('휴대폰 (휴대폰 상담)', '<span class="num">' + won(x.mob) + '</span>');
    h += '<div class="row big b"><div class="k">' + (W.addMobile ? '집 전체 월 납부' : '월 납부') + '</div><div class="v"><span class="num">' + won(x.after + x.mob) + '</span></div></div>';
    h += '</div>' + insBox + '<div class="cnote l" style="padding:0 16px">' + esc(D.wiredNote || '') + '</div><div class="acts"><button class="btn" data-act="wcopy">문자로 복사</button><button class="btn red" data-act="wreset">지우기</button></div></section></div>';
    app.innerHTML = '<div class="wrap">' + h + '</div><div class="mbar"><div><div class="lb">결합 후 월 납부</div><div class="m num">' + num(x.after + x.mob) + '원</div></div></div>';
    renderWired.text = '[고무신모바일 인터넷 · TV 상담]\n' + w.name + ' ' + w.inet[W.speed] + (x.tv ? ' + ' + tvLabel(x.tv) + (x.stbSel ? ' (' + x.stbSel.name + ')' : '') : '') + (W.tel ? ' + 인터넷 전화' : '') + '\n설치비 ' + (W.day ? '주말 · 공휴일 ' : '평일 ') + won(x.install[W.day || 0]) + ' (한 번)' + '\n결합 전 월 ' + won(x.before) + '\n결합 후 월 ' + won(x.after) + (W.bundle ? ' (' + w.bundleName + ')' : '') + '\n3년 할인 ' + won((x.inetOff + x.mobOff) * 36) + (W.gift ? '\n사은품 ' + won(W.gift) : '') + '\n문의 ' + DB.data.mainPhone;
  }

  /* =========================================================
     상담 기록
     ========================================================= */
  function renderRecords() {
    var q = renderRecords.q || '';
    var allSt = !!renderRecords.all, myN = DB.records.filter(function (x) { return (x.store || 'bupyeong') === DB.prefs.store; }).length;
    var list = DB.records.filter(function (x) { return (allSt || (x.store || 'bupyeong') === DB.prefs.store) && (!q || [x.state.customer, x.state.phone, x.device, x.staff].join(' ').indexOf(q) >= 0); });
    var h = '<div class="page-h"><h1>상담 기록</h1><div class="sub">' + esc(DB.store(DB.prefs.store).name) + ' ' + myN + '건 · 이 기기 전체 ' + DB.records.length + '건 · 줄을 누르면 불러와요</div></div>';
    h += '<section class="card"><div class="bar"><div class="seg" style="width:auto"><button id="rs1" class="' + (allSt ? '' : 'on') + '" style="padding:0 14px">이 매장</button><button id="rs2" class="' + (allSt ? 'on' : '') + '" style="padding:0 14px">전 매장</button></div><input class="search" id="rq" placeholder="이름, 전화번호, 모델로 찾기" value="' + esc(q) + '" style="flex:1;min-width:200px"><button class="btn" data-act="csv">엑셀(CSV) 받기</button></div>';
    h += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>날짜</th><th class="hide-m">매장</th><th>고객</th><th class="hide-m">전화번호</th><th class="hide-m">통신사</th><th>모델</th><th class="r">월 납부</th><th></th></tr></thead><tbody>';
    h += list.map(function (x) { return '<tr data-rid="' + x.id + '"><td>' + esc(x.at.slice(5)) + '</td><td class="hide-m">' + esc(DB.store(x.store).name) + '</td><td class="b">' + esc(x.state.customer || '-') + '</td><td class="hide-m">' + esc(x.state.phone || '') + '</td><td class="hide-m">' + esc(x.carrier) + '</td><td>' + esc(x.device || '-') + '</td><td class="r b">' + num(x.monthly) + '</td><td class="r"><button class="btn sm red" data-del="' + x.id + '">삭제</button></td></tr>'; }).join('') || '<tr><td colspan="8" class="empty-note">저장한 상담이 없어요. 상담 화면에서 [상담 저장]을 누르면 여기에 쌓여요.</td></tr>';
    h += '</tbody></table></div></section>';
    app.innerHTML = '<div class="wrap">' + h + '</div>';
    if ($('#rs1')) { $('#rs1').onclick = function () { renderRecords.all = false; renderRecords(); }; $('#rs2').onclick = function () { renderRecords.all = true; renderRecords(); }; }
    $('#rq').oninput = function (e) { renderRecords.q = e.target.value.trim(); var p = e.target.selectionStart; renderRecords(); var i = $('#rq'); i.focus(); i.setSelectionRange(p, p); };
  }

  /* =========================================================
     관리
     ========================================================= */
  var EDIT = {
    models: { title: '모델 · 색상 · 사진', help: '<b>색상</b>은 "이름:#색코드"를 쉼표로 이어 써요. 예) 블랙:#1C1C1E, 화이트:#F4F4F2 · <b>사진 주소</b>에 매장에서 직접 찍은 사진 주소를 넣으면 그림 대신 사진이 보여요. <b>모양</b>은 bar(일반) · fold(폴드) · flip(플립) · sim(유심).', fields: [['maker', '제조사', 'sel:삼성,애플,기타,유심', 80], ['name', '모델명', 'text', 190], ['code', '모델코드', 'text', 110], ['release', '출시', 'text', 90], ['only', '전용 통신사', 'only', 110], ['form', '모양', 'sel:bar,fold,flip,sim', 80], ['colors', '색상 (이름:#코드, ...)', 'text', 440], ['img', '사진 주소 (선택)', 'text', 200]] },
    devices: { title: '용량 · 출고가', help: '<b>출고가</b>를 바꾸면 상담 화면에 바로 반영돼요. 새 용량을 추가할 때는 <b>모델</b>을 꼭 골라요.', fields: [['model', '모델', 'model', 190], ['name', '표시 이름', 'text', 240], ['cap', '용량', 'text', 80], ['price', '출고가', 'num', 120]] },
    plans: { title: '요금제', help: '<b>구간</b>은 공통지원금 단계예요. 1구간 85,000원↑ · 2구간 68,000원↑ · 3구간 55,000원↑ · 4구간 47,000원↑ · 5구간 그 아래.', fields: [['carrier', '통신사', 'carrier', 120], ['name', '요금제 이름', 'text', 220], ['fee', '월정액', 'num', 100], ['data', '데이터', 'text', 150], ['tier', '구간', 'sel:1,2,3,4,5', 70], ['desc', '혜택 설명', 'text', 280]] },
    usedStock: { title: '중고폰 재고', help: '판매할 중고폰을 등록해요. <b>등급</b>은 S(새것 같음) · A · B · C 순서예요.', fields: [['name', '모델명', 'text', 220], ['grade', '등급', 'sel:S,A,B,C', 70], ['battery', '배터리 %', 'num', 90], ['color', '색상', 'text', 90], ['store', '보유 매장', 'store', 110], ['price', '판매가', 'num', 110], ['memo', '메모', 'text', 200]] },
    bundles: { title: '결합 할인', help: '<b>월 할인</b>은 상담할 때 처음 들어가는 값이에요. 상담 화면에서 고칠 수 있어요.', fields: [['carrier', '통신사', 'carrierM', 110], ['name', '이름', 'text', 180], ['tags', '종류 (무무선,유무선)', 'text', 140], ['value', '월 할인', 'num', 100], ['note', '빨간 안내', 'text', 200], ['desc', '설명 (줄바꿈 가능)', 'text', 360]] },
    cards: { title: '청구할인 카드', help: '<b>실적 구간</b>은 "전월실적:월할인"을 쉼표로 이어 써요. 예) 300000:15000,700000:20000', fields: [['carrier', '통신사', 'carrierM', 110], ['issuer', '카드사', 'text', 80], ['name', '카드 이름', 'text', 220], ['tiers', '실적 구간', 'text', 320], ['promo', '프로모션', 'text', 160], ['note', '파란 안내', 'text', 140], ['color', '카드 색', 'text', 90]] },
    lightCards: { title: '라이트할부카드', help: '<b>실적 구간</b>은 "전월실적:매달 할부 할인"을 쉼표로 이어 써요. 실적 구간이 비어 있으면 <b>할인 금액</b>을 할부원금에서 한 번에 빼요.', fields: [['carrier', '통신사', 'carrierM', 110], ['issuer', '카드사', 'text', 80], ['name', '카드 이름', 'text', 220], ['tiers', '실적 구간', 'text', 300], ['promo', '프로모션', 'text', 160], ['note', '파란 안내', 'text', 140], ['off', '할인 금액', 'num', 100], ['color', '카드 색', 'text', 90]] },
    welfare: { title: '복지 할인', help: '<b>고정액</b>을 먼저 빼고 남은 요금에서 <b>%</b>를 더 빼요. 최대 0은 제한 없음.', fields: [['name', '이름', 'text', 220], ['fixed', '고정액', 'num', 90], ['percent', '%', 'num', 60], ['max', '최대', 'num', 90], ['desc', '설명', 'text', 300]] },
    addons: { title: '부가서비스 · 보험', help: '<b>통신사</b>별로 따로 보여요 (공통은 모든 통신사). <b>유치</b>를 고르면 (상담 화면에서 ★를 눌러도 같아요) 맨 위에 고정돼요. <b>묶음</b>은 보험 위쪽 탭 · 부가서비스 왼쪽 그룹 이름이에요. 보험의 <b>대상</b>은 A 안드로이드 · I 아이폰 · FO 폴드 · FL 플립을 쉼표로 써요. <b>출고가 이상/미만</b>을 넣으면 맞는 보험을 "이 폰에 맞음"으로 알려줘요. 종류가 <b>폰교체</b>면 폰교체 프로그램에, <b>듀얼</b>이면 듀얼번호에 쓰여요.', fields: [['carrier', '통신사', 'carrierAll', 90], ['push', '유치', 'sel:,유치', 70], ['kind', '종류', 'sel:보험,부가,폰교체,듀얼', 90], ['grp', '묶음', 'text', 130], ['name', '이름', 'text', 220], ['fee', '월 요금', 'num', 90], ['months', '유지 개월', 'num', 80], ['dev', '대상', 'text', 90], ['minP', '출고가 이상', 'num', 100], ['maxP', '출고가 미만', 'num', 100], ['cond', '조건 · 메모', 'text', 220]] },
    usims: { title: '유심 비용', help: '통신사별 유심 종류와 비용이에요. 상담 화면 C칸에서 골라요. 통신사를 <b>공통</b>으로 두면 알뜰폰에 쓰여요.', fields: [['carrier', '통신사', 'carrierAll', 100], ['name', '이름', 'text', 220], ['fee', '비용', 'num', 100], ['cond', '메모', 'text', 220]] },
    notices: { title: '알림 (처음 화면)', help: '처음 화면 <b>알림</b> 칸에 보이는 글이에요.', fields: [['date', '날짜', 'text', 110], ['text', '내용', 'text', 640]] }
  };
  var ADMIN_TABS = [['subsidy', '공통지원금 (12시 변경)'], ['devices', '용량 · 출고가'], ['models', '모델 · 색상 · 사진'], ['plans', '요금제'], ['wired', '인터넷 · TV 요금'], ['usedStock', '중고폰 재고'], ['bundles', '결합 할인'], ['cards', '청구할인 카드'], ['lightCards', '라이트할부카드'], ['welfare', '복지 할인'], ['addons', '부가서비스 · 보험'], ['usims', '유심 비용'], ['notices', '알림'], ['basic', '매장 · 기본값'], ['sources', '자료 출처 · 기준일'], ['backup', '백업 · 옮기기']];

  function renderAdmin() {
    if (window.GMS_ME && window.GMS_ME.r !== 'admin') { location.hash = '#/home'; return; }
    var h = '<div class="page-h"><h1>관리</h1><div class="sub">여기서 바꾼 값은 이 컴퓨터에 저장돼요. 다른 기기로는 [백업 · 옮기기]로 옮겨요.</div></div>';
    h += '<div class="grid2"><div class="card side-nav">' + ADMIN_TABS.map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (adminTab === t[0] ? 'on' : '') + '">' + t[1] + '</button>'; }).join('') + '</div><div id="adm"></div></div>';
    app.innerHTML = '<div class="wrap">' + h + '</div>';
    var box = $('#adm');
    if (adminTab === 'subsidy') adminSubsidy(box);
    else if (adminTab === 'basic') adminBasic(box);
    else if (adminTab === 'backup') adminBackup(box);
    else if (adminTab === 'wired') adminWired(box);
    else if (adminTab === 'sources') adminSources(box);
    else adminTable(box, adminTab);
  }

  var subCar = 'lgu';
  function adminSubsidy(box) {
    var D = DB.data, devs = D.devices.filter(function (d) { return !d.special && (!d.only || d.only === subCar); });
    var plans = DB.plansOf(subCar);
    var tierName = [1, 2, 3, 4, 5].map(function (t) { var p = plans.filter(function (x) { return x.tier === t; }); return p.length ? num(Math.min.apply(null, p.map(function (x) { return x.fee; }))) + '원↑' : ''; });
    var k = G.kst();
    var tomorrow = new Date(Date.now() + 9 * 3600e3 + 864e5).toISOString().slice(0, 10);
    var h = '<section class="card"><div class="card-h"><h2>공통지원금</h2><div class="r"><div class="seg sm" style="width:220px">' + ['skt', 'kt', 'lgu'].map(function (c) { return '<button data-sc="' + c + '" class="' + (subCar === c ? 'on' : '') + '">' + esc(DB.carrier(c).name) + '</button>'; }).join('') + '</div></div></div>';
    h += '<div class="help">' + esc(D.subsidyNote || '') + '<br>칸을 고치고 아래에서 <b>언제 바꿀지</b> 고른 뒤 저장해요. <b>예약</b>으로 저장하면 그날 <b>낮 12시</b>에 자동으로 바뀌어요. (프로그램 창이 열려 있으면 12시 정각에, 닫혀 있으면 다음에 열 때 바뀌어요)</div>';
    h += '<div class="tbl-wrap" style="max-height:560px"><table class="tbl edit"><thead><tr><th>모델</th><th class="r">출고가</th>' + [1, 2, 3, 4, 5].map(function (t, i) { return '<th class="r">' + t + '구간<br><span style="font-weight:500">' + tierName[i] + '</span></th>'; }).join('') + '</tr></thead><tbody>';
    h += devs.map(function (d) { var arr = (D.subsidy[d.id] || {})[subCar] || [0, 0, 0, 0, 0]; return '<tr><td style="padding:0 12px;font-weight:700;white-space:nowrap">' + esc(d.name) + '</td><td class="r" style="padding:0 12px">' + num(d.price) + '</td>' + arr.map(function (v, i) { return '<td style="width:110px"><input class="r" data-did="' + d.id + '" data-n="' + i + '" data-old="' + n0(v) + '" value="' + num(v) + '" inputmode="numeric"></td>'; }).join('') + '</tr>'; }).join('');
    h += '</tbody></table></div>';
    h += '<div class="bar"><div class="seg sm" style="width:260px"><button data-when="now" class="on">지금 바로</button><button data-when="sched">날짜 예약 (12시)</button></div><input type="date" id="sdate" value="' + (k.hour >= 12 ? tomorrow : k.date) + '" class="hidden" style="height:32px;border:1px solid var(--line);border-radius:8px;padding:0 8px"><span class="grow"></span><span id="chgN" style="color:var(--sub);font-size:var(--fs-1)">바뀐 칸 0개</span><button class="btn pri" id="ssave">저장</button></div></section>';
    var sch = D.subsidySched || [], log = (D.subsidyLog || []).slice(0, 30);
    var dn = function (id) { return (DB.device(id) || {}).name || id; };
    h += '<section class="card" style="margin-top:16px"><div class="card-h"><h2>예약된 변경</h2><div class="r"><span style="font-size:var(--fs-1);color:var(--sub)">' + sch.length + '건</span></div></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>적용 시각</th><th>통신사</th><th>모델</th><th>구간</th><th class="r">새 금액</th><th></th></tr></thead><tbody>' +
      (sch.map(function (x, i) { return '<tr><td>' + x.at + ' 12:00</td><td>' + esc(DB.carrier(x.cid).name) + '</td><td>' + esc(dn(x.did)) + '</td><td>' + (x.n + 1) + '구간</td><td class="r b">' + num(x.value) + '</td><td class="r"><button class="btn sm red" data-unsch="' + i + '">취소</button></td></tr>'; }).join('') || '<tr><td colspan="6" class="empty-note">예약된 변경이 없어요.</td></tr>') + '</tbody></table></div></section>';
    h += '<section class="card" style="margin-top:16px"><div class="card-h"><h2>최근 바뀐 기록</h2></div><div class="tbl-wrap" style="max-height:320px"><table class="tbl"><thead><tr><th>시각</th><th>통신사</th><th>모델</th><th>구간</th><th class="r">전</th><th class="r">후</th></tr></thead><tbody>' +
      (log.map(function (x) { return '<tr><td>' + x.at + '</td><td>' + esc((DB.carrier(x.cid) || {}).name) + '</td><td>' + esc(dn(x.did)) + '</td><td>' + (x.n + 1) + '구간</td><td class="r">' + num(x.from) + '</td><td class="r b">' + num(x.to) + '</td></tr>'; }).join('') || '<tr><td colspan="6" class="empty-note">아직 기록이 없어요.</td></tr>') + '</tbody></table></div></section>';
    box.innerHTML = h;
    var when = 'now';
    $$('[data-sc]', box).forEach(function (b) { b.onclick = function () { subCar = b.getAttribute('data-sc'); renderAdmin(); }; });
    $$('[data-when]', box).forEach(function (b) { b.onclick = function () { when = b.getAttribute('data-when'); $$('[data-when]', box).forEach(function (x) { x.classList.toggle('on', x === b); }); $('#sdate').classList.toggle('hidden', when !== 'sched'); }; });
    var count = function () { var n = $$('input[data-did]', box).filter(function (i) { var ch = n0(i.value) !== n0(i.getAttribute('data-old')); i.classList.toggle('chg', ch); return ch; }).length; $('#chgN').textContent = '바뀐 칸 ' + n + '개'; return n; };
    $$('input[data-did]', box).forEach(function (i) { i.oninput = count; i.onblur = function () { i.value = num(i.value); }; });
    $$('[data-unsch]', box).forEach(function (b) { b.onclick = function () { D.subsidySched.splice(Number(b.getAttribute('data-unsch')), 1); DB.saveData(); renderAdmin(); toast('예약을 취소했어요'); }; });
    $('#ssave').onclick = function () {
      var ch = $$('input[data-did]', box).filter(function (i) { return n0(i.value) !== n0(i.getAttribute('data-old')); });
      if (!ch.length) { toast('바뀐 칸이 없어요'); return; }
      if (when === 'now') {
        ch.forEach(function (i) {
          var did = i.getAttribute('data-did'), n = Number(i.getAttribute('data-n'));
          var s = (D.subsidy[did] = D.subsidy[did] || {}); s[subCar] = s[subCar] || [0, 0, 0, 0, 0];
          D.subsidyLog.unshift({ at: G.nowStr(), did: did, cid: subCar, n: n, from: n0(s[subCar][n]), to: n0(i.value) });
          s[subCar][n] = n0(i.value);
        });
        toast(ch.length + '칸을 지금 바꿨어요');
      } else {
        var at = $('#sdate').value; if (!at) { toast('날짜를 골라 주세요'); return; }
        ch.forEach(function (i) { D.subsidySched.push({ at: at, did: i.getAttribute('data-did'), cid: subCar, n: Number(i.getAttribute('data-n')), value: n0(i.value) }); });
        toast(at.slice(5).replace('-', '/') + ' 낮 12시에 바뀌도록 예약했어요');
      }
      DB.saveData(); DB.applySchedule(); renderAdmin();
    };
  }

  function adminTable(box, key) {
    var cfg = EDIT[key], D = DB.data, list = D[key];
    var mno = D.carriers.filter(function (c) { return !c.mvno; });
    function cell(x, f, i) {
      var v = x[f[0]] == null ? '' : x[f[0]], t = f[2], a = 'data-i="' + i + '" data-f="' + f[0] + '"';
      if (t === 'num') return '<input class="r" inputmode="numeric" ' + a + ' value="' + num(v) + '">';
      if (t === 'carrier' || t === 'carrierM') return '<select ' + a + '>' + (t === 'carrierM' ? mno : D.carriers).map(function (c) { return opt(c.id, c.name, v); }).join('') + '</select>';
      if (t === 'carrierAll') return '<select ' + a + '><option value=>공통</option>' + mno.map(function (c) { return opt(c.id, c.name, v); }).join('') + '</select>';
      if (t === 'only') return '<select ' + a + '><option value="">전체</option>' + mno.map(function (c) { return opt(c.id, c.name + ' 전용', v); }).join('') + '</select>';
      if (t === 'model') return '<select ' + a + '>' + D.models.map(function (c) { return opt(c.id, c.name, v); }).join('') + '</select>';
      if (t === 'store') return '<select ' + a + '>' + D.stores.map(function (c) { return opt(c.id, c.name, v); }).join('') + '</select>';
      if (t.indexOf('sel:') === 0) return '<select ' + a + '>' + t.slice(4).split(',').map(function (o) { return opt(o, o, v); }).join('') + '</select>';
      return '<input ' + a + ' value="' + esc(v) + '">';
    }
    var h = '<section class="card"><div class="card-h"><h2>' + cfg.title + '</h2><div class="r"><span style="font-size:var(--fs-1);color:var(--sub)">' + list.length + '개</span></div></div><div class="help">' + cfg.help + ' 고친 뒤 <b>저장</b>을 눌러요.</div>';
    h += '<div class="tbl-wrap" style="max-height:620px"><table class="tbl edit"><thead><tr>' + cfg.fields.map(function (f) { return '<th' + (f[2] === 'num' ? ' class="r"' : '') + ' style="min-width:' + f[3] + 'px">' + f[1] + '</th>'; }).join('') + '<th></th></tr></thead><tbody>';
    h += list.map(function (x, i) { return '<tr>' + cfg.fields.map(function (f) { return '<td>' + cell(x, f, i) + '</td>'; }).join('') + '<td><button class="btn sm red" data-rm="' + i + '">삭제</button></td></tr>'; }).join('');
    h += '</tbody></table></div><div class="bar"><button class="btn" id="tadd">+ 한 줄 추가</button><span class="grow"></span><button class="btn pri" id="tsave">저장</button></div></section>';
    box.innerHTML = h;
    function collect() {
      $$('[data-f]', box).forEach(function (el) {
        var i = Number(el.getAttribute('data-i')), f = el.getAttribute('data-f'), fd = cfg.fields.find(function (x) { return x[0] === f; });
        var v = el.value; if (fd[2] === 'num') v = n0(v); if (f === 'tier') v = Number(v);
        list[i][f] = v;
      });
      if (key === 'devices') list.forEach(function (d) { var m = DB.model(d.model); if (m) { d.maker = m.maker; d.only = m.only || ''; d.special = !!m.special; } });
      if (key === 'models') list.forEach(function (m) { m.special = m.maker === '유심'; DB.skus(m.id).forEach(function (d) { d.maker = m.maker; d.only = m.only || ''; d.special = m.special; }); });
    }
    $('#tadd').onclick = function () {
      collect(); var x = { id: key + '-' + G.uid() };
      cfg.fields.forEach(function (f) { x[f[0]] = f[2] === 'num' ? 0 : f[2] === 'carrier' || f[2] === 'carrierM' ? 'skt' : f[2] === 'store' ? DB.prefs.store : f[2] === 'model' ? (D.models[0] || {}).id : f[2].indexOf('sel:') === 0 ? f[2].slice(4).split(',')[0] : ''; });
      if (key === 'plans') x.tier = 3;
      if (key === 'models') { x.specs = {}; x.cam = 's'; }
      list.push(x); adminTable(box, key); var last = $$('tbody tr', box).pop(); if (last) last.scrollIntoView({ block: 'center' });
    };
    $$('[data-rm]', box).forEach(function (b) { b.onclick = function () { collect(); var i = Number(b.getAttribute('data-rm')); if (!confirm('"' + (list[i].name || '이 줄') + '"을(를) 지울까요?')) return; list.splice(i, 1); DB.saveData(); adminTable(box, key); toast('지웠어요'); }; });
    $('#tsave').onclick = function () { collect(); DB.saveData(); toast('저장했어요'); adminTable(box, key); };
    $$('input.r', box).forEach(function (i) { i.onblur = function () { i.value = num(i.value); }; });
  }

  function adminWired(box) {
    var D = DB.data;
    var h = '<section class="card"><div class="card-h"><h2>인터넷 · TV 요금</h2></div><div class="help">3년 약정 · 부가세 포함 한 달 요금이에요. 칸을 고치고 <b>저장</b>을 눌러요. ' + esc(D.wiredNote || '') + '</div>';
    ['kt', 'skt', 'lgu'].forEach(function (c) {
      var w = D.wired[c];
      var line = function (lb, path, arr) { return '<tr><td style="padding:0 12px;font-weight:700">' + lb + '</td>' + arr.map(function (v, i) { return '<td><input class="r" data-wp="' + c + '|' + path + '|' + i + '" value="' + num(v) + '" inputmode="numeric"></td>'; }).join('') + '</tr>'; };
      h += '<div class="subhead" style="padding:12px 16px 0">' + esc(w.name) + '</div><div class="tbl-wrap"><table class="tbl edit"><thead><tr><th style="min-width:220px">항목</th><th class="r">100M</th><th class="r">500M</th><th class="r">1G</th></tr></thead><tbody>';
      h += line('인터넷 요금', 'fees', w.fees) + line('휴대폰 결합 시 인터넷 할인', 'bundleOff', w.bundleOff) + line('와이파이 공유기', 'wifi', w.wifi);
      var ins = w.install = w.install || { inet: [0, 0], tv: [0, 0] };
      h += '<tr><td style="padding:0 12px;font-weight:700">설치비 (평일 낮 · 주말/공휴일)</td><td colspan="3">인터넷 <input class="r" style="width:90px" data-wi="' + c + '|inet|0" value="' + num(ins.inet[0]) + '"> <input class="r" style="width:90px" data-wi="' + c + '|inet|1" value="' + num(ins.inet[1]) + '"> · TV 1대 <input class="r" style="width:90px" data-wi="' + c + '|tv|0" value="' + num(ins.tv[0]) + '"> <input class="r" style="width:90px" data-wi="' + c + '|tv|1" value="' + num(ins.tv[1]) + '"></td></tr>';
      h += '<tr><td style="padding:0 12px;font-weight:700">셋톱박스 · 인터넷 전화</td><td><input class="r" data-wp="' + c + '|stb|-" value="' + num(w.stb) + '"></td><td><input class="r" data-wp="' + c + '|tel|-" value="' + num(w.tel) + '"></td><td></td></tr>';
      h += '</tbody></table></div>';
      h += '<div class="tbl-wrap"><table class="tbl edit"><thead><tr><th style="min-width:220px">TV 요금제</th><th class="r">채널</th><th class="r">월 요금</th><th style="min-width:420px">셋톱박스 (이름:월요금, ...)</th><th style="min-width:240px">설명</th><th style="min-width:180px">주의</th><th>결합 불가</th></tr></thead><tbody>' +
        w.tv.map(function (t, ti) { var k = c + '|' + ti + '|'; return '<tr><td><input data-wt="' + k + 'name" value="' + esc(t.name) + '"></td><td><input class="r" data-wt="' + k + 'ch" value="' + n0(t.ch) + '"></td><td><input class="r" data-wt="' + k + 'fee" value="' + num(t.fee != null ? t.fee : (t.fees || [])[1]) + '"></td><td><input data-wt="' + k + 'stbs" value="' + esc(t.stbs || ('셋톱박스:' + n0(w.stb))) + '"></td><td><input data-wt="' + k + 'desc" value="' + esc(t.desc || '') + '"></td><td><input data-wt="' + k + 'note" value="' + esc(t.note || '') + '"></td><td style="text-align:center"><input type="checkbox" data-wt="' + k + 'noBundle"' + (t.noBundle ? ' checked' : '') + '></td></tr>'; }).join('') +
        '</tbody></table></div><div class="bar"><button class="btn" data-wtadd="' + c + '">+ TV 요금제 추가</button></div>';
    });
    h += '<div class="bar"><span class="grow"></span><button class="btn pri" id="wsave">저장</button></div></section>';
    box.innerHTML = h;
    $('#wsave').onclick = function () {
      $$('[data-wp]', box).forEach(function (el) {
        var p = el.getAttribute('data-wp').split('|'), w = D.wired[p[0]], v = n0(el.value);
        if (p[2] === '-') w[p[1]] = v;
        else if (p[1].indexOf('tv.') === 0) w.tv[Number(p[1].slice(3))].fees[Number(p[2])] = v;
        else w[p[1]][Number(p[2])] = v;
      });
      $$('[data-wi]', box).forEach(function (el) { var p = el.getAttribute('data-wi').split('|'); D.wired[p[0]].install[p[1]][Number(p[2])] = n0(el.value); });
      $$('[data-wt]', box).forEach(function (el) {
        var p = el.getAttribute('data-wt').split('|'), t = D.wired[p[0]].tv[Number(p[1])], k = p[2];
        if (k === 'noBundle') t.noBundle = el.checked; else if (k === 'ch' || k === 'fee') { t[k] = n0(el.value); delete t.fees; } else t[k] = el.value.trim();
      });
      DB.saveData(); toast('저장했어요'); adminWired(box);
    };
    $$('[data-wtadd]', box).forEach(function (b) { b.onclick = function () { var c = b.getAttribute('data-wtadd'); D.wired[c].tv.push({ id: c + '-tv' + Date.now().toString(36), name: '새 TV 요금제', ch: 0, fee: 0, stbs: '셋톱박스:4400', desc: '' }); DB.saveData(); adminWired(box); }; });
  }

  function adminSources(box) {
    var D = DB.data;
    var h = '<section class="card"><div class="card-h"><h2>자료 출처 · 기준일</h2><div class="r"><span style="font-size:var(--fs-1);color:var(--sub)">데이터 기준일 ' + esc(D.updatedAt || '') + '</span></div></div>';
    h += '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>항목</th><th>출처</th><th>조회일</th></tr></thead><tbody>' + (D.sources || []).map(function (x) { return '<tr><td class="b">' + esc(x[0]) + '</td><td>' + (x[2] ? '<a href="' + esc(x[2]) + '" target="_blank" rel="noopener">' + esc(x[1]) + '</a>' : esc(x[1])) + '</td><td>' + esc(x[3]) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    h += '<div class="help">' + esc(D.subsidyNote || '') + '<br>' + esc(D.wiredNote || '') + '<br>단말기 그림은 색상 안내용으로 직접 그린 그림이에요. 제조사 사진은 저작권이 있어 넣지 않았어요. [모델 · 색상 · 사진]에서 매장 사진 주소를 넣을 수 있어요.</div></section>';
    box.innerHTML = h;
  }

  function adminBasic(box) {
    var D = DB.data;
    var h = '<section class="card"><div class="card-h"><h2>매장 · 기본값</h2></div><div class="modal-p"><div class="form">';
    D.stores.forEach(function (s, i) { h += '<div class="field"><label>' + esc(s.name) + ' 전화</label><input data-st="' + i + '" value="' + esc(s.phone) + '"></div>'; });
    h += '<div class="field"><label>대표번호</label><input id="b-main" value="' + esc(D.mainPhone) + '"></div>';
    var lp = D.lowPlanFee || { skt: 45000, kt: 50000, lgu: 47000 };
    h += '<div class="field"><label>갤럭시 A · M 기본 요금제 (SKT / KT / LG U+, 원)</label><div style="display:flex;gap:8px"><input id="b-lp-skt" inputmode="numeric" value="' + num(lp.skt) + '"><input id="b-lp-kt" inputmode="numeric" value="' + num(lp.kt) + '"><input id="b-lp-lgu" inputmode="numeric" value="' + num(lp.lgu) + '"></div></div>';
    h += '<div class="field"><label>유심비 (원)</label><input id="b-usim" inputmode="numeric" value="' + num(D.usimFee) + '"></div>';
    h += '<div class="field"><label>군인 할인 (%)</label><input id="b-mil" inputmode="numeric" value="' + n0(D.militaryRate) + '"></div>';
    h += '<div class="field"><label>할부 이자 (연 %)</label><input id="b-rate" inputmode="decimal" value="' + ((D.carriers[0] || {}).rate || 5.9) + '"></div>';
    h += '<div class="field"><label>프리미엄패스 기본 금액 (원)</label><input id="b-pass" inputmode="numeric" value="' + num(((D.passes || [])[0] || {}).off) + '"></div>';
    h += '<div class="field full"><label>견적서 아래 안내 문구</label><textarea id="b-caut" style="height:120px">' + esc(D.cautions) + '</textarea></div>';
    h += '</div></div><div class="bar"><span class="grow"></span><button class="btn pri" id="bsave">저장</button></div></section>';
    box.innerHTML = h;
    $('#bsave').onclick = function () {
      $$('[data-st]', box).forEach(function (el) { D.stores[Number(el.getAttribute('data-st'))].phone = el.value.trim(); });
      D.mainPhone = $('#b-main').value.trim(); D.usimFee = n0($('#b-usim').value); D.lowPlanFee = { skt: n0($('#b-lp-skt').value), kt: n0($('#b-lp-kt').value), lgu: n0($('#b-lp-lgu').value) }; D.militaryRate = n0($('#b-mil').value);
      var rate = Number($('#b-rate').value) || 5.9; D.carriers.forEach(function (c) { c.rate = rate; });
      if (D.passes && D.passes[0]) D.passes[0].off = n0($('#b-pass').value);
      D.cautions = $('#b-caut').value; DB.saveData(); toast('저장했어요');
    };
  }

  function adminBackup(box) {
    var h = '<section class="card"><div class="card-h"><h2>백업 · 다른 기기로 옮기기</h2></div><div class="help">1) 이 컴퓨터에서 <b>백업 파일 받기</b> → 2) 그 파일을 다른 기기로 보내기 (카톡 나에게 보내기 등) → 3) 다른 기기에서 <b>백업 파일 불러오기</b></div>';
    h += '<div class="modal-p" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri lg" id="bk1">백업 파일 받기 (단가 · 정책)</button><button class="btn lg" id="bk2">상담 기록도 함께 받기</button><label class="btn lg">백업 파일 불러오기<input type="file" id="bk3" accept=".json" class="hidden"></label></div>';
    h += '<div class="bar"><span style="color:var(--sub);font-size:var(--fs-2)">처음 상태로 되돌리기 (' + esc(DB.data.updatedAt || '') + ' 기준 값으로 바뀌어요)</span><span class="grow"></span><button class="btn red" id="bk4">초기화</button></div></section>';
    box.innerHTML = h;
    var day = G.kst().date;
    $('#bk1').onclick = function () { G.download('고무신상담-단가-' + day + '.json', JSON.stringify({ type: 'gms-consult', data: DB.data }, null, 1)); };
    $('#bk2').onclick = function () { G.download('고무신상담-전체-' + day + '.json', JSON.stringify({ type: 'gms-consult', data: DB.data, records: DB.records }, null, 1)); };
    $('#bk3').onchange = function (e) {
      var f = e.target.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () {
        try { var j = JSON.parse(rd.result); if (j.type !== 'gms-consult' || !j.data) throw 0; if (!confirm('지금 값을 백업 파일 값으로 바꿀까요?')) return;
          DB.data = j.data; DB.saveData(); if (j.records) { DB.records = j.records; DB.saveRecords(); } DB.init(); toast('불러왔어요'); renderAdmin();
        } catch (x) { toast('이 프로그램의 백업 파일이 아니에요'); }
      };
      rd.readAsText(f);
    };
    $('#bk4').onclick = function () { if (!confirm('단가와 정책을 모두 처음 값으로 되돌릴까요? (상담 기록은 남아요)')) return; DB.resetData(); DB.init(); toast('초기화했어요'); renderAdmin(); };
  }

  /* =========================================================
     라우터 · 이벤트
     ========================================================= */
  function render() {
    var p = (location.hash.replace(/^#\/?/, '') || 'home').split('/');
    var r = p[0];
    if (r === 'wireless') { location.hash = '#/phone'; return; }
    header(r);
    if (r === 'phone' || r === 'mvno') {
      mode = r === 'phone' ? 'wireless' : 'mvno';
      if (!S[mode]) S[mode] = newState(mode);
      if (!p[1]) renderCarriers(mode);
      else if (!carriersFor(mode).find(function (c) { return c.id === p[1]; })) { location.hash = '#/' + r; return; }
      else if (!p[2]) renderGuide(mode, p[1], '');
      else renderGuide(mode, p[1], p[2]);
      saveDraft();
    } else if (r === 'used') {
      mode = 'used'; if (!S.used) S.used = newState('used');
      renderConsult(); saveDraft();
    } else if (r === 'home') renderHome();
    else if (r === 'wired') renderWired();
    else if (r === 'records') renderRecords();
    else if (r === 'admin') renderAdmin();
    else { location.hash = '#/home'; }
  }

  function bind() {
    app.addEventListener('click', function (e) {
      var b = e.target.closest('[data-set]');
      if (b) {
        var s = st(), k = b.getAttribute('data-set'), v = b.getAttribute('data-v');
        s[k] = v; if (k === 'subMode') s.view = 'consult';
        render(); return;
      }
      var gt = e.target.closest('[data-gtab]');
      if (gt) { var s1 = st(), t = gt.getAttribute('data-gtab'); if (t === 'plans') s1.view = 'plans'; else { s1.view = 'consult'; if (t !== 'consult') s1.subMode = t; } render(); return; }
      var col = e.target.closest('[data-color]'); if (col) { st().color = col.getAttribute('data-color'); render(); return; }
      var cap = e.target.closest('[data-cap]'); if (cap) { st().device = cap.getAttribute('data-cap'); st().priceEdit = null; render(); return; }
      var pr = e.target.closest('tr[data-prow]'); if (pr) { var s2 = st(); s2.plan = pr.getAttribute('data-prow'); s2.planAuto = false; if (!(DB.carrier(s2.carrier) || {}).mvno) s2.subMode = pr.getAttribute('data-psub'); s2.view = 'consult'; render(); window.scrollTo(0, ($('#gtabs') || {}).offsetTop - 64 || 0); return; }
      var lm = e.target.closest('[data-lmk]'); if (lm) { listMaker = lm.getAttribute('data-lmk'); render(); return; }
      var fv = e.target.closest('[data-fav]');
      if (fv) { e.preventDefault(); toggleFav(fv.getAttribute('data-fav')); render(); return; }
      var tl = e.target.closest('[data-tool]');
      if (tl) {
        var tk = tl.getAttribute('data-tool');
        if (tk === 'save') toolSave();
        else if (tk === 'fav') { toggleFav((DB.device(st().device) || {}).model); render(); }
        else if (tk === 'share') toolShare();
        else if (tk === 'fee') toolFee();
        else if (tk === 'cmp') { st().view = 'plans'; render(); }
        return;
      }
      var w = e.target.closest('[data-w]');
      if (w) { var wk = w.getAttribute('data-w'), wv = w.getAttribute('data-v'); if (wk === 'speed') W.speed = Number(wv); else if (wk === 'day') W.day = Number(wv); else { W.carrier = wv; W.tv = ''; W.stb = 0; } renderWired(); return; }
      var t2 = e.target.closest('[data-tab]'); if (t2) { adminTab = t2.getAttribute('data-tab'); renderAdmin(); return; }
      var at = e.target.closest('[data-admintab]'); if (at) { adminTab = at.getAttribute('data-admintab'); }
      var del = e.target.closest('[data-del]');
      if (del) { e.stopPropagation(); if (!confirm('이 상담 기록을 지울까요?')) return; DB.records = DB.records.filter(function (x) { return x.id !== del.getAttribute('data-del'); }); DB.saveRecords(); renderRecords(); return; }
      var rec = e.target.closest('tr[data-rid]'); if (rec) { loadRecord(rec.getAttribute('data-rid')); return; }
      var a = e.target.closest('[data-act]'); if (!a) return;
      var act = a.getAttribute('data-act');
      if (act === 'pickDevice') pickDevice();
      else if (act === 'pickModel') pickModel();
      else if (act === 'pickPlan') pickPlan();
      else if (act === 'pickTV') pickTV();
      else if (act === 'pickBundle') pickBundleBig();
      else if (act === 'pickCard') pickCardKind('card');
      else if (act === 'pickLight') pickCardKind('light');
      else if (act === 'pickWelfare') pickWelfare();
      else if (act === 'pickMilitary') pickMilitary();
      else if (act === 'pickDual') pickDual();
      else if (act === 'pickFam') pickFam();
      else if (act === 'pickAddon') pickAddon();
      else if (act === 'pickIns') pickIns();
      else if (act === 'more') { DB.prefs.more = !DB.prefs.more; DB.savePrefs(); render(); }
      else if (act === 'save') doSave();
      else if (act === 'print') doPrint();
      else if (act === 'copy') copySummary();
      else if (act === 'reset') { if (confirm('입력한 내용을 모두 지울까요?')) { var keep = st(); S[mode] = newState(mode); if (mode !== 'used') { S[mode].carrier = keep.carrier; S[mode].plan = keep.plan; S[mode].device = keep.device; S[mode].color = keep.color; } render(); } }
      else if (act === 'toTotal') { var tc = $('.total-card'); if (tc) tc.scrollIntoView({ behavior: 'smooth' }); }
      else if (act === 'wcopy') { G.copyText(renderWired.text).then(function (ok) { toast(ok ? '복사했어요' : '복사가 안 됐어요'); }); }
      else if (act === 'wreset') { W = null; renderWired(); }
      else if (act === 'csv') {
        var rows = [['날짜', '매장', '직원', '고객', '전화번호', '통신사', '모델', '요금제', '월납부', '메모']].concat(DB.records.map(function (x) { return [x.at, DB.store(x.store).name, x.staff, x.state.customer, x.state.phone, x.carrier, x.device, x.plan, x.monthly, (x.state.memo || '').replace(/\n/g, ' ')]; }));
        G.download('상담기록-' + G.kst().date + '.csv', '﻿' + rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'), 'text/csv');
      }
    });
    app.addEventListener('input', function (e) {
      var el = e.target;
      if (el.hasAttribute('data-k') && el.getAttribute('data-num')) { st()[el.getAttribute('data-k')] = n0(el.value); refresh(); }
      var wk = el.getAttribute('data-wk'); if (wk === 'gift' || wk === 'mobileOff') W[wk] = n0(el.value);
    });
    app.addEventListener('change', function (e) {
      var el = e.target, k = el.getAttribute('data-k');
      if (k) {
        var s = st();
        if (el.type === 'checkbox') s[k] = el.checked;
        else if (el.getAttribute('data-num')) { s[k] = n0(el.value); el.value = s[k] ? num(s[k]) : ''; refresh(); return; }
        else if (k === 'carrier') { setCarrier(s, el.value); }
        else { s[k] = (k === 'months' || k === 'cardTier' || k === 'lightTier') ? Number(el.value) : el.value; if (k === 'plan') s.planAuto = false; }
        if (k === 'pass') { var p = DB.data.passes.find(function (x) { return x.id === el.value; }); s.passAmt = p ? n0(p.off) : 0; }
        if (k === 'light') { var l = DB.data.lightCards.find(function (x) { return x.id === el.value; }); s.lightAmt = l ? n0(l.off) : 0; }
        render(); return;
      }
      var wk = el.getAttribute('data-wk');
      if (wk) { W[wk] = el.type === 'checkbox' ? el.checked : (wk === 'gift' || wk === 'mobileOff') ? n0(el.value) : el.value; renderWired(); }
    });
    $('#store').onchange = function (e) { DB.prefs.store = e.target.value; DB.savePrefs(); render(); toast(DB.store(e.target.value).name + '(으)로 바꿨어요'); };
    window.addEventListener('hashchange', function () { closeModal(); render(); window.scrollTo(0, 0); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
    setInterval(function () { var n = DB.applySchedule(); var r = (location.hash.replace(/^#\/?/, '') || 'home').split('/')[0]; header(r); if (n) { toast('낮 12시 공통지원금 ' + n + '건이 바뀌었어요'); if ($('#cols') || $('.mgrid')) render(); } }, 60000);
  }
  function toggleFav(mid) {
    if (!mid) return;
    var f = DB.prefs.fav = DB.prefs.fav || [], i = f.indexOf(mid);
    if (i >= 0) { f.splice(i, 1); toast('즐겨찾기에서 뺐어요'); } else { f.push(mid); toast('즐겨찾기에 넣었어요'); }
    DB.savePrefs();
  }

  document.addEventListener('DOMContentLoaded', function () {
    app = $('#app');
    DB.init();
    var qs = /[?&]store=([a-z]+)/.exec(location.search); if (qs && DB.data.stores.some(function (x) { return x.id === qs[1]; })) { DB.prefs.store = qs[1]; DB.savePrefs(); }
    var ME = null; try { var mc = /(?:^|;\s*)gms_n=([^;]+)/.exec(document.cookie); if (mc) ME = JSON.parse(decodeURIComponent(mc[1])); } catch (e) {}
    window.GMS_ME = ME;
    if (ME && ME.s && ME.s !== 'all' && DB.data.stores.some(function (x) { return x.id === ME.s; })) { DB.prefs.store = ME.s; DB.savePrefs(); document.body.classList.add('st-lock'); var se = document.getElementById('store'); if (se) se.disabled = true; }
    if (ME && ME.r !== 'admin') document.body.classList.add('no-admin');
    loadDraft(); bind(); render();
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () {});
    var lastChk = Date.now();
    function chkNew() {
      if (Date.now() - lastChk < 10 * 60e3) return; lastChk = Date.now();
      fetch('js/data.js?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
        var m = /officialAt:\s*'([^']+)'/.exec(t || '');
        if (m && m[1] > (window.DEFAULT_DATA.officialAt || '') && !$('#modal')) { saveDraft(); location.reload(); }
      }).catch(function () {});
    }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) chkNew(); });
    setInterval(function () { if (!document.hidden) chkNew(); }, 15 * 60e3);
    /* 상단에 반짝이며 떨어지는 별 */
    var sb = $('#stars');
    if (sb && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      var n = window.innerWidth < 760 ? 14 : 32, hs = '';
      for (var i = 0; i < n; i++) {
        var big = Math.random() < 0.3, dur = (4 + Math.random() * 5).toFixed(1), del = (-Math.random() * 9).toFixed(1);
        hs += '<i class="' + (big ? 'big' : '') + '" style="left:' + (Math.random() * 100).toFixed(1) + '%;animation-duration:' + dur + 's;animation-delay:' + del + 's"></i>';
      }
      sb.innerHTML = hs;
    }
  });
})();

/* 복사 · 저장 막기 (입력칸은 그대로 쓸 수 있어요) */
(function () {
  function editable(t) { return t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]'); }
  ['contextmenu', 'copy', 'cut', 'dragstart', 'selectstart'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (!editable(e.target)) e.preventDefault(); }, true);
  });
  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase(), c = e.ctrlKey || e.metaKey;
    if (k === 'f12' || (c && (k === 'u' || k === 's')) || (c && e.shiftKey && (k === 'i' || k === 'j' || k === 'c'))) { e.preventDefault(); e.stopPropagation(); }
    if (c && (k === 'c' || k === 'x' || k === 'a') && !editable(e.target)) e.preventDefault();
  }, true);
})();
