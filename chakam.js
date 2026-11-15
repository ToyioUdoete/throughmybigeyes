// chakam: friends snap a photo, my camera prints it, and it goes up on the chakam wall (chakam.html).
// Also keeps a simple visitor log that only I can read (visitors.html).
//
// Photos and the visitor log are stored in a free Supabase project. Paste its two values here
// (Supabase dashboard → Project Settings → API). Both are safe to be public: the database rules
// (chakam-setup.sql) only let visitors add photos and log visits, never read the log or change anything.
const CHAKAM_URL = "";   // e.g. "https://abcdefghijklm.supabase.co"
const CHAKAM_KEY = "";   // the "publishable" (or "anon") key

window.Chakam = (() => {
  const ready = !!(CHAKAM_URL && CHAKAM_KEY);
  const base = CHAKAM_URL.replace(/\/+$/, "");
  const head = (extra) => {
    const h = { apikey: CHAKAM_KEY, ...extra };
    if (CHAKAM_KEY.startsWith("eyJ")) h.Authorization = "Bearer " + CHAKAM_KEY; // older "anon" keys
    return h;
  };
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} }
  };
  const rand = () => Math.random().toString(36).slice(2, 10);

  // ---------- talking to the database ----------
  const publicUrl = (path) => base + "/storage/v1/object/public/chakam/" + path;
  async function list() {
    const r = await fetch(base + "/rest/v1/photos?select=id,created_at,name,note,path,w,h&order=created_at.desc&limit=500", { headers: head() });
    if (!r.ok) throw new Error("list " + r.status);
    return (await r.json()).map((p) => ({ ...p, src: publicUrl(p.path) }));
  }
  async function upload(blob, w, h, name, note) {
    const path = "guests/" + Date.now().toString(36) + "-" + rand() + ".jpg";
    const up = await fetch(base + "/storage/v1/object/chakam/" + path, {
      method: "POST", headers: head({ "Content-Type": "image/jpeg", "x-upsert": "false", "cache-control": "max-age=31536000" }), body: blob
    });
    if (!up.ok) throw new Error("upload " + up.status);
    const row = { name, note: note || null, path, w, h, visitor: visitorId() };
    const ins = await fetch(base + "/rest/v1/photos", {
      method: "POST", headers: head({ "Content-Type": "application/json", Prefer: "return=minimal" }), body: JSON.stringify(row)
    });
    if (!ins.ok) throw new Error("save " + ins.status);
    store.set("tmbe-name", name);
    return { ...row, created_at: new Date().toISOString(), src: publicUrl(path) };
  }
  async function owner(fn, args) {
    const r = await fetch(base + "/rest/v1/rpc/" + fn, { method: "POST", headers: head({ "Content-Type": "application/json" }), body: JSON.stringify(args) });
    if (!r.ok) throw new Error(r.status === 400 || r.status === 401 || r.status === 403 ? "passcode" : "owner " + r.status);
    const t = await r.text();
    return t ? JSON.parse(t) : null;
  }

  // ---------- who's visiting ----------
  function visitorId() {
    let v = store.get("tmbe-visitor");
    if (!v) { v = rand() + rand(); store.set("tmbe-visitor", v); }
    return v;
  }
  function logVisit() {
    if (!ready || store.get("tmbe-owner") === "1") return; // my own visits don't count
    const page = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
    if (page === "visitors") return;
    let ref = null;
    try { if (document.referrer) { const u = new URL(document.referrer); if (u.host !== location.host) ref = u.host.slice(0, 120); } } catch (_) {}
    const row = { visitor: visitorId(), name: store.get("tmbe-name"), page: page.slice(0, 40), referrer: ref, device: matchMedia("(pointer: coarse)").matches ? "phone" : "computer" };
    fetch(base + "/rest/v1/visits", { method: "POST", keepalive: true, headers: head({ "Content-Type": "application/json", Prefer: "return=minimal" }), body: JSON.stringify(row) }).catch(() => {});
  }

  // ---------- making photos small enough to upload quickly ----------
  async function shrink(source, mirror) {
    const MAX = 1400;
    let bmp = source;
    if (source instanceof Blob) {
      try { bmp = await createImageBitmap(source, { imageOrientation: "from-image" }); }
      catch (_) {
        bmp = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = URL.createObjectURL(source); });
      }
    }
    const sw = bmp.videoWidth || bmp.naturalWidth || bmp.width, sh = bmp.videoHeight || bmp.naturalHeight || bmp.height;
    const k = Math.min(1, MAX / Math.max(sw, sh));
    const w = Math.round(sw * k), h = Math.round(sh * k);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d");
    if (mirror) { g.translate(w, 0); g.scale(-1, 1); }
    g.drawImage(bmp, 0, 0, w, h);
    const blob = await new Promise((ok) => c.toBlob(ok, "image/jpeg", 0.85));
    return { blob, w, h, url: URL.createObjectURL(blob) };
  }

  // ---------- the "add yours" window ----------
  const css = `
  .ck { width: min(94vw, 440px); max-height: 96vh; padding: 0; border: 2px solid var(--ink, #161616); border-radius: 22px; background: var(--paper, #fbfaf6); color: var(--ink, #161616); box-shadow: 7px 7px 0 var(--ink, #161616); overflow: auto; }
  .ck::backdrop { background: rgba(22, 22, 22, .7); }
  .ck form { display: grid; gap: 14px; padding: 22px 22px 24px; }
  .ck-top { display: flex; justify-content: space-between; align-items: start; gap: 12px; }
  .ck h2 { margin: 0; font: 400 46px/1 var(--display, system-ui); }
  .ck-top p { margin: 4px 0 0; font-size: 16px; }
  .ck-x { flex: 0 0 44px; width: 44px; height: 44px; border: 2px solid var(--ink, #161616); border-radius: 50%; background: var(--paper, #fff); font-size: 20px; cursor: pointer; }
  .ck-shot { position: relative; display: grid; place-items: center; aspect-ratio: 4 / 5; max-height: 46vh; width: 100%; margin: 0 auto; overflow: hidden; border: 2px dashed var(--ink, #161616); border-radius: 14px; background: var(--pink, #ffc9df); }
  .ck-shot.has { border-style: solid; background: #111; }
  .ck-shot img, .ck-shot video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .ck-shot video { transform: scaleX(-1); }
  .ck-empty { display: grid; justify-items: center; gap: 6px; padding: 20px; text-align: center; font-weight: 700; }
  .ck-empty svg { width: 54px; height: 54px; }
  .ck-flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }
  .ck-flash.go { animation: ck-flash .5s ease-out; }
  @keyframes ck-flash { from { opacity: 1; } to { opacity: 0; } }
  .ck-row { display: flex; flex-wrap: wrap; gap: 10px; }
  .ck-row .pill { flex: 1 1 auto; justify-content: center; }
  .ck label { display: grid; gap: 6px; font-weight: 700; font-size: 15px; }
  .ck label span span { font-weight: 500; color: var(--muted, #5a4650); }
  .ck input[type=text] { width: 100%; padding: 12px 14px; border: 2px solid var(--ink, #161616); border-radius: 12px; background: #fff; font: 500 17px var(--body, system-ui); color: var(--ink, #161616); }
  .ck-go { justify-content: center; font-size: 17px; padding: 14px 22px; }
  .ck-go[disabled] { opacity: .6; cursor: progress; }
  .ck-msg { min-height: 1.4em; margin: 0; font-size: 15px; font-weight: 700; color: #b0004e; }
  .ck-small { margin: -4px 0 0; color: var(--muted, #5a4650); font-size: 13px; }
  @media (prefers-reduced-motion: reduce) { .ck-flash.go { animation: none; } }`;

  const camIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" fill="#fbfaf6" stroke="#161616" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.6" fill="#c9f45b" stroke="#161616" stroke-width="1.6"/></svg>';
  let dlg = null;

  function build() {
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    dlg = document.createElement("dialog");
    dlg.className = "ck"; dlg.setAttribute("aria-labelledby", "ckTitle");
    dlg.innerHTML = `
      <form method="dialog" novalidate>
        <div class="ck-top">
          <div><h2 id="ckTitle">chakam!</h2><p>Snap a photo and my camera will print it for you.</p></div>
          <button class="ck-x" type="button" data-close aria-label="Close">✕</button>
        </div>
        <div class="ck-shot" id="ckShot">
          <div class="ck-empty">${camIcon}<span>Your photo shows up here</span></div>
          <div class="ck-flash"></div>
        </div>
        <div class="ck-row">
          <button class="pill lime" type="button" id="ckTake">📸 Take a photo</button>
          <button class="pill" type="button" id="ckPick">Choose a photo</button>
        </div>
        <input type="file" accept="image/*" capture="user" id="ckCam" hidden />
        <input type="file" accept="image/*" id="ckFile" hidden />
        <label>Your name<input type="text" id="ckName" maxlength="40" autocomplete="given-name" required /></label>
        <label><span class="ck-l">Say something <span>(optional)</span></span><input type="text" id="ckNote" maxlength="120" /></label>
        <button class="pill lime ck-go" type="submit" id="ckGo">Print it</button>
        <p class="ck-small">It goes up on my chakam wall for everyone who visits to see.</p>
        <p class="ck-msg" id="ckMsg" role="status" aria-live="polite"></p>
      </form>`;
    document.body.appendChild(dlg);
    return dlg;
  }

  function open(onDone) {
    if (!ready) return;
    const d = dlg || build();
    const $ = (id) => d.querySelector("#" + id);
    const shot = $("ckShot"), take = $("ckTake"), pick = $("ckPick"), msg = $("ckMsg"), go = $("ckGo"), name = $("ckName"), note = $("ckNote");
    const flash = shot.querySelector(".ck-flash");
    let photo = null, stream = null, video = null;
    const fine = matchMedia("(pointer: fine)").matches && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

    const stopCam = () => { if (stream) stream.getTracks().forEach((t) => t.stop()); stream = null; if (video) video.remove(); video = null; };
    const setPhoto = (p) => {
      photo = p; stopCam();
      shot.querySelectorAll("img").forEach((i) => i.remove());
      const img = new Image(); img.src = p.url; img.alt = "Your photo";
      shot.insertBefore(img, flash); shot.classList.add("has");
      shot.querySelector(".ck-empty").hidden = true;
      take.textContent = "📸 Take another"; msg.textContent = "";
    };
    const reset = () => {
      stopCam(); photo = null;
      shot.querySelectorAll("img").forEach((i) => i.remove());
      shot.classList.remove("has"); shot.querySelector(".ck-empty").hidden = false;
      take.textContent = "📸 Take a photo"; msg.textContent = ""; note.value = ""; go.disabled = false; go.textContent = "Print it";
    };
    const fromFile = async (input) => {
      const f = input.files && input.files[0]; input.value = "";
      if (!f) return;
      if (!/^image\//.test(f.type) && !/\.(jpe?g|png|webp|heic|heif|gif)$/i.test(f.name)) { msg.textContent = "That file isn't a photo. Try another one."; return; }
      try { setPhoto(await shrink(f, false)); } catch (_) { msg.textContent = "I couldn't open that photo. Try another one."; }
    };
    const snap = async () => {
      flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go");
      setPhoto(await shrink(video, true));
    };

    take.onclick = async () => {
      if (video) return snap();
      if (!fine) return $("ckCam").click();
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 } }, audio: false });
        video = document.createElement("video"); video.muted = true; video.playsInline = true; video.srcObject = stream;
        shot.insertBefore(video, flash); shot.classList.add("has"); shot.querySelector(".ck-empty").hidden = true;
        shot.querySelectorAll("img").forEach((i) => i.remove());
        await video.play();
        take.textContent = "📸 Snap!"; msg.textContent = "";
      } catch (_) {
        stopCam(); shot.classList.toggle("has", !!photo); shot.querySelector(".ck-empty").hidden = !!photo;
        msg.textContent = "Your camera isn't available here. Choose a photo instead.";
      }
    };
    pick.onclick = () => $("ckFile").click();
    $("ckCam").onchange = (e) => fromFile(e.target);
    $("ckFile").onchange = (e) => fromFile(e.target);
    const close = () => { stopCam(); d.close(); };
    d.querySelector("[data-close]").onclick = close;
    d.onclick = (e) => { if (e.target === d) close(); };
    d.oncancel = () => stopCam();

    d.querySelector("form").onsubmit = async (e) => {
      e.preventDefault();
      if (!photo) { msg.textContent = video ? "Press Snap! first." : "Take or choose a photo first."; return; }
      const who = name.value.trim();
      if (!who) { msg.textContent = "Add your name so I know who it's from."; name.focus(); return; }
      go.disabled = true; go.textContent = "Printing…"; msg.textContent = "";
      try {
        const saved = await upload(photo.blob, photo.w, photo.h, who, note.value.trim());
        d.close(); reset();
        onDone && onDone(saved);
      } catch (_) {
        go.disabled = false; go.textContent = "Print it";
        msg.textContent = "That didn't go through. Check your connection and try again.";
      }
    };

    reset();
    name.value = store.get("tmbe-name") || "";
    d.showModal ? d.showModal() : d.setAttribute("open", "");
  }

  if (document.readyState === "loading") addEventListener("DOMContentLoaded", logVisit); else logVisit();
  return { ready, list, open, owner, store, photoUrl: publicUrl };
})();
