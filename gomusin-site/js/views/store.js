/* =========================================================
   3-3. 지도·위치 — 매장 위치·길찾기 [API 키 필요]
   - KAKAO_MAP_KEY 가 비어 있으면: 가짜 지도(그림)에 마커와 정보창
   - 키가 있으면: 카카오맵 SDK를 불러와 진짜 지도에 표시
   - 길찾기 버튼은 키 없이도 카카오맵/네이버지도 링크로 동작해요
   ========================================================= */
window.Views = window.Views || {};
(function () {
  const { $, $$, esc, icon, setMeta, withState } = UI;
  const pinSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s8-6 8-12a8 8 0 0 0-16 0c0 6 8 12 8 12Z"/><circle cx="12" cy="10" r="3" fill="#fff"/></svg>';

  const kakaoLink = (s) => `https://map.kakao.com/link/to/${encodeURIComponent(s.name)},${s.lat},${s.lng}`;
  const naverLink = (s) => `https://map.naver.com/p/search/${encodeURIComponent(s.address)}`;
  const kakaoSearch = (s) => `https://map.kakao.com/?q=${encodeURIComponent(s.address)}`;
  const tel = (p) => p.replace(/[^0-9]/g, "");
  const photo = (s) => ((window.BRAND || {}).storePhotos || {})[s.id];
  const infoHtml = (s) => `${photo(s) ? `<img class="info-photo" src="${esc(photo(s))}" alt="${esc(s.name)} 사진">` : ""}<strong>${esc(s.name)}</strong>
    <div class="small">${s.address ? esc(s.address) : '<span class="muted">주소 준비 중</span>'}</div>
    ${s.hours || s.phone ? `<div class="small muted">${s.hours ? icon("clock") + " " + esc(s.hours) : ""}${s.hours && s.phone ? " · " : ""}${s.phone ? `<a href="tel:${tel(s.phone)}">${esc(s.phone)}</a>` : ""}</div>` : ""}
    <div class="row">${s.lat ? `<a class="btn sm" target="_blank" rel="noopener" href="${kakaoLink(s)}">카카오맵 길찾기</a>` : s.address ? `<a class="btn sm" target="_blank" rel="noopener" href="${kakaoSearch(s)}">카카오맵</a>` : ""}${s.address ? `<a class="btn ghost sm" target="_blank" rel="noopener" href="${naverLink(s)}">네이버지도</a>` : ""}${!s.address && s.phone ? `<a class="btn sm" href="tel:${tel(s.phone)}">전화하기</a>` : ""}</div>`;

  function show(page) {
    setMeta("매장 안내", "고무신 부평본점 · 간석점 · 숭의점 위치와 길찾기");
    withState(page, API.listStores, (stores) => {
      page.innerHTML = `<div class="page">
        <div class="page-head"><h2>매장 안내</h2></div>
        <div class="store-layout">
          <ul class="store-list">${stores.map((s) => `<li><button data-id="${s.id}" aria-pressed="false">${photo(s) ? `<img class="store-photo" src="${esc(photo(s))}" alt="" loading="lazy">` : ""}<strong>${esc(s.name)}</strong><span class="small muted">${esc(s.address || s.phone)}</span>${s.hours ? `<span class="small muted" style="display:block">${esc(s.hours)}</span>` : ""}</button></li>`).join("")}</ul>
          <div><div class="map" id="map" role="region" aria-label="매장 지도"></div>
          <p class="hint" id="mapHint"></p></div>
        </div></div>`;
      const key = (window.APP_CONFIG || {}).KAKAO_MAP_KEY;
      if (key) realMap(stores, key, page); else mockMap(stores, page);
    }, "매장 정보를 불러오는 중…");
  }

  // ---------- 가짜 지도 (키 없을 때) ----------
  function mockMap(stores, page) {
    const map = $("#map", page);
    $("#mapHint", page).textContent = "지금은 예시 지도예요. KAKAO_MAP_KEY를 넣으면 실제 카카오맵으로 바뀌어요. (길찾기 버튼은 지금도 실제로 동작해요)";
    map.innerHTML = `<div class="river"></div>` + stores.map((s) => `<button class="marker" data-id="${s.id}" style="left:${s.x}%;top:${s.y + 12}%" aria-label="${esc(s.name)} 정보 보기">${pinSvg}</button>`).join("") + `<div class="map-note">예시 지도</div>`;
    let win = null;
    const open = (id) => {
      const s = stores.find((x) => x.id === id);
      $$(".marker", map).forEach((m) => m.classList.toggle("active", m.dataset.id === id));
      $$(".store-list button", page).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
      win && win.remove();
      win = document.createElement("div");
      win.className = "infowin"; win.setAttribute("role", "dialog"); win.setAttribute("aria-label", s.name + " 정보");
      win.style.left = Math.min(Math.max(s.x, 25), 75) + "%"; win.style.top = (s.y + 12) + "%";
      if (photo(s) && s.y + 12 < 55) win.classList.add("below"); // 사진이 있으면 위쪽이 잘리지 않게 마커 아래로
      win.innerHTML = `<button class="icon-btn close" aria-label="닫기">${icon("x")}</button>` + infoHtml(s);
      map.appendChild(win);
      $(".close", win).addEventListener("click", () => { win.remove(); win = null; $$(".marker", map).forEach((m) => m.classList.remove("active")); });
    };
    map.addEventListener("click", (e) => { const m = e.target.closest(".marker"); if (m) open(m.dataset.id); });
    $$(".store-list button", page).forEach((b) => b.addEventListener("click", () => { open(b.dataset.id); if (innerWidth < 860) map.scrollIntoView({ behavior: "smooth", block: "center" }); }));
    open(stores[0].id);
  }

  // ---------- 진짜 카카오맵 (키 있을 때) ----------
  function loadKakao(key) {
    return new Promise((resolve, reject) => {
      if (window.kakao && window.kakao.maps) return kakao.maps.load(resolve);
      const s = document.createElement("script");
      s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
      s.onload = () => kakao.maps.load(resolve);
      s.onerror = () => reject(new Error("카카오맵을 불러오지 못했어요. 카카오 콘솔에 지금 사이트 주소(도메인)를 등록했는지 확인해 주세요."));
      document.head.appendChild(s);
    });
  }
  async function realMap(stores, key, page) {
    const el = $("#map", page);
    el.innerHTML = UI.loading("지도를 불러오는 중…");
    try { await loadKakao(key); }
    catch (e) { el.innerHTML = UI.errorState(e.message); $("[data-retry]", el).onclick = () => realMap(stores, key, page); return; }
    el.innerHTML = "";
    const map = new kakao.maps.Map(el, { center: new kakao.maps.LatLng(stores[0].lat, stores[0].lng), level: 6 });
    const bounds = new kakao.maps.LatLngBounds();
    const info = new kakao.maps.InfoWindow({ removable: true });
    stores = stores.filter((s) => s.lat && s.lng); // 좌표가 있는 지점만 진짜 지도에 표시
    if (!stores.length) { el.innerHTML = UI.empty("지점 좌표가 아직 없어요", "js/mock-data.js 의 stores 에 lat·lng 를 넣어 주세요."); return; }
    const markers = stores.map((s) => {
      const pos = new kakao.maps.LatLng(s.lat, s.lng); bounds.extend(pos);
      const mk = new kakao.maps.Marker({ map, position: pos, title: s.name });
      kakao.maps.event.addListener(mk, "click", () => { info.setContent(`<div style="padding:10px 12px;min-width:220px;font-family:inherit">${infoHtml(s)}</div>`); info.open(map, mk); });
      return mk;
    });
    map.setBounds(bounds);
    $$(".store-list button", page).forEach((b, i) => b.addEventListener("click", () => { map.panTo(markers[i].getPosition()); kakao.maps.event.trigger(markers[i], "click"); }));
  }

  Views.store = { show };
})();
