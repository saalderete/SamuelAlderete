// Videos: the four product films from the plain site's assets. They are silent screen recordings,
// so there is no volume here; they loop, and they stop when the visitor leaves the screen.

import { h, clock } from "../dom.js";
import { iconEl } from "../icons.js";

export default {
  id: "videos", name: ["Videos", null], icon: "videos",
  size: { w: 900, h: 560, minW: 340, minH: 320 },

  mount({ body, content, host, audio, frozen }) {
    const films = content.films;
    let index = 0, scrubbing = false;

    const video = h("video", { class: "os-vid__video", playsinline: true, loop: true, preload: "metadata", "aria-label": "Film" });
    video.muted = true;
    const big = h("button", { class: "os-vid__big", type: "button", "aria-label": "Play" }, iconEl("play", 34));
    const playBtn = h("button", { class: "os-win__btn os-vid__play", type: "button" });
    const bar = h("input", { class: "os-range os-vid__bar", type: "range", min: "0", max: "1000", value: "0", step: "1", "aria-label": "Position" });
    const time = h("span", { class: "os-vid__time", text: "0:00 / 0:00" });
    const caption = h("p", { class: "os-vid__cap" });

    const rows = films.map((f, i) => h("button", { class: "os-vid__row", type: "button", onclick: () => { pick(i, true); audio.blip("click"); } },
      h("img", { class: "os-vid__thumb", src: host.assets + f.id + ".webp", alt: "", loading: "lazy", decoding: "async" }),
      h("span", { class: "os-vid__name", text: f.title }), h("span", { class: "os-vid__line", text: f.line })));

    function draw() {
      const on = !video.paused && !video.ended;
      playBtn.replaceChildren(iconEl(on ? "pause" : "play", 16));
      playBtn.setAttribute("aria-label", on ? "Pause" : "Play");
      big.hidden = on;
      const d = video.duration || 0;
      if (!scrubbing) bar.value = d ? String(Math.round(video.currentTime / d * 1000)) : "0";
      time.textContent = `${clock(video.currentTime)} / ${clock(d)}`;
    }
    function pick(i, andPlay) {
      index = i;
      const f = films[i];
      rows.forEach((r, n) => r.setAttribute("aria-current", String(n === i)));
      video.poster = host.assets + f.id + ".webp";
      video.src = host.assets + f.id + ".mp4";
      caption.replaceChildren(h("strong", { text: f.title }), " ", f.line);
      draw();
      if (andPlay && !frozen) video.play().catch(() => {});
    }
    const toggle = () => { if (frozen) return; if (video.paused) video.play().catch(() => {}); else video.pause(); };
    big.addEventListener("click", toggle);
    playBtn.addEventListener("click", toggle);
    video.addEventListener("click", toggle);
    for (const ev of ["play", "pause", "timeupdate", "loadedmetadata", "seeked", "emptied"]) video.addEventListener(ev, draw);
    bar.addEventListener("pointerdown", () => { scrubbing = true; });
    bar.addEventListener("input", () => { if (video.duration) video.currentTime = (+bar.value / 1000) * video.duration; });
    bar.addEventListener("change", () => { scrubbing = false; draw(); });

    body.append(h("div", { class: "os-vid" },
      h("div", { class: "os-vid__main" },
        h("div", { class: "os-vid__stage" }, video, big),
        h("div", { class: "os-vid__ctl" }, playBtn, bar, time),
        caption),
      h("div", { class: "os-vid__list", role: "list", "aria-label": "Films" }, rows)));
    pick(0, false);

    return {
      arg(id) { const i = films.findIndex((f) => f.id === id); if (i >= 0) pick(i, true); },
      key(e, typing, onControl) {
        if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === " " && !onControl) { e.preventDefault(); toggle(); }
      },
      active(v) { if (!v) video.pause(); },
      shown(v) { if (!v) video.pause(); },
      destroy() { video.pause(); video.removeAttribute("src"); video.load(); },
      // for tests
      get video() { return video; },
    };
  },
};
