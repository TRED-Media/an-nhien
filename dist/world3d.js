import {
  T,
  tiles,
  box,
  ball,
  cyl,
  ring,
  group,
  label,
  roof,
  buddha,
  tree,
  cushion,
  table,
  meal,
  woodfish,
  beads,
  burner,
  fish,
  broom,
  avatar,
  animateAvatar,
  renderer,
  lights,
  disposeGroup,
} from "./models3d.js";
import { stations } from "./scene.js";
import { hallStations } from "./hall.js";
const wx = (x) => (x - 450) / 100,
  wz = (y) => (y - 850) / 100;
export class TempleWorld3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = renderer(canvas);
    this.world = new T.Scene();
    this.world.background = new T.Color("#b6cec0");
    this.world.fog = new T.Fog("#b6cec0", 22, 50);
    this.sun = lights(this.world);
    this.camera = new T.OrthographicCamera(-8, 8, 8, -8, 0.1, 100);
    this.map = "courtyard";
    this.weather = "sun";
    this.autoWeather = true;
    this.time = 0;
    this.player = { x: 450, y: 915, name: "Khách hành hương", action: "idle" };
    this.others = new Map();
    this.actors = new Map();
    this.effects = [];
    this.lanterns = [];
    this.route = [];
    this.angle = 0.12;
    this.zoom = 1;
    this.ray = new T.Raycaster();
    this.plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
    this.courtyard = group(this.world);
    this.hall = group(this.world);
    this.pickables = [];
    this.fishes = [];
    this.buildCourtyard();
    this.buildHall();
    this.hall.visible = false;
    this.makeParticles();
    this.marker = ring(this.world, 0, 0.035, 0, 0.15, 0.018, "#fff2ba");
    this.marker.rotation.x = -Math.PI / 2;
    this.marker.visible = false;
    this.resize = () => {
      this.w = canvas.clientWidth;
      this.h = canvas.clientHeight;
      this.renderer.setSize(this.w, this.h, false);
      this.updateCamera();
    };
    this.resize();
    window.addEventListener("resize", this.resize);
    this.onWheel = (e) => {
      e.preventDefault();
      this.zoom = Math.max(0.75, Math.min(1.65, this.zoom - e.deltaY * 0.001));
      this.updateCamera();
    };
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.onLost = (e) => {
      e.preventDefault();
      const hint=document.querySelector("#hint");if(hint)hint.textContent="Đồ họa đang khôi phục…";
    };
    this.onRestored = () => {
      const hint=document.querySelector("#hint");if(hint)hint.textContent="Đã khôi phục không gian 3D";
    };
    canvas.addEventListener("webglcontextlost", this.onLost);
    canvas.addEventListener("webglcontextrestored", this.onRestored);
    this.last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.15, (now - this.last) / 1000);
      this.last = now;
      this.time += dt;
      this.update?.(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
    canvas.dataset.renderer = "webgl";
  }
  makeParticles() {
    const positions = new Float32Array(180 * 3);
    this.particleGeometry = new T.BufferGeometry();
    this.particleGeometry.setAttribute(
      "position",
      new T.BufferAttribute(positions, 3),
    );
    this.particleMaterial = new T.PointsMaterial({
      color: "#fff0bd",
      size: 0.045,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.particles = new T.Points(this.particleGeometry, this.particleMaterial);
    this.world.add(this.particles);
  }
  updateParticles() {
    const rain = this.weather === "rain" && this.map !== "hall",
      positions = this.particleGeometry.attributes.position.array;
    for (let i = 0; i < 180; i++) {
      positions[i * 3] =
        Math.sin(i * 39.7) * 7 + Math.sin(this.time * 0.3 + i) * 0.15;
      positions[i * 3 + 1] = rain
        ? 6 - ((i * 0.17 + this.time * 3) % 6)
        : 0.5 + ((i * 0.07 + this.time * 0.08) % 4);
      positions[i * 3 + 2] = Math.cos(i * 17.3) * 6;
    }
    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleMaterial.color.set(rain ? "#d2e7ed" : "#fff0bd");
    this.particleMaterial.size = rain ? 0.035 : 0.025;
    this.particles.visible = true;
  }
  updateCamera() {
    const aspect = this.w / this.h,
      size = (aspect < 0.8 ? 9.8 / aspect : 14.5) / this.zoom;
    this.camera.left = (-size * aspect) / 2;
    this.camera.right = (size * aspect) / 2;
    this.camera.top = size / 2;
    this.camera.bottom = -size / 2;
    const target = new T.Vector3(0, 0.45, this.map === "hall" ? -0.2 : -1.2);
    this.camera.position
      .set(Math.sin(this.angle) * 13, 13, Math.cos(this.angle) * 13)
      .add(target);
    this.camera.lookAt(target);
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }
  rotate(delta) {
    this.angle = Math.max(-0.85, Math.min(0.85, this.angle + delta));
    this.updateCamera();
  }
  resetCamera() {
    this.angle = 0.12;
    this.zoom = 1;
    this.updateCamera();
  }
  pick(g, x, y, parent) {
    g.userData.pick = { x, y };
    this.pickables.push({ g, parent });
    return g;
  }
  point(e) {
    const r = this.canvas.getBoundingClientRect();
    this.ray.setFromCamera(
      new T.Vector2(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      ),
      this.camera,
    );
    const hits = this.ray.intersectObjects(
      this.pickables.filter((p) => p.parent.visible).map((p) => p.g),
      true,
    );
    if (hits.length) {
      let o = hits[0].object;
      while (o) {
        if (o.userData.pick) return { ...o.userData.pick };
        o = o.parent;
      }
    }
    const v = new T.Vector3();
    if (!this.ray.ray.intersectPlane(this.plane, v))
      return { x: -999, y: -999 };
    return { x: v.x * 100 + 450, y: v.z * 100 + 850 };
  }
  screen(x, y, height = 0) {
    const v = new T.Vector3(wx(x), height, wz(y)).project(this.camera);
    return { x: ((v.x + 1) * this.w) / 2, y: ((1 - v.y) * this.h) / 2 };
  }
  addEffect(x, y, text, color) {
    this.effects.push({
      x,
      y,
      text,
      t: this.time,
      sprite: label(this.world, text, wx(x), 1.4, wz(y), 2, color),
    });
  }
  buildCourtyard() {
    const p = this.courtyard;
    box(p, 0, -0.25, 0, 18, 0.45, 19, "#80976c");
    box(p, 0, -0.02, 1.2, 8.6, 0.12, 7.3, "#c8b68c");
    tiles(p, -3.68, -1.8, 9, 7, 0.9, "#d5c4a0", "#cdbb95");
    for (const s of [-1, 1]) {
      box(p, s * 4.5, 0.25, 1.1, 0.18, 0.5, 7.6, "#a59878");
      for (let i = 0; i < 7; i++)
        cyl(p, s * 4.5, 0.65, -2 + i * 1.05, 0.12, 0.16, 0.8, "#b6a98a");
    }
    const temple = group(p, 0, 0, -4.5);
    box(temple, 0, 0.16, 0, 5.3, 0.32, 2.8, "#b3a486");
    box(temple, 0, 0.34, 0.1, 4.9, 0.14, 2.4, "#d8bd86");
    box(temple, 0, 1.4, -0.3, 4.6, 2.1, 1.4, "#d2ad71");
    box(temple, 0, 1.25, 0.43, 1.4, 1.8, 0.08, "#453d2f");
    for (const x of [-2.1, -1.4, 1.4, 2.1]) {
      cyl(temple, x, 1.45, 0.75, 0.09, 0.11, 2.2, "#8f4e34");
      cyl(temple, x, 0.45, 0.75, 0.17, 0.17, 0.15, "#e1bf7c");
    }
    for (let i = 0; i < 3; i++)
      box(
        temple,
        0,
        0.06 + i * 0.075,
        1.7 - i * 0.2,
        2.4,
        0.12,
        0.5,
        "#c7b28b",
      );
    roof(temple, 0, 2.6, 0, 5.8, 3.2, 1.25);
    roof(temple, 0, 3.65, -0.15, 3.9, 2.35, 0.85);
    cyl(temple, 0, 4.7, -0.15, 0.06, 0.06, 0.45, "#d9b260");
    ball(temple, 0, 4.98, -0.15, 0.1, 0.15, 0.1, "#edce82");
    label(temple, "AN NHIÊN TỰ", 0, 2.35, 1.1, 2.1);
    buddha(temple, 0, 0.4, 0.1, 0.55);
    this.pick(temple, 450, 400, p);
    for (const s of [-1, 1]) {
      const wing = group(p, s * 4, 0, -4.5);
      box(wing, 0, 1, 0, 2, 2, 1.8, "#c3a675");
      roof(wing, 0, 2.05, 0, 2.6, 2.4, 0.8);
      for (const x of [-0.7, 0.7])
        cyl(wing, x, 1, 0.8, 0.07, 0.08, 2, "#85583b");
    }
    for (const [x, z, s, pink] of [
      [-6, -5, 1.8, false],
      [6, -5, 1.8, false],
      [-5.3, 0, 1.2, false],
      [5.5, 1.8, 1.4, true],
      [-5, 5, 1.1, true],
      [5.8, 5.5, 1.3, false],
      [-7, 3, 1.3, false],
      [7, -1, 1.4, false],
    ])
      tree(p, x, z, s, pink);
    const pond = group(p, wx(725), 0.04, wz(900));
    cyl(pond, 0, 0, 0, 1.65, 1.75, 0.18, "#a9af88").scale.z = 0.6;
    const water = cyl(pond, 0, 0.105, 0, 1.5, 1.5, 0.025, "#619f96");
    water.scale.z = 0.56;
    water.material = new T.MeshStandardMaterial({
      color: "#73b6ad",
      roughness: 0.2,
      metalness: 0.25,
    });
    for (let i = 0; i < 7; i++) {
      const f = fish(pond);
      this.fishes.push(f);
    }
    for (const s of [-1, 1]) {
      cyl(pond, s * 0.9, 0.14, 0.25, 0.22, 0.22, 0.02, "#6b9565");
      ball(pond, s * 0.9, 0.2, 0.25, 0.1, 0.1, 0.1, "#e9b7a0");
    }
    this.pick(pond, 725, 900, p);
    const objects = {
      incense: burner(p, wx(450), 0, wz(635)),
      chant: group(p, wx(650), 0, wz(565)),
      beads: group(p, wx(180), 0, wz(720)),
      meditate: group(p, wx(730), 0, wz(735)),
      sweep: group(p, wx(345), 0, wz(1060)),
    };
    table(objects.chant, 0, 0);
    woodfish(objects.chant, 0, 0.57, 0);
    table(objects.beads, 0, 0, 0.9);
    beads(objects.beads, 0, 0.6, 0, 0.3);
    cushion(objects.meditate, 0, 0);
    const b = broom(objects.sweep);
    b.rotation.z = -0.3;
    for (let i = 0; i < 9; i++) {
      const leaf = ball(
        objects.sweep,
        ((i % 3) - 0.9) * 0.55,
        0.06,
        (Math.floor(i / 3) - 1) * 0.45,
        0.1,
        0.025,
        0.06,
        "#dba55b",
      );
      leaf.rotation.y = i;
    }
    for (const st of stations) {
      const g = objects[st.id];
      if (g) this.pick(g, st.x, st.y, p);
      label(
        p,
        st.name,
        wx(st.x),
        st.id === "fish" ? 0.3 : 1.35,
        wz(st.y) + 0.1,
        1.55,
      );
    }
    const monk = avatar(p, {
      character: { gender: "male", career: "boss", awakened: true },
      merit: 6000,
    });
    monk.position.set(wx(150), 0, wz(850));
    this.pick(monk, 150, 810, p);
    label(p, "Trụ trì An Hòa", wx(150), 1.6, wz(850), 1.8);
    this.monk = monk;
    const wish = tree(p, wx(100), wz(1030), 0.8, true);
    this.pick(wish, 100, 990, p);
    label(p, "Tâm nguyện", wx(100), 2.4, wz(1030), 1.6);
    for (let i = 0; i < 3; i++) {
      const l = group(
        p,
        wx(100) + (i - 1) * 0.35,
        1.35 + (i % 2) * 0.3,
        wz(1030) + 0.2,
      );
      cyl(l, 0, 0, 0, 0.09, 0.09, 0.22, "#d58e4d");
      cyl(l, 0, 0.13, 0, 0.1, 0.1, 0.035, "#efd18a");
    }
    for (let i = 0; i < 9; i++) {
      const m = meshMountain(p, (i - 4) * 4, -11, 3 + (i % 3));
    }
  }
  buildHall() {
    const p = this.hall;
    box(p, 0, -0.16, 0.3, 8.2, 0.3, 11, "#c6a86f");
    tiles(p, -3.52, -4.5, 9, 11, 0.88, "#c4a46c", "#d6b87d");
    box(p, 0, 2, -5, 8, 4, 0.2, "#986437");
    box(p, -4, 1.2, -0.4, 0.16, 2.4, 9.3, "#b1864d");
    box(p, 4, 1.2, -0.4, 0.16, 2.4, 9.3, "#b1864d");
    for (const s of [-1, 1])
      for (let z = -4; z <= 3; z += 2) {
        box(p, s * 3.91, 1.6, z, 0.05, 1.3, 0.8, "#f0ce86");
        for (let k = -1; k <= 1; k++)
          box(p, s * 3.86, 1.6, z + k * 0.22, 0.06, 1.3, 0.025, "#765135");
      }
    for (const x of [-3, 3])
      for (const z of [-1.2, 2.7]) {
        cyl(p, x, 1.7, z, 0.17, 0.2, 3.4, "#77462c");
        cyl(p, x, 0.12, z, 0.29, 0.29, 0.22, "#c39a50");
        cyl(p, x, 3.3, z, 0.3, 0.25, 0.18, "#caa151");
        for (let k = 0; k < 6; k++) {
          const r = ring(p, x, 0.5 + k * 0.45, z, 0.2, 0.025, "#e4b95d");
          r.rotation.x = Math.PI / 2;
          const ornament = box(
            p,
            x,
            0.72 + k * 0.45,
            z + 0.18,
            0.12,
            0.16,
            0.035,
            "#dfb45a",
          );
          ornament.rotation.z = Math.PI / 4;
        }
      }
    for (const z of [-1.2, 2.7]) {
      box(p, 0, 3.5, z, 6.5, 0.22, 0.22, "#65432e");
      box(p, 0, 3.65, z, 6.5, 0.04, 0.25, "#cc9e4d");
    }
    box(p, 0, 0.25, -3.6, 6, 0.5, 2, "#976436");
    box(p, 0, 0.52, -3.6, 5.8, 0.06, 1.85, "#d6ac5d");
    buddha(p, 0, 0.57, -3.6, 1.6);
    buddha(p, -2, 0.57, -3.6, 0.9);
    buddha(p, 2, 0.57, -3.6, 0.9);
    label(p, "ĐẠI HÙNG BẢO ĐIỆN", 0, 4.3, -4.4, 3.4);
    burner(p, 0, 0.55, -2.6);
    for (const x of [-2.6, 2.6]) {
      cyl(p, x, 0.9, -2.8, 0.1, 0.15, 0.75, "#e3b95c");
      ball(p, x, 1.35, -2.8, 0.045, 0.1, 0.045, "#fff1b8");
    }
    cushion(p, wx(450), wz(700));
    table(p, wx(230), wz(1020), 1.65);
    meal(p, wx(230), 0.56, wz(1020));
    for (const x of [1.5, 2.3]) for (const z of [1, 1.8, 2.6]) cushion(p, x, z);
    const teacher = avatar(p, {
      character: { gender: "male", career: "boss", awakened: true },
      merit: 6000,
    });
    teacher.position.set(2, 0, -0.4);
    animateAvatar(teacher, { action: "teach" }, 0);
    label(p, "Trụ trì giảng pháp", 2, 1.4, -0.5, 1.8);
    for (const st of hallStations) {
      label(p, st.name, wx(st.x), 0.55, wz(st.y), 1.8);
      const hit = box(p, wx(st.x), 0.18, wz(st.y), 0.8, 0.1, 0.6, "#c29b60");
      hit.visible = false; /* Ground raycasting retains the original station radii. */
    }
    label(p, "↓ Trở về sân chùa", 0, 0.4, 3.65, 2.2);
  }
  syncActor(id, p) {
    const signature = JSON.stringify([
      p.character,
      p.merit && Math.floor(p.merit / 100),
      p.name,
    ]);
    let item = this.actors.get(id);
    if (!item || item.signature !== signature) {
      if (item) disposeGroup(item.g);
      const g = avatar(this.world, p);
      label(
        g,
        p.name || "Bạn đồng hành",
        0,
        1.65,
        0,
        id === "self" ? 1.7 : 1.5,
      );
      item = { g, signature };
      this.actors.set(id, item);
    }
    item.g.visible = id === "self" || (p.map || "courtyard") === this.map;
    item.g.position.set(wx(p.x), 0, wz(p.y));
    animateAvatar(item.g, p, this.time);
    return item.g;
  }
  draw() {
    const inside = this.map === "hall";
    if (this.lastMap !== this.map) {
      this.courtyard.visible = !inside;
      this.hall.visible = inside;
      this.lastMap = this.map;
      this.updateCamera();
    }
    if (this.autoWeather)
      this.weather = ["sun", "wind", "rain", "sunset"][
        Math.floor(this.time / 75) % 4
      ];
    const sky = inside
      ? "#aa895d"
      : this.weather === "sunset"
        ? "#d6ae93"
        : this.weather === "rain"
          ? "#9eb1af"
          : "#b6cec0";
    this.world.background.set(sky);
    this.world.fog.color.set(sky);
    this.sun.color.set(
      inside ? "#ffce84" : this.weather === "sunset" ? "#ffbc7c" : "#ffe4b2",
    );
    this.sun.intensity = inside ? 2.5 : this.weather === "rain" ? 1.7 : 3.1;
    this.updateParticles();
    this.syncActor("self", this.player);
    for (const [id, p] of this.others) this.syncActor(id, p);
    for (const [id, item] of this.actors)
      if (id !== "self" && !this.others.has(id)) {
        disposeGroup(item.g);
        this.actors.delete(id);
      }
    this.fishes.forEach((f, i) => {
      const a = this.time * 0.35 + i;
      f.position.set(Math.sin(a) * 1.1, 0.16, Math.cos(a * 0.8 + i) * 0.4);
      f.rotation.y = -a;
    });
    animateAvatar(this.monk, { action: "bow" }, this.time);
    this.marker.visible = !!this.route?.length;
    if (this.marker.visible) {
      const q = this.route.at(-1);
      this.marker.position.set(wx(q.x), 0.06, wz(q.y));
      this.marker.scale.setScalar(1 + Math.sin(this.time * 4) * 0.15);
    }
    for (const e of this.effects) {
      e.sprite.position.y = 1.4 + (this.time - e.t) * 0.4;
      e.sprite.material.opacity = Math.max(0, 1 - (this.time - e.t) / 2.5);
    }
    this.effects = this.effects.filter((e) => {
      if (this.time - e.t < 2.5) return true;
      disposeGroup(e.sprite);
      return false;
    });
    for (const l of this.lanterns) {
      if (!l.g) {
        l.g = group(this.world, wx(l.x), 1, wz(l.y));
        cyl(l.g, 0, 0, 0, 0.12, 0.12, 0.25, "#ecac57");
      }
      l.g.position.y = 1 + (this.time - l.t) * 0.3;
    }
    this.lanterns = this.lanterns.filter((l) => {
      if (this.time - l.t < 18) return true;
      disposeGroup(l.g);
      return false;
    });
    if (!document.querySelector("#activityScreen")?.open)
      this.renderer.render(this.world, this.camera);
  }
  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.canvas.removeEventListener("webglcontextlost", this.onLost);
    this.canvas.removeEventListener("webglcontextrestored", this.onRestored);
    disposeGroup(this.world);
    this.particleGeometry.dispose();
    this.particleMaterial.dispose();
    this.renderer.dispose();
  }
}
function meshMountain(p, x, z, h) {
  const o = cyl(p, x, h / 2 - 0.5, z, 0, 4, h, "#91a28a");
  return o;
}
