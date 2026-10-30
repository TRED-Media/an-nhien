// Currency is a spendable balance; merit is lifetime spiritual progression.
export const items = {
  fish: { name: "Cá tươi", icon: "🐟" },
  leaf: { name: "Lá vàng", icon: "🍂" },
  bead: { name: "Chuỗi bồ đề", icon: "📿" },
  flower: { name: "Bó hoa", icon: "💐" },
  compost: { name: "Phân hữu cơ", icon: "🌱" },
  egg: { name: "Trứng gà", icon: "🥚" },
  fortune: { name: "Thiệp tarot vui", icon: "🃏" },
  voucher: { name: "Phiếu chốt đơn", icon: "🎟️" },
  tea: { name: "Trà sen", icon: "🍵" },
  cake: { name: "Bánh chay", icon: "🥮" },
  art: { name: "Tranh nhỏ", icon: "🎨" },
  pouch: { name: "Túi vải", icon: "👝" },
  paper: { name: "Giấy tái chế", icon: "📜" },
};
export const newActivities = [
  {
    id: "garden",
    title: "Chăm vườn hoa",
    icon: "🌻",
    item: "flower",
    gesture: "down",
    instruction: "Vuốt xuống để tưới hoa và thu một bó hoa.",
    color: "#e6b6b2",
  },
  {
    id: "pig",
    title: "Nuôi heo tròn",
    icon: "🐷",
    item: "compost",
    gesture: "tap",
    instruction: "Chạm máng ăn để chăm heo và thu phân hữu cơ.",
    color: "#edb7a3",
  },
  {
    id: "chicken",
    title: "Cho gà ăn",
    icon: "🐔",
    item: "egg",
    gesture: "tap",
    instruction: "Chạm rổ thóc để cho gà ăn, nhặt một quả trứng.",
    color: "#edca84",
  },
  {
    id: "tarot",
    title: "Tarot đầu ngõ",
    icon: "🃏",
    item: "fortune",
    gesture: "down",
    instruction: "Vuốt xuống để lật một lá bài vui và nhận thiệp.",
    color: "#b7a1d3",
  },
  {
    id: "live",
    title: "Livestream chốt đơn",
    icon: "📱",
    item: "voucher",
    gesture: "tap",
    instruction: "Chạm màn hình, hô “chốt đơn!” để tạo một phiếu.",
    color: "#e5a1b7",
  },
  {
    id: "tea",
    title: "Pha trà sen",
    icon: "🍵",
    item: "tea",
    gesture: "down",
    instruction: "Vuốt xuống để rót một chén trà sen.",
    color: "#a3c4a4",
  },
  {
    id: "bake",
    title: "Làm bánh chay",
    icon: "🥮",
    item: "cake",
    gesture: "tap",
    instruction: "Chạm khuôn để làm một chiếc bánh chay.",
    color: "#dfb78e",
  },
  {
    id: "paint",
    title: "Vẽ tranh dạo",
    icon: "🎨",
    item: "art",
    gesture: "swipe",
    instruction: "Vuốt một nét cọ để hoàn thành bức tranh nhỏ.",
    color: "#9ebfc9",
  },
  {
    id: "sew",
    title: "May túi vải",
    icon: "🧵",
    item: "pouch",
    gesture: "swipe",
    instruction: "Vuốt một đường chỉ để may túi vải.",
    color: "#c7aad0",
  },
  {
    id: "recycle",
    title: "Tái chế giấy",
    icon: "♻️",
    item: "paper",
    gesture: "down",
    instruction: "Vuốt xuống để ép một tờ giấy tái chế.",
    color: "#aec5a2",
  },
];
export const lootFor = {
  fish: "fish",
  sweep: "leaf",
  beads: "bead",
  ...Object.fromEntries(newActivities.map((a) => [a.id, a.item])),
};
export const activityIds = [
  "incense",
  "fish",
  "chant",
  "beads",
  "meditate",
  "sweep",
  "meal",
  "prostrate",
  "sermon",
  ...newActivities.map((a) => a.id),
];
export const canDo = (profile, id) =>
  activityIds.includes(id) && (profile.character?.awakened || !!lootFor[id]);
export const economyRules = `10 XP nhiệm vụ → 1 Công Đức trong ví. Mua hàng dùng ví, không mất XP hay bậc tu. Bán mỗi vật phẩm cho người khác: +1 XP buôn bán; đủ 10 XP buôn bán: +1 Tâm Ma, không sinh thêm tiền. Sau quy y, mỗi 10 thao tác giảm 1 Tâm Ma trước, rồi mới +1 công đức tu tập. Người đã quy y có thể mua nhưng không mở sạp. Vật phẩm mua về chỉ để sưu tầm hoặc bán lại trước quy y; không tự tăng XP. Giá do người bán đặt: 1–10.000 Công Đức/món. Một người giữ một sạp, một loại hàng/sạp; sạp tự trả sau 48 giờ, hàng còn lại về túi.`;
export function migrateLocal(p) {
  if (p.economy_version === 1) return p;
  return {
    ...p,
    economy_version: 1,
    wallet: Math.floor(p.xp / 10),
    task_xp: p.xp,
    trade_xp: 0,
    practice_xp: 0,
    demon: 0,
    inventory: {},
    events: [],
    guestStalls: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      owner: null,
      quantity: 0,
    })),
  };
}
export function rewardLocal(profile, id, event) {
  const p = structuredClone(migrateLocal(profile));
  if (!canDo(p, id))
    throw Error("Hãy quy y trước khi thực hiện hoạt động trong chùa.");
  if (p.events.includes(event)) return p;
  p.events.push(event);
  p.xp++;
  const before = p.task_xp;
  p.task_xp++;
  p.wallet += Math.floor(p.task_xp / 10) - Math.floor(before / 10);
  if (p.character?.awakened) {
    p.practice_xp++;
    if (p.practice_xp % 10 === 0) {
      if (p.demon > 0) p.demon--;
      else p.merit++;
    }
  }
  const item = lootFor[id];
  if (item) p.inventory[item] = (p.inventory[item] || 0) + 1;
  p.daily = { ...p.daily, [id]: true };
  return p;
}
export function awakenLocal(profile) {
  const p = structuredClone(migrateLocal(profile));
  if (!p.character) throw Error("Hãy chọn nhân vật trước.");
  for (const s of p.guestStalls) {
    if (s.owner) {
      if (s.item) p.inventory[s.item] = (p.inventory[s.item] || 0) + s.quantity;
      Object.assign(s, {
        owner: null,
        item: null,
        quantity: 0,
        price: 0,
        listing: null,
      });
    }
  }
  p.character.awakened = true;
  return p;
}
export function localStalls(profile) {
  const p = structuredClone(migrateLocal(profile));
  for (const s of p.guestStalls)
    if (s.owner && s.expires < Date.now()) {
      if (s.item) p.inventory[s.item] = (p.inventory[s.item] || 0) + s.quantity;
      Object.assign(s, {
        owner: null,
        item: null,
        quantity: 0,
        price: 0,
        listing: null,
      });
    }
  return p;
}
export function listLocal(profile, slot, item, quantity, price) {
  const p = localStalls(profile);
  if (p.character?.awakened) throw Error("Chỉ người chưa quy y được bán hàng.");
  if (!p.character) throw Error("Hãy chọn nhân vật.");
  if (
    !items[item] ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 999 ||
    !Number.isInteger(price) ||
    price < 1 ||
    price > 10000
  )
    throw Error("Số lượng hoặc giá không hợp lệ.");
  const s = p.guestStalls.find((s) => s.id === slot);
  if (!s) throw Error("Sạp không tồn tại.");
  if (p.guestStalls.some((s) => s.owner && s.id !== slot))
    throw Error("Mỗi người chỉ giữ một sạp.");
  if (s.item) p.inventory[s.item] = (p.inventory[s.item] || 0) + s.quantity;
  if ((p.inventory[item] || 0) < quantity)
    throw Error("Túi không đủ vật phẩm.");
  p.inventory[item] -= quantity;
  Object.assign(s, {
    owner: p.id,
    item,
    quantity,
    price,
    listing: crypto.randomUUID(),
    expires: Date.now() + 48 * 3600000,
    seller_name: p.display_name,
  });
  return p;
}
export function cancelLocal(profile, slot) {
  const p = localStalls(profile),
    s = p.guestStalls.find((s) => s.id === slot);
  if (!s?.owner) throw Error("Bạn chưa có hàng ở sạp này.");
  if (s.item) p.inventory[s.item] = (p.inventory[s.item] || 0) + s.quantity;
  Object.assign(s, {
    owner: null,
    item: null,
    quantity: 0,
    price: 0,
    listing: null,
  });
  return p;
}
