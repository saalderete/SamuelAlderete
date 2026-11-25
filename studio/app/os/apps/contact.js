// Contact: the home page's closing words, and the three ways to reach Samuel. Email first.

import { h } from "../dom.js";
import { iconEl } from "../icons.js";

export default {
  id: "contact", name: ["Contact", "Contacto"], icon: "contact",
  size: { w: 560, h: 520, minW: 320, minH: 320 },

  mount({ body, content, audio }) {
    const { person, contact, links } = content;
    const copied = h("span", { class: "os-con__copied", role: "status" });
    const copy = h("button", { class: "os-btn", type: "button" }, iconEl("copy", 14), h("span", { text: "Copy the address" }));
    copy.addEventListener("click", async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(person.email); ok = true; } catch { /* no clipboard here */ }
      copied.textContent = ok ? "Copied." : "Select the address above to copy it.";
      audio.blip(ok ? "good" : "error");
    });
    const mail = h("a", { class: "os-con__mail os-sel", href: links.email, text: person.email });
    body.append(h("div", { class: "os-con" },
      h("p", { class: "os-con__lead os-sel", text: contact[0] }),
      h("p", { class: "os-con__text os-sel", text: contact[1] }),
      mail,
      h("div", { class: "os-con__row" }, h("a", { class: "os-btn os-btn--solid", href: links.email }, iconEl("contact", 14), h("span", { text: "Write an email" })), copy, copied),
      h("ul", { class: "os-con__links" },
        h("li", {}, h("a", { href: links.linkedin, target: "_blank", rel: "noopener" }, h("span", { text: "LinkedIn" }), h("span", { class: "os-con__url", text: "linkedin.com/in/saalderete" }), iconEl("ext", 14))),
        h("li", {}, h("a", { href: links.github, target: "_blank", rel: "noopener" }, h("span", { text: "GitHub" }), h("span", { class: "os-con__url", text: "github.com/saalderete" }), iconEl("ext", 14)))),
      h("p", { class: "os-con__place", text: person.place })));
    return { focus() { mail.focus({ preventScroll: true }); } };
  },
};
