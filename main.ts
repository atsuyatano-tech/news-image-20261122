// THE SUNDAY ORBIT - a hand-drawn-style newspaper front page for
// Sunday, November 22, 2026, drawn entirely by this program.
// Node standard library only. Deterministic: fixed seed, no clock,
// no network, no randomness beyond a seeded LCG, so two runs write
// the same bytes.

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ----------------------------------------------------------------
// Canvas
// ----------------------------------------------------------------
const W = 1000;
const H = 1000;
const px = new Uint8Array(W * H * 3);

const PAPER: [number, number, number] = [247, 241, 226];
const INK: [number, number, number] = [26, 22, 17];
const RED: [number, number, number] = [168, 44, 36];
const BLUE: [number, number, number] = [38, 70, 110];
const GOLD: [number, number, number] = [198, 142, 32];
const GREY: [number, number, number] = [110, 102, 88];

function setPx(x: number, y: number, c: [number, number, number]): void {
  const xi = Math.round(x);
  const yi = Math.round(y);
  if (xi < 0 || yi < 0 || xi >= W || yi >= H) return;
  const i = (yi * W + xi) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  for (let yy = Math.round(y); yy < Math.round(y + h); yy++)
    for (let xx = Math.round(x); xx < Math.round(x + w); xx++) setPx(xx, yy, c);
}

// Seeded LCG so the hand-drawn jitter is identical on every run.
let seed = 20261122;
function rnd(): number {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}

function line(x0: number, y0: number, x1: number, y1: number, c: [number, number, number], thick = 1): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let s = 0; s <= steps; s++) {
    const x = x0 + ((x1 - x0) * s) / steps;
    const y = y0 + ((y1 - y0) * s) / steps;
    for (let t = 0; t < thick; t++) setPx(x + t, y, c);
  }
}

// A slightly wobbly hand-inked rule.
function rule(x0: number, y: number, x1: number, c: [number, number, number], thick = 2): void {
  for (let x = x0; x <= x1; x++) {
    const off = Math.round((rnd() - 0.5) * 1.4);
    for (let t = 0; t < thick; t++) setPx(x, y + off + t, c);
  }
}

function box(x: number, y: number, w: number, h: number, c: [number, number, number], thick = 2): void {
  fillRect(x, y, w, thick, c);
  fillRect(x, y + h - thick, w, thick, c);
  fillRect(x, y, thick, h, c);
  fillRect(x + w - thick, y, thick, h, c);
}

function circle(cx: number, cy: number, r: number, c: [number, number, number], thick = 2): void {
  for (let a = 0; a < Math.PI * 2; a += 0.004) {
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    for (let t = 0; t < thick; t++) setPx(x + t, y, c);
  }
}

function fillCircle(cx: number, cy: number, r: number, c: [number, number, number]): void {
  for (let y = -r; y <= r; y++)
    for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) setPx(cx + x, cy + y, c);
}

// ----------------------------------------------------------------
// 5x7 pixel font (uppercase newspaper style)
// ----------------------------------------------------------------
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", ".#.#.", "..#..", "..#..", "..#..", ".#.#.", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", "#####"],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  "'": ["..#..", "..#..", "..#..", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  "%": ["##..#", "##.#.", "....#", "...#.", "..#..", ".#...", "#.###"],
  $: ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "(": ["...##", "..#..", ".#...", ".#...", ".#...", "..#..", "...##"],
  ")": ["##...", "..#..", "...#.", "...#.", "...#.", "..#..", "##..."],
  '"': [".#.#.", ".#.#.", ".....", ".....", ".....", ".....", "....."],
};

function textWidth(text: string, scale: number): number {
  return text.length * 6 * scale - scale;
}

function drawText(
  x: number,
  y: number,
  text: string,
  scale: number,
  c: [number, number, number],
  bold = false,
): void {
  const up = text.toUpperCase();
  for (let i = 0; i < up.length; i++) {
    const glyph = FONT[up[i]] ?? FONT[" "];
    for (let gy = 0; gy < 7; gy++)
      for (let gx = 0; gx < 5; gx++)
        if (glyph[gy][gx] === "#") {
          fillRect(x + i * 6 * scale + gx * scale, y + gy * scale, scale, scale, c);
          if (bold) fillRect(x + i * 6 * scale + gx * scale + Math.max(1, scale - 1), y + gy * scale, scale, scale, c);
        }
  }
}

function drawCentered(cx: number, y: number, text: string, scale: number, c: [number, number, number], bold = false): void {
  drawText(cx - textWidth(text, scale) / 2, y, text, scale, c, bold);
}

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur === "") cur = w;
    else if (cur.length + 1 + w.length <= maxChars) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function body(x: number, y: number, text: string, maxChars: number, lineH: number): number {
  const lines = wrap(text, maxChars);
  for (let i = 0; i < lines.length; i++) drawText(x, y + i * lineH, lines[i], 2, INK);
  return y + lines.length * lineH;
}

// ----------------------------------------------------------------
// Paper
// ----------------------------------------------------------------
fillRect(0, 0, W, H, PAPER);
for (let i = 0; i < 2600; i++) {
  const x = Math.floor(rnd() * W);
  const y = Math.floor(rnd() * H);
  setPx(x, y, [236, 228, 205]);
}
box(10, 10, W - 20, H - 20, INK, 4);
box(20, 20, W - 40, H - 40, INK, 1);

// ----------------------------------------------------------------
// Masthead
// ----------------------------------------------------------------
drawCentered(500, 34, "ALL THE WORLD IN ONE PAGE", 2, GREY);
drawCentered(500, 58, "THE SUNDAY ORBIT", 7, INK, true);
rule(36, 122, 964, INK, 3);
drawText(36, 132, "SUNDAY EDITION", 2, INK);
drawCentered(500, 130, "SUNDAY, NOVEMBER 22, 2026", 3, RED, true);
const volW = textWidth("VOL. 1 - NO. 22", 2);
drawText(964 - volW, 132, "VOL. 1 - NO. 22", 2, INK);
rule(36, 158, 964, INK, 1);
rule(36, 162, 964, INK, 3);

// ----------------------------------------------------------------
// Lead story: COP31, Antalya
// ----------------------------------------------------------------
drawText(36, 178, "CLIMATE - ANTALYA, TURKIYE", 2, RED, true);
drawText(36, 202, "CLIMATE TALKS GO", 6, INK, true);
drawText(36, 252, "INTO OVERTIME", 6, INK, true);
drawText(36, 306, "COP31 NEARS A FINAL DEAL AS THE FOSSIL FUEL", 2, BLUE, true);
drawText(36, 328, "ROW RUMBLES ON INTO SUNDAY MORNING", 2, BLUE, true);
body(
  36,
  356,
  "ANTALYA - NEGOTIATORS AT THE UN CLIMATE SUMMIT WORKED THROUGH SATURDAY NIGHT AND INTO SUNDAY MORNING AFTER THE COP31 PRESIDENCY TABLED A NEW PACKAGE IT SAYS EVERY PARTY CAN ACCEPT. THE TALKS RAN PAST THEIR FRIDAY DEADLINE. THE LAST FIGHT IS OVER WORDS: ONE DRAFT DROPPED ALL MENTION OF COAL, OIL AND GAS, AND A BLOC OF NATIONS DEMANDED THE FINAL TEXT PROMISE A MOVE AWAY FROM FOSSIL FUELS.",
  51,
  19,
);

// Lead illustration: sun, thermometer and a factory skyline.
box(664, 202, 300, 218, INK, 2);
fillCircle(724, 262, 26, GOLD);
for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
  line(724 + Math.cos(a) * 34, 262 + Math.sin(a) * 34, 724 + Math.cos(a) * 46, 262 + Math.sin(a) * 46, GOLD, 3);
}
// factory blocks
fillRect(676, 356, 52, 52, INK);
fillRect(736, 340, 40, 68, INK);
fillRect(784, 362, 58, 46, INK);
fillRect(700, 322, 10, 34, INK);
fillRect(756, 306, 10, 34, INK);
// smoke curls
circle(705, 306, 8, GREY, 2);
circle(761, 290, 10, GREY, 2);
circle(720, 288, 6, GREY, 2);
// thermometer
fillRect(884, 240, 16, 130, INK);
fillCircle(892, 386, 20, RED);
fillRect(889, 268, 10, 112, RED);
for (let i = 0; i < 5; i++) fillRect(872, 252 + i * 26, 12, 3, INK);
line(676, 408, 952, 408, INK, 2);
drawCentered(814, 428, "THE HEAT IS ON IN ANTALYA", 1, GREY);

rule(36, 516, 964, INK, 2);

// ----------------------------------------------------------------
// Middle band: two columns
// ----------------------------------------------------------------
fillRect(499, 526, 2, 254, INK);

// Left: credit card cap
drawText(36, 526, "MONEY - WASHINGTON", 2, RED, true);
drawText(36, 552, "TRUMP VOWS 10% CAP", 3, INK, true);
drawText(36, 582, "ON CARD RATES", 3, INK, true);
body(
  36,
  620,
  "WASHINGTON - PRESIDENT TRUMP SAID SATURDAY HE WOULD WORK WITH THE INCOMING DEMOCRATIC CONGRESS TO CAP CARD RATES AT 10%, REVIVING A 2024 PLEDGE. \"THESE CREDIT CARD COMPANIES HAVE MADE A LOT,\" HE TOLD FOX NEWS. SENATOR WARREN REPLIED: \"LET'S CAP RATES AND SAVE AMERICANS MONEY.\" A 10% CAP COULD SAVE $100 BILLION A YEAR.",
  38,
  19,
);

// Right: AUKUS
drawText(516, 526, "DEFENCE - SYDNEY", 2, RED, true);
drawText(516, 552, "AUSTRALIA TELLS US:", 3, INK, true);
drawText(516, 582, "\"WRONG\" ON AUKUS SUBS", 3, INK, true);
body(
  516,
  620,
  "SYDNEY - DEFENCE MINISTER RICHARD MARLES ON SUNDAY REJECTED A US CONGRESSIONAL BUDGET OFFICE REPORT WARNING THAT SELLING VIRGINIA-CLASS SUBMARINES TO AUSTRALIA COULD SHRINK THE US NAVY'S ATTACK FLEET THROUGH 2060. \"THEY ARE WRONG,\" HE SAID, ADDING AUKUS IS \"VERY MUCH HAPPENING\" AND PRODUCTION IS RISING.",
  37,
  19,
);

rule(36, 792, 964, INK, 2);

// ----------------------------------------------------------------
// Bottom band: sketch map + sport + numbers
// ----------------------------------------------------------------
drawText(36, 802, "WHERE TODAY HAPPENED", 2, RED, true);

// Sketch world map, equirectangular, dot style. Land is listed as
// [row, firstCol, lastCol] spans on an 84 x 32 grid (col ~4.3 deg of
// longitude, row ~5.6 deg of latitude). Stylised, not to scale.
const MAP_SPANS: [number, number, number][] = [
  [0, 16, 22], [0, 32, 36],
  [1, 13, 27], [1, 31, 38], [1, 56, 60], [1, 66, 70],
  [2, 2, 9], [2, 12, 29], [2, 31, 37], [2, 47, 82],
  [3, 3, 11], [3, 13, 30], [3, 33, 36], [3, 44, 47], [3, 48, 82],
  [4, 4, 11], [4, 14, 31], [4, 37, 38], [4, 44, 49], [4, 50, 81],
  [5, 14, 30], [5, 40, 41], [5, 44, 47], [5, 48, 79],
  [6, 15, 29], [6, 40, 41], [6, 43, 50], [6, 51, 76],
  [7, 14, 28], [7, 42, 51], [7, 53, 55], [7, 56, 74],
  [8, 13, 27], [8, 41, 46], [8, 48, 55], [8, 56, 73], [8, 74, 76],
  [9, 13, 26], [9, 39, 49], [9, 50, 55], [9, 56, 60], [9, 61, 71], [9, 71, 72], [9, 73, 75],
  [10, 13, 24], [10, 38, 51], [10, 50, 54], [10, 58, 62], [10, 63, 70],
  [11, 13, 20], [11, 37, 51], [11, 49, 53], [11, 58, 61], [11, 63, 66], [11, 70, 71],
  [12, 14, 18], [12, 37, 52], [12, 59, 60], [12, 63, 66], [12, 70, 71],
  [13, 15, 17], [13, 38, 52], [13, 51, 53], [13, 63, 66], [13, 68, 72],
  [14, 23, 29], [14, 39, 51], [14, 64, 66], [14, 68, 70], [14, 72, 75],
  [15, 24, 32], [15, 41, 49], [15, 64, 76],
  [16, 24, 33], [16, 42, 49], [16, 66, 78],
  [17, 25, 33], [17, 43, 50], [17, 72, 78], [17, 76, 77],
  [18, 26, 34], [18, 43, 51], [18, 50, 51], [18, 67, 78],
  [19, 26, 34], [19, 44, 51], [19, 50, 51], [19, 66, 78],
  [20, 27, 33], [20, 44, 50], [20, 66, 77],
  [21, 27, 32], [21, 45, 49], [21, 67, 76],
  [22, 28, 31], [22, 45, 47], [22, 68, 75], [22, 81, 82],
  [23, 28, 30], [23, 80, 82],
  [24, 28, 29],
  [25, 28, 29],
];
const MAP_X = 36;
const MAP_Y = 824;
const DX = 6;
const DY = 4;
for (const [r, c0, c1] of MAP_SPANS) {
  for (let c = c0; c <= c1; c++) fillRect(MAP_X + c * DX, MAP_Y + r * DY, 4, 3, BLUE);
}
function marker(lon: number, lat: number, label: string, pos: "left" | "right" | "above" | "below"): void {
  const cx = MAP_X + ((lon + 180) / 360) * 84 * DX;
  const cy = MAP_Y + ((90 - lat) / 180) * 32 * DY;
  const tw = textWidth(label, 1);
  let lx = cx + 9;
  let ly = cy - 4;
  if (pos === "left") lx = cx - 9 - tw;
  if (pos === "above") {
    lx = cx - tw / 2;
    ly = cy - 17;
  }
  if (pos === "below") {
    lx = cx - tw / 2;
    ly = cy + 10;
  }
  fillRect(lx - 2, ly - 1, tw + 4, 9, PAPER); // halo so the label reads over the dots
  fillCircle(cx, cy, 5, RED);
  fillCircle(cx, cy, 2, PAPER);
  drawText(lx, ly, label, 1, RED, true);
}
marker(30.7, 36.9, "ANTALYA", "right");
marker(-77.0, 38.9, "WASHINGTON", "above");
marker(-115.1, 36.2, "LAS VEGAS", "below");
marker(149.1, -35.3, "CANBERRA", "left");

// Sport box
box(560, 802, 404, 92, INK, 2);
drawText(576, 812, "TONIGHT ON THE STRIP - SPORT", 2, RED, true);
drawText(576, 836, "LAS VEGAS GRAND PRIX, 04:00 GMT.", 2, INK);
drawText(576, 856, "VERSTAPPEN ON POLE, 50 LAPS.", 2, INK);
drawText(576, 876, "ANTONELLI LEADS TITLE BY 111 PTS.", 2, INK);

// Numbers box
box(560, 906, 404, 52, INK, 2);
drawText(576, 916, "THE DAY IN NUMBERS", 2, RED, true);
drawText(576, 938, "200 DELEGATIONS - $100BN - 2060", 2, INK);

// Footer
drawCentered(500, 966, "DRAWN BY CODE - EVERY STORY CHECKED AGAINST TWO OR MORE WIRE REPORTS", 1, GREY);

// ----------------------------------------------------------------
// PNG encode (deterministic: filter 0, fixed compression level)
// ----------------------------------------------------------------
const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // colour type RGB
const raw = Buffer.alloc(H * (1 + W * 3));
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0;
  Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.png"), png);
console.log(`wrote ${join(outDir, "entry.png")} (${png.length} bytes)`);
