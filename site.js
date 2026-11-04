// The directory follows you down the aisles: the sign of the aisle you're in
// inverts to lime, its number lights in the directory, and each sign flickers
// on once, the first time you reach it.
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
