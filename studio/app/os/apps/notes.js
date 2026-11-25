// Notes: the About note, in the home page's own words and read-only, and one scratch note that is
// the visitor's to type in. The scratch note is kept on their device and goes nowhere else.

import { h, store, two } from "../dom.js";
import { iconEl } from "../icons.js";

export default {
  id: "notes", name: ["Notes", "Notas"], icon: "notes",
  size: { w: 760, h: 620, minW: 320, minH: 300 },

  mount({ body, content, audio }) {
    const { person, about, stats } = content;
    let current = "about";

    const aboutEl = h("article", { class: "os-note os-sel", tabindex: "0", "aria-label": "About" },
      h("p", { class: "os-note__kicker" }, iconEl("lock", 13), h("span", { text: "Read only" })),
      h("h3", { class: "os-note__title" }, two("About", "Sobre mí")),
      h("p", { class: "os-note__lead", text: `${person.name}, ${person.role}. ${person.place}.` }),
      about.map((p) => h("p", { text: p })),
      h("dl", { class: "os-note__stats" }, stats.map((s) => h("div", {}, h("dt", { text: s.n }), h("dd", { text: s.label })))));

    const saved = h("span", { class: "os-note__saved", text: "Kept on this device only" });
    const area = h("textarea", { class: "os-note__area os-sel", spellcheck: "false", "aria-label": "Scratch note", placeholder: "Type here. It stays on this device." });
    area.value = store.get("notes.scratch", "");
    area.addEventListener("input", () => { store.set("notes.scratch", area.value); saved.textContent = "Saved on this device"; });
    const scratchEl = h("div", { class: "os-note os-note--scratch" },
      h("div", { class: "os-note__head" }, h("h3", { class: "os-note__title" }, two("Scratch", "Borrador")), saved), area);

    const tabs = [["about", "About", "Sobre mí", "lock"], ["scratch", "Scratch", "Borrador", null]].map(([id, en, es, ic]) =>
      h("button", { class: "os-notes__tab", type: "button", role: "tab", "data-id": id, onclick: () => { pick(id); audio.blip("click"); } },
        h("span", {}, two(en, es)), ic ? iconEl(ic, 13) : null));
    function pick(id) {
      current = id;
      tabs.forEach((t) => t.setAttribute("aria-selected", String(t.dataset.id === id)));
      aboutEl.hidden = id !== "about"; scratchEl.hidden = id !== "scratch";
    }
    pick("about");

    body.append(h("div", { class: "os-notes" },
      h("div", { class: "os-notes__list", role: "tablist", "aria-label": "Notes" }, tabs),
      h("div", { class: "os-notes__page" }, aboutEl, scratchEl)));

    return {
      arg(id) { if (id === "about" || id === "scratch") pick(id); },
      focus() { (current === "scratch" ? area : aboutEl).focus({ preventScroll: true }); },
    };
  },
};
