/* =========================================================
   3-3. 지도·위치 — 매장 위치·길찾기 [API 키 필요]
   - 지도는 움직이지 않는 "고정 지도"예요. 지점 이름표가 달린 금색 고정 핀이 항상 보여요.
   - 각 매장 카드 아래에 네이버지도 · T맵 · 카카오맵 · 전화 버튼이 바로 있어요. (키 없이도 동작)
   - KAKAO_MAP_KEY 가 비어 있으면: 예시 지도(그림)에 같은 핀 + js/mock-data.js 의 landmarks 를 그려요
   - 키가 있으면: 진짜 카카오맵. 좌표가 없으면 주소로 자동 검색해서 핀을 꽂고, 주변 지하철역을 자동 표시해요
   ========================================================= */
window.Views = window.Views || {};
(function () {
  const { $, $$, esc, icon, setMeta, withState, toast } = UI;

  // 금색 고정 핀 (테두리 + 그림자, 가운데 검은 점)
  const pinSvg = `<svg class="pin-svg" viewBox="0 0 40 52" aria-hidden="true">
    <path d="M20 50s16-15.6 16-29.5A16 16 0 0 0 4 20.5C4 34.4 20 50 20 50Z" class="pin-body"/>
    <circle cx="20" cy="20" r="6.5" class="pin-dot"/></svg>`;
  const shortName = (s) => s.name.replace(/^고무신\s*/, "");
  const pinHtml = (s) => `<span class="pin-wrap">${pinSvg}<span class="pin-label">${esc(shortName(s))}</span></span>`;
  const lmHtml = (l) => `<span class="lm-ico" aria-hidden="true">${l.type === "subway" ? "M" : "●"}</span>${esc(l.name)}`;

  const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const tel = (p) => (p || "").replace(/[^0-9]/g, "");
  const addr = (s) => (s.address || "").replace(/\s*\d+층.*$/, ""); // 층·호수는 길찾기 검색에서 빼요
  const naverLink = (s) => s.naver || `https://map.naver.com/p/search/${encodeURIComponent(addr(s))}`;
  const kakaoLink = (s) => s.lat ? `https://map.kakao.com/link/to/${encodeURIComponent(s.name)},${s.lat},${s.lng}` : `https://map.kakao.com/?q=${encodeURIComponent(addr(s))}`;
  const tmapLink = (s) => s.lat
    ? `tmap://route?goalname=${encodeURIComponent(s.name)}&goalx=${s.lng}&goaly=${s.lat}`
    : `tmap://search?name=${encodeURIComponent(addr(s))}`;
  const photo = (s) => ((window.BRAND || {}).storePhotos || {})[s.id];

  // 매장 카드 아래 길찾기 버튼 줄
  const navRow = (s) => `<div class="nav-row">
      ${s.address ? `<a class="nav-btn nav-naver" target="_blank" rel="noopener" href="${esc(naverLink(s))}"><b>N</b>네이버지도</a>` : ""}
      ${s.address ? `<a class="nav-btn nav-tmap" href="${esc(tmapLink(s))}" data-tmap><b>T</b>T맵</a>` : ""}
      ${s.address ? `<a class="nav-btn nav-kakao" target="_blank" rel="noopener" href="${esc(kakaoLink(s))}"><b>K</b>카카오맵</a>` : ""}
      ${s.phone ? `<a class="nav-btn nav-call" href="tel:${tel(s.phone)}">☎ 전화</a>` : ""}
    </div>`;

  const itemHtml = (s) => `<li class="store-item" data-id="${s.id}">
      <button class="store-pick" data-id="${s.id}" aria-pressed="false">
        ${photo(s) ? `<img class="store-photo" src="${esc(photo(s))}" alt="" loading="lazy">` : ""}
        <strong><span class="list-pin" aria-hidden="true">${pinSvg}</span>${esc(s.name)}</strong>
        <span class="small muted">${esc(s.address || "주소 준비 중")}</span>
        ${s.guide ? `<span class="store-guide">${esc(s.guide)}</span>` : ""}
        <span class="small muted store-meta">${s.hours ? esc(s.hours) : ""}${s.hours && s.phone ? " · " : ""}${s.phone ? esc(s.phone) : ""}</span>
      </button>
      ${navRow(s)}
    </li>`;

  function show(page) {
    setMeta("매장 안내", "고무신 부평본점 · 간석점 · 숭의점 위치와 길찾기");
    withState(page, API.listStores, (stores) => {
      page.innerHTML = `<div class="page">
        <div class="page-head"><h2>매장 안내</h2><p class="muted small">원하는 지점의 네이버지도 · T맵 버튼을 누르면 바로 길안내가 시작돼요.</p></div>
        <div class="store-layout">
          <div class="map-col">
            <div class="map" id="map" role="region" aria-label="매장 지도"></div>
            <p class="hint" id="mapHint"></p>
          </div>
          <ul class="store-list">${stores.map(itemHtml).join("")}</ul>
        </div></div>`;
      const key = (window.APP_CONFIG || {}).KAKAO_MAP_KEY;
      const ctl = key ? realMap(stores, key, page) : mockMap(stores, page);
      $$(".store-pick", page).forEach((b) => b.addEventListener("click", () => ctl.select(b.dataset.id)));
      // T맵은 휴대폰 앱으로만 열려요. 컴퓨터에서는 안내만 해요.
      page.addEventListener("click", (e) => {
        const a = e.target.closest("[data-tmap]"); if (!a) return;
        if (!isMobile()) { e.preventDefault(); toast("T맵은 휴대폰에서 눌러 주세요. (T맵 앱이 있으면 바로 길안내가 열려요)"); return; }
        setTimeout(() => { if (!document.hidden) toast("T맵 앱이 설치되어 있어야 열려요. 네이버지도 버튼도 이용해 보세요."); }, 1800);
      });
    }, "매장 정보를 불러오는 중…");
  }

  // 공통: 선택 표시 (지도는 움직이지 않아요)
  function selector(stores, page, onSelect) {
    return (id) => {
      const s = stores.find((x) => x.id === id) || stores[0];
      $$(".pin", page).forEach((m) => { const on = m.dataset.id === s.id; m.classList.toggle("active", on); m.setAttribute("aria-pressed", String(on)); });
      $$(".store-pick", page).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === s.id)));
      $$(".store-item", page).forEach((li) => li.classList.toggle("active", li.dataset.id === s.id));
      onSelect && onSelect(s);
    };
  }
  // 핀을 누르면 목록의 해당 매장 카드로 (휴대폰에서는 지도 아래에 목록이 있어요)
  function revealItem(page, id) {
    const li = $(`.store-item[data-id="${id}"]`, page);
    if (li && innerWidth < 860) li.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  // ---------- 예시 지도 (키 없을 때) ----------
  function mockMap(stores, page) {
    const map = $("#map", page);
    const lms = (window.MOCK && window.MOCK.landmarks) || [];
    map.classList.add("map-mock");
    $("#mapHint", page).textContent = "예시 지도라 핀 위치는 대략적이에요. 정확한 위치는 아래 네이버지도 · T맵 버튼으로 확인해 주세요.";
    map.innerHTML = `<div class="road r1"></div><div class="road r2"></div><div class="road r3"></div>` +
      lms.map((l) => `<span class="lm" style="left:${l.x}%;top:${l.y}%">${lmHtml(l)}</span>`).join("") +
      stores.map((s) => `<button class="pin" data-id="${s.id}" style="left:${s.x}%;top:${s.y}%" aria-label="${esc(s.name)} 선택" aria-pressed="false">${pinHtml(s)}</button>`).join("") +
      `<div class="map-note">예시 지도</div>`;
    const select = selector(stores, page);
    map.addEventListener("click", (e) => { const m = e.target.closest(".pin"); if (m) { select(m.dataset.id); revealItem(page, m.dataset.id); } });
    select(stores[0].id);
    return { select };
  }

  // ---------- 진짜 카카오맵 (키 있을 때) ----------
  function loadKakao(key) {
    return new Promise((resolve, reject) => {
      if (window.kakao && window.kakao.maps && window.kakao.maps.services) return kakao.maps.load(resolve);
      const s = document.createElement("script");
      s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false&libraries=services`;
      s.onload = () => kakao.maps.load(resolve);
      s.onerror = () => reject(new Error("카카오맵을 불러오지 못했어요. 카카오 개발자 콘솔에 지금 사이트 주소(도메인)를 등록했는지 확인해 주세요."));
      document.head.appendChild(s);
    });
  }
  // 좌표가 없으면 주소로 좌표 찾기
  function geocode(s) {
    return new Promise((resolve) => {
      if (s.lat && s.lng) return resolve(s);
      new kakao.maps.services.Geocoder().addressSearch(addr(s), (res, status) => {
        if (status === kakao.maps.services.Status.OK && res[0]) { s.lat = +res[0].y; s.lng = +res[0].x; }
        resolve(s);
      });
    });
  }
  // 매장 주변 지하철역 (카카오 장소 검색, 반경 1km, 가까운 순 2곳)
  function nearbyStations(s) {
    return new Promise((resolve) => {
      new kakao.maps.services.Places().categorySearch("SW8", (res, status) => {
        resolve(status === kakao.maps.services.Status.OK ? res.slice(0, 2) : []);
      }, { location: new kakao.maps.LatLng(s.lat, s.lng), radius: 1000, sort: kakao.maps.services.SortBy.DISTANCE });
    });
  }
  function realMap(stores, key, page) {
    const el = $("#map", page);
    const select = selector(stores, page);
    select(stores[0].id);
    $("#mapHint", page).textContent = "핀을 누르면 해당 지점의 길찾기 버튼으로 이동해요.";
    (async () => {
      el.innerHTML = UI.loading("지도를 불러오는 중…");
      try { await loadKakao(key); }
      catch (e) { el.innerHTML = UI.errorState(e.message); $("[data-retry]", el).onclick = () => show(page); return; }
      await Promise.all(stores.map(geocode));
      const placed = stores.filter((s) => s.lat && s.lng);
      if (!placed.length) { el.innerHTML = UI.empty("지점 위치를 찾지 못했어요", "js/mock-data.js 의 stores 에 lat·lng 를 넣어 주세요."); return; }
      el.innerHTML = "";
      // 고정 지도: 끌기·휠 확대를 막아 화면이 흔들리지 않게 해요
      const map = new kakao.maps.Map(el, { center: new kakao.maps.LatLng(placed[0].lat, placed[0].lng), level: 6, draggable: false, scrollwheel: false, disableDoubleClickZoom: true });
      const bounds = new kakao.maps.LatLngBounds();
      placed.forEach((s) => bounds.extend(new kakao.maps.LatLng(s.lat, s.lng)));
      map.setBounds(bounds, 70, 50, 40, 50);

      // 주변 지하철역 랜드마크 (실제 카카오 장소 데이터) + 직접 넣은 landmarks(lat·lng 가 있는 것)
      const seen = {};
      const stations = (await Promise.all(placed.map(nearbyStations))).flat().filter((p) => !seen[p.id] && (seen[p.id] = 1));
      const custom = ((window.MOCK && window.MOCK.landmarks) || []).filter((l) => l.lat && l.lng);
      stations.map((p) => ({ name: p.place_name, type: "subway", lat: +p.y, lng: +p.x })).concat(custom).forEach((l) => {
        const n = document.createElement("span"); n.className = "lm lm-kakao"; n.innerHTML = lmHtml(l);
        new kakao.maps.CustomOverlay({ map, position: new kakao.maps.LatLng(l.lat, l.lng), content: n, yAnchor: 0.5, zIndex: 0 });
      });

      placed.forEach((s) => {
        const node = document.createElement("button");
        node.className = "pin pin-kakao"; node.dataset.id = s.id; node.setAttribute("aria-label", s.name + " 선택");
        node.innerHTML = pinHtml(s);
        node.addEventListener("click", () => { select(s.id); revealItem(page, s.id); });
        new kakao.maps.CustomOverlay({ map, position: new kakao.maps.LatLng(s.lat, s.lng), content: node, yAnchor: 1, clickable: true, zIndex: 5 });
      });
      // 좌표가 생겼으니 카카오맵·T맵 버튼을 정확한 좌표 링크로 바꿔요
      placed.forEach((s) => { const li = $(`.store-item[data-id="${s.id}"]`, page); if (li) $(".nav-row", li).outerHTML = navRow(s); });
      select(($(".store-pick[aria-pressed=true]", page) || {}).dataset?.id || placed[0].id);
    })();
    return { select };
  }

  Views.store = { show };
})();
