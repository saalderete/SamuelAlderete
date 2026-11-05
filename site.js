// The directory follows you down the aisles: the aisle you're in lights up (its
// sign's number and hairline, and its row in the directory), and each sign's
// number flickers on once, the first time you reach it.
(() => {
  const aisles = [...document.querySelectorAll(".aisle[id]")];
  const links = new Map(
    [...document.querySelectorAll(".aisles a[data-aisle]")].map((a) => [a.dataset.aisle, a]),
  );
  if (!aisles.length) return;

  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const seen = new Set();
  let current = null;
  let queued = false;

  function pick() {
    queued = false;
    const line = innerHeight * 0.32;
    let here = aisles[0];
    for (const a of aisles) {
      if (a.getBoundingClientRect().top <= line) here = a;
    }
    // At the very bottom, the last aisle is where you are even if it is short.
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) here = aisles[aisles.length - 1];
    if (here === current) return;

    if (current) {
      current.classList.remove("is-here");
      links.get(current.id)?.removeAttribute("aria-current");
    }
    current = here;
    current.classList.add("is-here");
    links.get(current.id)?.setAttribute("aria-current", "true");

    if (!seen.has(here.id)) {
      seen.add(here.id);
      if (!still.matches && scrollY > 0) {
        here.classList.add("lit");
        here.addEventListener("animationend", () => here.classList.remove("lit"), { once: true });
      }
    }
  }

  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(pick);
    }
  };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  pick();
})();

// The work light: a soft lamp that follows a mouse or trackpad along the aisle floor, under the shelves.
// Touch screens and reduced motion never get it. It moves by transform only, once a frame at most.
(() => {
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  if (!fine.matches || still.matches) return;

  const lamp = document.createElement("div");
  lamp.className = "worklight";
  lamp.setAttribute("aria-hidden", "true");
  document.body.prepend(lamp);
  const half = lamp.offsetWidth / 2;

  let x = 0;
  let y = 0;
  let queued = false;
  const draw = () => {
    queued = false;
    lamp.style.transform = `translate3d(${x - half}px, ${y - half}px, 0)`;
    lamp.classList.add("on");
  };
  addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    x = e.clientX;
    y = e.clientY;
    if (!queued) {
      queued = true;
      requestAnimationFrame(draw);
    }
  }, { passive: true });
  // out of the window: the lamp dims, and comes back where the pointer re-enters
  document.addEventListener("mouseout", (e) => { if (!e.relatedTarget) lamp.classList.remove("on"); });
  still.addEventListener("change", () => { if (still.matches) lamp.remove(); });
})();

// The shutter (index.html): the <head> decides whether it shows (html.opening), on the first visit of a session
// and on every refresh. It fades once the page has loaded and the greetings have played to the store's sign
// (2.7 s at least, so the store's sign holds about a second, and 3.8 s at most); a key, a click, a scroll or a touch fades it straight away. Then the sign of
// the aisle you're in flickers on, as if the lights came on (after a refresh, that can be any aisle).
(() => {
  const d = document.documentElement;
  const shutter = document.querySelector(".shutter");
  if (!shutter || !d.classList.contains("opening")) return;

  const wait = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
  const loaded = new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r, { once: true })));
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  const skip = new Promise((r) => {
    for (const type of ["keydown", "pointerdown", "wheel", "touchstart"]) addEventListener(type, r, { once: true, passive: true });
  });

  let lifted = false;
  const lift = () => {
    if (lifted) return;
    lifted = true;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      d.classList.remove("opening", "opened");
      const here = document.querySelector(".aisle.is-here") || document.querySelector(".aisle");
      if (here) {
        here.classList.remove("lit");
        void here.offsetWidth; // restart the flicker if the scroll-spy just played it under the shutter
        here.classList.add("lit");
        here.addEventListener("animationend", () => here.classList.remove("lit"), { once: true });
      }
    };
    d.classList.add("opened");
    shutter.addEventListener("transitionend", (e) => { if (e.target === shutter) finish(); });
    setTimeout(finish, 1100);
  };
  Promise.race([Promise.all([loaded, fonts, wait(2700 - performance.now())]), wait(3800 - performance.now()), skip]).then(lift);
})();

// The progress line along the top edge (styles.css). Where the browser can drive it from the scroll position
// it does so on its own; otherwise this fills it, by transform only, once a frame at most.
(() => {
  const bar = document.createElement("div");
  bar.className = "progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.prepend(bar);
  if (window.CSS && CSS.supports && CSS.supports("animation-timeline: scroll()")) return;
  let queued = false;
  const draw = () => {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
  };
  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(draw);
    }
  };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  draw();
})();
