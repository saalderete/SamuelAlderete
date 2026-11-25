// Inventory: everything on the room's shelves and desk as one list, with the full card for each.
// The words are the home page's; this is the same content the shelf objects open.

import { h, two } from "../dom.js";
import { iconEl } from "../icons.js";

const GROUPS = [
  ["project", "Projects", "Proyectos"],
  ["experience", "Experience", "Experiencia"],
  ["education", "Education", "Estudios"],
  ["shelf", "Also on the shelf", "También en el estante"],
  ["desk", "On the desk", "En el escritorio"],
];

export default {
  id: "inventory", name: ["Inventory", "Inventario"], icon: "inventory",
  size: { w: 940, h: 620, minW: 340, minH: 320 },

  mount({ body, content, os, href, audio }) {
    const { items, alsoOnTheShelf, films } = content;
    const all = [
      ...items,
      ...alsoOnTheShelf.map((s) => ({ ...s, kind: "shelf", facts: [], stack: [], links: s.href ? [{ label: "Open it", href: s.href }] : [] })),
    ];
    let current = all[0].id;
    const rowOf = new Map();

    const list = h("nav", { class: "os-inv__list", "aria-label": "Inventory" });
    for (const [kind, en, es] of GROUPS) {
      const group = all.filter((it) => it.kind === kind);
      if (!group.length) continue;
      list.append(h("h3", { class: "os-inv__group" }, two(en, es)));
      for (const it of group) {
        const row = h("button", { class: "os-inv__row", type: "button", onclick: () => { pick(it.id); audio.blip("click"); } },
          h("span", { class: "os-inv__name", text: it.tag || it.name }), h("span", { class: "os-inv__sub", text: it.sub }));
        rowOf.set(it.id, row);
        list.append(row);
      }
    }
    const pane = h("article", { class: "os-inv__pane os-sel", tabindex: "0" });

    function pick(id, scrollRow) {
      const it = all.find((x) => x.id === id);
      if (!it) return;
      current = id;
      for (const [rid, row] of rowOf) row.setAttribute("aria-current", String(rid === id));
      if (scrollRow) rowOf.get(id)?.scrollIntoView({ block: "nearest" });
      const group = GROUPS.find((g) => g[0] === it.kind);
      const film = it.loop && films.find((f) => f.id === it.loop);
      pane.replaceChildren(
        h("p", { class: "os-inv__kicker" }, two(group[1], group[2])),
        h("h3", { class: "os-inv__title", text: it.name }),
        h("p", { class: "os-inv__subline", text: it.sub }),
        h("p", { class: "os-inv__text", text: it.text }),
        it.facts.length ? h("dl", { class: "os-inv__facts" }, it.facts.map(([k, v]) => h("div", {}, h("dt", { text: k }), h("dd", { text: v })))) : null,
        it.stack.length ? h("ul", { class: "os-chips", "aria-label": it.kind === "experience" ? "Scope and tools" : "Technologies" }, it.stack.map((s) => h("li", { class: "os-chip", text: s }))) : null,
        it.links.length || film ? h("div", { class: "os-inv__links" },
          it.links.map((l) => {
            const url = href(l.href), outside = /^https?:/.test(url);
            return h("a", { class: "os-btn", href: url, target: outside || /\.pdf$/.test(url) ? "_blank" : null, rel: outside ? "noopener" : null }, h("span", { text: l.label }), outside ? iconEl("ext", 14) : null);
          }),
          film ? h("button", { class: "os-btn", type: "button", onclick: () => os.open("videos", film.id) }, iconEl("play", 14), h("span", { text: "Watch the film" })) : null) : null,
        it.note ? h("p", { class: "os-inv__note", text: it.note }) : null,
        it.object ? h("p", { class: "os-inv__object" }, h("span", { text: "In the room" }), it.object + ".") : null,
      );
      pane.scrollTop = 0;
    }
    pick(current);

    body.append(h("div", { class: "os-inv" }, list, pane));

    return {
      arg(id) { pick(id, true); },
      focus() { rowOf.get(current)?.focus({ preventScroll: true }); },
      key(e, typing) {
        if (typing || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
        if (!list.contains(document.activeElement)) return;
        e.preventDefault();
        const ids = [...rowOf.keys()], i = ids.indexOf(current);
        const next = ids[Math.min(ids.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)))];
        pick(next, true); rowOf.get(next).focus({ preventScroll: true });
      },
      // for tests
      get current() { return current; },
    };
  },
};
