import { finishGame, setBest, clearFireQueued, clearBoostQueued, BOOST_MUL, BOOST_RECHARGE, BOOST_TIME, C, DIRS, H, HUD, K, LH, LW, M, S, W, banner, best, boostQueued, circ, col, enterOver, fireHeld, fireQueued, fitGrid, g, idx, inb, mulberry32, palRGB, poly, qualifies, rr, saveBest, sfx, startEntry, track, txt, wantDir } from "../../console/core";
/* dirt is drawn straight into the low-res buffer, one pattern per seam */
export const dirtCanvas = document.createElement('canvas');
export function makeDirt(){
  if (dirtCanvas.width !== LW || dirtCanvas.height !== LH - HUD) { dirtCanvas.width = LW; dirtCanvas.height = LH - HUD; }
  const d = dirtCanvas.getContext('2d'), w = dirtCanvas.width, h = dirtCanvas.height;
  const img = d.createImageData(w, h), px = img.data;
  const base = palRGB[M.roles.dirt], s1 = palRGB[M.roles.ds1], s2 = palRGB[M.roles.ds2];
  const r = mulberry32(S.level * 31 + 5), pat = (S.level - 1) % 4;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let c = base;
    if (pat === 0) { const v = r(); if (v < 0.07) c = s1; else if (v < 0.085) c = s2; }
    else if (pat === 1) { if ((x + y) % 6 === 0) c = s1; else if ((x * 7 + y * 13) % 97 === 0) c = s2; }
    else if (pat === 2) { const row = (y / 6) | 0; if (y % 6 === 0 || (x + (row % 2) * 6) % 12 === 0) c = s1; }
    else { if ((y + Math.round(Math.sin(x / 7) * 2)) % 5 === 0) c = s1; else if (r() < 0.012) c = s2; }
    const o = (y * w + x) * 4; px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2]; px[o + 3] = 255;
  }
  d.putImageData(img, 0, 0);
}

export function carve(x, y){ if (inb(x, y)) S.dug[idx(x, y)] = 1; }
export function genLevel(L){
  fitGrid();
  const r = mulberry32(L * 7919 + 13), ri = n => (r() * n) | 0;
  S.dug.fill(0); S.em.fill(0);
  S.bags = []; S.golds = []; S.monsters = []; S.sparks = []; S.parts = []; S.pops = [];
  const runL = 3 + ri(4);
  // the grubs' den: one block down and one in from the corner, so with wraparound on it has no edge to slip through
  for (let x = W - 2; x >= W - 2 - runL; x--) carve(x, 1);
  const mid = W >> 1;
  for (let x = mid - 2; x <= mid + 2; x++) carve(x, H - 1);
  const runs = 2 + (L > 3 ? 1 : 0);
  for (let k = 0; k < runs; k++) {
    if (r() < 0.5) { const x = ri(W - 2) + 1, y0 = 1 + ri(H - 5), len = 3 + ri(3); for (let y = y0; y < y0 + len; y++) carve(x, y); }
    else { const y = 2 + ri(H - 5), x0 = ri(W - 6), len = 4 + ri(4); for (let x = x0; x < x0 + len; x++) carve(x, y); }
  }
  const nearSpawn = (x, y) => x >= W - 4 && y <= 2;
  const area = (W * H) / 150;   // treasure scales with the size of the field
  const clusters = Math.max(3, Math.round((5 + Math.min(3, (L / 2) | 0)) * area));
  for (let c = 0; c < clusters; c++) {
    const w = 2 + ri(2), h = 2 + ri(2), cx = ri(W - w + 1), cy = 1 + ri(H - h - 1);
    for (let y = cy; y < cy + h; y++) for (let x = cx; x < cx + w; x++)
      if (inb(x, y) && !S.dug[idx(x, y)] && !nearSpawn(x, y)) S.em[idx(x, y)] = 1;
  }
  const want = Math.max(4, Math.round((6 + Math.min(3, (L / 2) | 0)) * area));
  let tries = 0;
  while (S.bags.length < want && tries++ < 400) {
    const x = ri(W), y = ri(H - 3);
    if (S.dug[idx(x, y)] || S.dug[idx(x, y + 1)] || S.em[idx(x, y)] || nearSpawn(x, y) || bagAt(x, y) || bagAt(x, y + 1) || bagAt(x, y - 1)) continue;
    S.bags.push({ x, y, fy: y, state: 'rest', t: 0, dist: 0, slide: 0 });
  }
  S.emLeft = S.em.reduce((a, b) => a + b, 0);
  S.total = 6 + L;
  S.maxAlive = Math.min(5, 3 + ((L - 1) / 3 | 0));
  S.spawned = 0; S.spawnT = 1.2;
  S.sun = { active: false, used: false, x: W - 2, y: 1 };
  S.bonusT = 0; S.bonusChain = 0;
  resetPlayer();
  makeDirt();
}
export function resetPlayer(){
  const mid = W >> 1;
  S.player = { x: mid, y: H - 1, tx: mid, ty: H - 1, t: 0, moving: false, mdx: 0, mdy: 0, face: 'right', speed: 6, collected: true, deadT: 0 };
  S.charge = 1; S.boost = 1; S.boostT = 0;
}

/* ---------- queries ---------- */
export function bagAt(x, y){ return S.bags.find(b => b.x === x && b.y === y); }
export function restingBagAt(x, y){ const b = bagAt(x, y); return b && b.state !== 'fall' ? b : null; }
/* the field wraps: leave by one edge and you come back in at the opposite one */
export const wrapX = x => ((x % W) + W) % W, wrapY = y => ((y % H) + H) % H;
export const wrapD = (d, span) => d - span * Math.round(d / span);   // shortest offset across the wrap
export const wdist = (ax, ay, bx, by) => Math.hypot(wrapD(ax - bx, W * C), wrapD(ay - by, H * C));
export function ppos(o){
  const fw = W * C, fh = H * C, x = (o.x + (o.tx - o.x) * o.t) * C + C / 2, y = (o.y + (o.ty - o.y) * o.t) * C + C / 2;
  return { x: ((x % fw) + fw) % fw, y: ((y % fh) + fh) % fh };
}
export function wrapSpots(p){   // where to draw something that is half through an edge
  const fw = W * C, fh = H * C, xs = [p.x], ys = [p.y];
  if (p.x < C) xs.push(p.x + fw); if (p.x > fw - C) xs.push(p.x - fw);
  if (p.y < C) ys.push(p.y + fh); if (p.y > fh - C) ys.push(p.y - fh);
  const out = []; for (const x of xs) for (const y of ys) out.push({ x, y }); return out;
}
export function pcell(o){ const p = ppos(o); return { x: Math.floor(p.x / C), y: Math.floor(p.y / C) }; }
export function monsterOnCell(x, y){ return S.monsters.some(m => (m.x === x && m.y === y) || (m.moving && wrapX(m.tx) === x && wrapY(m.ty) === y)); }

export function addScore(n, x?, y?){
  S.score += n;
  if (x !== undefined) S.pops.push({ x, y, text: String(n), life: 0.9 });
  while (S.score >= S.nextLife) { S.lives++; S.nextLife += 20000; sfx.life(); }
  if (S.score > best) setBest(S.score);
}
export function burst(x, y, roles, n = 14){
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = 40 + Math.random() * 90;
    S.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, life: 0.5 + Math.random() * 0.4, role: roles[i % roles.length] });
  }
}

/* ---------- player ---------- */
export function setFace(d){ S.player.face = d.dx > 0 ? 'right' : d.dx < 0 ? 'left' : d.dy < 0 ? 'up' : 'down'; }
export function tryMove(d){
  const p = S.player; setFace(d);
  const nx = p.x + d.dx, ny = p.y + d.dy, cx = wrapX(nx), cy = wrapY(ny);   // nx/ny may sit just past an edge, for a smooth slide through it
  const bag = bagAt(cx, cy);
  if (bag) {
    if (bag.state === 'fall' || d.dy !== 0) return;
    const mx = wrapX(cx + d.dx);
    if (bagAt(mx, cy) || monsterOnCell(mx, cy) || S.em[idx(mx, cy)]) return;   // a sack can't be pushed onto an emerald
    bag.x = mx; bag.slide = Math.abs(mx - cx) === 1 ? -d.dx : 0; bag.fy = bag.y;
    if (bag.state === 'wobble') bag.state = 'rest';
  }
  const digging = !S.dug[idx(cx, cy)];
  S.dug[idx(cx, cy)] = 1;
  p.speed = (digging ? CART_DIG : CART_RUN) * pace();
  p.tx = nx; p.ty = ny; p.t = 0; p.moving = true; p.mdx = d.dx; p.mdy = d.dy; p.collected = false;
}
export function collectGem(x, y){
  const i = idx(x, y); if (!S.em[i]) return;
  S.em[i] = 0; S.emLeft--;
  S.streak = (S.time - S.lastGem < 1.6) ? S.streak + 1 : 1; S.lastGem = S.time;
  addScore(25);
  if (S.streak >= 8) { S.streak = 0; addScore(250, x * C + C / 2, y * C); sfx.chain(); } else sfx.gem(S.streak);
  burst(x * C + C / 2, y * C + C / 2, ['gem', 'gemHi'], 6);
}
export function updatePlayer(dt){
  const p = S.player, d = wantDir();
  if (p.moving) {
    if (d && d.dx === -p.mdx && d.dy === -p.mdy) {
      [p.x, p.tx] = [p.tx, p.x]; [p.y, p.ty] = [p.ty, p.y];
      p.t = 1 - p.t; p.mdx = d.dx; p.mdy = d.dy; p.collected = true; setFace(d);
    }
    p.t += dt * p.speed * (S.boostT > 0 ? BOOST_MUL : 1);
    if (S.boostT > 0 && Math.random() < 0.6) { const q = ppos(p); S.parts.push({ x: q.x - p.mdx * 12, y: q.y - p.mdy * 12 + 6, vx: -p.mdx * 40 + (Math.random() - .5) * 30, vy: -p.mdy * 40 - 10, life: 0.3, role: Math.random() < .5 ? 'sparkTrail' : 'track' }); }
    if (!p.collected && p.t >= 0.5) { collectGem(wrapX(p.tx), wrapY(p.ty)); p.collected = true; }
    if (p.t >= 1) { p.x = p.tx = wrapX(p.tx); p.y = p.ty = wrapY(p.ty); p.t = 0; p.moving = false; }
  }
  if (!p.moving && d) tryMove(d);
  const pp = ppos(p);
  for (let i = S.golds.length - 1; i >= 0; i--) {
    const g = S.golds[i];
    if (wdist(g.x * C + C / 2, g.y * C + C / 2, pp.x, pp.y) < C * 0.55) {
      S.golds.splice(i, 1); addScore(500, pp.x, pp.y - 10); sfx.gold(); burst(pp.x, pp.y, ['gold', 'goldHi'], 10);
    }
  }
  if (S.sun.active && wdist(S.sun.x * C + C / 2, S.sun.y * C + C / 2, pp.x, pp.y) < C * 0.6) {
    S.sun.active = false; S.sun.used = true; track('sunstone', { level: S.level });
    addScore(1000, pp.x, pp.y - 10); sfx.sun();
    S.bonusT = Math.max(5, 15 - S.level); S.bonusChain = 0;
    S.monsters.forEach(m => { if (m.type === 'b') { m.type = 'g'; m.morphT = 8; } });
  }
  if (S.sparks.length === 0) S.charge = Math.min(1, S.charge + dt / 2.6);
  if (boostQueued) { clearBoostQueued(); if (S.boost >= 1 && S.boostT <= 0) { S.boostT = BOOST_TIME; S.boost = 0; sfx.boost(); } }
  if (S.boostT > 0) S.boostT -= dt;
  else if (S.boost < 1) { S.boost = Math.min(1, S.boost + dt / BOOST_RECHARGE); if (S.boost >= 1) sfx.boostReady(); }
  if (fireQueued || fireHeld) {
    clearFireQueued();
    if (S.charge >= 1 && S.sparks.length === 0) {
      const f = { right:[1,0], left:[-1,0], up:[0,-1], down:[0,1] }[p.face];
      S.sparks.push({ x: pp.x, y: pp.y, dx: f[0], dy: f[1], trail: [], age: 0 });
      S.charge = 0; sfx.zap();
    }
  }
}

/* ---------- sacks ---------- */
export function updateBags(dt){
  const pp = ppos(S.player);
  for (let i = S.bags.length - 1; i >= 0; i--) {
    const b = S.bags[i];
    b.slide *= Math.pow(0.0005, dt); if (Math.abs(b.slide) < 0.01) b.slide = 0;
    if (b.state === 'rest' || b.state === 'wobble') {
      const can = inb(b.x, b.y + 1) && S.dug[idx(b.x, b.y + 1)] && !bagAt(b.x, b.y + 1);
      if (b.state === 'rest' && can) { b.state = 'wobble'; b.t = 0.6; }
      else if (b.state === 'wobble') {
        if (!can) b.state = 'rest';
        else if ((b.t -= dt) <= 0) { b.state = 'fall'; b.fy = b.y; b.dist = 0; }
      }
    } else if (b.state === 'fall') {
      b.fy += dt * 9;
      let landed = false;
      while (b.fy >= b.y + 1) {
        b.y += 1; b.dist += 1;
        const ci = idx(b.x, b.y);
        if (S.em[ci]) { S.em[ci] = 0; S.emLeft--; burst(b.x * C + C / 2, b.y * C + C / 2, ['gemDark', 'gem', 'gemHi'], 10); }   // a falling sack smashes any emerald in its way
        const below = b.y + 1;
        if (!inb(b.x, below) || !S.dug[idx(b.x, below)] || S.bags.some(o => o !== b && o.x === b.x && o.y === below)) { landed = true; break; }
      }
      const bx = b.x * C + C / 2, by = b.fy * C + C / 2;
      for (let j = S.monsters.length - 1; j >= 0; j--) {
        const mp = ppos(S.monsters[j]);
        if (Math.abs(wrapD(mp.x - bx, W * C)) < C * 0.7 && mp.y - by > -C * 0.2 && mp.y - by < C * 0.85) {
          const m = S.monsters[j];
          if (b.hits && b.hits.has(m)) continue;   // one blow per sack
          if (m.hp > 1) { m.hp--; m.hitT = 0.6; (b.hits ||= new Set()).add(m); sfx.thud(); }
          else killMonster(j, 250);
        }
      }
      if (S.mode === 'play' && Math.abs(wrapD(pp.x - bx, W * C)) < C * 0.6 && pp.y - by > -C * 0.2 && pp.y - by < C * 0.8) killPlayer('sack');
      if (landed) {
        b.fy = b.y;
        if (b.dist >= 2) {
          S.bags.splice(i, 1); S.golds.push({ x: b.x, y: b.y, t: 12 });
          sfx.burst(); burst(bx, b.y * C + C / 2, ['gold', 'goldHi', 'bag'], 16);
        } else { b.state = 'rest'; sfx.thud(); }
      }
    }
  }
  for (let i = S.golds.length - 1; i >= 0; i--) if ((S.golds[i].t -= dt) <= 0) S.golds.splice(i, 1);
}

/* ---------- grubs ---------- */
export function computeDist(){
  const dist = S.dist; dist.fill(-1);
  const pc = pcell(S.player); if (!inb(pc.x, pc.y)) return;
  const q = [pc.x, pc.y]; dist[idx(pc.x, pc.y)] = 0;
  for (let h = 0; h < q.length; h += 2) {
    const x = q[h], y = q[h + 1], dd = dist[idx(x, y)];
    for (const k in DIRS) {
      const nx = wrapX(x + DIRS[k].dx), ny = wrapY(y + DIRS[k].dy);
      const i = idx(nx, ny);
      if (dist[i] >= 0 || !S.dug[i] || restingBagAt(nx, ny)) continue;
      dist[i] = dd + 1; q.push(nx, ny);
    }
  }
}
export const smartness = () => Math.min(1, (S.level - 1) / 6);   // 0 on seam 1, full cunning by seam 7
/* speed: everything starts slow. The cart starts at 72% of full speed and the grubs at about a third of that;
   both gain every level, and the grubs are always capped just under the cart's open-tunnel speed. */
export const CART_RUN = 6.2, CART_DIG = 4.3;
// the cart starts at 72% and gains a little every level, reaching full speed around level 9, then up to 135%
export const pace = () => S.level <= 8 ? 0.72 + 0.035 * (S.level - 1) : Math.min(1.35, 1 + 0.04 * (S.level - 8));
export const EARLY = [1.0, 1.25, 1.55];   // levels 1 to 3 crawl, so new players can learn the sacks
export const grubSpeed = () => Math.min(S.level <= 3 ? EARLY[S.level - 1] : 1.55 + 0.4 * (S.level - 3), 0.92 * CART_RUN * pace());
export function spawnMonster(){
  const rock = S.level >= 4 && Math.random() < Math.min(0.45, 0.12 * (S.level - 3));
  S.monsters.push({ x: W - 2, y: 1, tx: W - 2, ty: 1, t: 0, moving: false, mdx: -1, mdy: 0,
    type: rock ? 'r' : 'g', hp: rock ? (S.level >= 7 ? 3 : 2) : 1, hitT: 0,
    morphT: (7 + Math.random() * 10) * (1 - 0.55 * smartness()), wait: 0, wob: Math.random() * 6 });
  S.spawned++;
}
export function killMonster(j, pts){
  const m = S.monsters[j], mp = ppos(m);
  if (m.type === 'r') pts *= 2;
  S.monsters.splice(j, 1);
  addScore(pts, mp.x, mp.y - 10); sfx.kill();
  burst(mp.x, mp.y, m.type === 'b' ? ['borer', 'borerBelly'] : ['grub', 'grubBelly'], 14);
}
export function updateMonsters(dt){
  const bonus = S.bonusT > 0;
  const base = grubSpeed() * (bonus ? 0.7 : 1);
  const pp = ppos(S.player), smart = smartness();
  for (const m of S.monsters) {
    m.wob += dt * 10;
    if (m.hitT > 0) m.hitT -= dt;
    if (!bonus && m.type !== 'r') {
      m.morphT -= dt;
      if (m.morphT <= 0 && !m.moving) {
        if (m.type === 'g') { m.type = 'b'; m.morphT = 4 + Math.random() * 3 + 5 * smart; }
        else { m.type = 'g'; m.morphT = (7 + Math.random() * 10) * (1 - 0.55 * smart); }
      }
    }
    const spd = base * (m.type === 'b' ? 0.72 + 0.12 * smart : m.type === 'r' ? 0.88 : 1);
    if (m.moving) {
      m.t += dt * spd;
      if (m.t >= 1) { m.x = m.tx = wrapX(m.tx); m.y = m.ty = wrapY(m.ty); m.t = 0; m.moving = false; }
      continue;
    }
    if ((m.wait -= dt) > 0) continue;
    let pick = null;
    if (m.type === 'g') {
      const opts = [];
      for (const k in DIRS) {
        const d = DIRS[k], ux = m.x + d.dx, uy = m.y + d.dy, nx = wrapX(ux), ny = wrapY(uy);
        if (!S.dug[idx(nx, ny)] || restingBagAt(nx, ny)) continue;
        const dd = S.dist[idx(nx, ny)];
        opts.push({ d, nx, ny, ux, uy, dist: dd < 0 ? 999 : dd, back: d.dx === -m.mdx && d.dy === -m.mdy });
      }
      let pool = opts.filter(o => !o.back); if (!pool.length) pool = opts;
      if (pool.length) {
        if (Math.random() < 0.14 - 0.12 * smart) pick = pool[(Math.random() * pool.length) | 0];
        else { pool.sort((a, b) => bonus ? b.dist - a.dist : a.dist - b.dist); pick = pool[0]; }
      }
    } else {
      const mx = m.x * C + C / 2, my = m.y * C + C / 2;
      const sgn = bonus ? -1 : 1;   // a frightened digger burrows away from you
      const ddx = wrapD(pp.x - mx, W * C), ddy = wrapD(pp.y - my, H * C);   // the short way round, through an edge if that's nearer
      const ax = sgn * Math.sign(ddx), ay = sgn * Math.sign(ddy);
      const order = Math.abs(ddx) > Math.abs(ddy) ? [{dx:ax,dy:0},{dx:0,dy:ay}] : [{dx:0,dy:ay},{dx:ax,dy:0}];
      order.push(...Object.values(DIRS).sort(() => Math.random() - 0.5));   // blocked by a sack: dig round it
      // from seam 3, diggers shove sacks sideways like the cart does
      const canShove = S.level >= 3 && !bonus, pc = pcell(S.player);
      const shove = (d, nx, ny) => {
        if (!canShove || d.dy !== 0) return false;
        const b = restingBagAt(nx, ny); if (!b) return false;
        const bx = wrapX(nx + d.dx);
        if (bagAt(bx, ny) || monsterOnCell(bx, ny) || S.em[idx(bx, ny)] || (pc.x === bx && pc.y === ny)) return false;
        b.x = bx; b.slide = Math.abs(bx - nx) === 1 ? -d.dx : 0; b.fy = b.y; if (b.state === 'wobble') b.state = 'rest';
        sfx.thud();
        return true;
      };
      // the cunning part: if a sack beside me would land right above the cart, push it there
      if (canShove && pc.y > m.y) {
        for (const dx of [-1, 1]) {
          const nx = wrapX(m.x + dx);
          if (pc.x === wrapX(nx + dx) && shove({ dx, dy: 0 }, nx, m.y)) { pick = { d: { dx, dy: 0 }, nx, ny: m.y, ux: m.x + dx, uy: m.y }; break; }
        }
      }
      if (!pick) for (const d of order) {
        if (!d.dx && !d.dy) continue;
        const ux = m.x + d.dx, uy = m.y + d.dy, nx = wrapX(ux), ny = wrapY(uy);
        if (!bagAt(nx, ny) || shove(d, nx, ny)) { pick = { d, nx, ny, ux, uy }; break; }
      }
      if (pick) S.dug[idx(pick.nx, pick.ny)] = 1;
    }
    if (pick) { m.tx = pick.ux ?? pick.nx; m.ty = pick.uy ?? pick.ny; m.t = 0; m.moving = true; m.mdx = pick.d.dx; m.mdy = pick.d.dy; }
    else m.wait = 0.25;
  }
  for (let j = S.monsters.length - 1; j >= 0; j--) {
    const mp = ppos(S.monsters[j]);
    if (wdist(mp.x, mp.y, pp.x, pp.y) < C * 0.68) {
      if (bonus) { const v = [200, 400, 800, 1600][Math.min(3, S.bonusChain)]; sfx.eat(S.bonusChain); S.bonusChain++; killMonster(j, v); }
      else { killPlayer({ g: 'grub', b: 'borer', r: 'rockjaw' }[S.monsters[j].type] || 'grub'); return; }
    }
  }
}

/* ---------- sparks ---------- */
export function updateSparks(dt){
  for (let i = S.sparks.length - 1; i >= 0; i--) {
    const s = S.sparks[i];
    s.trail.unshift({ x: s.x, y: s.y }); if (s.trail.length > 5) s.trail.pop();
    s.x += s.dx * dt * 14 * C; s.y += s.dy * dt * 14 * C; s.age = (s.age || 0) + dt;
    const fw = W * C, fh = H * C, ox = s.x, oy = s.y;
    s.x = ((s.x % fw) + fw) % fw; s.y = ((s.y % fh) + fh) % fh;
    if (s.x !== ox || s.y !== oy) s.trail.length = 0;   // jumped through an edge
    const cx = Math.floor(s.x / C), cy = Math.floor(s.y / C);
    let dead = s.age > 1.4 || !S.dug[idx(cx, cy)] || restingBagAt(cx, cy);
    for (let j = S.monsters.length - 1; j >= 0 && !dead; j--) {
      const mp = ppos(S.monsters[j]);
      if (wdist(mp.x, mp.y, s.x, s.y) < C * 0.6) {
        const m = S.monsters[j];
        if (m.hp > 1) { m.hp--; m.hitT = 0.45; sfx.thud(); } else killMonster(j, 250);
        dead = true;
      }
    }
    if (dead) { S.sparks.splice(i, 1); burst(s.x - s.dx * 6, s.y - s.dy * 6, ['spark', 'sparkTrail'], 6); }
  }
}

/* ---------- life and death ---------- */
export function killPlayer(cause){
  if (S.mode !== 'play') return;
  track('life_lost', { level: S.level, cause: cause || 'grub' });
  S.mode = 'dying'; S.modeT = 1.7; sfx.die();
  const pp = ppos(S.player); burst(pp.x, pp.y, ['cart', 'drill', 'window'], 20);
}
export function afterDeath(){
  S.lives--;
  if (S.lives <= 0) {
    finishGame();
    return;
  }
  S.spawned -= S.monsters.length; S.monsters = []; S.sparks = [];
  S.bonusT = 0; S.spawnT = 1.5;
  resetPlayer();
  S.mode = 'ready'; S.modeT = 1.2;
}

export function update(dt){
  if (S.mode === 'ready') { if ((S.modeT -= dt) <= 0) S.mode = 'play'; return; }
  if (S.mode === 'dying') { S.player.deadT += dt; updateBags(dt); if ((S.modeT -= dt) <= 0) afterDeath(); return; }
  if (S.mode === 'clear') { if ((S.modeT -= dt) <= 0) { S.level++; genLevel(S.level); S.mode = 'ready'; S.modeT = 1.4; saveBest(); } return; }
  if (S.mode !== 'play') return;
  if ((S.distT -= dt) <= 0) { computeDist(); S.distT = 0.12; }
  updatePlayer(dt);
  updateBags(dt); if (S.mode !== 'play') return;
  updateSparks(dt);
  updateMonsters(dt); if (S.mode !== 'play') return;
  if (S.bonusT > 0) {
    S.bonusT -= dt;
    if ((S.sirenT -= dt) <= 0) { S.sirenHi = !S.sirenHi; sfx.siren(S.sirenHi); S.sirenT = 0.28; }
  } else if (S.spawned < S.total && S.monsters.length < S.maxAlive) {
    if ((S.spawnT -= dt) <= 0) { spawnMonster(); S.spawnT = Math.max(1.6, 6 - 0.45 * S.level); /* early levels: grubs arrive well apart */ }
  }
  if (S.spawned >= S.total && !S.sun.used && !S.sun.active && S.monsters.length) S.sun.active = true;
  if (S.emLeft <= 0 || (S.spawned >= S.total && S.monsters.length === 0)) { S.mode = 'clear'; S.modeT = 2.2; S.bonusT = 0; sfx.clear(); track('level_cleared', { level: S.level, how: S.emLeft <= 0 ? 'emeralds' : 'grubs' }); }
}
export function drawTunnels(){
  g.fillStyle = col('core');
  const ins = 3;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!S.dug[idx(x, y)]) continue;
    const X = x * C, Y = y * C;
    g.fillRect(X + ins, Y + ins, C - ins * 2, C - ins * 2);
    if (x + 1 < W && S.dug[idx(x + 1, y)]) g.fillRect(X + C - ins, Y + ins, ins * 2, C - ins * 2);
    if (y + 1 < H && S.dug[idx(x, y + 1)]) g.fillRect(X + ins, Y + C - ins, C - ins * 2, ins * 2);
    // a tunnel that carries on at the far side is open to the edge
    if (x === W - 1 && S.dug[idx(0, y)]) g.fillRect(X + C - ins, Y + ins, ins, C - ins * 2);
    if (x === 0 && S.dug[idx(W - 1, y)]) g.fillRect(X, Y + ins, ins, C - ins * 2);
    if (y === H - 1 && S.dug[idx(x, 0)]) g.fillRect(X + ins, Y + C - ins, C - ins * 2, ins);
    if (y === 0 && S.dug[idx(x, H - 1)]) g.fillRect(X + ins, Y, C - ins * 2, ins);
  }
  g.fillStyle = col('spawn');
  g.fillRect((W - 2) * C + 6, C + 6, 4, 4); g.fillRect((W - 1) * C - 10, C + 6, 4, 4);   // marks on the den's mouth
}
export function drawGem(x, y){
  const X = x * C + C / 2, Y = y * C + C / 2;
  g.fillStyle = col('gemDark'); poly([X, Y - 11, X + 10, Y - 2, X, Y + 12, X - 10, Y - 2]);
  g.fillStyle = col('gem');     poly([X, Y - 8, X + 7, Y - 2, X, Y + 9, X - 7, Y - 2]);
  g.fillStyle = col('gemHi');   poly([X - 3, Y - 5, X + 3, Y - 5, X, Y - 1]);
}
export function drawBag(b){
  const X = (b.x + b.slide) * C + C / 2, Y = (b.state === 'fall' ? b.fy : b.y) * C + C / 2;
  g.save(); g.translate(X, Y);
  if (b.state === 'wobble') g.translate(Math.round(Math.sin(S.time * 40) * 2), 0);
  g.fillStyle = col('bagDark'); rr(-12, -6, 24, 19, 6); g.fill();
  g.fillStyle = col('bag'); rr(-10, -4, 20, 15, 5); g.fill();
  poly([-6, -4, -9, -12, 0, -8, 9, -12, 6, -4]);
  g.fillStyle = col('bagBand'); g.fillRect(-7, -6, 14, 3); g.fillRect(-2, 1, 4, 6); g.fillRect(-5, 3, 10, 2);
  g.restore();
}
export function drawGold(o){
  if (o.t < 3 && Math.floor(o.t * 8) % 2) return;
  const X = o.x * C + C / 2, Y = o.y * C + C / 2 + 4;
  for (const [dx, dy] of [[-7, 3], [0, 4], [7, 3], [-3, -3], [4, -3], [0, -8]]) {
    g.fillStyle = col('goldDark'); circ(X + dx, Y + dy + 1, 4.5);
    g.fillStyle = col('gold'); circ(X + dx, Y + dy, 3.6);
  }
}
export function drawSun(){
  if (!S.sun.active) return;
  const X = S.sun.x * C + C / 2, Y = S.sun.y * C + C / 2;
  g.save(); g.translate(X, Y); g.rotate(Math.floor(S.time * 6) * Math.PI / 8);
  g.fillStyle = col('sunRay'); for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); g.fillRect(-2, -14, 4, 5); }
  g.restore();
  g.fillStyle = col(Math.floor(S.time * 6) % 2 ? 'sun' : 'sunRay'); circ(X, Y, 8);
  g.fillStyle = col('bg'); g.fillRect(X - 3, Y - 3, 2, 2); g.fillRect(X + 1, Y - 3, 2, 2);
}
export function drawMonster(m){ for (const q of wrapSpots(ppos(m))) drawMonsterAt(m, q); }
export function drawMonsterAt(m, p){
  const bonus = S.bonusT > 0;
  const flashing = bonus && S.bonusT < 2 && Math.floor(S.bonusT * 8) % 2;
  g.save(); g.translate(p.x, p.y);
  const bob = Math.sin(m.wob) > 0 ? -1 : 1;
  let body, belly;
  if (bonus) { body = flashing ? 'scaredFlash' : 'scared'; belly = 'scaredBelly'; }
  else if (m.type === 'b' || m.type === 'r') { body = 'borer'; belly = 'borerBelly'; }
  if (m.hitT > 0 && Math.floor(m.hitT * 20) % 2) body = 'eye';
  else { body = 'grub'; belly = 'grubBelly'; }
  // segmented grub: three humps
  g.fillStyle = col(body);
  circ(-7, 4 - bob, 6); circ(7, 4 + bob, 6); circ(0, -1, 10);
  g.fillStyle = col(belly); g.fillRect(-9, 6, 18, 3);
  if (m.type === 'r' && !bonus) {
    // rockjaw: banded shell and a row of grinding teeth
    g.fillStyle = col('bg'); g.fillRect(-10, -2, 20, 2); g.fillRect(-12, 3, 24, 2);
    g.fillStyle = col('eye'); for (let i = 0; i < 4; i++) g.fillRect(-7 + i * 4, 9, 2, 4);
    g.fillStyle = col('horn'); g.fillRect(-15, 1, 4, 4); g.fillRect(11, 1, 4, 4);
    // remaining toughness, as pips over its head
    g.fillStyle = col('eye'); for (let i = 0; i < m.hp; i++) g.fillRect(-(m.hp * 5 - 1) / 2 + i * 5, -16, 3, 3);
  }
  if (m.type === 'b' && !bonus) {
    g.fillStyle = col('horn');
    poly([-8, -6, -12, -16, -3, -9]); poly([8, -6, 12, -16, 3, -9]);
  }
  const lx2 = m.mdx * 2, ly2 = m.mdy * 2;
  if (bonus) {
    g.fillStyle = col('pupil'); g.fillRect(-6, -4, 3, 3); g.fillRect(3, -4, 3, 3);
    for (let i = 0; i < 5; i++) g.fillRect(-7 + i * 3, 3 + (i % 2) * 2, 2, 2);
  } else {
    g.fillStyle = col('eye'); g.fillRect(-8, -7, 7, 6); g.fillRect(1, -7, 7, 6);
    g.fillStyle = col('pupil'); g.fillRect(-6 + lx2, -5 + ly2, 3, 3); g.fillRect(3 + lx2, -5 + ly2, 3, 3);
    if (m.type === 'b') g.fillRect(-4, 4, 8, 2);
  }
  g.restore();
}
export function drawPlayer(){ for (const q of wrapSpots(ppos(S.player))) drawPlayerAt(q); }
export function drawPlayerAt(pos){
  const p = S.player;
  if (S.mode === 'dying' && Math.floor(p.deadT * 10) % 2) return;
  g.save(); g.translate(pos.x, pos.y);
  if (S.mode === 'dying') g.rotate(Math.floor(p.deadT * 8) * Math.PI / 2);
  else if (p.face === 'left') g.scale(-1, 1);
  else if (p.face === 'up') g.rotate(-Math.PI / 2);
  else if (p.face === 'down') g.rotate(Math.PI / 2);
  g.fillStyle = col('track'); rr(-13, 5, 20, 8, 3); g.fill();
  g.fillStyle = col('wheel');
  const roll = p.moving ? Math.floor(S.time * 20) % 2 : 0;
  for (let i = 0; i < 3; i++) g.fillRect(-11 + i * 6 + roll, 8, 3, 3);
  g.fillStyle = col('cartShade'); rr(-13, -9, 19, 15, 3); g.fill();
  g.fillStyle = col('cart'); rr(-13, -9, 19, 11, 3); g.fill();
  g.fillStyle = col('window'); g.fillRect(-9, -6, 8, 5);
  g.fillStyle = col('lamp'); g.fillRect(-12, -13, 4, 4);
  g.fillStyle = col('drill'); poly([5, -9, 17, 0, 5, 9]);
  g.fillStyle = col('drillLine');
  const sp = p.moving ? Math.floor(S.time * 24) % 3 : 0;
  for (let x = 7 + sp; x < 15; x += 3) { const h = Math.max(1, 8 * (1 - (x - 5) / 12)); g.fillRect(x, -h, 1.5, h * 2); }
  g.restore();
}
export function drawSparks(){
  for (const s of S.sparks) {
    g.fillStyle = col('sparkTrail'); s.trail.forEach((t, i) => { if (i % 2 === 0) g.fillRect(t.x - 2, t.y - 2, 4, 4); });
    g.fillStyle = col('spark'); g.fillRect(s.x - 4, s.y - 4, 8, 8);
  }
}

/* HUD row and banners are drawn in screen pixels at the top of the buffer */
export function drawHud(){
  g.fillStyle = col('bg'); g.fillRect(0, 0, LW, HUD);
  txt(String(S.score).padStart(6, '0'), 6, 6, 'text');
  const wide = LW >= 330;
  if (wide) txt('HI ' + String(best).padStart(6, '0'), 80, 6, 'hud');
  // lives as pixel hearts, the one you're playing included
  const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
  const maxH = wide ? 6 : 3, shown = Math.min(Math.max(0, S.lives), maxH), hx0 = wide ? 176 : 58;
  for (let i = 0; i < shown; i++) {
    const x = hx0 + i * 10;
    for (let r = 0; r < HEART.length; r++) for (let c = 0; c < 7; c++) if (HEART[r][c] === '#') { g.fillStyle = col(r === 1 && c === 1 ? 'textDim' : 'text'); g.fillRect(x + c, 5 + r, 1, 1); }
  }
  if (S.lives > maxH) txt('+' + (S.lives - maxH), hx0 + maxH * 10 + 1, 6, 'hud');
  // tiny F and B tags for the spark (fire) and boost meters
  const GLYPH = { F: ['###', '#..', '##.', '#..', '#..'], B: ['##.', '#.#', '##.', '#.#', '##.'] };
  for (const [ch, gy] of [['F', 5], ['B', 11]]) GLYPH[ch].forEach((row, r) => { for (let c = 0; c < 3; c++) if (row[c] === '#') { g.fillStyle = col('hud'); g.fillRect(LW - 62 + c, gy + r, 1, 1); } });
  txt('LEVEL ' + S.level, LW - 69, 6, 'hud', 'right');
  g.fillStyle = col('hud'); g.fillRect(LW - 56, 4, 50, 1); g.fillRect(LW - 56, 15, 50, 1); g.fillRect(LW - 56, 4, 1, 12); g.fillRect(LW - 7, 4, 1, 12);
  g.fillStyle = col(S.charge >= 1 ? 'text' : 'textDim'); g.fillRect(LW - 54, 6, Math.round(46 * S.charge), 3);
  const bl = S.boostT > 0 ? 1 : (S.boost || 0);
  if (!(S.boostT > 0 && Math.floor(S.time * 12) % 2)) { g.fillStyle = col(S.boostT > 0 || bl >= 1 ? 'gold' : 'textDim'); g.fillRect(LW - 54, 11, Math.round(46 * bl), 2); }
  g.fillStyle = col('hud'); for (let x = 0; x < LW; x += 4) g.fillRect(x, HUD - 2, 2, 1);
}
export function draw(){
  g.drawImage(dirtCanvas, 0, HUD);
  g.setTransform(K, 0, 0, K, 0, HUD);
  g.save(); g.beginPath(); g.rect(0, -10, W * C, H * C + 10); g.clip();   /* a little headroom so the cart's lamp and drill aren't trimmed in the top row */   // sprites half through an edge show on both sides, never over the score bar
  drawTunnels();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (S.em[idx(x, y)]) drawGem(x, y);
  S.golds.forEach(drawGold);
  S.bags.forEach(drawBag);
  drawSun();
  if (S.mode !== 'title') { S.monsters.forEach(drawMonster); drawPlayer(); }
  drawSparks();
  for (const q of S.parts) { g.fillStyle = col(q.role); g.fillRect(q.x - 2, q.y - 2, 4, 4); }
  g.restore();
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (const q of S.pops) if (Math.floor(q.life * 12) % 3) txt(q.text, q.x * K, q.y * K + HUD - 4, 'text', 'center');
  if (S.bonusT > 0 && Math.floor(S.time * 4) % 2) { g.fillStyle = col('textDim'); g.fillRect(0, LH - 2, LW, 2); g.fillRect(0, HUD, LW, 2); }
  drawHud();
  if (S.mode === 'ready') banner('LEVEL ' + S.level, `${S.emLeft} EMERALDS  ·  ${S.total} GRUBS`);
  if (S.mode === 'clear') banner('LEVEL CLEARED');
}

