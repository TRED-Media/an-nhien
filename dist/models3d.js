import * as T from "./vendor/three.module.min.js";
import { careerFor, rankFor } from "./journey.js";
export { T };
const materials = new Map(),
  geometries = new Map();
export function mat(color, metal = 0) {
  const key = color + ":" + metal;
  if (!materials.has(key))
    materials.set(
      key,
      new T.MeshStandardMaterial({
        color,
        roughness: metal ? 0.36 : 0.83,
        metalness: metal,
      }),
    );
  return materials.get(key);
}
function geo(key, make) {
  if (!geometries.has(key)) geometries.set(key, make());
  return geometries.get(key);
}
export function mesh(parent, geometry, color, x = 0, y = 0, z = 0, metal = 0) {
  const o = new T.Mesh(geometry, mat(color, metal));
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
export function box(p, x, y, z, w, h, d, c) {
  return (
    mesh(
      p,
      geo("b", () => new T.BoxGeometry(1, 1, 1)),
      c,
      x,
      y,
      z,
    ).scale.set(w, h, d),
    p.children.at(-1)
  );
}
export function ball(p, x, y, z, rx, ry, rz, c, metal = 0) {
  const o = mesh(
    p,
    geo("s", () => new T.SphereGeometry(1, 16, 12)),
    c,
    x,
    y,
    z,
    metal,
  );
  o.scale.set(rx, ry, rz);
  return o;
}
export function cyl(p, x, y, z, rt, rb, h, c, metal = 0) {
  return mesh(
    p,
    geo(`c${rt},${rb},${h}`, () => new T.CylinderGeometry(rt, rb, h, 20)),
    c,
    x,
    y,
    z,
    metal,
  );
}
export function ring(p, x, y, z, r, t, c) {
  const o = mesh(
    p,
    geo(`r${r},${t}`, () => new T.TorusGeometry(r, t, 6, 40)),
    c,
    x,
    y,
    z,
    0.35,
  );
  return o;
}
export function group(p, x = 0, y = 0, z = 0) {
  const g = new T.Group();
  g.position.set(x, y, z);
  p.add(g);
  return g;
}
export function label(parent, text, x, y, z, width = 2, color = "#f9e4b1") {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 96;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#18392ee8";
  ctx.beginPath();
  ctx.roundRect(4, 4, 504, 88, 30);
  ctx.fill();
  ctx.strokeStyle = "#ceab6766";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.font = "600 30px sans-serif";
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 48, 480);
  const texture = new T.CanvasTexture(c);
  texture.colorSpace = T.SRGBColorSpace;
  const sprite = new T.Sprite(
    new T.SpriteMaterial({ map: texture, depthTest: false, transparent: true }),
  );
  sprite.position.set(x, y, z);
  sprite.scale.set(width, (width * 96) / 512, 1);
  sprite.renderOrder = 10;
  parent.add(sprite);
  return sprite;
}
export function disposeGroup(root) {
  root.traverse((o) => {
    if (o.isSprite) {
      o.material.map?.dispose();
      o.material.dispose();
    }
    if (o.userData.uniqueGeometry) {
      o.geometry?.dispose();
      if (o.userData.uniqueMaterial) o.material?.dispose();
    }
  });
  root.removeFromParent();
}
export function roof(p, x, y, z, w, d, h) {
  const g = group(p, x, y, z),
    pts = [],
    indices = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * 2 - 1,
      yy = h * (1 - Math.abs(u)) + 0.22 * Math.pow(Math.abs(u), 8);
    for (const side of [-1, 1])
      pts.push((u * w) / 2, yy, side * (d / 2 - 0.17 * (1 - Math.abs(u))));
  }
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(pts, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const o = mesh(g, geometry, "#a24e3c");
  o.material = new T.MeshStandardMaterial({
    color: "#a24e3c",
    side: T.DoubleSide,
    roughness: 0.8,
  });
  o.userData.uniqueGeometry = true;
  o.userData.uniqueMaterial = true;
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * 2 - 1,
      yy = h * (1 - Math.abs(u)) + 0.22 * Math.pow(Math.abs(u), 8);
    cyl(g, (u * w) / 2, yy + 0.03, 0, 0.035, 0.035, d, "#d48a54").rotation.x =
      Math.PI / 2;
  }
  for (const s of [-1, 1]) {
    const curve = new T.CatmullRomCurve3(
      Array.from({ length: 15 }, (_, i) => {
        const u = i / 7 - 1;
        return new T.Vector3(
          (u * w) / 2,
          h * (1 - Math.abs(u)) + 0.22 * Math.pow(Math.abs(u), 8),
          (s * d) / 2,
        );
      }),
    );
    const trim = mesh(
      g,
      new T.TubeGeometry(curve, 24, 0.055, 5, false),
      "#edc078",
      0,
      0,
      0,
      0.3,
    );
    trim.userData.uniqueGeometry = true;
  }
  return g;
}
export function buddha(p, x, y, z, size = 1) {
  const g = group(p, x, y, z);
  g.scale.setScalar(size);
  cyl(g, 0, 0.12, 0, 0.85, 0.94, 0.24, "#b98334", 0.5);
  cyl(g, 0, 0.29, 0, 0.8, 0.85, 0.14, "#f1cb71", 0.55);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const petal = ball(
      g,
      Math.sin(a) * 0.64,
      0.43,
      Math.cos(a) * 0.64,
      0.15,
      0.25,
      0.1,
      "#e4b650",
      0.45,
    );
    petal.rotation.z = Math.sin(a) * 0.5;
  }
  ball(g, 0, 0.6, 0, 0.69, 0.23, 0.4, "#dca841", 0.6);
  cyl(g, 0, 1.06, 0, 0.3, 0.54, 0.9, "#e5b54d", 0.55);
  ball(g, 0, 1.79, 0, 0.3, 0.38, 0.3, "#f5cd6e", 0.6);
  ball(g, 0, 2.05, -0.04, 0.31, 0.18, 0.28, "#8a6739", 0.5);
  ball(g, 0, 2.23, -0.04, 0.1, 0.15, 0.1, "#d2a249", 0.5);
  for (const s of [-1, 1]) {
    ball(g, s * 0.32, 1.75, 0, 0.08, 0.18, 0.07, "#e9bb58", 0.5);
    const arm = ball(g, s * 0.36, 0.98, 0.17, 0.13, 0.38, 0.13, "#edc362", 0.5);
    arm.rotation.z = s * 0.35;
    ball(g, s * 0.15, 0.72, 0.35, 0.22, 0.08, 0.13, "#f1ce7b", 0.5);
    box(g, s * 0.12, 1.79, 0.284, 0.1, 0.018, 0.025, "#79502a");
  }
  ball(g, 0, 1.68, 0.29, 0.07, 0.018, 0.015, "#af7834");
  const halo = ring(g, 0, 1.69, -0.35, 0.78, 0.035, "#efc767");
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    ball(
      g,
      Math.sin(a) * 0.85,
      1.69 + Math.cos(a) * 0.85,
      -0.35,
      0.035,
      0.035,
      0.035,
      "#f5d88b",
      0.5,
    );
  }
  return g;
}
export function tree(p, x, z, s = 1, pink = false) {
  const g = group(p, x, 0, z);
  g.scale.setScalar(s);
  cyl(g, 0, 0.7, 0, 0.09, 0.17, 1.4, "#866246");
  for (const [xx, yy, zz, rr] of [
    [0, 1.95, 0, 0.7],
    [-0.45, 1.6, 0.1, 0.55],
    [0.43, 1.72, -0.1, 0.55],
    [0, 2.35, -0.1, 0.48],
  ]) {
    const o = mesh(
      g,
      geo("ico", () => new T.IcosahedronGeometry(1, 1)),
      pink ? "#d99987" : yy > 2 ? "#9ca86a" : "#6e9663",
      xx,
      yy,
      zz,
    );
    o.scale.setScalar(rr);
  }
  return g;
}
export function cushion(p, x, z) {
  cyl(p, x, 0.12, z, 0.42, 0.43, 0.18, "#b77255");
  cyl(p, x, 0.22, z, 0.38, 0.42, 0.08, "#dab27b");
}
export function table(p, x, z, w = 1.3) {
  box(p, x, 0.5, z, w, 0.12, 0.8, "#8d593a");
  for (const s of [-1, 1])
    for (const t of [-1, 1])
      box(
        p,
        x + s * (w / 2 - 0.12),
        0.24,
        z + t * 0.28,
        0.09,
        0.48,
        0.09,
        "#674331",
      );
}
export function meal(p, x = 0, y = 0.6, z = 0) {
  const g = group(p, x, y, z);
  cyl(g, 0, 0.12, 0, 0.23, 0.12, 0.23, "#efe8ce");
  ball(g, 0, 0.23, 0, 0.21, 0.055, 0.21, "#fff7e3");
  for (const s of [-1, 1]) {
    cyl(g, s * 0.42, 0.04, 0, 0.17, 0.13, 0.07, "#e4cd9e");
    ball(g, s * 0.42, 0.1, 0, 0.12, 0.06, 0.12, s < 0 ? "#84a357" : "#d9994d");
  }
  for (const s of [-1, 1])
    box(
      g,
      0.3 + s * 0.025,
      0.12,
      0.24,
      0.025,
      0.025,
      0.5,
      "#5b3e2b",
    ).rotation.y = 0.3;
  return g;
}
export function woodfish(p, x = 0, y = 0, z = 0) {
  const g = group(p, x, y, z);
  ball(g, 0, 0.19, 0, 0.34, 0.23, 0.26, "#b77b41");
  box(g, 0, 0.24, 0.24, 0.23, 0.035, 0.035, "#533e29");
  const stick = group(g, 0.37, 0.48, 0.1);
  cyl(stick, 0, 0.13, 0, 0.025, 0.025, 0.5, "#6d4a2d");
  ball(stick, 0, -0.12, 0, 0.07, 0.07, 0.07, "#d6a35e");
  stick.rotation.z = -0.8;
  g.userData.stick = stick;
  return g;
}
export function beads(p, x = 0, y = 0, z = 0, r = 0.42) {
  const g = group(p, x, y, z);
  for (let i = 0; i < 18; i++) {
    const a = (i * Math.PI) / 9;
    ball(
      g,
      Math.sin(a) * r,
      0,
      Math.cos(a) * r,
      0.055,
      0.055,
      0.055,
      i === 0 ? "#ebc06b" : "#986437",
      0.15,
    );
  }
  return g;
}
export function burner(p, x = 0, y = 0, z = 0) {
  const g = group(p, x, y, z);
  cyl(g, 0, 0.35, 0, 0.4, 0.27, 0.38, "#b78c45", 0.55);
  cyl(g, 0, 0.56, 0, 0.41, 0.41, 0.06, "#e4be68", 0.5);
  cyl(g, 0, 0.59, 0, 0.33, 0.33, 0.02, "#6b5643");
  for (const s of [-1, 1]) {
    cyl(g, s * 0.26, 0.12, 0, 0.07, 0.06, 0.25, "#916b37", 0.4);
    ring(g, s * 0.43, 0.4, 0, 0.15, 0.04, "#d2a250").rotation.y = Math.PI / 2;
  }
  for (let i = -1; i <= 1; i++) {
    cyl(g, i * 0.14, 0.89, 0, 0.012, 0.012, 0.6, "#a74c33");
    ball(g, i * 0.14, 1.2, 0, 0.022, 0.025, 0.022, "#ffca83");
  }
  return g;
}
export function fish(p, x = 0, y = 0, z = 0) {
  const g = group(p, x, y, z);
  ball(g, 0, 0, 0, 0.14, 0.055, 0.055, "#edb46b");
  const tail = mesh(
    g,
    geo("tail", () => new T.ConeGeometry(0.08, 0.14, 3)),
    "#df8d55",
    -0.16,
    0,
    0,
  );
  tail.rotation.z = Math.PI / 2;
  ball(g, 0.09, 0.025, 0.035, 0.012, 0.012, 0.012, "#343e32");
  return g;
}
export function broom(p) {
  const g = group(p);
  cyl(g, 0, 0.65, 0, 0.022, 0.022, 1.1, "#9e7449");
  const head = cyl(g, 0, 0.1, 0, 0.09, 0.21, 0.3, "#d1ad68");
  head.scale.z = 0.4;
  return g;
}
export function avatar(p, data = {}) {
  const g = group(p),
    body = group(g),
    skin = "#edc09a",
    c = data.character || {},
    rank = rankFor(c, data.merit),
    color = c.awakened
      ? ["#b38350", "#bb965d", "#cd9e46", "#deae51", "#ebc161", "#f1ce69"][
          Math.max(0, rank.index)
        ]
      : careerFor(c.career).color;
  const torso = cyl(body, 0, 0.66, 0, 0.17, 0.24, 0.48, color);
  box(body, -0.1, 0.11, 0, 0.13, 0.18, 0.22, "#584335");
  box(body, 0.1, 0.11, 0, 0.13, 0.18, 0.22, "#584335");
  const head = group(body, 0, 1.04, 0);
  ball(head, 0, 0, 0, 0.225, 0.255, 0.215, skin);
  for (const s of [-1, 1]) {
    ball(head, s * 0.223, -0.01, 0, 0.05, 0.065, 0.05, skin);
    ball(head, s * 0.075, 0.015, 0.201, 0.018, 0.023, 0.012, "#45392d");
    ball(head, s * 0.125, -0.07, 0.18, 0.045, 0.018, 0.015, "#cf907e");
  }
  ball(head, 0, -0.095, 0.208, 0.04, 0.013, 0.01, "#a26d54");
  if (!c.awakened) {
    ball(head, 0, 0.16, -0.04, 0.23, 0.13, 0.21, "#473e32");
    if (c.gender === "female") {
      ball(head, 0, 0.02, -0.18, 0.23, 0.23, 0.1, "#473e32");
      ball(head, 0.1, 0.22, -0.15, 0.13, 0.13, 0.13, "#473e32");
    }
  } else if (c.gender === "female") {
    const hood = ball(head, 0, 0.09, -0.08, 0.24, 0.21, 0.2, "#917252");
  }
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = group(body, s * 0.21, 0.8, 0);
    cyl(arm, 0, -0.1, 0, 0.065, 0.065, 0.24, color);
    ball(arm, 0, -0.26, 0, 0.064, 0.07, 0.064, skin);
    arms.push(arm);
  }
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = group(g, s * 0.1, 0.38, 0);
    cyl(leg, 0, -0.13, 0, 0.065, 0.065, 0.28, color);
    legs.push(leg);
  }
  const prop = group(body, 0, 0.55, 0.22);
  if (!c.awakened) {
    switch (c.career) {
      case "photo":
        box(prop, 0, 0, 0.02, 0.25, 0.15, 0.1, "#394342");
        cyl(prop, 0, 0, 0.09, 0.065, 0.065, 0.1, "#b6c7bb").rotation.x =
          Math.PI / 2;
        break;
      case "driver":
        ball(head, 0, 0.16, 0, 0.25, 0.15, 0.24, "#4f9e78");
        box(head, 0, 0.2, 0.23, 0.32, 0.04, 0.1, "#dbd5ae");
        break;
      case "boss":
        box(body, 0, 0.72, 0.18, 0.055, 0.26, 0.03, "#ca8c6b");
        box(body, 0.32, 0.32, 0, 0.24, 0.23, 0.12, "#614934");
        break;
      case "collector":
        box(prop, 0.23, -0.04, 0, 0.19, 0.26, 0.045, "#d9b767");
        break;
      case "tough":
        for (const s of [-1, 1])
          box(head, s * 0.08, 0.015, 0.21, 0.13, 0.07, 0.04, "#252c2c");
        break;
      case "streamer":
        ring(head, 0, 0.05, 0, 0.25, 0.035, "#e2b879");
        for (const s of [-1, 1])
          box(head, s * 0.25, 0, 0, 0.08, 0.16, 0.12, "#795a94");
        break;
      case "seller":
        cyl(prop, 0.24, 0.02, 0.1, 0.12, 0.04, 0.23, "#ecd3a0").rotation.x =
          Math.PI / 2;
        break;
      case "office":
        cyl(prop, 0.26, 0.02, 0, 0.085, 0.075, 0.15, "#eee9cf");
        break;
      case "broker":
        box(prop, 0.28, 0.1, 0, 0.26, 0.23, 0.035, "#e9d69c");
        break;
      case "chef":
        cyl(head, 0, 0.25, 0, 0.23, 0.21, 0.23, "#f4eddb");
        for (let i = -1; i <= 1; i++)
          ball(head, i * 0.12, 0.39, 0, 0.14, 0.12, 0.15, "#fff5df");
        break;
    }
  }
  g.userData = {
    body,
    arms,
    legs,
    head,
    prop,
    torso,
    previous: new T.Vector2(),
    direction: 0,
  };
  return g;
}
export function animateAvatar(g, p, t) {
  const d = g.userData,
    a = p.action || "idle",
    walk = p.moving ? Math.sin(t * 12) : 0,
    age = (Date.now() - (p.animationStarted || 0)) / 1000,
    hit = Math.max(0, 1 - age / 0.65),
    sit = ["meditate", "sermon", "meal", "teach"].includes(a);
  d.body.position.y = sit
    ? -0.27
    : Math.abs(walk) * 0.025 + Math.sin(t * 1.8) * 0.01;
  d.body.rotation.x =
    a === "prostrate"
      ? -0.8 * Math.sin(Math.min(1, age / 2.4) * Math.PI)
      : a === "bow"
        ? 0.25
        : 0;
  d.legs.forEach((l, i) => {
    l.rotation.x = sit ? -Math.PI / 2 : walk * (i ? 1 : -1) * 0.5;
    l.rotation.z = sit ? (i ? -0.6 : 0.6) : 0;
  });
  d.arms.forEach((arm, i) => {
    arm.rotation.set(0, 0, 0);
    arm.rotation.x = walk * (i ? -1 : 1) * 0.6;
    if (["bow", "prostrate", "incense", "beads"].includes(a)) {
      arm.rotation.x = -1;
      arm.rotation.z = i ? -0.4 : 0.4;
    }
    if (["chant", "meal", "fish", "sweep"].includes(a))
      arm.rotation.x = -0.65 - hit * (i ? 0.8 : 0.3);
    if (sit) arm.rotation.x = -0.65;
  });
  if (p.moving) {
    const dx = p.x - d.previous.x,
      dz = p.y - d.previous.y;
    if (Math.hypot(dx, dz) > 0.01) d.direction = Math.atan2(dx, dz);
  }
  g.rotation.y = d.direction;
  d.previous.set(p.x || 0, p.y || 0);
}
export function tiles(parent, x0, z0, cols, rows, step, colorA, colorB) {
  for (let parity = 0; parity < 2; parity++) {
    const positions = [];
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++)
        if ((i + j) % 2 === parity)
          positions.push([x0 + i * step, z0 + j * step]);
    const inst = new T.InstancedMesh(
        geo("b", () => new T.BoxGeometry(1, 1, 1)),
        mat(parity ? colorA : colorB),
        positions.length,
      ),
      m = new T.Matrix4();
    positions.forEach(([x, z], i) => {
      m.makeScale(step - 0.035, 0.025, step - 0.035);
      m.setPosition(x, 0.047, z);
      inst.setMatrixAt(i, m);
    });
    inst.receiveShadow = true;
    parent.add(inst);
  }
}
export function renderer(canvas) {
  const r = new T.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  r.shadowMap.enabled = true;
  r.shadowMap.type = T.PCFSoftShadowMap;
  r.outputColorSpace = T.SRGBColorSpace;
  r.toneMapping = T.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.05;
  return r;
}
export function lights(scene) {
  scene.add(new T.HemisphereLight("#fff1d4", "#6a7562", 1.5));
  const sun = new T.DirectionalLight("#ffe4b2", 3.1);
  sun.position.set(-7, 14, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(512, 512);
  Object.assign(sun.shadow.camera, {
    left: -12,
    right: 12,
    top: 12,
    bottom: -12,
    near: 1,
    far: 45,
  });
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.035;
  scene.add(sun);
  return sun;
}
