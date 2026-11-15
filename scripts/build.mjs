// Generates every SVG used by the profile README.
// Static panels are deterministic; assets/activity.svg uses live GitHub data
// (needs GITHUB_TOKEN). Run: node scripts/build.mjs

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets');
const LOGIN = process.env.PROFILE_LOGIN || 'pratyushdeosingh';

const C = {
  bg: '#07060b',
  panel: '#0c0a14',
  line: '#231f36',
  text: '#ece9f8',
  dim: '#9a96b4',
  faint: '#544f6e',
  cyan: '#00e5ff',
  mag: '#ff2a6d',
  vio: '#8f6bff',
  yel: '#f9f002',
  grn: '#3ddc97'
};

const FONT =
  "ui-monospace,'SF Mono',SFMono-Regular,Menlo,Consolas,'Liberation Mono','DejaVu Sans Mono',monospace";

// ---------- helpers ----------

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n = (v) => Number(v.toFixed(2));

/** Width of a monospace string; textLength pins it so layout is identical on every OS. */
const tw = (s, size, ls = 0) => s.length * (size * 0.6 + ls);

function t(x, y, s, size, o = {}) {
  const { fill = C.text, ls = 0, anchor = 'start', weight = 400, cls = '', style = '', opacity } = o;
  return (
    `<text x="${n(x)}" y="${n(y)}" font-size="${size}" fill="${fill}"` +
    (weight !== 400 ? ` font-weight="${weight}"` : '') +
    (anchor !== 'start' ? ` text-anchor="${anchor}"` : '') +
    (opacity !== undefined ? ` opacity="${opacity}"` : '') +
    (cls ? ` class="${cls}"` : '') +
    (style ? ` style="${style}"` : '') +
    ` textLength="${n(tw(s, size, ls))}" lengthAdjust="spacing">${esc(s)}</text>`
  );
}

/** One <text> per character, each fading in on its own delay: a typing effect. */
function typed(x, y, s, size, o = {}) {
  const { fill = C.text, start = 0, step = 40, weight = 400 } = o;
  const adv = size * 0.6;
  let out = `<g font-size="${size}" fill="${fill}" text-anchor="middle"${weight !== 400 ? ` font-weight="${weight}"` : ''}>`;
  [...s].forEach((ch, i) => {
    if (ch === ' ') return;
    out += `<text class="in" x="${n(x + i * adv + adv / 2)}" y="${y}" style="animation-delay:${start + i * step}ms">${esc(ch)}</text>`;
  });
  return { svg: out + '</g>', width: s.length * adv, end: start + s.length * step };
}

function wrap(text, max) {
  const lines = [];
  let cur = '';
  for (const word of text.split(' ')) {
    if (cur && (cur + ' ' + word).length > max) {
      lines.push(cur);
      cur = word;
    } else cur = cur ? cur + ' ' + word : word;
  }
  if (cur) lines.push(cur);
  return lines;
}

const BASE_CSS = `
text{font-family:${FONT}}
.in{opacity:0;animation:in .01s linear forwards}
.fade{opacity:0;animation:in .7s ease forwards}
.blink{animation:blink 1.1s steps(1) infinite}
.pulse{animation:pulse 2.4s ease-in-out infinite}
@keyframes in{to{opacity:1}}
@keyframes blink{50%{opacity:0}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes spinr{to{transform:rotate(-360deg)}}
@keyframes dash{to{stroke-dashoffset:0}}
`;

const REDUCED = `
@media (prefers-reduced-motion:reduce){
*{animation:none!important}
.in,.fade{opacity:1!important}
.d{stroke-dashoffset:0!important}
}`;

function svg(w, h, title, desc, css, body, { rx = 14, frame = true } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<style>${BASE_CSS}${css}${REDUCED}</style>
<defs>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#2a2640"/></pattern>
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#fff" opacity=".028"/></pattern>
<clipPath id="frame"><rect width="${w}" height="${h}" rx="${rx}"/></clipPath>
</defs>
<g clip-path="url(#frame)">
<rect width="${w}" height="${h}" fill="${C.bg}"/>
${body}
<rect width="${w}" height="${h}" fill="url(#scan)"/>
</g>
${frame ? `<rect x=".75" y=".75" width="${w - 1.5}" height="${h - 1.5}" rx="${rx}" fill="none" stroke="${C.line}" stroke-width="1.5"/>` : ''}
</svg>
`;
}

function brackets(w, h, inset, len, color) {
  const a = inset, b = w - inset, c = h - inset;
  return `<g fill="none" stroke="${color}" stroke-width="2">
<path d="M${a} ${a + len}V${a}H${a + len}"/><path d="M${b - len} ${a}H${b}V${a + len}"/>
<path d="M${b} ${c - len}V${c}H${b - len}"/><path d="M${a + len} ${c}H${a}V${c - len}"/></g>`;
}

function write(name, content) {
  writeFileSync(join(OUT, name), content);
  console.log('wrote assets/' + name);
}

// ---------- display lettering (custom stroke font, 4x6 grid) ----------

const GLYPHS = {
  P: { w: 4, p: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]]] },
  R: { w: 4, p: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]], [[2, 3], [4, 5], [4, 6]]] },
  A: { w: 4, p: [[[0, 6], [0, 1], [1, 0], [3, 0], [4, 1], [4, 6]], [[0, 3.6], [4, 3.6]]] },
  T: { w: 4, p: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]] },
  Y: { w: 4, p: [[[0, 0], [0, 1.5], [2, 3.5], [4, 1.5], [4, 0]], [[2, 3.5], [2, 6]]] },
  U: { w: 4, p: [[[0, 0], [0, 5], [1, 6], [3, 6], [4, 5], [4, 0]]] },
  S: { w: 4, p: [[[4, 0], [1, 0], [0, 1], [0, 2], [1, 3], [3, 3], [4, 4], [4, 5], [3, 6], [0, 6]]] },
  H: { w: 4, p: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]] },
  D: { w: 4, p: [[[0, 3], [0, 0], [3, 0], [4, 1], [4, 5], [3, 6], [0, 6], [0, 3]]] },
  E: { w: 4, p: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]] },
  O: { w: 4, p: [[[2, 0], [3, 0], [4, 1], [4, 5], [3, 6], [1, 6], [0, 5], [0, 1], [1, 0], [2, 0]]] },
  I: { w: 0, p: [[[0, 0], [0, 6]]] },
  N: { w: 4, p: [[[0, 6], [0, 0], [4, 6], [4, 0]]] },
  G: { w: 4, p: [[[4, 1.7], [4, 1], [3, 0], [1, 0], [0, 1], [0, 5], [1, 6], [3, 6], [4, 5], [4, 3], [2, 3]]] }
};

/** Returns path `d` strings for a word set in the stroke font. */
function letter(word, x, y, u, gap = 1.4, space = 2.4) {
  const paths = [];
  let cx = x;
  for (const ch of word) {
    if (ch === ' ') {
      cx += space * u;
      continue;
    }
    const g = GLYPHS[ch];
    for (const poly of g.p) {
      paths.push('M' + poly.map(([px, py]) => `${n(cx + px * u)} ${n(y + py * u)}`).join('L'));
    }
    cx += (g.w + gap) * u;
  }
  return { paths, width: cx - gap * u - x };
}

// ---------- hero ----------

function hero() {
  const W = 1200, H = 500, U = 19, X = 64;
  const l1 = letter('PRATYUSH', X, 106, U);
  const l2 = letter('DEO SINGH', X, 252, U);
  const all = [...l1.paths, ...l2.paths];

  const layer = (cls, stroke, draw) =>
    `<g class="${cls}" fill="none" stroke="${stroke}" stroke-width="11" stroke-miterlimit="2">` +
    all
      .map((d, i) =>
        draw
          ? `<path class="d" pathLength="1" style="animation-delay:${200 + i * 55}ms" d="${d}"/>`
          : `<path d="${d}"/>`
      )
      .join('') +
    '</g>';

  const tag = typed(X + 22, 424, 'CSE @ VIT CHENNAI. I BUILD WEB APPS, CONNECT SYSTEMS, AND FOLLOW INTERESTING PROBLEMS.', 15, {
    fill: C.text,
    start: 2100,
    step: 26
  });
  const steps = Math.round(tag.width / 9);

  const css = `
.d{stroke-dasharray:1;stroke-dashoffset:1;animation:dash .9s cubic-bezier(.7,0,.2,1) forwards}
.gc,.gm{opacity:0;mix-blend-mode:screen}
.gc{animation:in .5s 1.5s ease forwards,gc 5.2s 2s steps(1) infinite}
.gm{animation:in .5s 1.5s ease forwards,gm 5.2s 2s steps(1) infinite}
.slice{opacity:0;animation:slice 5.2s 2s steps(1) infinite}
.slice2{opacity:0;animation:slice2 7.3s 3s steps(1) infinite}
@keyframes gc{0%{transform:translate(-4px,0)}90%{transform:translate(-16px,2px)}92%{transform:translate(7px,-1px)}94%{transform:translate(-9px,0)}96%{transform:translate(-4px,0)}}
@keyframes gm{0%{transform:translate(4px,0)}90%{transform:translate(15px,-2px)}92%{transform:translate(-8px,1px)}94%{transform:translate(10px,0)}96%{transform:translate(4px,0)}}
@keyframes slice{0%{opacity:0}90%{opacity:1;transform:translate(22px,0)}92%{opacity:1;transform:translate(-14px,0)}94%{opacity:0}}
@keyframes slice2{0%{opacity:0}48%{opacity:1;transform:translate(-18px,0)}50%{opacity:1;transform:translate(12px,0)}52%{opacity:0}}
.sweep{animation:sweep 7s linear infinite}
@keyframes sweep{from{transform:translateY(-80px)}to{transform:translateY(${H}px)}}
.o1{transform-origin:0 0;animation:spin 26s linear infinite}
.o2{transform-origin:0 0;animation:spinr 34s linear infinite}
.o3{transform-origin:0 0;animation:spin 44s linear infinite}
.ring{transform-origin:0 0;animation:spinr 60s linear infinite}
.core{animation:core 2.6s ease-in-out infinite}
@keyframes core{0%,100%{r:9px;opacity:1}50%{r:13px;opacity:.7}}
.cur{animation:cur ${steps * 26}ms 2100ms steps(${steps}) forwards}
@keyframes cur{to{transform:translateX(${n(tag.width)}px)}}
`;

  const ell = 'M-120 0A120 44 0 1 0 120 0A120 44 0 1 0 -120 0';
  const orbit = (cls, rot, color, dur, begin) =>
    `<g transform="rotate(${rot})"><g class="${cls}">
<path d="${ell}" fill="none" stroke="${color}" stroke-width="1.4" opacity=".75"/>
<circle r="4.5" fill="${color}"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${ell}"/></circle>
</g></g>`;

  const ticks = Array.from({ length: 36 }, (_, i) => {
    const a = (i * 10 * Math.PI) / 180, r1 = 138, r2 = i % 3 === 0 ? 150 : 144;
    return `M${n(Math.cos(a) * r1)} ${n(Math.sin(a) * r1)}L${n(Math.cos(a) * r2)} ${n(Math.sin(a) * r2)}`;
  }).join('');

  const body = `
<defs>
<radialGradient id="g1" cx="12%" cy="88%" r="60%"><stop stop-color="${C.mag}" stop-opacity=".2"/><stop offset="1" stop-color="${C.mag}" stop-opacity="0"/></radialGradient>
<radialGradient id="g2" cx="86%" cy="42%" r="46%"><stop stop-color="${C.cyan}" stop-opacity=".17"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></radialGradient>
<linearGradient id="sw" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${C.cyan}" stop-opacity="0"/><stop offset="1" stop-color="${C.cyan}" stop-opacity=".1"/></linearGradient>
<clipPath id="b1"><rect x="0" y="150" width="${W}" height="26"/></clipPath>
<clipPath id="b2"><rect x="0" y="296" width="${W}" height="20"/></clipPath>
</defs>
<rect width="${W}" height="${H}" fill="url(#dots)"/>
<rect width="${W}" height="${H}" fill="url(#g1)"/>
<rect width="${W}" height="${H}" fill="url(#g2)"/>
<rect class="sweep" width="${W}" height="80" fill="url(#sw)"/>
${brackets(W, H, 22, 22, C.cyan)}

<circle class="pulse" cx="70" cy="59" r="4.5" fill="${C.grn}"/>
${t(86, 64, 'SYS.ONLINE', 13, { fill: C.grn, ls: 2 })}
${t(232, 64, '//', 13, { fill: C.faint })}
${t(262, 64, 'PDS.PROFILE', 13, { fill: C.dim, ls: 2 })}
${t(W - 64, 64, '12.84°N 80.15°E  CHENNAI, IN', 13, { fill: C.dim, ls: 2, anchor: 'end' })}
<path d="M64 80H${W - 64}" stroke="${C.line}"/>

${layer('gc', C.cyan, false)}
${layer('gm', C.mag, false)}
${layer('wh', C.text, true)}
<g clip-path="url(#b1)">${layer('slice', C.cyan, false)}</g>
<g clip-path="url(#b2)">${layer('slice2', C.mag, false)}</g>

<g transform="translate(1024 232)">
<g class="ring"><circle r="132" fill="none" stroke="${C.faint}" stroke-width="1" stroke-dasharray="2 9"/><path d="${ticks}" stroke="${C.faint}" stroke-width="1"/></g>
${orbit('o1', 0, C.cyan, 5, 0)}
${orbit('o2', 60, C.mag, 7, -2)}
${orbit('o3', 120, C.vio, 9, -5)}
<circle r="26" fill="${C.mag}" opacity=".12"/>
<circle class="core" r="9" fill="${C.mag}"/>
<circle r="3" fill="${C.text}"/>
</g>
${t(1024, 408, 'ORBIT.SYS  /  3 BODIES', 11, { fill: C.faint, ls: 2, anchor: 'middle' })}

<path d="M64 394H858" stroke="${C.line}"/>
${t(X, 424, '>', 15, { fill: C.mag, weight: 700, cls: 'in', style: 'animation-delay:1900ms' })}
${tag.svg}
<g class="cur"><rect class="blink" x="${X + 24}" y="410" width="9" height="17" fill="${C.cyan}"/></g>
${t(X, 458, 'FOCUS', 12, { fill: C.faint, ls: 2 })}
${t(X + 78, 458, 'DATA STRUCTURES & ALGORITHMS  /  FULL-STACK  /  AI SYSTEMS', 12, { fill: C.dim, ls: 1.5 })}
`;
  write(
    'hero.svg',
    svg(W, H, 'Pratyush Deo Singh', 'Animated nameplate. CSE at VIT Chennai. I build web apps, connect systems, and follow interesting problems.', css, body)
  );
}

// ---------- buttons ----------

function button(file, label, color) {
  const W = 250, H = 56;
  const css = `
.sh{animation:sh 3.6s ease-in-out infinite}
@keyframes sh{0%,60%{transform:translateX(-60px)}100%{transform:translateX(${W + 60}px)}}`;
  const body = `
<defs><linearGradient id="s" x1="0" x2="1"><stop stop-color="${color}" stop-opacity="0"/><stop offset=".5" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
<rect class="sh" width="60" height="${H}" fill="url(#s)"/>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="9" fill="none" stroke="${color}" stroke-width="1.5"/>
<rect x="14" y="20" width="4" height="16" fill="${color}"/>
${t(W / 2 + 6, 34, label, 16, { ls: 3, weight: 700, anchor: 'middle' })}
<path d="M${W - 26} 22l6 6-6 6" fill="none" stroke="${color}" stroke-width="2"/>`;
  write(file, svg(W, H, label, `Link: ${label}`, css, body, { rx: 10, frame: false }));
}

// ---------- stack marquee ----------

function stack() {
  const W = 1200, H = 58, size = 16, ls = 3;
  const items = ['TYPESCRIPT', 'REACT', 'NEXT.JS', 'PYTHON', 'FASTAPI', 'SQL', 'C++', 'C', 'JAVA', 'ORACLE PL/SQL', 'ARDUINO', 'DOCKER', 'GIT'];
  let x = 0, run = '';
  items.forEach((it, i) => {
    run += t(x, 36, it, size, { ls, weight: 700, fill: i % 2 ? C.dim : C.text });
    x += tw(it, size, ls) + 22;
    run += `<rect x="${n(x)}" y="25" width="8" height="8" fill="${i % 2 ? C.cyan : C.mag}" transform="rotate(45 ${n(x + 4)} 29)"/>`;
    x += 8 + 26;
  });
  const css = `.mq{animation:mq 38s linear infinite}@keyframes mq{to{transform:translateX(-${n(x)}px)}}`;
  const body = `
<defs><linearGradient id="fl" x1="0" x2="1"><stop stop-color="${C.bg}"/><stop offset="1" stop-color="${C.bg}" stop-opacity="0"/></linearGradient>
<linearGradient id="fr" x1="0" x2="1"><stop stop-color="${C.bg}" stop-opacity="0"/><stop offset="1" stop-color="${C.bg}"/></linearGradient></defs>
<g class="mq">${run}<g transform="translate(${n(x)})">${run}</g><g transform="translate(${n(2 * x)})">${run}</g></g>
<rect width="150" height="${H}" fill="url(#fl)"/><rect x="${W - 150}" width="150" height="${H}" fill="url(#fr)"/>`;
  write('stack.svg', svg(W, H, 'Tech stack', items.join(', '), css, body));
}

// ---------- terminal ----------

function terminal() {
  const W = 1200, H = 330, X = 48, size = 16;
  const blocks = [
    ['whoami', 'pratyush deo singh  /  b.tech cse, vit chennai (2025-2029)'],
    ['cat focus.txt', 'data structures & algorithms  /  full-stack  /  ai systems'],
    ['cat now.txt', 'building a hazard-inspection rover: esp32 control, live telemetry, vision'],
    ['cat status.txt', 'open to internships and collaborations']
  ];
  let y = 104, time = 500, out = '';
  for (const [cmd, res] of blocks) {
    out += t(X, y, '$', size, { fill: C.mag, weight: 700, cls: 'in', style: `animation-delay:${time}ms` });
    const ty = typed(X + 20, y, cmd, size, { fill: C.cyan, start: time + 150, step: 45 });
    out += ty.svg;
    out += t(X + 20, y + 25, res, size, { fill: C.text, cls: 'fade', style: `animation-delay:${ty.end + 180}ms` });
    y += 56;
    time = ty.end + 750;
  }
  out += t(X, y - 2, '$', size, { fill: C.mag, weight: 700, cls: 'in', style: `animation-delay:${time}ms` });
  out += `<g class="in" style="animation-delay:${time}ms"><rect class="blink" x="${X + 20}" y="${y - 17}" width="10" height="19" fill="${C.cyan}"/></g>`;

  const body = `
<rect width="${W}" height="48" fill="${C.panel}"/>
<path d="M0 48H${W}" stroke="${C.line}"/>
<circle cx="34" cy="24" r="6" fill="${C.mag}"/><circle cx="56" cy="24" r="6" fill="${C.yel}"/><circle cx="78" cy="24" r="6" fill="${C.grn}"/>
${t(W / 2, 29, 'pratyush@vit-chennai: ~', 13, { fill: C.dim, ls: 1, anchor: 'middle' })}
${t(W - 34, 29, 'ZSH', 12, { fill: C.faint, ls: 2, anchor: 'end' })}
${out}`;
  write('terminal.svg', svg(W, H, 'About, as a terminal session', blocks.map(([c, r]) => `${c}: ${r}`).join('. '), '', body));
}

// ---------- section headers ----------

function header(file, num, title, note) {
  const W = 1200, H = 64;
  const tx = 104, tEnd = tx + tw(title, 20, 4);
  const nx = W - 40 - tw(note, 12, 2);
  const css = `.ln{stroke-dasharray:6 10;animation:ln 1.2s linear infinite}@keyframes ln{to{stroke-dashoffset:-16}}`;
  const body = `
${t(40, 40, num, 20, { fill: C.mag, weight: 700 })}
${t(72, 40, '//', 20, { fill: C.faint })}
${t(tx, 40, title, 20, { ls: 4, weight: 700 })}
<path class="ln" d="M${n(tEnd + 20)} 33H${n(nx - 24)}" stroke="${C.cyan}" stroke-width="1.5" opacity=".7"/>
${t(nx, 37, note, 12, { fill: C.dim, ls: 2 })}`;
  write(file, svg(W, H, title, note, css, body, { rx: 12 }));
}

// ---------- project cards ----------

const GLYPH_ART = {
  radar: (c) => `<g transform="translate(55 40)">
<circle r="36" fill="none" stroke="${C.faint}"/><circle r="22" fill="none" stroke="${C.faint}"/><circle r="8" fill="none" stroke="${C.faint}"/>
<path d="M-36 0H36M0 -36V36" stroke="${C.faint}" stroke-width=".8"/>
<g style="transform-origin:0 0;animation:spin 3.6s linear infinite"><path d="M0 0L36 0A36 36 0 0 0 25.5 -25.5Z" fill="${c}" opacity=".28"/><path d="M0 0H36" stroke="${c}" stroke-width="2"/></g>
<circle class="pulse" cx="16" cy="-12" r="3" fill="${C.mag}"/><circle class="pulse" cx="-20" cy="14" r="2.5" fill="${C.mag}" style="animation-delay:1.1s"/>
</g>`,
  bars: (c) =>
    `<g transform="translate(8 74)"><path d="M-2 .5H98" stroke="${C.faint}"/>` +
    [38, 62, 30, 70, 48, 58]
      .map(
        (h, i) =>
          `<rect x="${i * 16}" y="${-h}" width="10" height="${h}" fill="${i === 3 ? C.mag : c}" opacity="${i === 3 ? 1 : 0.75}" style="transform-origin:0 0;animation:bar ${2 + (i % 3) * 0.5}s ${i * 0.18}s ease-in-out infinite alternate"/>`
      )
      .join('') +
    '</g>',
  ecg: (c) => {
    const d = 'M0 44H22L28 34L34 44H44L50 10L58 70L64 44H78L84 36L90 44H110';
    return `<path d="M0 44H110" stroke="${C.faint}" stroke-dasharray="2 5"/><path d="${d}" fill="none" stroke="${C.faint}" stroke-width="1.5"/>
<path d="${d}" fill="none" stroke="${c}" stroke-width="2.5" pathLength="1" stroke-dasharray=".3 .7" stroke-dashoffset="1" style="animation:dash 2.2s linear infinite"/>`;
  },
  impact: (c) =>
    `<g transform="translate(55 40)">` +
    [0, 0.8, 1.6]
      .map((dl) => `<circle r="36" fill="none" stroke="${c}" stroke-width="1.6" style="transform-origin:0 0;animation:ring 2.4s ${dl}s ease-out infinite;opacity:0"/>`)
      .join('') +
    `<circle r="5" fill="${C.mag}"/><path d="M-46 0H-12M12 0H46" stroke="${C.faint}"/></g>`,
  rover: (c) => {
    const p = 'M6 64C30 64 26 20 52 20S76 60 104 56';
    return `<path d="${p}" fill="none" stroke="${C.faint}" stroke-width="1.5" stroke-dasharray="3 6"/>
<circle cx="6" cy="64" r="3" fill="${C.faint}"/><path d="M99 51l10 10M109 51l-10 10" stroke="${C.mag}" stroke-width="2"/>
<g><rect x="-7" y="-5" width="14" height="10" rx="2" fill="${c}"/><animateMotion dur="5s" repeatCount="indefinite" rotate="auto" path="${p}"/></g>`;
  },
  browser: (c) => `<rect x="4" y="6" width="102" height="68" rx="5" fill="none" stroke="${C.faint}" stroke-width="1.5"/>
<path d="M4 22H106" stroke="${C.faint}"/><circle cx="14" cy="14" r="2.5" fill="${C.mag}"/><circle cx="23" cy="14" r="2.5" fill="${C.yel}"/><circle cx="32" cy="14" r="2.5" fill="${C.grn}"/>
<rect class="pulse" x="14" y="32" width="50" height="6" fill="${c}"/><rect class="pulse" x="14" y="44" width="78" height="4" fill="${C.faint}" style="animation-delay:.5s"/>
<rect class="pulse" x="14" y="54" width="62" height="4" fill="${C.faint}" style="animation-delay:1s"/>`
};

function card(p, i) {
  const W = 584, H = 304, X = 30;
  const c = i % 2 ? C.mag : C.cyan;
  const per = 2 * (W + H);
  const css = `
.tr{stroke-dasharray:140 ${per};animation:tr 7s ${-i * 1.1}s linear infinite}
@keyframes tr{from{stroke-dashoffset:${per + 140}}to{stroke-dashoffset:0}}
@keyframes bar{from{transform:scaleY(.35)}to{transform:scaleY(1)}}
@keyframes ring{0%{transform:scale(.15);opacity:1}100%{transform:scale(1);opacity:0}}`;

  const sw = tw(p.status, 11, 1.5) + 34;
  const lines = wrap(p.desc, 57);
  if (lines.length > 3) throw new Error(`description too long for card: ${p.name}`);

  let tx = X, tags = '';
  for (const tag of p.tags) {
    const w = tw(tag, 11, 1) + 16;
    if (tx + w > W - 160) break;
    tags += `<rect x="${n(tx)}" y="246" width="${n(w)}" height="24" rx="4" fill="none" stroke="${C.line}" stroke-width="1.2"/>${t(tx + 8, 262, tag, 11, { fill: C.dim, ls: 1 })}`;
    tx += w + 8;
  }
  const cta = p.cta;

  const body = `
<defs><radialGradient id="g" cx="88%" cy="8%" r="70%"><stop stop-color="${c}" stop-opacity=".13"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="url(#dots)" opacity=".6"/>
<rect width="${W}" height="${H}" fill="url(#g)"/>
<rect class="tr" x="1.5" y="1.5" width="${W - 3}" height="${H - 3}" rx="13" fill="none" stroke="${c}" stroke-width="2"/>
${t(X, 46, String(i + 1).padStart(2, '0'), 14, { fill: c, weight: 700 })}
<rect x="${X + 30}" y="29" width="${n(sw)}" height="24" rx="12" fill="none" stroke="${p.live ? C.grn : C.line}" stroke-width="1.2"/>
<circle class="pulse" cx="${X + 44}" cy="41" r="3.5" fill="${p.live ? C.grn : p.wip ? C.yel : C.faint}"/>
${t(X + 54, 45, p.status, 11, { fill: p.live ? C.grn : C.dim, ls: 1.5 })}
<g transform="translate(446 26)">${GLYPH_ART[p.art](c)}</g>
${t(X, 100, p.name, 30, { weight: 700, ls: 1 })}
${t(X, 126, p.kicker, 12, { fill: c, ls: 2.5 })}
${lines.map((l, k) => t(X, 160 + k * 23, l, 14.5, { fill: C.dim })).join('\n')}
${tags}
${t(W - X, 263, cta, 12, { fill: p.href ? C.text : C.faint, ls: 2, weight: 700, anchor: 'end' })}`;
  write(`card-${p.slug}.svg`, svg(W, H, `${p.name}: ${p.kicker}`, p.desc, css, body));
}

const PROJECTS = [
  {
    slug: 'argus', name: 'ARGUS', kicker: 'FINANCIAL FRAUD INTELLIGENCE', art: 'radar', status: 'PUBLIC', cta: 'VIEW CODE >>',
    href: 'https://github.com/pratyushdeosingh/ARGUS_CSI',
    desc: 'Ingests payments, flags suspicious money movement with rules and a graph model, and streams explainable risk scores to a live analyst dashboard.',
    tags: ['PYTHON', 'TYPESCRIPT', 'GRAPH ML', 'WEBSOCKETS', 'DOCKER']
  },
  {
    slug: 'pratin', name: 'PRATIN', kicker: 'AGENTIC INVOICE FINANCING', art: 'bars', status: 'PUBLIC', cta: 'VIEW CODE >>',
    href: 'https://github.com/pratyushdeosingh/PRATIN',
    desc: 'Reads an invoice PDF, runs explainable risk checks, then lets autonomous capital-provider agents price, rank and settle offers.',
    tags: ['PYTHON', 'REACT', 'AI AGENTS', 'DOCKER']
  },
  {
    slug: 'care', name: 'CARE CONTINUUM', kicker: 'TELEMEDICINE + EHR', art: 'ecg', status: 'LIVE DEMO', live: true, cta: 'VIEW CODE >>',
    href: 'https://github.com/pratyushdeosingh/telemedicine-consultation-ehr-system',
    desc: 'Health records across 18 Oracle tables, with PL/SQL triggers that reject allergy-conflicting medicines and a Cassandra patient timeline.',
    tags: ['REACT', 'EXPRESS', 'ORACLE', 'PL/SQL', 'CASSANDRA']
  },
  {
    slug: 'helmet', name: 'SAFETY HELMET', kicker: 'IOT CRASH DETECTION', art: 'impact', status: 'PUBLIC', cta: 'VIEW CODE >>',
    href: 'https://github.com/pratyushdeosingh/mdp',
    desc: 'Detects crashes with an MPU6050 motion sensor and fires a cancellable emergency alert, streaming GPS and motion data to a real-time dashboard.',
    tags: ['ARDUINO', 'C++', 'REACT', 'NODE.JS']
  },
  {
    slug: 'rover', name: 'HAZARD ROVER', kicker: 'INSPECTION ROBOTICS', art: 'rover', status: 'IN PROGRESS', wip: true, cta: 'PRIVATE REPO',
    href: null,
    desc: 'Team inspection rover: ESP32 control, hazard sensing, live telemetry and vision development, from prototype through final review.',
    tags: ['ESP32', 'PYTHON', 'TELEMETRY', 'VISION']
  },
  {
    slug: 'portfolio', name: 'PORTFOLIO', kicker: 'PERSONAL SITE', art: 'browser', status: 'LIVE', live: true, cta: 'VISIT SITE >>',
    href: 'https://pratyushdeosingh.vercel.app',
    desc: 'A fast, responsive site built with Next.js, React and Tailwind CSS, with an interactive canvas background and scroll-driven motion.',
    tags: ['NEXT.JS', 'REACT', 'TAILWIND', 'CANVAS']
  }
];

// ---------- live activity ----------

async function fetchData() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) return null;
  const query = `query($login:String!){user(login:$login){
repositories(first:100,ownerAffiliations:OWNER,isFork:false,privacy:PUBLIC){totalCount nodes{languages(first:10,orderBy:{field:SIZE,direction:DESC}){edges{size node{name}}}}}
contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'profile-readme-build' },
    body: JSON.stringify({ query, variables: { login: LOGIN } })
  });
  const json = await res.json();
  if (!res.ok || json.errors || !json.data?.user) throw new Error('GitHub API error: ' + JSON.stringify(json.errors || json));
  return json.data.user;
}

function activity(user) {
  const W = 1200, H = 344;
  const cal = user.contributionsCollection.contributionCalendar;
  const weeks = cal.weeks.slice(-53);
  const days = weeks.flatMap((w) => w.contributionDays);

  let longest = 0, run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) current++;
    else if (i === days.length - 1) continue; // today may simply not have happened yet
    else break;
  }

  const LEVEL = { NONE: '#15121f', FIRST_QUARTILE: '#5c1a3a', SECOND_QUARTILE: C.mag, THIRD_QUARTILE: C.vio, FOURTH_QUARTILE: C.cyan };
  const X0 = 40, Y0 = 104, CELL = 13, STEP = 17;
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  let cells = '', labels = '', lastMonth = -1, lastLabelCol = -9;
  weeks.forEach((w, col) => {
    const first = new Date(w.contributionDays[0].date + 'T00:00:00Z');
    const m = first.getUTCMonth();
    if (m !== lastMonth) {
      if (col - lastLabelCol >= 3 && col < weeks.length - 1) {
        labels += t(X0 + col * STEP, Y0 - 12, MONTHS[m], 11, { fill: C.faint, ls: 1.5 });
        lastLabelCol = col;
      }
      lastMonth = m;
    }
    let colCells = '';
    for (const d of w.contributionDays) {
      const row = new Date(d.date + 'T00:00:00Z').getUTCDay();
      colCells += `<rect x="${X0 + col * STEP}" y="${Y0 + row * STEP}" width="${CELL}" height="${CELL}" rx="3" fill="${LEVEL[d.contributionLevel]}"/>`;
    }
    cells += `<g class="fade" style="animation-delay:${200 + col * 28}ms">${colCells}</g>`;
  });
  const gridW = weeks.length * STEP - (STEP - CELL);

  // languages
  const sizes = new Map();
  for (const repo of user.repositories.nodes)
    for (const e of repo.languages.edges) sizes.set(e.node.name, (sizes.get(e.node.name) || 0) + e.size);
  const total = [...sizes.values()].reduce((a, b) => a + b, 0) || 1;
  const sorted = [...sizes.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, 5).map(([name, size]) => ({ name, pct: (size / total) * 100 }));
  const rest = 100 - top.reduce((a, l) => a + l.pct, 0);
  if (rest > 0.05) top.push({ name: 'Other', pct: rest });
  const PAL = [C.cyan, C.mag, C.vio, C.yel, C.grn, C.faint];
  const BY = 252;
  let bx = X0, bar = '', legend = '', lx = X0;
  top.forEach((l, i) => {
    const w = (l.pct / 100) * gridW;
    bar += `<rect x="${n(bx)}" y="${BY}" width="${n(Math.max(w - 3, 1))}" height="10" rx="2" fill="${PAL[i]}"/>`;
    bx += w;
    const label = `${l.name.toUpperCase()} ${l.pct.toFixed(1)}%`;
    legend += `<rect x="${n(lx)}" y="${BY + 29}" width="9" height="9" rx="2" fill="${PAL[i]}"/>${t(lx + 16, BY + 38, label, 12, { fill: C.dim, ls: 1 })}`;
    lx += 16 + tw(label, 12, 1) + 26;
  });

  const stats = [
    [String(cal.totalContributions), 'CONTRIBUTIONS / 12 MO', C.cyan],
    [`${current} ${current === 1 ? 'DAY' : 'DAYS'}`, 'CURRENT STREAK', C.mag],
    [`${longest} ${longest === 1 ? 'DAY' : 'DAYS'}`, 'LONGEST STREAK', C.vio],
    [String(user.repositories.totalCount), 'PUBLIC REPOS', C.yel]
  ];
  const SX = 986;
  const statSvg = stats
    .map(([v, l, col], i) => {
      const y = 88 + i * 60;
      return `<rect x="${SX}" y="${y - 24}" width="3" height="42" fill="${col}"/>
${t(SX + 16, y, v, 26, { weight: 700, cls: 'fade', style: `animation-delay:${600 + i * 200}ms` })}
${t(SX + 16, y + 18, l, 10.5, { fill: C.dim, ls: 1.5 })}`;
    })
    .join('\n');

  const body = `
<defs><radialGradient id="g" cx="100%" cy="0%" r="60%"><stop stop-color="${C.vio}" stop-opacity=".14"/><stop offset="1" stop-color="${C.vio}" stop-opacity="0"/></radialGradient></defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>
<circle class="pulse" cx="45" cy="45" r="4.5" fill="${C.mag}"/>
${t(60, 50, 'LIVE FEED', 12, { fill: C.mag, ls: 2, weight: 700 })}
${t(160, 50, 'CONTRIBUTION SIGNAL, LAST 12 MONTHS', 12, { fill: C.dim, ls: 2 })}
<path d="M40 66H${X0 + gridW}" stroke="${C.line}"/>
${labels}
${cells}
${t(X0, BY - 10, 'LANGUAGES BY CODE SIZE, PUBLIC REPOS', 11, { fill: C.faint, ls: 1.5 })}
${bar}
${legend}
<path d="M${SX - 24} 40V${H - 40}" stroke="${C.line}"/>
${statSvg}
${t(W - 40, H - 22, 'REFRESHED DAILY BY GITHUB ACTIONS', 10, { fill: C.faint, ls: 1.5, anchor: 'end' })}`;
  write(
    'activity.svg',
    svg(W, H, 'GitHub activity', `${cal.totalContributions} contributions in the last 12 months. Current streak ${current} days, longest ${longest} days. ${user.repositories.totalCount} public repositories.`, '', body)
  );
}

// ---------- footer ----------

function footer() {
  const W = 1200, H = 150;
  const wave = (amp, period, y) => {
    let d = `M0 ${y}`;
    for (let x = 0; x < W + period * 2; x += period) d += `q${period / 4} ${-amp} ${period / 2} 0t${period / 2} 0`;
    return d;
  };
  const css = `
.w1{animation:w1 5s linear infinite}.w2{animation:w2 8s linear infinite}.w3{animation:w3 13s linear infinite}
@keyframes w1{to{transform:translateX(-160px)}}@keyframes w2{to{transform:translateX(-240px)}}@keyframes w3{to{transform:translateX(-360px)}}`;
  const msg = 'CURRENTLY EXPLORING BETTER INTERFACES AND THE SYSTEMS BEHIND THEM.';
  const end = '// END OF TRANSMISSION';
  const ex = W / 2 - tw(end, 12, 3) / 2;
  const body = `
<path class="w3" d="${wave(26, 360, 52)}" fill="none" stroke="${C.vio}" stroke-width="1.2" opacity=".5"/>
<path class="w2" d="${wave(18, 240, 52)}" fill="none" stroke="${C.mag}" stroke-width="1.5" opacity=".8"/>
<path class="w1" d="${wave(11, 160, 52)}" fill="none" stroke="${C.cyan}" stroke-width="1.8"/>
${t(W / 2, 108, msg, 14, { fill: C.text, ls: 2.5, anchor: 'middle' })}
${t(ex, 132, end, 12, { fill: C.faint, ls: 3 })}
<rect class="blink" x="${n(ex + tw(end, 12, 3) + 6)}" y="121" width="8" height="13" fill="${C.mag}"/>`;
  write('footer.svg', svg(W, H, 'Footer', msg, css, body));
}

// ---------- run ----------

mkdirSync(OUT, { recursive: true });
hero();
button('btn-portfolio.svg', 'PORTFOLIO', C.cyan);
button('btn-linkedin.svg', 'LINKEDIN', C.mag);
button('btn-leetcode.svg', 'LEETCODE', C.cyan);
button('btn-email.svg', 'EMAIL', C.mag);
stack();
terminal();
header('h-builds.svg', '01', 'SELECTED BUILDS', `${PROJECTS.length} ENTRIES`);
header('h-signal.svg', '02', 'SIGNAL', 'LIVE GITHUB DATA');
PROJECTS.forEach(card);
footer();

const user = await fetchData();
if (user) activity(user);
else console.log('GITHUB_TOKEN not set: kept the existing assets/activity.svg');
