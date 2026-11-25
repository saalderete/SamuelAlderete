// Small helpers the screen's programs share: element building, local storage, a few numbers.

/** h("div", { class: "x", onclick: fn }, child, "text") */
export function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k === "html") el.innerHTML = v;
      else if (k === "style" && typeof v === "object") Object.assign(el.style, v);
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Local storage under "studio.", JSON, never throws (private windows, blocked storage). */
export const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem("studio." + key);
      return v == null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("studio." + key, JSON.stringify(value)); } catch { /* not saved, and that is fine */ }
  },
};

/** A name the way the site's aisle signs write it: English, then the Spanish a step quieter. */
export function two(en, es) {
  return [h("span", { text: en }), es ? h("span", { class: "os-es", text: " / " + es }) : null];
}

export function clock(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

/** True for places where typing belongs to the field, not to the program's shortcuts. */
export function isTyping(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return true;
  if (target.tagName !== "INPUT") return false;
  return !/^(range|checkbox|radio|button|submit|color)$/.test(target.type);
}

/** A seeded random number source, so a drawing comes out the same every time. */
export function rng(seed) {
  let s = seed >>> 0;
  return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
}
