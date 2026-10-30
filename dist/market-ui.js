import {
  items,
  newActivities,
  economyRules,
  migrateLocal,
  listLocal,
  cancelLocal,
  localStalls,
} from "./economy.js";
import { rpc, saveLocal, errorText } from "./cloud.js";
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export class MarketUI {
  constructor({ getProfile, apply, open, close, toast, scene, visit }) {
    Object.assign(this, {
      getProfile,
      apply,
      open,
      close,
      toast,
      scene,
      visit,
    });
    this.busy = false;
    this.slots = [];
    this.timer = setInterval(() => {
      if (
        this.getProfile() &&
        (this.scene.map === "market" || document.querySelector("#marketBoard"))
      )
        this.refresh()
          .then(() => {
            if (document.querySelector("#marketBoard")) this.renderBoard();
          })
          .catch(() => {});
    }, 8000);
  }
  get profile() {
    return this.getProfile();
  }
  async refresh() {
    if (this.busy) return;
    if (this.profile.cloud) {
      const r = await rpc("game_economy", { p_op: "status" });
      this.apply(r.profile);
      this.slots = r.slots;
    } else {
      const p = localStalls(this.profile);
      saveLocal(p);
      this.apply(p);
      this.slots = p.guestStalls;
    }
    this.scene.marketSlots = this.slots;
  }
  async init() {
    await this.refresh();
    if (this.profile.cloud) {
      try {
        const p = JSON.parse(
          localStorage.getItem("annhien-market-pending-" + this.profile.id) ||
            "null",
        );
        if (p) {
          this.pending = p;
          this.toast("Có giao dịch đang chờ xác nhận. Mở túi để thử lại.");
        }
      } catch {}
    }
  }
  async run(op, args) {
    if (this.busy) return false;
    this.busy = true;
    try {
      if (this.profile.cloud) {
        if (this.pending)
          throw Error(
            "Có giao dịch chưa xác nhận. Hãy chọn Thử lại giao dịch trong túi đồ.",
          );
        this.pending = { op, args: { ...args, event: crypto.randomUUID() } };
        localStorage.setItem(
          "annhien-market-pending-" + this.profile.id,
          JSON.stringify(this.pending),
        );
        const r = await rpc("game_economy", {
          p_op: op,
          p_args: this.pending.args,
        });
        this.apply(r.profile);
        this.slots = r.slots;
        this.clearPending();
      } else {
        const next =
          op === "list"
            ? listLocal(
                this.profile,
                args.slot,
                args.item,
                args.quantity,
                args.price,
              )
            : cancelLocal(this.profile, args.slot);
        saveLocal(next);
        this.apply(next);
        this.slots = next.guestStalls;
      }
      this.scene.marketSlots = this.slots;
      return true;
    } catch (e) {
      if (
        !/fetch|network|timeout|Failed to fetch|chưa xác nhận/i.test(
          e.message || "",
        )
      )
        this.clearPending();
      this.toast(errorText(e));
      return false;
    } finally {
      this.busy = false;
    }
  }
  clearPending() {
    this.pending = null;
    localStorage.removeItem("annhien-market-pending-" + this.profile.id);
  }
  async retry() {
    if (!this.pending || this.busy) return;
    this.busy = true;
    try {
      const r = await rpc("game_economy", {
        p_op: this.pending.op,
        p_args: this.pending.args,
      });
      this.apply(r.profile);
      this.clearPending();
      this.toast("Giao dịch đã được xác nhận.");
    } catch (e) {
      if (!/fetch|network|timeout/i.test(e.message || "")) this.clearPending();
      this.toast(errorText(e));
    } finally {
      this.busy = false;
      await this.bag();
    }
  }
  async bag() {
    try {
      await this.refresh();
      const p = this.profile;
      this.open(
        `<p class="eyebrow">TÚI NHỎ · CHUYỆN LỚN</p><h2>Túi đồ của ${esc(p.display_name)}</h2>${this.stats()}${this.pending ? '<button id="retryMarket" class="primary">Thử lại giao dịch đang chờ</button>' : ""}<div class="bag-grid">${Object.entries(
          items,
        )
          .map(
            ([id, it]) =>
              `<div class="bag-item"><span>${it.icon}</span><b>${it.name}</b><strong>× ${Number(p.inventory?.[id] || 0)}</strong></div>`,
          )
          .join(
            "",
          )}</div><button id="openMarket" class="primary">Xem 10 sạp hàng →</button><details class="rules-card"><summary>Luật Công Đức & Tâm Ma</summary><p>${economyRules}</p><p>XP và bậc tu từ bản trước được giữ. Ví khởi tạo một lần bằng ⌊XP cũ / 10⌋. Quà ngày +50 XP không quy đổi tiền.</p></details>`,
      );
      document.querySelector("#openMarket").onclick = () => this.board();
      if (document.querySelector("#retryMarket"))
        document.querySelector("#retryMarket").onclick = () => this.retry();
    } catch (e) {
      this.toast(errorText(e));
    }
  }
  stats() {
    const p = this.profile;
    return `<div class="economy-stats"><span>Ví Công Đức<b>${p.wallet || 0} ✦</b></span><span>Công đức tu tập<b>${p.merit || 0} 🪷</b></span><span>Tâm Ma<b>${p.demon || 0} 🔥</b></span></div><p class="small-muted">${p.xp} XP tổng · ${p.task_xp % 10 || 0}/10 XP nhiệm vụ để nhận 1 Công Đức · ${p.trade_xp % 10 || 0}/10 XP bán hàng để tăng 1 Tâm Ma</p>`;
  }
  async board() {
    try {
      await this.refresh();
      this.open('<div id="marketBoard"></div>');
      this.renderBoard();
    } catch (e) {
      this.toast(errorText(e));
    }
  }
  renderBoard() {
    const target = document.querySelector("#marketBoard");
    if (!target) return;
    target.innerHTML = `<p class="eyebrow">CHỢ AN NHIÊN</p><h2>Mười sạp, trăm chuyện vui.</h2>${this.stats()}<p>${this.profile.cloud ? "Hàng của người chơi thật · Tự làm mới mỗi 8 giây." : "Chợ thử riêng trên thiết bị. Bạn có thể gom đồ và bày sạp; đăng nhập để mua bán với người chơi khác."}</p><div class="stall-grid">${this.slots.map((s) => `<button data-stall="${s.id}"><small>SẠP ${s.id}</small><span>${s.item && s.quantity ? items[s.item]?.icon || "📦" : "🧺"}</span><b>${s.owner ? esc(s.seller_name || "Người bán") : "Còn trống"}</b><small>${s.owner ? (s.quantity ? `${items[s.item]?.name} ×${s.quantity}<br>${s.price} Công Đức/món` : "Chủ sạp đang bổ sung hàng") : "Chưa quy y? Mở sạp tại đây!"}</small></button>`).join("")}</div><button class="secondary" id="refreshMarket">Làm mới chợ</button>`;
    target
      .querySelectorAll("[data-stall]")
      .forEach((b) => (b.onclick = () => this.stall(Number(b.dataset.stall))));
    target.querySelector("#refreshMarket").onclick = () => this.board();
  }
  async stall(id) {
    try {
      await this.refresh();
      const s = this.slots.find((s) => s.id === id);
      if (!s) return;
      const own = s.owner === this.profile.id,
        canSell = !this.profile.character?.awakened && (!s.owner || own);
      const available = { ...this.profile.inventory };
      if (own && s.item)
        available[s.item] = (available[s.item] || 0) + s.quantity;
      this.open(
        `<p class="eyebrow">CHỢ AN NHIÊN · SẠP ${id}</p><h2>${s.owner ? esc(s.seller_name || "Sạp hàng") : "Một sạp nhỏ đang đợi bạn"}</h2>${this.stats()}${s.owner && s.item ? `<div class="product-card"><span>${items[s.item]?.icon}</span><h3>${items[s.item]?.name}</h3><p>${s.quantity} món còn lại · <b>${s.price} Công Đức/món</b></p></div>` : ""}${
          canSell
            ? `<p>Một người giữ một sạp. Hàng được giữ riêng trong sạp, tự trả về túi sau 48 giờ.</p><form id="listGoods"><label>Vật phẩm trong túi<select id="goodsItem" required>${Object.entries(
                items,
              )
                .filter(([key]) => (available[key] || 0) > 0)
                .map(
                  ([key, it]) =>
                    `<option value="${key}">${it.icon} ${it.name} (có ${available[key]})</option>`,
                )
                .join(
                  "",
                )}</select></label><label>Số lượng<input id="goodsQty" type="number" min="1" max="999" step="1" value="1" required></label><label>Giá mỗi món (Công Đức)<input id="goodsPrice" type="number" min="1" max="10000" step="1" value="${own ? s.price : 1}" required></label><button class="primary" ${Object.values(available).some((v) => v > 0) ? "" : "disabled"}>${own ? "Cập nhật hàng" : "Mở sạp & bày hàng"}</button></form>${Object.values(available).some((v) => v > 0) ? "" : "<p>Túi còn trống. Bắt cá, quét lá hoặc ghé Vườn vui để gom đồ trước nhé.</p>"}`
            : !s.owner
              ? "<p>Bạn đã quy y nên không thể mở sạp; vẫn có thể mua ở các sạp có hàng.</p>"
              : ""
        }${s.owner && !own && s.quantity > 0 ? `<form id="buyGoods"><label>Số lượng mua<input id="buyQty" type="number" min="1" max="${s.quantity}" value="1" step="1" required></label><p id="buyTotal">Tổng: ${s.price} Công Đức</p><button class="primary">Mua và nhận vào túi</button></form>` : ""}${own ? '<button id="releaseStall" class="secondary">Thu hồi hàng & trả sạp</button>' : ""}<button class="secondary" id="backMarket">← Xem các sạp</button>`,
      );
      const form = document.querySelector("#listGoods");
      if (form)
        form.onsubmit = async (e) => {
          e.preventDefault();
          const b = form.querySelector("button");
          b.disabled = true;
          const ok = await this.run("list", {
            slot: id,
            item: document.querySelector("#goodsItem").value,
            quantity: Number(document.querySelector("#goodsQty").value),
            price: Number(document.querySelector("#goodsPrice").value),
          });
          if (ok) {
            this.toast("Đã bày hàng lên sạp.");
            await this.board();
          } else b.disabled = false;
        };
      const buy = document.querySelector("#buyGoods");
      if (buy) {
        document.querySelector("#buyQty").oninput = () =>
          (document.querySelector("#buyTotal").textContent =
            "Tổng: " +
            Number(document.querySelector("#buyQty").value) * s.price +
            " Công Đức");
        buy.onsubmit = async (e) => {
          e.preventDefault();
          const b = buy.querySelector("button");
          b.disabled = true;
          const ok = await this.run("buy", {
            slot: id,
            listing: s.listing,
            quantity: Number(document.querySelector("#buyQty").value),
          });
          if (ok) {
            this.toast("Đã mua hàng, vật phẩm nằm trong túi.");
            await this.bag();
          } else b.disabled = false;
        };
      }
      if (document.querySelector("#releaseStall"))
        document.querySelector("#releaseStall").onclick = async () => {
          if (await this.run("cancel", { slot: id })) this.board();
        };
      document.querySelector("#backMarket").onclick = () => this.board();
    } catch (e) {
      this.toast(errorText(e));
    }
  }
  activities(stations) {
    this.open(
      `<p class="eyebrow">LÀM MỘT CHÚT · VUI MỘT NGÀY</p><h2>Hoạt động quanh bạn</h2><div class="activity-grid">${stations.map((a) => `<button class="secondary" data-activity="${a.id}">${a.icon} ${a.name || a.title}</button>`).join("")}</div>`,
    );
    document.querySelectorAll("[data-activity]").forEach(
      (b) =>
        (b.onclick = () => {
          this.close();
          this.visit(b.dataset.activity);
        }),
    );
  }
  destroy() {
    clearInterval(this.timer);
  }
}
