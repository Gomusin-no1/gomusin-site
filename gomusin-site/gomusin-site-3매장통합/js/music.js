/* =========================================================
   배경 음악 — 잔잔한 라운지 재즈
   - 브라우저는 소리 나는 자동재생을 막아요. 그래서 손님이 화면을
     처음 누르거나(터치·클릭·키보드) 할 때 작은 소리로 천천히 시작해요.
   - 오른쪽 아래 금색 버튼으로 켜고 끌 수 있고, 끈 손님에게는 다음에도 안 나와요.
   - 음원·볼륨은 js/brand.js 의 music 에서 바꿔요. (비우면 음악 기능이 꺼져요)
   ========================================================= */
(function () {
  const M = (window.BRAND || {}).music;
  if (!M || !M.src) return;
  const KEY = "gomusin-music";
  const VOL = Math.min(1, Math.max(0, M.volume == null ? 0.22 : M.volume));
  let audio = null, wanted = true, fadeT = null;
  try { wanted = localStorage.getItem(KEY) !== "off"; } catch (e) {}

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "music-btn";
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10 3v10.6a3.6 3.6 0 1 0 2 3.2V7.2h5V3h-7z"/></svg><span class="music-eq" aria-hidden="true"><i></i><i></i><i></i></span>';

  function ui(on) {
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", String(on));
    btn.setAttribute("aria-label", on ? "배경 음악 끄기" : "배경 음악 켜기");
    btn.title = on ? "배경 음악 끄기" : "배경 음악 켜기";
  }
  function fade(to, ms, done) {
    clearInterval(fadeT);
    const from = audio.volume, t0 = Date.now();
    fadeT = setInterval(() => {
      const k = Math.min(1, (Date.now() - t0) / ms);
      audio.volume = from + (to - from) * k;
      if (k >= 1) { clearInterval(fadeT); done && done(); }
    }, 50);
  }
  function play() {
    if (!audio) { audio = new Audio(M.src); audio.loop = true; audio.preload = "auto"; audio.volume = 0; }
    const p = audio.play();
    if (p && p.then) p.then(() => { ui(true); fade(VOL, 2500); detach(); }).catch(() => ui(false));
    else { ui(true); fade(VOL, 2500); detach(); }
  }
  function stop() {
    if (!audio) return ui(false);
    fade(0, 600, () => audio.pause());
    ui(false);
  }

  // 첫 터치·클릭·키 입력 때 시작 (음악 버튼 누른 경우는 버튼이 처리)
  const evs = ["pointerdown", "touchstart", "keydown"];
  function first(e) { if (btn.contains(e.target)) return; if (wanted) play(); }
  function detach() { evs.forEach((ev) => window.removeEventListener(ev, first, true)); }
  evs.forEach((ev) => window.addEventListener(ev, first, { capture: true, passive: true }));

  btn.addEventListener("click", () => {
    const on = !(audio && !audio.paused && btn.classList.contains("on"));
    wanted = on;
    try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) {}
    on ? play() : stop();
  });
  // 다른 탭으로 가면 잠시 멈추고, 돌아오면 다시
  document.addEventListener("visibilitychange", () => {
    if (!audio) return;
    if (document.hidden) audio.pause();
    else if (wanted && btn.classList.contains("on")) audio.play().catch(() => {});
  });

  ui(false);
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(btn));
  if (document.readyState !== "loading") document.body.appendChild(btn);
})();
