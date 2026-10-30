import test from "node:test";
import assert from "node:assert/strict";
import {
  migrateLocal,
  rewardLocal,
  listLocal,
  cancelLocal,
  awakenLocal,
  canDo,
  newActivities,
  lootFor,
} from "../dist/economy.js";
const fresh = () => ({
  id: "guest",
  display_name: "Sen",
  xp: 0,
  merit: 0,
  character: { gender: "female", career: "designer", awakened: false },
});
test("old XP opens wallet once without losing merit or resetting ranks", () => {
  const p = migrateLocal({ ...fresh(), xp: 125, merit: 250 });
  assert.equal(p.wallet, 12);
  assert.equal(p.merit, 250);
  p.wallet = 3;
  assert.equal(migrateLocal(p).wallet, 3);
});
test("each task gives one item and XP; ten task XP mint one currency, retries do not duplicate", () => {
  let p = fresh();
  for (let i = 0; i < 10; i++) p = rewardLocal(p, "fish", "fish" + i);
  p = rewardLocal(p, "fish", "fish9");
  assert.equal(p.xp, 10);
  assert.equal(p.inventory.fish, 10);
  assert.equal(p.wallet, 1);
  assert.equal(p.merit, 0);
});
test("ten new activities have distinct collectible goods and work before ordination", () => {
  assert.equal(newActivities.length, 10);
  assert.equal(new Set(newActivities.map((a) => a.item)).size, 10);
  let p = fresh();
  for (const a of newActivities) {
    assert(canDo(p, a.id));
    p = rewardLocal(p, a.id, a.id);
    assert.equal(p.inventory[lootFor[a.id]], 1);
  }
  assert.equal(p.wallet, 1);
  assert(!canDo(p, "meal"));
  assert.throws(() => rewardLocal(p, "meal", "bad"));
});
test("listing reserves items, replace/cancel returns stock and rejects invalid quantities and second slot", () => {
  let p = fresh();
  for (let i = 0; i < 10; i++) p = rewardLocal(p, "fish", String(i));
  p = listLocal(p, 1, "fish", 6, 2);
  assert.equal(p.inventory.fish, 4);
  assert.equal(p.guestStalls[0].quantity, 6);
  assert.throws(() => listLocal(p, 2, "fish", 1, 2));
  assert.throws(() => listLocal(p, 1, "fish", 11, 2));
  assert.throws(() => listLocal(p, 1, "fish", 1, 0));
  p = listLocal(p, 1, "fish", 8, 3);
  assert.equal(p.inventory.fish, 2);
  p = cancelLocal(p, 1);
  assert.equal(p.inventory.fish, 10);
});
test("ordination returns listed goods, releases stall and practice settles demon before merit", () => {
  let p = rewardLocal(fresh(), "beads", "first");
  p = listLocal(p, 5, "bead", 1, 4);
  p = awakenLocal(p);
  assert.equal(p.inventory.bead, 1);
  assert.equal(p.guestStalls[4].owner, null);
  assert.throws(() => listLocal(p, 1, "bead", 1, 4));
  p.demon = 1;
  for (let i = 0; i < 10; i++) p = rewardLocal(p, "chant", "c" + i);
  assert.equal(p.demon, 0);
  assert.equal(p.merit, 0);
  for (let i = 10; i < 20; i++) p = rewardLocal(p, "chant", "c" + i);
  assert.equal(p.merit, 1);
});
