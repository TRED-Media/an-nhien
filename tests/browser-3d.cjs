const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
      headless: true,
      executablePath: process.env.CHROMIUM_PATH || chromium.executablePath(),
      args: ["--enable-unsafe-swiftshader"],
    }),
    p = await b.newPage({ viewport: { width: 390, height: 844 } }),
    errors = [];
  p.on("pageerror", (e) => {
    errors.push(e.message);
    console.log(e.message);
  });
  try {
    await p.goto(process.env.BASE_URL || "http://127.0.0.1:5173");
    await p.evaluate(() => {
      sessionStorage.setItem("annhien-mode", "guest");
      localStorage.setItem(
        "annhien-v2-guest",
        JSON.stringify({
          id: "guest",
          display_name: "Sen",
          xp: 0,
          merit: 0,
          character: { gender: "female", career: "photo", awakened: true },
        }),
      );
    });
    await p.goto(
      (process.env.BASE_URL || "http://127.0.0.1:5173") + "/game.html",
    );
    await p.waitForFunction(
      () => document.querySelector("#levelText").textContent === "Sa-di-ni",
    );
    assert.equal(
      await p.locator("#world").getAttribute("data-renderer"),
      "webgl",
    );
    await p.screenshot({
      path: (process.env.SCREENSHOT_DIR || "/tmp") + "/3d-mobile.png",
    });
    async function clickWorld(x, y, h = 0.6) {
      const pos = await p.evaluate(
        async ({ x, y, h }) => {
          const T = await import("./vendor/three.module.min.js"),
            a = innerWidth / innerHeight,
            size = a < 0.8 ? 9.8 / a : 14.5,
            camera = new T.OrthographicCamera(
              (-size * a) / 2,
              (size * a) / 2,
              size / 2,
              -size / 2,
              0.1,
              100,
            ),
            target = new T.Vector3(0, 0.45, -1.2);
          camera.position
            .set(Math.sin(0.12) * 13, 13, Math.cos(0.12) * 13)
            .add(target);
          camera.lookAt(target);
          camera.updateMatrixWorld();
          const q = new T.Vector3((x - 450) / 100, h, (y - 850) / 100).project(
            camera,
          );
          return {
            x: ((q.x + 1) * innerWidth) / 2,
            y: ((1 - q.y) * innerHeight) / 2,
          };
        },
        { x, y, h },
      );
      await p.locator("#world").click({ position: pos });
    }
    async function waitTask(title) {
      await p.waitForFunction(
        () => document.querySelector("#activityScreen").open,
        null,
        { timeout: 30000 },
      );
      assert.match(await p.locator("#activityTitle").textContent(), title);
      assert.equal(
        await p.locator("#activityCanvas").getAttribute("data-renderer"),
        "webgl",
      );
    }
    async function swipe(horizontal = false) {
      const r = await p.locator("#activityCanvas").boundingBox();
      await p.mouse.move(r.x + r.width / 2, r.y + r.height * 0.4);
      await p.mouse.down();
      await p.mouse.move(
        r.x + r.width / 2 + (horizontal ? 90 : 0),
        r.y + r.height * 0.4 + (horizontal ? 0 : 100),
        { steps: 4 },
      );
      await p.mouse.up();
    }
    await clickWorld(180, 720, 0.65);
    await waitTask(/chuỗi/);
    await swipe(true);
    assert.equal(await p.locator("#activityScore").textContent(), "0 XP");
    for (let i = 0; i < 5; i++) await swipe();
    await p.waitForFunction(
      () => document.querySelector("#activityScore").textContent === "5 XP",
    );
    await p.screenshot({
      path: (process.env.SCREENSHOT_DIR || "/tmp") + "/3d-beads.png",
    });
    await p.click("#activityClose");
    await clickWorld(650, 565, 0.8);
    await waitTask(/mõ/);
    const r = await p.locator("#activityCanvas").boundingBox();
    for (let i = 0; i < 10; i++)
      await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
    await p.waitForFunction(
      () => document.querySelector("#activityScore").textContent === "10 XP",
    );
    await p.screenshot({
      path: (process.env.SCREENSHOT_DIR || "/tmp") + "/3d-chant.png",
    });
    await p.click("#activityClose");
    await p.click('[data-camera="left"]');
    await p.click('[data-camera="in"]');
    await p.click('[data-camera="reset"]');
    await p.click("#enterHall");
    await p.waitForFunction(
      () => document.body.classList.contains("inside-hall"),
      null,
      { timeout: 30000 },
    );
    await p.screenshot({
      path: (process.env.SCREENSHOT_DIR || "/tmp") + "/3d-hall-mobile.png",
    });
    for (const id of ["meal", "sermon", "prostrate"]) {
      await p.click(`[data-hall-task="${id}"]`);
      await waitTask(/./);
      if (id === "meal") {
        const r = await p.locator("#activityCanvas").boundingBox();
        await p.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
      } else await swipe();
      await p.waitForFunction(
        () => document.querySelector("#activityScore").textContent === "1 XP",
      );
      await p.keyboard.press("Escape");
    }
    await p.click("#homeButton");
    await p.waitForFunction(
      () => !document.body.classList.contains("inside-hall"),
    );
    await p.reload();
    await p.waitForFunction(
      () => document.querySelector("#levelText").textContent === "Sa-di-ni",
    );
    await p.click("#profile");
    assert.match(await p.locator("#panelContent").textContent(), /18 XP/);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: mobile WebGL, 3D ray picking, beads swipe, invalid swipe, 10 taps, camera controls, hall activities, map exit, 18 XP persisted, no JS errors",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
