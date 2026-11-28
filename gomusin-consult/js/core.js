/* =========================================================
   컨설팅 · 저장소와 계산
   - 모든 값은 이 브라우저(localStorage)에 저장돼요.
   - 공통지원금 예약 변경은 적용일 낮 12시(한국 시간)에 자동 반영돼요.
   ========================================================= */
(function () {
  'use strict';
  var KEY_DATA = 'gms-consult-data-v2';
  var KEY_REC = 'gms-consult-records-v1';
  var KEY_PREF = 'gms-consult-prefs-v1';

  function load(key, fb) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; } }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function n0(v) { var n = Number(String(v == null ? '' : v).replace(/[^0-9.-]/g, '')); return isFinite(n) ? n : 0; }
  function pos(v) { return Math.max(0, n0(v)); }

  /* 한국 시간 */
  function kst() {
    var d = new Date(Date.now() + 9 * 3600e3);
    return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours(), min: d.getUTCMinutes() };
  }

  var DB = {
    data: null, records: [], prefs: {},
    init: function () {
      var def = window.DEFAULT_DATA;
      this.data = load(KEY_DATA, null) || clone(def);
      var self = this;
      if ((this.data.version || 1) < def.version) this.data = clone(def);
      ['carriers', 'plans', 'addons', 'usims', 'models', 'devices', 'lightCards', 'passes', 'usedStock', 'welfare', 'bundles', 'cards', 'notices', 'sources'].forEach(function (k) {
        if (!Array.isArray(self.data[k])) self.data[k] = clone(def[k] || []);
      });
      this.data.models.forEach(function (m) { if (m.code == null) { var d = (def.models || []).find(function (x) { return x.id === m.id; }); if (d && d.code) m.code = d.code; } });
      if (!this.data.wired || Array.isArray(this.data.wired)) this.data.wired = clone(def.wired);
      if ((this.data.wiredTvVer || 1) < (def.wiredTvVer || 1)) { ['kt', 'skt', 'lgu'].forEach(function (c) { if (self.data.wired[c] && def.wired[c]) { self.data.wired[c].tv = clone(def.wired[c].tv); self.data.wired[c].install = clone(def.wired[c].install); } }); this.data.wiredTvVer = def.wiredTvVer; }
      if ((this.data.planVer || 1) < (def.planVer || 1)) {
        var have = {}; this.data.plans.forEach(function (p) { have[p.id] = p; });
        def.plans.forEach(function (d) { var h = have[d.id]; if (!h) self.data.plans.push(clone(d)); else if (h.name === d.name) { h.data = d.data; h.desc = d.desc; if (d.call) h.call = d.call; if (d.sms) h.sms = d.sms; if (d.seg) h.seg = d.seg; } });
        this.data.planVer = def.planVer;
      }
      (def.carriers || []).forEach(function (c) { if (!self.data.carriers.some(function (x) { return x.id === c.id; })) self.data.carriers.push(clone(c)); });
      if ((this.data.mobingVer || 0) < (def.mobingVer || 0)) { this.data.plans = this.data.plans.filter(function (p) { return !/^mobing-/.test(p.carrier); }).concat(clone(def.plans.filter(function (p) { return /^mobing-/.test(p.carrier); }))); this.data.mvnoInfo = clone(def.mvnoInfo || {}); this.data.mobingVer = def.mobingVer; }
      if (!this.data.mvnoInfo) this.data.mvnoInfo = clone(def.mvnoInfo || {});
      if ((this.data.discVer || 0) < (def.discVer || 0)) { ['welfare', 'bundles', 'cards', 'lightCards'].forEach(function (k) { self.data[k] = clone(def[k]); }); this.data.military = clone(def.military); this.data.dualInfo = clone(def.dualInfo); this.data.famDisc = clone(def.famDisc || {}); this.data.planChange = clone(def.planChange || {}); this.data.discVer = def.discVer; }
      if (!this.data.dualInfo) this.data.dualInfo = clone(def.dualInfo || {});
      if (!this.data.military) this.data.military = clone(def.military || {});
      if (!this.data.famDisc) this.data.famDisc = clone(def.famDisc || {});
      if ((this.data.addonVer || 1) < (def.addonVer || 1)) { this.data.addons = clone(def.addons); this.data.usims = clone(def.usims); this.data.addonVer = def.addonVer; }
      if (!this.data.subsidy) this.data.subsidy = {};
      if (!Array.isArray(this.data.subsidySched)) this.data.subsidySched = [];
      if (!Array.isArray(this.data.subsidyLog)) this.data.subsidyLog = [];
      this.syncOfficial(def);
      this.applySchedule();
      this.records = load(KEY_REC, []);
      this.prefs = Object.assign({ store: 'bupyeong', staff: '', more: false, fav: [] }, load(KEY_PREF, {}));
      this.saveData();
    },
    saveData: function () { return save(KEY_DATA, this.data); },
    saveRecords: function () { return save(KEY_REC, this.records); },
    savePrefs: function () { return save(KEY_PREF, this.prefs); },
    resetData: function () { this.data = clone(window.DEFAULT_DATA); this.data.subsidySched = []; this.data.subsidyLog = []; this.saveData(); },

    /* 공식값 반영: 새 기준(officialAt)이 오면 지원금 · 출고가 · 월정액을 바꿔요.
       지난번 공식값과 다르면(매장에서 직접 고친 값) 그대로 둬요. */
    syncOfficial: function (def) {
      var D = this.data, snap = D.officialSnap, same = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
      var newer = (D.officialAt || '') < (def.officialAt || '');
      if (snap && !newer) return false;
      if (newer && snap) {
        ['models', 'devices'].forEach(function (k) { var have = {}; D[k].forEach(function (x) { have[x.id] = 1; }); (def[k] || []).forEach(function (x) { if (!have[x.id]) D[k].push(clone(x)); }); });
        (def.devices || []).forEach(function (d) { var h = D.devices.find(function (x) { return x.id === d.id; }); if (h && n0(h.price) === n0((snap.price || {})[d.id])) h.price = d.price; });
        (def.plans || []).forEach(function (d) { var h = D.plans.find(function (x) { return x.id === d.id; }); if (h && h.name === d.name && n0(h.fee) === n0((snap.fee || {})[d.id])) { h.fee = d.fee; h.tier = d.tier; } });
        D.subsidy = D.subsidy || {};
        Object.keys(def.subsidy || {}).forEach(function (did) {
          D.subsidy[did] = D.subsidy[did] || {};
          Object.keys(def.subsidy[did]).forEach(function (cid) {
            var cur = D.subsidy[did][cid], old = ((snap.sub || {})[did] || {})[cid];
            if (!cur || (old && same(cur, old))) D.subsidy[did][cid] = clone(def.subsidy[did][cid]);
          });
        });
        D.updatedAt = def.updatedAt;
      }
      var price = {}, fee = {}; (def.devices || []).forEach(function (d) { price[d.id] = d.price; }); (def.plans || []).forEach(function (p) { fee[p.id] = p.fee; });
      D.officialSnap = { price: price, fee: fee, sub: clone(def.subsidy || {}) };
      D.officialAt = def.officialAt || '';
      this.saveData();
      return newer;
    },
    /* 예약 변경 반영: 적용일 12:00(한국 시간)이 지나면 */
    applySchedule: function () {
      var k = kst(); var self = this; var left = []; var n = 0;
      (this.data.subsidySched || []).forEach(function (x) {
        var due = x.at < k.date || (x.at === k.date && k.hour >= 12);
        if (!due) { left.push(x); return; }
        var s = (self.data.subsidy[x.did] = self.data.subsidy[x.did] || {});
        s[x.cid] = s[x.cid] || [0, 0, 0, 0, 0];
        var from = n0(s[x.cid][x.n]);
        s[x.cid][x.n] = n0(x.value);
        self.data.subsidyLog.unshift({ at: x.at + ' 12:00', did: x.did, cid: x.cid, n: x.n, from: from, to: n0(x.value) });
        n++;
      });
      this.data.subsidySched = left;
      if (this.data.subsidyLog.length > 300) this.data.subsidyLog.length = 300;
      if (n) this.saveData();
      return n;
    },
    /* 지금 적용 중인 기준 시각 */
    subsidyBase: function () {
      var k = kst();
      if (k.hour >= 12) return k.date + ' 12:00';
      return new Date(Date.now() + 9 * 3600e3 - 864e5).toISOString().slice(0, 10) + ' 12:00';
    },

    carrier: function (id) { return this.data.carriers.find(function (c) { return c.id === id; }); },
    device: function (id) { return this.data.devices.find(function (d) { return d.id === id; }); },
    model: function (id) { return this.data.models.find(function (m) { return m.id === id; }); },
    skus: function (mid) { return this.data.devices.filter(function (d) { return d.model === mid; }); },
    /* 색상 "이름:#코드, ..." → [{name, hex}] */
    colors: function (m) {
      return String((m && m.colors) || '').split(',').map(function (t) { var p = t.split(':'); return { name: (p[0] || '').trim(), hex: (p[1] || '#9CA3AF').trim() }; }).filter(function (c) { return c.name; });
    },
    used: function (id) { return this.data.usedStock.find(function (d) { return d.id === id; }); },
    plan: function (id) { return this.data.plans.find(function (p) { return p.id === id; }); },
    plansOf: function (cid) { return this.data.plans.filter(function (p) { return p.carrier === cid; }).sort(function (a, b) { return b.fee - a.fee; }); },
    store: function (id) { return this.data.stores.find(function (s) { return s.id === id; }) || this.data.stores[0]; },
    subsidy: function (did, cid, pid) {
      var p = this.plan(pid); if (!p) return 0;
      var arr = (this.data.subsidy[did] || {})[cid];
      if (!arr) return 0;
      return n0(arr[Math.max(0, Math.min(arr.length - 1, (p.tier || 1) - 1))]);
    }
  };

  /* 카드 실적 구간 "300000:15000,700000:20000" → [[300000,15000],...] */
  function tiers(card) {
    if (!card || !card.tiers) return [];
    return String(card.tiers).split(',').map(function (t) { return t.split(':').map(n0); }).filter(function (t) { return t[1] > 0; });
  }
  function welfareOff(w, base) {
    if (!w) return 0;
    var off = Math.min(base, n0(w.fixed));
    off += Math.round(((base - off) * n0(w.percent)) / 100);
    if (n0(w.max) > 0) off = Math.min(off, n0(w.max));
    return Math.min(off, base);
  }
  /* 월 할부금 (원리금 균등) */
  function installment(principal, months, ratePct) {
    if (!principal || !months) return { monthly: 0, fee: 0 };
    var r = ratePct / 100 / 12;
    if (!r) return { monthly: Math.round(principal / months), fee: 0 };
    var m = (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
    var monthly = Math.round(m / 10) * 10;
    return { monthly: monthly, fee: Math.max(0, monthly * months - principal) };
  }

  /* =========================================================
     상담 계산
     s: 상담 상태 (app.js의 newState 참고)
     ========================================================= */
  /* 결합 할인 자동 계산 (금액표가 있는 결합만) · 이 회선 한 대의 월 할인 */
  function bundleAuto(b, s, fee, afterSelect) {
    if (!b || !b.calc) return null;
    var n = Math.max(1, Math.min(n0(b.maxN) || 10, n0(s.bundleN) || n0(b.minN) || 2));
    var f10 = function (x) { return Math.floor(x / 10) * 10; };
    var keyLE = function (obj, k) { var best = null; Object.keys(obj || {}).forEach(function (x) { x = Number(x); if (x <= k && (best === null || x > best)) best = x; }); return best; };
    var colOf = function (cuts, v) { var c = 0; (cuts || [0]).forEach(function (m, i) { if (v >= m) c = i; }); return c; };
    var amt = 0, note = n + '회선', ok = n >= (n0(b.minN) || 1);
    var net = (b.nets || []).find(function (x) { return x.k === s.bundleNet; }) || (b.nets || [])[0];
    if (b.calc === 'perLine') {
      var base = b.basis === 'after' ? afterSelect : fee, k = keyLE(b.rows, n);
      amt = ok && k !== null ? n0((b.rows[k] || [])[colOf(b.cuts, base)]) : 0;
      if (ok && b.teen && s.bundleTeen) { amt += n0(b.teen); note += ' · 청소년'; }
      if (ok && b.longOpts && n0(s.bundleLong)) { amt += f10(n0(s.bundleLong) / n); note += ' · 장기'; }
    } else if (b.calc === 'group') {
      var t = net ? net.t : {}, k2 = keyLE(t, n), tot = k2 !== null ? n0(t[k2]) : 0;
      if (net && net.k === 'none' && n < 2) tot = 0;
      amt = s.bundleOne ? tot : f10(tot / n); note += ' · ' + (net ? net.l : '') + (s.bundleOne ? ' · 1회선 몰아받기' : ' · 나눠받기');
    } else if (b.calc === 'total') {
      var sum = n0(s.bundleTotal) || fee * n, mob = net ? n0(net.m[colOf(b.cuts, sum)]) : 0;
      amt = s.bundleOne ? mob : f10(mob / n); note += ' · 가족 합계 ' + won(sum) + (s.bundleOne ? ' · 1대 몰아받기' : ' · 나눠받기');
    } else if (b.calc === 'tier') {
      amt = ok ? n0(((b.tiers || []).filter(function (x) { return fee >= x[0]; }).pop() || [0, 0])[1]) : 0;
    } else if (b.calc === 'pct') {
      if (s.bundleBase) { amt = 0; note += ' · 베이스 회선'; }
      else { amt = ok && fee >= n0(b.minFee) ? f10((fee * n0(b.rate)) / 100) : 0; if (amt && b.teen && s.bundleTeen && fee >= n0(b.teenMinFee)) { amt += n0(b.teen); note += ' · 청소년'; } }
    } else if (b.calc === 'opt') {
      var op = (b.opts || []).find(function (x) { return x.k === s.bundleOpt; }) || (b.opts || [])[0];
      if (op) {
        if (op.pct) amt = f10((fee * op.pct) / 100);
        else amt = n0((op.amt || [])[colOf(b.cuts, fee)]);
        note = op.l;
      }
      (b.adds || []).forEach(function (a) { var on = (s.bundleAdds || []).indexOf(a.k) >= 0, nd = !a.need || (s.bundleAdds || []).indexOf(a.need) >= 0; if (on && nd) { amt += n0(a.amt); note += ' · ' + a.l; } });
      ok = true;
    }
    if (!ok) note += ' (최소 ' + b.minN + '회선)';
    return { amt: amt, note: note, n: n };
  }
  function calc(s, override) {
    s = Object.assign({}, s, override || {});
    var D = DB.data;
    var car = DB.carrier(s.carrier) || {};
    var mvno = !!car.mvno;
    var plan = DB.plan(s.plan);
    var isUsed = s.mode === 'used';
    var dev = isUsed ? DB.used(s.device) : DB.device(s.device);
    var special = !isUsed && dev && dev.special;
    var subMode = (mvno || isUsed || special) ? 'select' : s.subMode;
    if (mvno) subMode = 'none';

    /* ---------- A. 단말기 ---------- */
    var price = s.priceEdit != null && s.priceEdit !== '' ? pos(s.priceEdit) : (dev ? pos(dev.price) : 0);
    var common = (subMode === 'common' && dev && !isUsed && !special) ? DB.subsidy(dev.id, s.carrier, s.plan) : 0;
    var extra = (isUsed || mvno) ? 0 : pos(s.extra);
    var pass = (D.passes || []).find(function (x) { return x.id === s.pass; });
    var passOff = pass ? pos(s.passAmt) : 0;
    var usedOff = pos(s.usedOff);
    var etc = pos(s.etc);
    var light = (D.lightCards || []).find(function (x) { return x.id === s.light; });
    var lightT = tiers(light), lightMon = light && lightT.length ? n0((lightT[Math.min(lightT.length - 1, n0(s.lightTier))] || [])[1]) : 0;
    var lightOff = light && !lightT.length ? pos(s.lightAmt) : 0;
    var swap = (D.addons || []).find(function (x) { return x.id === s.swap; });
    var beforeCash = Math.max(0, price - common - extra - passOff - usedOff - etc - lightOff);
    var cash = s.cashMode === 'full' ? beforeCash : s.cashMode === 'part' ? Math.min(beforeCash, pos(s.cash)) : 0;
    var principal = beforeCash - cash;
    var months = principal > 0 ? n0(s.months) : 0;
    var rate = n0(car.rate || 5.9);
    var inst = installment(principal, months, rate);
    if (months === 0 && principal > 0) inst = { monthly: 0, fee: 0 }; /* 일시불 */

    /* ---------- B. 요금 ---------- */
    var fee = plan ? pos(plan.fee) : 0;
    var selectOff = subMode === 'select' && plan ? Math.round((fee * 0.25) / 10) * 10 : 0;
    var afterSelect = fee - selectOff;
    var bundle = (D.bundles || []).find(function (x) { return x.id === s.bundle; });
    var bAuto = bundle ? bundleAuto(bundle, s, fee, afterSelect) : null;
    var bundleOff = bundle ? Math.min(afterSelect, bAuto ? bAuto.amt : pos(s.bundleAmt)) : 0;
    var welfare = (D.welfare || []).find(function (x) { return x.id === s.welfare; });
    var welOff = welfareOff(welfare, Math.max(0, afterSelect - bundleOff));
    var mil = (D.military || {})[s.carrier] || {}, milRate = n0(mil.rate || D.militaryRate || 20);
    var milOff = s.military ? Math.min(Math.max(0, afterSelect - bundleOff - welOff), Math.round((fee * milRate) / 100 / 10) * 10) : 0;
    var famD = s.fam ? (((D.famDisc || {})[s.carrier]) || []).find(function (x) { return x.id === s.fam; }) : null;
    var famOff = famD && fee >= n0(famD.minFee) ? Math.min(Math.max(0, afterSelect - bundleOff - welOff - milOff), pos(famD.amount)) : 0;
    var promo = pos(s.promo);
    var dInfo = (D.dualInfo || {})[s.carrier];
    var dual = s.dual ? (dInfo && n0(dInfo.fee) ? pos(dInfo.fee) : pos(((D.addons || []).find(function (a) { return a.kind === '듀얼'; }) || {}).fee || 3300)) : 0;
    var planMonthly = Math.max(0, fee - selectOff - bundleOff - welOff - milOff - famOff - promo) + dual;
    var card = (D.cards || []).find(function (x) { return x.id === s.card; });
    var cardT = tiers(card);
    var cardOff = card && cardT.length ? n0((cardT[Math.min(cardT.length - 1, n0(s.cardTier))] || [])[1]) : 0;

    /* ---------- C. 별도 ---------- */
    var addons = (s.addons || []).map(function (id) { return (D.addons || []).find(function (a) { return a.id === id; }); }).filter(function (a) { return a && (!a.carrier || a.carrier === s.carrier); });
    var addonFee = addons.reduce(function (t, a) { return t + pos(a.fee); }, 0) + (swap ? pos(swap.fee) : 0);
    var usims = (D.usims || []).filter(function (u) { return u.carrier === s.carrier; });
    if (!usims.length) usims = (D.usims || []).filter(function (u) { return !u.carrier; });
    var usimItem = s.usim ? (usims.find(function (u) { return u.id === s.usim; }) || usims[0] || null) : null;
    var usim = usimItem ? pos(usimItem.fee) : (s.usim && !usims.length ? pos(D.usimFee) : 0);

    lightMon = Math.min(lightMon, inst.monthly);
    var monthly = inst.monthly - lightMon + planMonthly - cardOff + addonFee;
    var total24 = ((inst.monthly - lightMon) * Math.min(24, months || 24)) + (planMonthly - cardOff) * 24 + cash;

    return {
      mvno: mvno, subMode: subMode, isUsed: isUsed, special: special, dev: dev, plan: plan, car: car,
      price: price, common: common, extra: extra, passOff: passOff, usedOff: usedOff, etc: etc, lightOff: lightOff, light: light, lightTiers: lightT, lightMon: lightMon, milRate: milRate,
      beforeCash: beforeCash, cash: cash, principal: principal, months: months, rate: rate,
      instMonthly: inst.monthly, instFee: inst.fee,
      fee: fee, selectOff: selectOff, bundleOff: bundleOff, bAuto: bAuto, welOff: welOff, milOff: milOff, famOff: famOff, famD: famD, promo: promo, dual: dual,
      planMonthly: planMonthly, cardOff: cardOff, card: card, cardTiers: cardT,
      addons: addons, swap: swap, addonFee: addonFee, usim: usim, usimItem: usimItem, usims: usims,
      monthly: monthly, total24: total24
    };
  }

  /* 요금제를 바꾼 뒤 (6개월 후) 월 납부액 */
  function afterChange(s, planId) {
    if (!planId) return null;
    /* 단말기 할부금은 개통 때 정해진 그대로, 요금(B)만 새 요금제로 계산 */
    var r0 = calc(s); var r1 = calc(s, { plan: planId });
    return { plan: r1.plan, planMonthly: r1.planMonthly, cardOff: r1.cardOff, monthly: r0.instMonthly + r1.planMonthly - r1.cardOff + r0.addonFee, diff: (r0.instMonthly + r1.planMonthly - r1.cardOff + r0.addonFee) - r0.monthly };
  }

  function won(n) { return Math.round(n0(n)).toLocaleString('ko-KR') + '원'; }
  function num(n) { return Math.round(n0(n)).toLocaleString('ko-KR'); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function nowStr() { var d = new Date(Date.now() + 9 * 3600e3).toISOString(); return d.slice(0, 10) + ' ' + d.slice(11, 16); }
  function download(name, text, type) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/json' }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return fallback(); });
    return Promise.resolve(fallback());
    function fallback() { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); return ok; }
  }

  window.GC = { DB: DB, calc: calc, bundleAuto: bundleAuto, afterChange: afterChange, tiers: tiers, installment: installment, won: won, num: num, n0: n0, esc: esc, uid: uid, kst: kst, nowStr: nowStr, download: download, copyText: copyText, clone: clone };
})();
