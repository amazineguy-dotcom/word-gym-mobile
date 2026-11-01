// The body chart: a cartoon fitness girl doing a double-biceps flex, front and back (viewBox 0 0 200 400).
// Only the left half of each shape is written; the right half is mirrored (x -> 200 - x).
// Each topic of words trains one region. As its words are learned the region gets more toned and rosier.
// Her face follows overall progress: nervous → determined → smiling → laughing → star eyes and sparkles.

export const TONE = ["#f3c7a8", "#f4b6a2", "#f29fa0", "#ec849e", "#e0699d", "#cf4f9b", "#b23a98"];
const SKIN = "#f6cdb0", HAIR = "#3b2418", BAND = "#ff6fa8", TOP = "#8b5cf6", SHORTS = "#2f2a55", SHOE = "#ffffff";

function mirror(d) {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+/g);
  let xNext = true;
  return tokens.map(t => {
    if (/[MLCZ]/.test(t)) { xNext = true; return t; }
    const v = xNext ? 200 - Number(t) : Number(t);
    xNext = !xNext;
    return String(Math.round(v * 100) / 100);
  }).join(" ");
}
const both = paths => paths.flatMap(d => [d, mirror(d)]);
const tags = (ds, attrs = "") => ds.map(d => `<path d="${d}"${attrs}/>`).join("");
const circle = (x, y, r) => `M${x - r} ${y} C${x - r} ${y - r * .55} ${x - r * .55} ${y - r} ${x} ${y - r} C${x + r * .55} ${y - r} ${x + r} ${y - r * .55} ${x + r} ${y} C${x + r} ${y + r * .55} ${x + r * .55} ${y + r} ${x} ${y + r} C${x - r * .55} ${y + r} ${x - r} ${y + r * .55} ${x - r} ${y} Z`;
const rrect = (x, y, w, h, r) => `M${x + r} ${y} L${x + w - r} ${y} C${x + w} ${y} ${x + w} ${y} ${x + w} ${y + r} L${x + w} ${y + h - r} C${x + w} ${y + h} ${x + w} ${y + h} ${x + w - r} ${y + h} L${x + r} ${y + h} C${x} ${y + h} ${x} ${y + h} ${x} ${y + h - r} L${x} ${y + r} C${x} ${y} ${x} ${y} ${x + r} ${y} Z`;
const star = (x, y, s) => `M${x} ${y - s} L${x + s * .3} ${y - s * .3} L${x + s} ${y} L${x + s * .3} ${y + s * .3} L${x} ${y + s} L${x - s * .3} ${y + s * .3} L${x - s} ${y} L${x - s * .3} ${y - s * .3} Z`;

/* ---------- body (left half) ---------- */
const NECK = "M92 86 L100 86 L100 104 L90 104 Z";
const TORSO = "M100 100 C88 100 74 102 68 110 C64 128 70 150 76 168 C72 180 72 196 76 206 L100 210 Z";
const UPPER_ARM = "M68 108 C54 106 38 110 28 115 C22 119 22 128 29 130 C42 132 56 130 68 127 Z";
const FOREARM = "M22 124 C19 106 21 88 25 76 L37 76 C38 90 38 106 35 124 Z";
const FIST = circle(31, 68, 10);
const THIGH = "M84 236 L97 236 L95 330 L86 330 Z";             // slim on purpose: the muscles add the shape
const SHIN = "M86 328 L95 328 L94 378 L87 378 Z";
const EAR = circle(67, 62, 6);
const HEAD = circle(100, 58, 34);

const CROP_FRONT = "M100 104 C90 104 78 106 70 112 C68 124 70 134 74 142 C84 146 94 146 100 145 Z";
const CROP_BACK = "M74 136 L100 138 L100 150 L76 148 Z M78 106 L84 106 L92 138 L86 138 Z";
const SHORTS_L = "M76 200 L100 204 L100 226 L98 248 L74 248 C70 232 72 214 76 200 Z";
const SHOE_L = "M80 376 L96 376 L98 390 L72 390 C70 384 74 378 80 376 Z";
const WRIST = "M21 76 L38 76 L38 82 L21 82 Z";

// Regions: [region, [left-half paths]]. Drawn in order (later on top).
const MUSCLES = {
  front: [
    ["calves", ["M83 336 C80 348 81 362 86 374 L94 374 C96 362 96 348 94 336 Z"]],
    ["thighs", ["M78 250 C72 270 74 298 82 326 L96 326 C99 300 99 272 98 250 Z"]],
    ["waist", ["M76 150 C74 166 76 184 82 198 L87 196 C85 180 85 164 87 150 Z"]],
    ["abs", [rrect(90, 150, 9, 11, 3), rrect(90, 163, 9, 11, 3), rrect(90, 176, 9, 13, 3)]],
    ["arms", ["M23 122 C20 106 22 92 27 81 C32 88 35 104 33 122 Z",
              "M30 117 C28 104 35 95 44 95 C53 95 58 104 56 116 C50 121 36 122 30 117 Z"]],
    ["shoulders", ["M72 106 C60 101 50 106 50 116 C50 124 58 128 66 127 C72 121 74 112 72 106 Z"]],
  ],
  back: [
    ["calves", ["M80 334 C73 344 75 362 86 372 C93 370 97 360 96 346 C95 340 92 336 88 334 Z"]],
    ["thighs", ["M78 252 C72 272 74 298 82 326 L96 326 C99 300 99 274 98 252 Z"]],
    ["glutes", ["M78 206 C74 220 80 236 92 240 C97 240 100 234 100 226 L100 206 Z"]],
    ["waist", ["M80 168 C80 182 82 194 86 200 L99 200 L99 180 Z"]],
    ["back", ["M70 118 C68 140 76 166 88 186 L99 180 L99 152 C90 142 78 130 70 118 Z",
              "M100 98 L100 132 L86 116 L70 108 C80 102 90 99 100 98 Z"]],
    ["arms", ["M23 122 C20 106 22 92 27 81 C32 88 35 104 33 122 Z",
              "M28 124 C36 138 54 138 66 130 L66 120 C54 126 40 126 28 124 Z"]],
    ["shoulders", ["M72 106 C60 101 50 106 50 116 C50 124 58 128 66 127 C72 121 74 112 72 106 Z"]],
  ],
};
// Toned, not bulky: scale = start + stage × step.
const SWELL = { arms: [0.7, 0.08], shoulders: [0.75, 0.07], thighs: [0.7, 0.07], calves: [0.72, 0.07], glutes: [0.82, 0.05] };

/* ---------- face ---------- */
const REGIONS = ["shoulders", "arms", "back", "abs", "waist", "glutes", "thighs", "calves"];
const avg = s => REGIONS.reduce((a, k) => a + (s[k] || 0), 0) / REGIONS.length;
function mood(stages) {
  const a = avg(stages);
  return a === 0 ? 0 : a < 1 ? 1 : a < 2.5 ? 2 : a < 4.5 ? 3 : 4;
}
const INK = 'stroke="#2a1712" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
const LASH = `<path d="M80 61 L77 58 M84 59 L83 55 M120 61 L123 58 M116 59 L117 55" ${INK} fill="none" stroke-width="1.6"/>`;
const GRIN = `<path d="M89 75 L111 75 C111 84 106 89 100 89 C94 89 89 84 89 75 Z" fill="#b8325a" ${INK}/><path d="M91 75 L109 75 L108 78.5 L92 78.5 Z" fill="#fff"/>`;
const FACES = [
  // 0: nervous first day
  `<path d="M80 52 L92 49 M108 49 L120 52" fill="none" ${INK}/>`
  + `<circle cx="88" cy="63" r="5.5" fill="#fff" ${INK}/><circle cx="112" cy="63" r="5.5" fill="#fff" ${INK}/>`
  + `<circle cx="88" cy="64" r="2.6" fill="#2a1712"/><circle cx="112" cy="64" r="2.6" fill="#2a1712"/>` + LASH
  + `<path d="M91 80 C94 77 97 83 100 80 C103 77 106 83 109 80" fill="none" ${INK}/>`,
  // 1: determined
  `<path d="M80 51 L92 54 M108 54 L120 51" fill="none" ${INK}/>`
  + `<path d="M82 63 C85 60 90 60 93 63 M107 63 C110 60 115 60 118 63" fill="none" ${INK}/>` + LASH
  + `<path d="M95 80 C95 77 105 77 105 80 C105 84 95 84 95 80 Z" fill="#b8325a" ${INK}/>`,
  // 2: smiling
  `<path d="M81 52 C85 49 90 49 93 51 M107 51 C110 49 115 49 119 52" fill="none" ${INK}/>`
  + `<circle cx="88" cy="63" r="3.4" fill="#2a1712"/><circle cx="112" cy="63" r="3.4" fill="#2a1712"/>`
  + `<circle cx="89.2" cy="61.8" r="1" fill="#fff"/><circle cx="113.2" cy="61.8" r="1" fill="#fff"/>` + LASH
  + `<path d="M90 77 C95 83 105 83 110 77" fill="none" ${INK}/>`,
  // 3: laughing
  `<path d="M81 51 C85 47 90 47 93 50 M107 50 C110 47 115 47 119 51" fill="none" ${INK}/>`
  + `<path d="M82 64 C85 58 91 58 94 64 M106 64 C109 58 115 58 118 64" fill="none" ${INK}/>` + LASH + GRIN,
  // 4: champion — star eyes
  `<path d="${star(88, 63, 6.5)} ${star(112, 63, 6.5)}" fill="#ffd166" ${INK} stroke-width="1.4"/>` + GRIN,
];
const CHEEKS = `<circle cx="79" cy="74" r="5" fill="#ff8fb1" opacity=".5"/><circle cx="121" cy="74" r="5" fill="#ff8fb1" opacity=".5"/>`;
const SWEAT = `<path class="sweat" d="M138 40 C142 48 144 52 140 55 C136 57 133 53 135 49 Z" fill="#7cc8ff" stroke="#2a1712" stroke-width="1.3"/>`;
const SPARKLES = [[28, 34, 7], [172, 30, 6], [174, 196, 5], [26, 210, 6], [170, 300, 5]]
  .map(([x, y, s], i) => `<path class="spark" style="animation-delay:${i * .35}s" d="${star(x, y, s)}" fill="#ffd166"/>`).join("");

const HAIR_FRONT = "M64 56 C62 32 80 20 100 20 C120 20 138 32 136 56 C130 42 116 35 100 37 C86 35 72 42 64 56 Z";
const BANGS = "M70 46 C78 37 92 35 101 39 C94 46 84 50 70 54 Z";
const PONY_SIDE = "M126 38 C152 42 160 76 150 110 C144 96 140 76 128 62 Z";
const BAND_PATH = "M66 46 C80 34 120 34 134 46 L133 52 C120 42 80 42 67 52 Z";
const HAIR_BACK = "M64 58 C62 32 80 22 100 22 C120 22 138 32 136 58 C134 78 120 90 100 92 C80 90 66 78 64 58 Z";
const PONY_BACK = "M92 40 C84 72 88 104 100 128 C112 104 116 72 108 40 Z";

function head(side, m) {
  const skin = `<g class="skin" fill="${SKIN}">${tags(both([EAR]))}<path d="${HEAD}"/></g>`;
  if (side === "back") {
    return skin + `<g class="cloth"><path d="${HAIR_BACK}" fill="${HAIR}"/><path d="${PONY_BACK}" fill="${HAIR}"/>`
      + `<path d="${BAND_PATH}" fill="${BAND}"/><path d="${circle(100, 42, 6)}" fill="${BAND}"/></g>`;
  }
  return `<g class="cloth"><path d="${PONY_SIDE}" fill="${HAIR}"/></g>` + skin
    + `<g class="cloth"><path d="${HAIR_FRONT}" fill="${HAIR}"/><path d="${BANGS}" fill="${HAIR}"/><path d="${BAND_PATH}" fill="${BAND}"/>`
    + `<path d="${circle(131, 45, 5)}" fill="${BAND}"/></g>`
    + `<g class="face">${CHEEKS}${FACES[m]}</g>`;
}

// side: "front" | "back"; stages: region -> 0–6 (averages are fine); names: region -> label.
export function figure(side, stages, names = {}, flash = new Set()) {
  const m = mood(stages);
  const base = `<g class="skin" fill="${SKIN}">${tags(both([NECK, TORSO, UPPER_ARM, FOREARM, FIST, THIGH, SHIN]))}</g>`;
  const shorts = `<g class="cloth" fill="${SHORTS}">${tags(both([SHORTS_L]))}</g>`;
  const top = `<g class="cloth" fill="${TOP}">${tags(both([side === "back" ? CROP_BACK : CROP_FRONT]))}</g>`;
  const gear = `<g class="cloth"><g fill="${SHOE}">${tags(both([SHOE_L]))}</g><g fill="${BAND}">${tags(both([WRIST]))}</g></g>`;
  const muscles = MUSCLES[side].map(([region, paths]) => {
    const st = Math.min(stages[region] || 0, 6);
    // Glutes sit on the shorts: untrained they are just shorts, then a rosy tint shows through.
    const col = region === "glutes" && st === 0 ? SHORTS : TONE[st > 0 ? Math.max(1, Math.round(st)) : 0];
    const [a, b] = SWELL[region] || [0.8, 0.05];
    const cls = "mus" + (st === 0 ? " untrained" : "") + (flash.has(region) ? " grew" : "") + (region === "glutes" ? " onfabric" : "");
    const ds = both(paths);
    return `<g class="${cls}" data-region="${region}" style="fill:${col};--s:${(a + st * b).toFixed(3)}">`
      + `<title>${names[region] || region}</title>${tags(ds)}<g class="shade" fill="url(#tone)">${tags(ds)}</g></g>`;
  }).join("");
  const fx = `<g class="fx">${m <= 1 ? SWEAT : ""}${m === 4 ? SPARKLES : ""}</g>`;
  const defs = `<defs><radialGradient id="tone" cx=".32" cy=".28" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>`;
  return defs + base + (side === "back" ? shorts + muscles + top : muscles + shorts + top) + gear + head(side, m) + fx;
}
