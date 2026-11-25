// Résumé: the plain site's own résumé page in a frame, and the PDF one click away.

import { h } from "../dom.js";
import { iconEl } from "../icons.js";

export default {
  id: "resume", name: ["Résumé", "Currículum"], icon: "resume",
  size: { w: 820, h: 640, minW: 320, minH: 320 },

  mount({ body, host }) {
    const page = host.site + "resume.html", pdf = host.site + "resume.pdf";
    const frame = h("iframe", { class: "os-res__frame", src: page, title: "Résumé", loading: "lazy" });
    body.append(h("div", { class: "os-res" },
      h("div", { class: "os-res__bar" },
        h("span", { class: "os-res__hint", text: "One page. The PDF is the one to send on." }),
        h("a", { class: "os-btn os-btn--solid", href: pdf, target: "_blank", rel: "noopener" }, iconEl("download", 14), h("span", { text: "Résumé (PDF)" })),
        h("a", { class: "os-btn", href: page, target: "_blank", rel: "noopener" }, h("span", { text: "Open as a page" }), iconEl("ext", 14))),
      frame));
    // Keys pressed inside the frame never reach this page, so the frame hands Escape back itself
    // (it is the same site, so the page may listen inside it).
    frame.addEventListener("load", () => {
      try {
        frame.contentWindow.addEventListener("keydown", (e) => { if (e.key === "Escape") host.exit(); });
      } catch { /* a frame from another origin: the "Back to the room" button still works */ }
    });
    return {};
  },
};
