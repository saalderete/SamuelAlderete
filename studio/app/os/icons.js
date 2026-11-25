// The screen's icons: one family, drawn here. A 24 unit grid, one 1.5 stroke, square ends and
// mitred corners to sit with the square windows. No fills except where a shape is a solid mark.

const P = {
  // programs
  inventory: '<path d="M3.5 20.5v-17M20.5 20.5v-17M3.5 11.5h17M3.5 19.5h17"/><rect x="6.5" y="6" width="4.5" height="5.5"/><rect x="13" y="8" width="5" height="3.5"/><rect x="8" y="14.5" width="8" height="5"/>',
  notes: '<path d="M6 3.5h8.5L18 7v13.5H6z"/><path d="M14.5 3.5V7H18M9 11h6M9 14h6M9 17h3.5"/>',
  terminal: '<rect x="3" y="4.5" width="18" height="15"/><path d="M7 9.5l3 2.5-3 2.5M12.5 14.5H17"/>',
  resume: '<rect x="5.5" y="3.5" width="13" height="17"/><path d="M8.5 7.5h4" stroke-width="2.5"/><path d="M8.5 11.5h7M8.5 14.5h7M8.5 17.5h4"/>',
  contact: '<rect x="3" y="5.5" width="18" height="13"/><path d="M3.5 6l8.5 7 8.5-7"/>',
  videos: '<rect x="3" y="5" width="18" height="14"/><path d="M10 9v6l5.5-3z"/>',
  paint: '<path d="M19.5 4.5L11 13"/><path d="M11 13c-2.1-.4-3.9.9-4.2 3-.2 1.5-.9 2.5-2.3 3.2 3.7.7 7.2-1 7.8-4.2"/>',
  drums: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7" fill="currentColor"/>',
  game: '<rect x="5" y="14.5" width="14" height="5"/><rect x="7" y="9.5" width="12" height="5"/><rect x="4" y="4.5" width="10" height="5"/>',
  settings: '<path d="M4 7h8M16.5 7H20M4 12h2.5M11 12h9M4 17h10.5M19 17h1"/><rect x="12.25" y="5" width="4" height="4"/><rect x="6.75" y="10" width="4" height="4"/><rect x="14.75" y="15" width="4" height="4"/>',
  // window and bar
  close: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  min: '<path d="M6.5 17.5h11"/>',
  max: '<rect x="6.5" y="6.5" width="11" height="11"/>',
  restore: '<rect x="5.5" y="8.5" width="10" height="10"/><path d="M8.5 8.5v-3h10v10h-3"/>',
  back: '<path d="M20 12H5M10.5 6.5L5 12l5.5 5.5"/>',
  sound: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9.5c1.2 1.4 1.2 3.6 0 5M18 7.5c2.3 2.6 2.3 6.4 0 9"/>',
  mute: '<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9.5l5 5M20.5 9.5l-5 5"/>',
  // controls
  play: '<path d="M8 5.5v13l10-6.5z"/>',
  pause: '<rect x="7" y="5.5" width="3" height="13"/><rect x="14" y="5.5" width="3" height="13"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11"/>',
  undo: '<path d="M8.5 5L4.5 9l4 4"/><path d="M5 9h9c3 0 5.5 2.2 5.5 5s-2.5 5-5.5 5H9"/>',
  trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13.5h9l1-13.5M10 10.5v6.5M14 10.5v6.5"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
  lock: '<rect x="6" y="11" width="12" height="9.5"/><path d="M8.5 11V8a3.5 3.5 0 017 0v3"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  ext: '<path d="M10 5.5H5v13.5h13.5v-5M13.5 4.5h6v6M19.5 4.5L11 13"/>',
  copy: '<rect x="8" y="8" width="11.5" height="11.5"/><path d="M5 15.5v-11h11"/>',
  brush: '<path d="M19.5 4.5L11 13"/><path d="M11 13c-2.1-.4-3.9.9-4.2 3-.2 1.5-.9 2.5-2.3 3.2 3.7.7 7.2-1 7.8-4.2"/>',
  eraser: '<path d="M5 15.5L14.5 6l5 5L12 18.5H8z"/><path d="M10.5 10l5 5M4 20.5h16"/>',
  line: '<path d="M5 19L19 5"/>',
  rect: '<rect x="4.5" y="6.5" width="15" height="11"/>',
  caret: '<path d="M7.5 10l4.5 4.5 4.5-4.5"/>',
};

export function icon(name, size = 18) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">${P[name] || ""}</svg>`;
}

export function iconEl(name, size = 18) {
  const s = document.createElement("span");
  s.className = "os-ic";
  s.innerHTML = icon(name, size);
  return s;
}
