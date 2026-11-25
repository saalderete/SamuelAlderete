// Terminal: a small file system built from the portfolio's own words, real commands, a few jokes.

import { h } from "../dom.js";

const ALIAS = { mail: "contact", email: "contact", work: "inventory", shelf: "inventory", films: "videos", video: "videos", film: "videos", drum: "drums", pad: "drums", stack: "game", note: "notes", cv: "resume", prefs: "settings" };

export default {
  id: "terminal", name: ["Terminal", null], icon: "terminal",
  size: { w: 700, h: 430, minW: 320, minH: 220 },

  mount({ body, os, host, audio, content, href, frozen }) {
    const { person, links, items, alsoOnTheShelf, about, contact, byId } = content;

    // ---- the file system
    const page = (it) => [
      `# ${it.name}`, it.sub, "", it.text, "",
      ...it.facts.map(([k, v]) => `${k}: ${v}`),
      it.stack.length ? `Stack: ${it.stack.join(", ")}` : null,
      ...it.links.map((l) => `${l.label}: ${href(l.href)}`),
      it.note || null,
    ].filter((x) => x != null).join("\n").replace(/\n{3,}/g, "\n\n").trim();
    const fs = {
      "about.txt": [`${person.name}, ${person.role}`, person.place, "", about.join("\n\n")].join("\n"),
      "contact.txt": [contact.join("\n\n"), "", person.email, links.linkedin, links.github].join("\n"),
      "resume.pdf": { bin: true },
      projects: Object.fromEntries([
        ...items.filter((i) => i.kind === "project").map((i) => [i.id + ".md", page(i)]),
        ...alsoOnTheShelf.map((s) => [s.id + ".md", [`# ${s.name}`, s.sub, "", s.text, s.href || null].filter((x) => x != null).join("\n")]),
      ]),
      experience: Object.fromEntries(items.filter((i) => i.kind === "experience" || i.kind === "education").map((i) => [i.id + ".md", page(i)])),
    };
    let cwd = [];
    const isDir = (n) => n != null && typeof n === "object" && !n.bin;
    const node = (parts) => parts.reduce((n, p) => (isDir(n) ? n[p] : undefined), fs);
    const resolve = (path) => {
      const parts = /^[~/]/.test(path) ? [] : cwd.slice();
      for (const seg of path.replace(/^~/, "").split("/")) {
        if (!seg || seg === ".") continue;
        if (seg === "..") parts.pop(); else parts.push(seg);
      }
      return parts;
    };
    const show = (parts) => "~" + (parts.length ? "/" + parts.join("/") : "");

    // ---- the view
    const out = h("div", { class: "os-term__out", role: "log" });
    const ps = h("span", { class: "os-term__ps" });
    const pre = h("span"), cur = h("span", { class: "os-term__cur" }), post = h("span");
    const input = h("input", { class: "os-term__in", type: "text", autocomplete: "off", autocapitalize: "off", autocorrect: "off", spellcheck: "false", "aria-label": "Command line" });
    const line = h("label", { class: "os-term__line" }, ps, h("span", { class: "os-term__typed" }, pre, cur, post), input);
    const el = h("div", { class: "os-term" }, out, line);
    body.append(el);

    const scroll = () => { el.scrollTop = el.scrollHeight; };
    const print = (text = "", cls = "") => { out.append(h("div", { class: "os-term__row " + cls, text: text === "" ? " " : text })); scroll(); };
    const printLink = (label, url) => { out.append(h("div", { class: "os-term__row" }, h("a", { href: href(url), target: "_blank", rel: "noopener", text: label }))); scroll(); };
    const sync = () => {
      const v = input.value, a = input.selectionStart ?? v.length;
      pre.textContent = v.slice(0, a); cur.textContent = v[a] || " "; post.textContent = v.slice(a + 1);
      ps.textContent = show(cwd) + " $";
    };

    // ---- commands
    const history = [];
    let hIndex = 0, draft = "";
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); };
    const programs = os.programs.map((p) => p.id);

    function openThing(name) {
      if (!name) return print("open: say what to open. Programs: " + programs.join(", "));
      const key = name.toLowerCase().replace(/^projects\/|^experience\/|\.md$/g, "");
      if (key === "resume.pdf") { os.open("resume"); return print("Opening the résumé."); }
      if (key === "about.txt") { os.open("notes"); return print("Opening the About note."); }
      if (key === "contact.txt") { os.open("contact"); return print("Opening Contact."); }
      const prog = programs.includes(key) ? key : ALIAS[key];
      if (prog) { os.open(prog); return print(`Opening ${prog}.`); }
      if (byId[key] || alsoOnTheShelf.some((s) => s.id === key)) { os.open("inventory", key); return print(`Opening ${key} in the inventory.`); }
      print(`open: nothing here is called ${name}. Try: projects`, "err");
      audio.blip("error");
    }

    const table = (rows) => { const wd = Math.max(...rows.map((r) => r[0].length)) + 3; rows.forEach(([a, b]) => print(a.padEnd(wd) + b)); };

    const cmds = {
      help() {
        table([
          ["about", "who this is"], ["projects", "what is on the shelves"], ["contact", "how to reach me"], ["resume", "open the one-page résumé"], ["whoami", "name, role, place"],
          ["ls [folder]", "list files"], ["cd <folder>", "change folder"], ["pwd", "where you are"], ["cat <file>", "read a file"],
          ["open <name>", "open a program, a project or a file"], ["wallpaper [name]", "list or change the wallpaper"], ["sound on|off", "the room's sound"],
          ["date", "now"], ["echo <text>", "say it back"], ["history", "what you have typed"], ["clear", "wipe the screen"], ["exit", "back to the room"],
        ]);
        print("Tab completes, the up arrow repeats. There are a few jokes in here too.", "dim");
      },
      about() { print(`${person.name}, ${person.role}`); print(person.place, "dim"); about.forEach((p) => { print(); print(p); }); },
      projects() {
        table(items.filter((i) => i.kind === "project").map((i) => [i.id, `${i.name} · ${i.sub}`]));
        print("Also on the shelf:", "dim");
        table(alsoOnTheShelf.map((s) => [s.id, `${s.name} · ${s.sub}`]));
        print("open <name> shows one in the inventory. cat projects/<name>.md reads it here.", "dim");
      },
      contact() { contact.forEach((p) => print(p)); print(); printLink(person.email, links.email); printLink("LinkedIn", links.linkedin); printLink("GitHub", links.github); },
      resume() { os.open("resume"); print("Opening the résumé."); printLink("Résumé (PDF)", links.resumePdf); },
      whoami() { print(person.name); print(person.role); print(person.place, "dim"); },
      pwd() { print(show(cwd)); },
      ls(args) {
        const target = resolve(args[0] || ".");
        const n = node(target);
        if (n === undefined) return print(`ls: no such file or folder: ${args[0]}`, "err");
        if (!isDir(n)) return print(target[target.length - 1]);
        print(Object.keys(n).map((k) => (isDir(n[k]) ? k + "/" : k)).join("   "));
      },
      cd(args) {
        const target = resolve(args[0] || "~");
        if (!isDir(node(target))) return print(`cd: not a folder: ${args[0]}`, "err");
        cwd = target;
      },
      cat(args) {
        if (!args[0]) return print("cat: say which file. Try: cat about.txt", "err");
        const n = node(resolve(args[0]));
        if (n === undefined) return print(`cat: no such file: ${args[0]}`, "err");
        if (isDir(n)) return print(`cat: ${args[0]} is a folder. Try: ls ${args[0]}`, "err");
        if (n.bin) return print(`cat: ${args[0]} is a PDF. Try: open ${args[0]}`, "err");
        n.split("\n").forEach((l) => print(l, l.startsWith("# ") ? "head" : ""));
      },
      open(args) { openThing(args[0]); },
      wallpaper(args) {
        if (!args[0]) return print(os.wallpapers.map((w) => (w.id === os.wallpaper ? `[${w.id}]` : w.id)).join("   "));
        if (os.setWallpaper(args[0].toLowerCase())) print(`Wallpaper: ${args[0].toLowerCase()}. The room takes its colour.`);
        else print(`wallpaper: no such wallpaper: ${args[0]}. Try: wallpaper`, "err");
      },
      sound(args) {
        if (args[0] === "on") audio.enable().then((ok) => print(ok ? "Sound on." : "This browser would not start sound.", ok ? "" : "err"));
        else if (args[0] === "off") { audio.disable(); print("Sound off."); }
        else print(`Sound is ${audio.enabled ? "on" : "off"}. Try: sound ${audio.enabled ? "off" : "on"}`);
      },
      date() { print(new Date().toLocaleString([], { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" })); },
      echo(args, rest) { print(rest.replace(/^(["'])(.*)\1$/, "$2")); },
      history() { history.forEach((l, i) => print(String(i + 1).padStart(3) + "  " + l)); },
      clear() { out.replaceChildren(); },
      exit() { print("Back to the room."); os.exit(); },
      // the jokes
      npm(args) {
        if (args[0] !== "test") return print("npm: this screen has no packages. Not one. Try: npm test", "dim");
        const lines = [["> kasapro test", "dim"], ["reading every SQL query for the fence ...", ""], ["estimates  jobs  invoices  rentals  e-signatures  card payments", "dim"], ["940 passing", "ok"]];
        if (frozen || os.calm) lines.forEach(([l, c]) => print(l, c));
        else lines.forEach(([l, c], i) => later(() => { print(l, c); if (i === 3) audio.blip("good"); }, i * 280));
      },
      rm() { print("rm: refused. Every table here is fenced by business, and a test fails the build when a query forgets the fence."); audio.blip("error"); },
      sudo() { print("sudo: permission denied. Guests get read access; the foreman keeps the keys."); audio.blip("error"); },
      make(args) { print(args[0] === "coffee" ? "make: no rule to make target 'coffee'. The kitchen is down the hall." : "make: nothing to build here. No build step."); },
    };
    cmds["?"] = cmds.man = cmds.help;

    function run(raw, { record = true } = {}) {
      const text = raw.trim();
      out.append(h("div", { class: "os-term__row os-term__row--cmd" }, h("span", { class: "os-term__ps", text: show(cwd) + " $" }), " " + raw));
      if (!text) return scroll();
      if (record) { history.push(text); hIndex = history.length; }
      const [name, ...rest] = text.split(/\s+/);
      const args = rest.filter((a) => !a.startsWith("-"));
      const fn = cmds[name.toLowerCase()];
      if (fn) fn(args, text.slice(name.length).trim());
      else if (programs.includes(name.toLowerCase()) || byId[name.toLowerCase()]) openThing(name);
      else { print(`${name}: command not found. Type help.`, "err"); audio.blip("error"); }
      scroll();
    }

    // ---- completion
    function candidates(before) {
      const parts = before.split(/\s+/);
      const last = parts[parts.length - 1];
      if (parts.length === 1) return Object.keys(cmds).filter((c) => c.length > 1 && c !== "man").filter((c) => c.startsWith(last)).map((c) => c + " ");
      const cmd = parts[0].toLowerCase();
      if (cmd === "wallpaper") return os.wallpapers.map((w) => w.id).filter((x) => x.startsWith(last)).map((x) => x + " ");
      if (cmd === "sound") return ["on ", "off "].filter((x) => x.startsWith(last));
      if (cmd === "npm") return ["test "].filter((x) => x.startsWith(last));
      if (cmd === "make") return ["coffee "].filter((x) => x.startsWith(last));
      const cut = last.lastIndexOf("/") + 1, dir = last.slice(0, cut), stem = last.slice(cut);
      const n = node(resolve(dir || "."));
      let list = isDir(n) ? Object.keys(n).filter((k) => k.startsWith(stem)).map((k) => dir + k + (isDir(n[k]) ? "/" : " ")) : [];
      if (cmd === "cd") list = list.filter((x) => x.endsWith("/"));
      if (cmd === "open" && !dir) list = [...list, ...[...programs, ...Object.keys(byId), ...alsoOnTheShelf.map((s) => s.id)].filter((x) => x.startsWith(last)).map((x) => x + " ")];
      return [...new Set(list)];
    }
    function complete() {
      const at = input.selectionStart ?? input.value.length;
      const before = input.value.slice(0, at), after = input.value.slice(at);
      const list = candidates(before);
      if (!list.length) return audio.blip("tick");
      const start = before.length - before.split(/\s+/).pop().length;
      let fill = list[0];
      if (list.length > 1) {
        while (!list.every((c) => c.startsWith(fill))) fill = fill.slice(0, -1);
        if (fill.length <= before.length - start) { print(list.map((c) => c.trim()).join("   "), "dim"); return; }
      }
      input.value = before.slice(0, start) + fill + after;
      const pos = start + fill.length;
      input.setSelectionRange(pos, pos);
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const v = input.value; input.value = ""; draft = "";
        run(v); audio.blip("tick");
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (hIndex === history.length) draft = input.value;
        if (hIndex > 0) input.value = history[--hIndex];
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (hIndex < history.length) { hIndex++; input.value = hIndex === history.length ? draft : history[hIndex]; }
      } else if (e.key === "Tab" && !e.shiftKey && (input.value || true)) {
        e.preventDefault(); complete();
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault(); cmds.clear();
      } else if (e.key === "c" && e.ctrlKey && !String(getSelection())) {
        e.preventDefault();
        out.append(h("div", { class: "os-term__row os-term__row--cmd" }, h("span", { class: "os-term__ps", text: show(cwd) + " $" }), " " + input.value + "^C"));
        input.value = ""; scroll();
      }
      queueMicrotask(sync);
    });
    for (const ev of ["input", "keyup", "click", "select", "focus", "blur"]) input.addEventListener(ev, sync);
    el.addEventListener("click", () => { if (!String(getSelection())) input.focus({ preventScroll: true }); });

    // the screen you find when you sit down
    print("The studio's terminal. Type help to see what it can do.", "dim");
    run("whoami", { record: false });
    sync();

    return {
      focus() { input.focus({ preventScroll: true }); },
      key(e, typing) {
        if (!typing && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey && document.activeElement !== input) input.focus({ preventScroll: true });
      },
      destroy() { timers.forEach(clearTimeout); },
    };
  },
};
