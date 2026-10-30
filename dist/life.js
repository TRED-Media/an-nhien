import { newActivities, items } from "./economy.js";
export const gardenStations = newActivities.map((a, i) => ({
  ...a,
  name: a.title,
  x: i % 2 ? 650 : 250,
  y: 660 + Math.floor(i / 2) * 120,
  r: 65,
  stand: { x: i % 2 ? 650 : 250, y: 700 + Math.floor(i / 2) * 120 },
}));
export const marketSpots = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  x: 150 + (i % 5) * 150,
  y: i < 5 ? 760 : 1040,
  stand: { x: 150 + (i % 5) * 150, y: i < 5 ? 835 : 1115 },
}));
export function lifeBlocked(map, x, y) {
  if (x < 90 || x > 870 || y < 620 || y > 1240) return true;
  return (
    map === "market" &&
    marketSpots.some(
      (s) => Math.abs(x - s.x) < 51 && y > s.y - 36 && y < s.y + 24,
    )
  );
}
export function drawLife() {
  const c = this.ctx;
  c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  const gradient = c.createLinearGradient(0, 0, 0, this.h);
  gradient.addColorStop(0, "#91d9da");
  gradient.addColorStop(1, "#8bc96a");
  c.fillStyle = gradient;
  c.fillRect(0, 0, this.w, this.h);
  c.save();
  c.translate(this.ox, this.oy);
  c.scale(this.scale, this.scale);
  
  this.path(
    [
      [-100, 430],
      [1000, 430],
      [1000, 1400],
      [-100, 1400],
    ],
    "#8bc96a",
  );
  this.tree(100, 425, 0.9, "#418a57");
  this.tree(790, 425, 0.9, "#e79e75");
  this.rounded(285, 295, 330, 130, 15, "#e8cc95");
  this.path(
    [
      [245, 310],
      [330, 245],
      [570, 245],
      [655, 310],
    ],
    "#b96047",
    "#f0d19c",
  );
  this.rounded(410, 340, 80, 85, 8, "#96734c");
  this.rounded(320, 338, 55, 43, 7, "#bad1ac");
  this.rounded(525, 338, 55, 43, 7, "#bad1ac");
  this.text(
    this.map === "market" ? "🧺 QUÁN CHỢ" : "🌻 NHÀ VƯỜN",
    450,
    284,
    21,
    "#fff0ce",
  );
  this.rounded(
    55,
    450,
    790,
    830,
    45,
    "#8bc96a",
  );
  this.rounded(95, 490, 710, 95, 20, "#386b50", "#e8d5a1");
  this.text(
    this.map === "market"
      ? "CHỢ AN NHIÊN · 10 SẠP"
      : "VƯỜN VUI · MỖI NGÀY MỘT NGHỀ",
    450,
    525,
    25,
    "#fff0c5",
  );
  this.text(
    this.map === "market"
      ? "Buôn có bạn · Bán có duyên"
      : "Gom niềm vui, đầy túi nhỏ",
    450,
    560,
    18,
    "#d3e6b5",
  );
  this.tree(30, 620, 0.65, "#418a57");
  this.tree(875, 610, 0.65, "#e79e75");
  if (this.map === "market") {
    for (const spot of marketSpots) {
      const s = this.marketSlots?.find((s) => s.id === spot.id),
        x = spot.x,
        y = spot.y,
        color = s?.owner ? "#c97754" : "#8ca77c";
      this.shadow(x, y + 20, 65, 20);
      this.rounded(x - 58, y - 60, 116, 88, 8, "#bb8857");
      this.rounded(x - 64, y - 134, 128, 24, 6, color);
      this.path(
        [
          [x - 52, y - 165],
          [x + 52, y - 165],
          [x + 68, y - 130],
          [x - 68, y - 130],
        ],
        color,
        "#f8deaa",
      );
      for (let i = 0; i < 4; i++)
        this.path(
          [
            [x - 52 + i * 26, y - 165],
            [x - 39 + i * 26, y - 165],
            [x - 37 + i * 26, y - 130],
            [x - 55 + i * 26, y - 130],
          ],
          "#ffffff38",
        );
      this.line(x - 55, y - 130, x - 55, y + 30, "#805c3e", 5);
      this.line(x + 55, y - 130, x + 55, y + 30, "#805c3e", 5);
      this.rounded(x - 46, y - 110, 92, 28, 7, "#fff0ca");
      this.text("SẠP " + spot.id, x, y - 96, 16, "#5e6142");
      this.text(
        s?.item && s.quantity > 0 ? items[s.item]?.icon || "📦" : "🧺",
        x,
        y - 34,
        39,
      );
      this.text(
        s?.owner
          ? s.quantity
            ? `${s.quantity} món · ${s.price} CĐ`
            : "Hết hàng"
          : "Còn trống",
        x,
        y + 52,
        15,
        "#4e5b3b",
      );
      if (s?.owner)
        this.text(
          String(s.seller_name || "Người bán").slice(0, 12),
          x,
          y + 72,
          14,
          "#7b6846",
        );
    }
  } else
    for (const a of gardenStations) {
      this.rounded(a.x - 155, a.y - 55, 310, 108, 18, "#8bc96a00", "#8bc96a00");
      drawActivityArt(this, a.id, a.x, a.y - 6, 0.55, this.time, 0);
      this.text(a.title, a.x, a.y + 52, 19, "#3e624a");
    }
  const players = [
    this.player,
    ...[...this.others.values()].filter(
      (p) => (p.map || "courtyard") === this.map,
    ),
  ];
  players
    .sort((a, b) => a.y - b.y)
    .forEach((p) => this.character(p, p === this.player));
  if (this.route?.length) {
    const q = this.route.at(-1);
    this.ellipse(q.x, q.y, 15, 6, "#fff2bca0");
  }
  this.text("↓ Về sân chùa", 450, 1250, 20, "#436144");
  c.restore();
}
export function drawActivityArt(s, id, x, y, scale = 1, t = 0, hit = 0) {
  const c = s.ctx;
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  const r = (x, y, w, h, fill) => s.rounded(x, y, w, h, 12, fill),
    e = (x, y, rx, ry, fill) => s.ellipse(x, y, rx, ry, fill),
    text = (v, x, y, size = 30, color = "#4c563f") =>
      s.text(v, x, y, size, color);
  s.shadow(0, 55, 130, 24);
  if (id === "garden") {
    r(-130, 25, 260, 32, "#9f784c");
    for (let i = -2; i <= 2; i++) {
      const xx = i * 48;
      s.line(xx, 30, xx, -20 - Math.sin(t + i) * 5, "#6d9759", 6);
      for (let j = 0; j < 5; j++) {
        const a = (j * Math.PI * 2) / 5;
        e(
          xx + Math.cos(a) * 13,
          -26 + Math.sin(a) * 13,
          10,
          10,
          ["#eb9ea0", "#f0c777", "#c0acd6"][Math.abs(i) % 3],
        );
      }
      e(xx, -26, 8, 8, "#e7af53");
    }
    r(77, -85 - hit * 20, 58, 40, "#79b6bd");
    s.line(80, -60, 50, -45, "#79b6bd", 10);
    for (let i = 0; i < 5; i++)
      e(48 - i * 12, -35 + i * 12 + hit * 18, 3, 7, "#8fcbd3");
  } else if (id === "pig") {
    r(-135, 35, 270, 16, "#ac8755");
    e(-5, -8, 94, 59, "#e9adac");
    for (const xx of [-48, 35]) r(xx, 29, 22, 31, "#cd8c8b");
    e(65, -25, 51, 42, "#f1b9b1");
    s.path(
      [
        [40, -58],
        [42, -94],
        [66, -66],
      ],
      "#dd999e",
    );
    s.path(
      [
        [81, -61],
        [104, -89],
        [104, -48],
      ],
      "#dd999e",
    );
    e(91, -12, 29, 19, "#df999d");
    e(82, -12, 4, 6, "#aa6e79");
    e(100, -12, 4, 6, "#aa6e79");
    e(61, -36, 5, 5, "#4e4841");
    r(32, 40, 111, 30, "#a8794d");
    for (let i = 0; i < 8; i++) e(45 + i * 12, 42 - hit * 8, 6, 4, "#e6c478");
  } else if (id === "chicken") {
    e(-10, 0, 61, 48, "#fff2ce");
    e(34, -44, 30, 32, "#fff5db");
    for (let i = 0; i < 3; i++) e(20 + i * 14, -73, 10, 15, "#d57f65");
    s.path(
      [
        [56, -43],
        [81, -34],
        [57, -28],
      ],
      "#e3ad4d",
    );
    e(43, -49, 4, 4, "#51483b");
    e(-23, 5, 31, 22, "#e1c998");
    s.line(-25, 35, -29, 65, "#d3a047", 5);
    s.line(15, 35, 19, 65, "#d3a047", 5);
    e(100, 40, 35, 16, "#ae8755");
    e(98, 33, 18, 23, "#fff2cd");
    for (let i = 0; i < 8; i++)
      e(-100 + i * 12, 58 + Math.sin(i) * 9 - hit * 8, 3, 3, "#d3a651");
  } else if (id === "tarot") {
    r(-130, -60, 260, 140, "#8c729f");
    for (let i = -1; i <= 1; i++) {
      c.save();
      c.translate(i * 78, -5);
      c.rotate(i * 0.13);
      r(
        -30,
        -52,
        60,
        104,
        i === (Math.floor(t) % 3) - 1 ? "#f4dfaa" : "#57486e",
      );
      text(
        i === (Math.floor(t) % 3) - 1 ? "☀" : "✦",
        0,
        0,
        34,
        i === (Math.floor(t) % 3) - 1 ? "#b88143" : "#e7cc91",
      );
      c.restore();
    }
    if (scale > 1) text("Bốc một lời vui · Không dự đoán thật", 0, 108, 17);
  } else if (id === "live") {
    e(0, 0, 80, 80, "#d3b8a6");
    e(0, 0, 68, 68, "#f2e3bc");
    r(-39, -69, 78, 136, "#3a4d48");
    r(-31, -56, 62, 108, "#c3d3b0");
    e(0, -14, 18, 22, "#e8b58e");
    r(-21, 10, 42, 30, "#d49481");
    text("LIVE", 0, -45, 12, "#bd5b5a");
    for (let i = 0; i < 3; i++)
      text("♥", 75 + i * 25, -hit * 70 + i * 23, 25, "#e09b9d");
    s.line(0, 78, 0, 110, "#6c7058", 7);
    if (scale > 1) text("Chốt một đơn, vui cả xóm!", 0, 133, 18);
  } else if (id === "tea") {
    e(-40, 5, 70, 49, "#8fae86");
    s.path(
      [
        [-98, -5],
        [-137, -36],
        [-125, 5],
        [-94, 24],
      ],
      "#8fae86",
    );
    e(-40, -45, 32, 9, "#a6bd8a");
    e(-40, -58, 10, 13, "#73936d");
    r(45, 20, 62, 46, "#f2e4ba");
    e(76, 21, 31, 10, "#a8ba78");
    for (let i = 0; i < 3; i++)
      s.line(65 + i * 12, 0, 60 + i * 12 + Math.sin(t) * 8, -30, "#e9eed2", 3);
    s.line(12, -5, 65, 14 + hit * 10, "#bdd0a0", 4);
  } else if (id === "bake") {
    r(-125, -40, 250, 115, "#b98758");
    for (let i = -1; i <= 1; i++) {
      e(i * 75, 7, 32, 29, "#e4b874");
      e(i * 75, 2, 25, 20, "#efd19a");
      text("✿", i * 75, 2, 28, "#bd9259");
    }
    s.line(-95, -75, 95, -75 + hit * 25, "#a4774d", 22);
  } else if (id === "paint") {
    s.line(-65, 95, -35, -100, "#9b794f", 9);
    s.line(65, 95, 35, -100, "#9b794f", 9);
    r(-82, -85, 164, 130, "#fff0d0");
    e(38, -51, 17, 17, "#edc576");
    s.path(
      [
        [-72, 35],
        [-35, -16],
        [0, 10],
        [32, -10],
        [72, 35],
      ],
      "#83a886",
    );
    s.line(53 + hit * 35, -8, 109 + hit * 20, -65, "#8c6847", 10);
    text("✦", -38, -45, 24, "#99b9b6");
  } else if (id === "sew") {
    r(-64, -44, 128, 112, "#d2b0cc");
    s.path(
      [
        [-35, -42],
        [-35, -81],
        [35, -81],
        [35, -42],
      ],
      null,
      "#a783a1",
      9,
    );
    for (let i = 0; i < 8; i++)
      s.line(-47 + i * 13, 51, -42 + i * 13, 51, "#f6e4cb", 3);
    text("✿", 0, 8, 40, "#f4d7a3");
    s.line(80, -50 - hit * 20, 27, -6, "#708c8b", 4);
  } else if (id === "recycle") {
    r(-107, -54, 214, 121, "#8da485");
    for (let i = 0; i < 4; i++)
      r(-71 + i * 9, -28 - i * 10, 135, 69, "#f0dfb8");
    text("♻", 0, -12, 45, "#6e9671");
    s.line(-125, -80 + hit * 60, 125, -80 + hit * 60, "#a6784d", 13);
  }
  c.restore();
}
