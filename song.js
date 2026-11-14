// Carmen by Olivia Dean, quietly in the background (shared by every page).
(() => {
  // ---------- background song: Carmen by Olivia Dean, quietly ----------
  // Apple Music's 30-second preview, looped at a low volume. Browsers only allow sound after the
  // visitor's first tap, click or key press, so it starts then. Any [data-song] button turns it on/off (and remembers).
  window.song = (() => {
    const SONG = "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/09/70/bd/0970bdb8-15c0-38c1-0435-4141a8fc7e44/mzaf_4185929247297700535.plus.aac.p.m4a";
    // Full song: https://music.apple.com/us/album/carmen/1676252821?i=1676253112
    const VOL = 0.12;
    const btns = [...document.querySelectorAll("[data-song]")];
    let off = false; try { off = localStorage.getItem("tmbe-song") === "off"; } catch (_) {}
    const audio = new Audio(); audio.crossOrigin = "anonymous"; audio.src = SONG; audio.loop = true; audio.preload = "none";
    let ctx = null, gain = null, playing = false, ducked = false, userOff = false;
    const level = (v, secs) => {
      if (gain) { gain.gain.cancelScheduledValues(ctx.currentTime); gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime); gain.gain.linearRampToValueAtTime(v, ctx.currentTime + secs); }
      else audio.volume = v;
    };
    const vol = () => (ducked ? VOL * .2 : VOL);
    const setUi = (on) => { playing = on; btns.forEach((b) => { b.classList.toggle("playing", on); b.setAttribute("aria-pressed", String(on)); b.setAttribute("aria-label", (on ? "Pause" : "Play") + " Carmen by Olivia Dean"); }); };
    let trying = false;
    const start = () => {
      if (trying) return; trying = true;
      if (!ctx && window.AudioContext) {
        try { ctx = new AudioContext(); gain = ctx.createGain(); gain.gain.value = 0; ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination); } catch (_) { ctx = null; gain = null; }
      }
      if (ctx && ctx.state === "suspended") ctx.resume();
      if (!gain) audio.volume = 0;
      audio.play().then(() => { level(vol(), 2.5); setUi(true); }).catch(() => setUi(false)).finally(() => { trying = false; });
    };
    const stop = () => { level(0, .6); setTimeout(() => { if (!playing) audio.pause(); }, 650); setUi(false); };
    // soften the jump where the 30-second clip loops
    audio.addEventListener("timeupdate", () => {
      if (!audio.duration || audio.paused || !playing) return;
      const left = audio.duration - audio.currentTime;
      if (left < 1.6 && !audio.dataset.fading) { audio.dataset.fading = "1"; level(0, Math.max(.2, left - .1)); }
      if (audio.currentTime < 1 && audio.dataset.fading) { delete audio.dataset.fading; level(vol(), 1.5); }
    });
    btns.forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation();
      const on = !playing; userOff = !on;
      try { localStorage.setItem("tmbe-song", on ? "on" : "off"); } catch (_) {}
      on ? start() : stop();
    }));
    setUi(false);
    if (!off) {
      // Plays as soon as the page opens wherever the browser allows it. Browsers that block sound
      // until the visitor interacts get it on their very first tap, click, key press or swipe.
      const kinds = ["pointerdown", "pointerup", "click", "keydown", "touchend", "mousedown"];
      const done = () => kinds.forEach((t) => removeEventListener(t, first, true));
      const first = (e) => {
        if (ctx && ctx.state === "suspended") ctx.resume();
        if (e.target.closest && e.target.closest("[data-song]")) return done();
        if (userOff || (playing && (!ctx || ctx.state === "running"))) return done();
        start();
      };
      kinds.forEach((t) => addEventListener(t, first, true));
      start();
    }
    return { duck: (on) => { ducked = on; if (playing) level(vol(), .4); }, pause: () => { if (playing) stop(); } };
  })();
})();
