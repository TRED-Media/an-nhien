import {
  T,
  box,
  ball,
  cyl,
  ring,
  group,
  buddha,
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
  label,
} from "./models3d.js";
export class ActivityStage3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = renderer(canvas);
    this.world = new T.Scene();
    this.world.background = new T.Color("#234b40");
    lights(this.world);
    this.camera = new T.PerspectiveCamera(38, 1, 0.1, 40);
    this.camera.position.set(0, 3.7, 7);
    this.camera.lookAt(0, 0.6, 0);
    this.root = group(this.world);
    this.lastId = null;
    canvas.dataset.renderer = "webgl";
  }
  setup(id, player) {
    disposeGroup(this.root);
    this.root = group(this.world);
    this.id = id;
    const p = this.root;
    this.world.background.set(
      ["meal", "prostrate", "sermon"].includes(id) ? "#644b30" : "#31594a",
    );
    box(
      p,
      0,
      -0.1,
      0,
      20,
      0.1,
      20,
      ["meal", "prostrate", "sermon"].includes(id) ? "#9c7b4d" : "#72866a",
    );
    this.actor = avatar(p, player);
    this.actor.position.set(0, 0, 1.5);
    this.actor.scale.setScalar(0.85);
    this.actor.userData.direction = Math.PI;
    this.object = group(p);
    this.beadRing = null;
    this.fishes = [];
    if (id === "beads") {
      this.beadRing = beads(this.object, 0, 0.85, 0, 1.05);
      this.beadRing.scale.setScalar(1.8);
      this.beadRing.rotation.x = 0.65;
      this.beadRing.children.forEach((b) => b.scale.multiplyScalar(1.5));
    }
    if (id === "chant") {
      table(this.object, 0, 0, 2.7);
      this.instrument = woodfish(this.object, 0, 0.58, 0);
      this.instrument.scale.setScalar(2);
    }
    if (id === "incense") {
      this.object = burner(p, 0, 0, 0);
      this.object.scale.setScalar(1.8);
    }
    if (id === "fish") {
      cyl(this.object, 0, 0.05, 0, 1.9, 2, 0.12, "#c1b892");
      cyl(this.object, 0, 0.13, 0, 1.8, 1.8, 0.03, "#6aada1");
      for (let i = 0; i < 7; i++) this.fishes.push(fish(this.object));
    }
    if (id === "sweep") {
      this.sweeper = broom(this.object);
      this.sweeper.scale.setScalar(1.8);
      this.leaves = [];
      for (let i = 0; i < 12; i++)
        this.leaves.push(
          ball(
            this.object,
            Math.sin(i * 7) * 1.5,
            0.02,
            Math.cos(i * 5) * 1.2,
            0.15,
            0.025,
            0.09,
            "#d3a35c",
          ),
        );
    }
    if (id === "meal") {
      table(this.object, 0, 0, 2.5);
      this.food = meal(this.object, 0, 0.6, 0);
      this.food.scale.setScalar(2);
    }
    if (["meditate", "prostrate", "sermon"].includes(id)) {
      cushion(p, 0, 1.5);
      if (id !== "meditate") {
        buddha(p, 0, 0, -1.2, 1.4);
        for (const s of [-1, 1])
          cyl(p, s * 2, 1.5, -1.8, 0.16, 0.2, 3, "#9c713d");
      }
      this.actor.scale.setScalar(1.2);
    }
    this.pulse = ring(p, 0, 0.035, 0, 1, 0.018, "#ead49d");
    this.pulse.rotation.x = -Math.PI / 2;
  }
  draw(view) {
    if (this.id !== view.id || this.player !== view.player) {
      this.setup(view.id, view.player);
      this.player = view.player;
    }
    const r = this.canvas.getBoundingClientRect();
    if (this.w !== r.width || this.h !== r.height) {
      this.w = r.width;
      this.h = r.height;
      this.renderer.setSize(r.width, r.height, false);
      this.camera.aspect = r.width / r.height;
      this.camera.fov = this.camera.aspect < 0.6 ? 50 : 38;
      this.camera.updateProjectionMatrix();
    }
    const t = view.scene.time,
      age = t - view.lastHit,
      hit = Math.max(0, 1 - age / 0.65);
    this.pulse.scale.setScalar(1 + Math.sin(t * 1.5) * 0.06 + hit * 0.2);
    this.pulse.material.opacity = 0.3 + hit * 0.5;
    this.pulse.material.transparent = true;
    if (this.beadRing)
      this.beadRing.rotation.y =
        view.scene.task.rotation +
        Math.max(-40, Math.min(70, view.drag || 0)) / 300;
    if (this.id === "chant") {
      this.instrument.scale.set(2 + hit * 0.08, 2 - hit * 0.18, 2);
      this.instrument.userData.stick.rotation.z = -0.8 + hit * 0.7;
    }
    if (this.id === "incense") this.object.position.y = hit * 0.2;
    if (this.id === "fish")
      this.fishes.forEach((f, i) => {
        const a = t * 0.6 + i;
        f.position.set(
          Math.sin(a) * 1.4,
          0.2 + (i === view.count % 7 ? hit * 0.5 : 0),
          Math.cos(a + i) * 1.1,
        );
        f.rotation.y = -a;
      });
    if (this.id === "sweep") {
      this.sweeper.rotation.z = -0.4 + hit * 0.65;
      this.sweeper.position.x = hit * 0.7;
      this.leaves.forEach((l, i) => {
        l.position.x =
          Math.sin(i * 7) * 1.5 + (i === view.count % 12 ? hit * 0.7 : 0);
      });
    }
    if (this.id === "meal") this.food.rotation.y = Math.sin(hit) * 0.08;
    animateAvatar(
      this.actor,
      {
        ...view.player,
        x: 0,
        y: 0,
        moving: false,
        action: this.id === "prostrate" && age > 2.4 ? "idle" : this.id,
        animationStarted: view.lastHit < 0 ? 0 : Date.now() - age * 1000,
      },
      t,
    );
    this.renderer.render(this.world, this.camera);
  }
  reset() {
    this.id = null;
  }
  destroy() {
    disposeGroup(this.root);
    this.renderer.dispose();
  }
}
export class AvatarPreview3D {
  constructor(canvas) {
    this.renderer = renderer(canvas);
    this.world = new T.Scene();
    this.world.background = new T.Color("#dce2c8");
    lights(this.world);
    this.camera = new T.PerspectiveCamera(35, 1.5, 0.1, 20);
    this.camera.position.set(1.3, 1.2, 2.8);
    this.camera.lookAt(0, 0.65, 0);
    this.renderer.setSize(240, 160, false);
  }
  show(character) {
    if (this.actor) disposeGroup(this.actor);
    this.actor = avatar(this.world, { character });
    this.renderer.render(this.world, this.camera);
  }
  destroy() {
    if (this.actor) disposeGroup(this.actor);
    this.renderer.dispose();
  }
}
