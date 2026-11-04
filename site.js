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
