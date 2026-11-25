// Settings: the wallpaper (the room outside takes its colour), sound, and motion.

import { h, two } from "../dom.js";
import { iconEl } from "../icons.js";

export default {
  id: "settings", name: ["Settings", "Ajustes"], icon: "settings",
  size: { w: 660, h: 720, minW: 320, minH: 320 },

  mount({ body, os, audio }) {
    const papers = os.wallpapers.map((wp) => {
      const cv = h("canvas", { class: "os-set__thumb", width: 256, height: 144 });
      wp.draw(cv.getContext("2d"), 256, 144);
      return h("button", { class: "os-set__paper", type: "button", "data-id": wp.id, onclick: () => { os.setWallpaper(wp.id); audio.blip("click"); draw(); } },
        cv, h("span", { class: "os-set__name" }, two(wp.name[0], wp.name[1])), h("span", { class: "os-set__tick" }, iconEl("check", 14)));
    });

    const toggle = (label, hint, get, set) => {
      const b = h("button", { class: "os-switch", type: "button", role: "switch" }, h("span", { class: "os-switch__knob" }));
      b.addEventListener("click", async () => { await set(!get()); audio.blip("switch"); draw(); });
      const row = h("div", { class: "os-set__row" }, h("div", {}, h("div", { class: "os-set__label" }, label), h("div", { class: "os-set__hint", text: hint })), b);
      row._sync = () => b.setAttribute("aria-checked", String(!!get()));
      b.setAttribute("aria-label", typeof label === "string" ? label : label[0].textContent);
      return row;
    };
    const sound = toggle(two("Sound", "Sonido"), "Every sound is made in the page as it plays. Nothing is downloaded.", () => audio.enabled, (v) => (v ? audio.enable() : audio.disable()));
    const motion = toggle(two("Reduce motion", "Menos movimiento"), "Windows and the start-up stop sliding and simply appear.", () => os.calm, (v) => os.setCalm(v));

    function draw() {
      papers.forEach((p) => p.setAttribute("aria-pressed", String(p.dataset.id === os.wallpaper)));
      sound._sync(); motion._sync();
    }
    const off = audio.on(draw);
    draw();

    body.append(h("div", { class: "os-set" },
      h("section", {}, h("h3", { class: "os-set__head" }, two("Wallpaper", "Fondo")),
        h("p", { class: "os-set__hint", text: "The desk outside is lit by this screen, so the room takes the wallpaper's colour." }),
        h("div", { class: "os-set__papers" }, papers)),
      h("section", {}, h("h3", { class: "os-set__head" }, two("Sound and motion", "Sonido y movimiento")), sound, motion),
      h("section", {}, h("h3", { class: "os-set__head" }, two("About this screen", "Sobre esta pantalla")),
        h("p", { class: "os-set__about", text: "This desktop is plain HTML, CSS and JavaScript with no libraries. Its windows are real page elements, which is why the text stays sharp. Notes, the wallpaper and the best score are kept on this device and nowhere else." }))));

    return { destroy() { off(); } };
  },
};
