const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const b = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || chromium.executablePath(),
  });
  try {
    const p = await b.newPage({ viewport: { width: 390, height: 844 } }),
      errors = [];
    p.on("pageerror", (e) => {
      errors.push(e.message);
      console.log("ERR", e.message);
    });
    await p.goto(process.env.BASE_URL || "http://127.0.0.1:5173");
    await p.click("#guest");
    await p.waitForSelector('[data-career="designer"]');
    await p.click('[data-gender="female"]');
    await p.click('[data-career="designer"]');
    await p.click("#saveCharacter");
    await p.click("#visitGarden");
    await p.screenshot({
      path: (process.env.SCREENSHOT_DIR || "/tmp") + "/v5-garden.png",
    });
    async function activity(id, n = 1) {
      await p.click("#activityMenu");
      await p.click(`[data-activity="${id}"]`);
      await p.waitForFunction(
        () => document.querySelector("#activityScreen").open,
      );
      for (let i = 0; i < n; i++)
        await p.locator("#activityCanvas").press("Enter");
      await p.waitForFunction(
        (n) =>
          document.querySelector("#activityScore").textContent === n + " XP",
        n,
      );
      if (id === "pig")
        await p.screenshot({
          path: (process.env.SCREENSHOT_DIR || "/tmp") + "/v5-pig.png",
        });
      await p.click("#activityClose");
    }
    for (const id of [
      "garden",
      "pig",
      "chicken",
      "tarot",
      "live",
      "tea",
      "bake",
      "paint",
      "sew",
      "recycle",
    ])
      await activity(id);
    await p.click("#homeButton");
    await p.click("#enterHall");
    await p.waitForFunction(() =>
      document.querySelector("#toast").textContent.includes("Chính điện dành"),
    );
    assert(
      !(await p
        .locator("body")
        .evaluate((b) => b.classList.contains("inside-hall"))),
    );
    await activity("fish", 10);
    await activity("sweep");
    await activity("beads");
    await p.click("#bagButton");
    await p.waitForSelector(".bag-grid");
    await p.screenshot({
      path: (process.env.SCREENSHOT_DIR || "/tmp") + "/v5-bag.png",
    });
    await p.click(".panel-close");
    await p.click("#marketButton");
    await p.screenshot({
      path: (process.env.SCREENSHOT_DIR || "/tmp") + "/v5-market.png",
    });
    await p.click("#activityMenu");
    await p.click('[data-stall="3"]');
    await p.selectOption("#goodsItem", "fish");
    await p.fill("#goodsQty", "5");
    await p.fill("#goodsPrice", "2");
    await p.locator("#listGoods button").click();
    await p.waitForSelector("#marketBoard");
    assert.match(
      await p.locator('[data-stall="3"]').textContent(),
      /Cá tươi ×5/,
    );
    await p.click(".panel-close");
    await p.reload();
    await p.waitForFunction(
      () => document.querySelector("#playerName").textContent === "Sen Nhỏ",
    );
    await p.click(".panel-close");
    await p.click("#bagButton");
    await p.waitForSelector(".bag-grid");
    const inventory = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("annhien-v2-guest")),
    );
    assert.equal(inventory.inventory.fish, 5);
    assert.equal(inventory.wallet, 2);
    assert.equal(inventory.xp, 22);
    await p.click(".panel-close");
    await p.click("#profile");
    await p.click("#journeyButton");
    await p.click("#ceremony");
    await p.click("#ceremony");
    const after = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("annhien-v2-guest")),
    );
    assert.equal(after.inventory.fish, 10);
    assert.equal(after.guestStalls[2].owner, null);
    await p.click("#enterHall");
    await p.waitForFunction(() =>
      document.body.classList.contains("inside-hall"),
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS designer, ten activities, loot, 10:1 currency, lay hall gate, stall escrow, reload, ordination returns goods and opens hall",
    );
  } finally {
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
