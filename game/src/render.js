// Everything the player sees, drawn on one canvas: the kitchen, the order rail,
// the woks, the plate, the counter, and the title / pause / day-over screens.
// The same layout() drives the hit-testing in input.js, so a button is drawn
// exactly where it can be clicked.
import { FIELD, FONT, INGREDIENTS, INGREDIENT_BY_ID, PALETTE } from './config.js';
import { SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, plateMatches } from './state.js';

/** Geometry of every clickable thing, in logical 1280x720 coordinates. */
export function layout() {
  const stations = INGREDIENTS.map((item, i) => ({
    id: item.id,
    x: 8 + i * 159,
    y: 506,
    w: 151,
    h: 196,
  }));
  return {
    stations,
    woks: [
      { x: 24, y: 252, w: 128, h: 128 },
      { x: 168, y: 252, w: 128, h: 128 },
    ],
    plate: { x: 560, y: 236, w: 260, h: 190 },
    serve: { x: 640, y: 436, w: 160, h: 52 },
    trash: { x: 820, y: 436, w: 120, h: 52 },
    orders: [0, 1, 2, 3].map((i) => ({ x: 8 + i * 318, y: 76, w: 310, h: 116 })),
    mute: { x: 1232, y: 10, w: 40, h: 40 },
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight ?? 700} ${size}px ${FONT}`;
  ctx.textAlign = align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

/** One ingredient, drawn as a small vector picture: no image files, no fonts. */
export function drawIngredient(ctx, id, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  switch (id) {
    case 'nasi': {
      ctx.fillStyle = '#f5efe0';
      ctx.beginPath();
      ctx.ellipse(0, r * 0.25, r * 0.95, r * 0.6, 0, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#cbbf9e';
      ctx.lineWidth = r * 0.08;
      ctx.stroke();
      ctx.fillStyle = '#e3d7b8';
      for (const [dx, dy] of [[-0.4, -0.1], [0, -0.3], [0.4, -0.05], [-0.15, 0.05], [0.25, 0.15]]) {
        ctx.beginPath();
        ctx.arc(dx * r, dy * r, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'mie': {
      ctx.strokeStyle = '#f2c14e';
      ctx.lineWidth = r * 0.16;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i += 1) {
        const y = -r * 0.35 + i * r * 0.35;
        ctx.beginPath();
        ctx.moveTo(-r * 0.8, y);
        ctx.bezierCurveTo(-r * 0.4, y - r * 0.25, -r * 0.1, y + r * 0.25, r * 0.2, y);
        ctx.bezierCurveTo(r * 0.5, y - r * 0.25, r * 0.65, y + r * 0.2, r * 0.8, y);
        ctx.stroke();
      }
      break;
    }
    case 'ayam': {
      ctx.fillStyle = '#c97b2d';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.75, r * 0.6, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#8a4f16';
      ctx.beginPath();
      ctx.ellipse(-r * 0.15, -r * 0.1, r * 0.4, r * 0.28, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f5efe0';
      ctx.lineWidth = r * 0.14;
      ctx.beginPath();
      ctx.moveTo(r * 0.55, r * 0.35);
      ctx.lineTo(r * 0.95, r * 0.7);
      ctx.stroke();
      break;
    }
    case 'telur': {
      ctx.fillStyle = '#fffdf2';
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.9, r * 0.65, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f6c945';
      ctx.beginPath();
      ctx.arc(r * 0.1, -r * 0.05, r * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8a91c';
      ctx.beginPath();
      ctx.arc(r * 0.1, -r * 0.05, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'sayur': {
      ctx.fillStyle = '#58b368';
      for (const [dx, dy, rot] of [[-0.35, 0.1, -0.6], [0, -0.25, 0], [0.35, 0.1, 0.6]]) {
        ctx.save();
        ctx.translate(dx * r, dy * r);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.32, r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = '#2c7a3a';
      ctx.lineWidth = r * 0.07;
      ctx.beginPath();
      ctx.moveTo(0, r * 0.35);
      ctx.lineTo(0, r * 0.7);
      ctx.stroke();
      break;
    }
    case 'sambal': {
      ctx.fillStyle = '#d93829';
      ctx.beginPath();
      ctx.ellipse(0, r * 0.15, r * 0.8, r * 0.5, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#ff7a5c';
      ctx.beginPath();
      ctx.arc(-r * 0.2, -r * 0.1, r * 0.12, 0, Math.PI * 2);
      ctx.arc(r * 0.25, 0, r * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3d6';
      ctx.beginPath();
      ctx.arc(-r * 0.05, r * 0.05, r * 0.06, 0, Math.PI * 2);
      ctx.arc(r * 0.35, r * 0.1, r * 0.05, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'kecap': {
      ctx.strokeStyle = '#4a2c17';
      ctx.lineWidth = r * 0.22;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.2);
      ctx.bezierCurveTo(-r * 0.3, -r * 0.55, r * 0.1, r * 0.25, r * 0.5, -r * 0.1);
      ctx.bezierCurveTo(r * 0.65, -r * 0.3, r * 0.7, r * 0.1, r * 0.75, r * 0.3);
      ctx.stroke();
      ctx.fillStyle = '#4a2c17';
      ctx.beginPath();
      ctx.arc(-r * 0.7, r * 0.35, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'teh': {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.strokeStyle = '#9c5a16';
      ctx.lineWidth = r * 0.08;
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, -r * 0.7);
      ctx.lineTo(-r * 0.4, r * 0.7);
      ctx.lineTo(r * 0.4, r * 0.7);
      ctx.lineTo(r * 0.55, -r * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e08a3c';
      ctx.beginPath();
      ctx.moveTo(-r * 0.48, -r * 0.35);
      ctx.lineTo(-r * 0.38, r * 0.6);
      ctx.lineTo(r * 0.38, r * 0.6);
      ctx.lineTo(r * 0.48, -r * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#d93829';
      ctx.lineWidth = r * 0.12;
      ctx.beginPath();
      ctx.moveTo(r * 0.2, -r * 0.35);
      ctx.lineTo(r * 0.45, -r * 0.95);
      ctx.stroke();
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

function drawDishOnPlate(ctx, plate, cx, cy, r) {
  // The plate itself.
  ctx.fillStyle = PALETTE.plate;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 1.35, r * 0.95, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.plateRim;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#efe6cf';
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 1.05, r * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  // Each plated ingredient, layered like a real dish.
  plate.forEach((id, i) => {
    const angle = -Math.PI / 2 + (i - (plate.length - 1) / 2) * 0.5;
    const dx = Math.cos(angle) * r * 0.35;
    const dy = Math.sin(angle) * r * 0.22;
    drawIngredient(ctx, id, cx + dx, cy + dy - r * 0.1, r * 0.52);
  });
}

function patienceColor(share) {
  if (share > 0.5) return PALETTE.good;
  if (share > 0.25) return PALETTE.warn;
  return PALETTE.bad;
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = Math.floor(FIELD.width * scale * dpr);
    canvas.height = Math.floor(FIELD.height * scale * dpr);
    canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
    canvas.style.height = `${Math.floor(FIELD.height * scale)}px`;
  }

  function drawKitchen() {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.wallTile;
    for (let y = 0; y < 200; y += 40) {
      for (let x = (y / 40) % 2 === 0 ? 0 : 40; x < FIELD.width; x += 80) {
        ctx.fillRect(x, y, 76, 36);
      }
    }
    // Window with a sunny street outside.
    ctx.fillStyle = '#bfe3f2';
    roundRect(ctx, 1060, 200, 200, 120, 10);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(1210, 240, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7fb069';
    ctx.fillRect(1060, 296, 200, 24);
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 6;
    roundRect(ctx, 1060, 200, 200, 120, 10);
    ctx.stroke();
    // Floor.
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 486, FIELD.width, 234);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let x = 0; x < FIELD.width; x += 96) ctx.fillRect(x, 486, 4, 234);
    // Counter front.
    ctx.fillStyle = PALETTE.counterFront;
    ctx.fillRect(0, 486, FIELD.width, 20);
  }

  function drawHeader(game, best) {
    ctx.fillStyle = PALETTE.counterTop;
    ctx.fillRect(0, 0, FIELD.width, 60);
    text(ctx, 'WARUNG RUSH', 16, 32, 28, '#ffe9b0', 900);
    text(ctx, 'Dapur Kilat', 264, 34, 16, '#f7d774', 700);
    text(ctx, `Koin  ${game.coins}`, 470, 32, 24, '#ffffff', 800);
    if (game.combo > 1) {
      ctx.fillStyle = '#ff9d2e';
      roundRect(ctx, 640, 14, 150, 32, 16);
      ctx.fill();
      text(ctx, `KOMBO x${game.combo}`, 715, 31, 18, '#2b2118', 900, 'center');
    }
    const left = Math.max(0, 150 - game.time);
    const urgent = left <= 30 && game.screen === SCREEN_PLAY;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, 1010, 14, 200, 32, 16);
    ctx.fill();
    ctx.fillStyle = urgent ? '#ff5f4d' : '#7ee2a0';
    roundRect(ctx, 1014, 18, 192 * (left / 150), 24, 12);
    ctx.fill();
    text(ctx, formatTime(left), 1110, 31, 20, '#ffffff', 900, 'center');
    text(ctx, `Terbaik ${Math.max(best, game.coins)}`, 860, 32, 16, '#ffe9b0', 700);
  }

  function drawOrders(game) {
    const geo = layout();
    text(ctx, 'PESANAN', 16, 68, 13, PALETTE.muted, 800);
    game.orders.forEach((order, i) => {
      const box = geo.orders[i];
      if (!box) return;
      const ready = plateMatches(game, order.dish);
      const shaking = game.shakeOrderId === order.id && game.time < game.shakeUntil;
      const dx = shaking ? Math.sin(game.time * 60) * 5 : 0;
      const share = Math.max(0, order.patience / order.patienceMax);
      ctx.save();
      ctx.translate(dx, 0);
      ctx.shadowColor = PALETTE.shadow;
      ctx.shadowBlur = ready ? 14 : 6;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = ready ? '#fff3c4' : PALETTE.ticket;
      roundRect(ctx, box.x, box.y, box.w, box.h, 12);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = ready ? '#e8a91c' : PALETTE.ticketEdge;
      ctx.lineWidth = ready ? 3 : 2;
      roundRect(ctx, box.x + dx, box.y, box.w, box.h, 12);
      ctx.stroke();
      text(ctx, order.dish.name, box.x + dx + 14, box.y + 24, 21, PALETTE.text, 800);
      text(ctx, `${order.dish.price} koin`, box.x + dx + box.w - 14, box.y + 24, 16, '#8a6d1f', 800, 'right');
      order.dish.recipe.forEach((id, j) => {
        drawIngredient(ctx, id, box.x + dx + 30 + j * 46, box.y + 62, 17);
      });
      ctx.fillStyle = '#e8ddc2';
      roundRect(ctx, box.x + dx + 14, box.y + 92, box.w - 28, 10, 5);
      ctx.fill();
      ctx.fillStyle = patienceColor(share);
      roundRect(ctx, box.x + dx + 14, box.y + 92, (box.w - 28) * share, 10, 5);
      ctx.fill();
      if (ready) {
        const label = order.dish.recipe.length <= 3 ? 'SIAP DISAJIKAN — KLIK!' : 'SIAP!';
        text(ctx, label, box.x + dx + box.w - 14, box.y + 62, 13, '#8a6d1f', 900, 'right');
      }
    });
    if (game.orders.length === 0 && game.screen === SCREEN_PLAY) {
      text(ctx, 'Menunggu pelanggan pertama…', 16, 130, 18, PALETTE.muted, 700);
    }
  }

  function drawWoks(game) {
    const geo = layout();
    text(ctx, 'WOK — GORENG DULU', 24, 232, 13, PALETTE.muted, 800);
    game.woks.forEach((wok, slot) => {
      const box = geo.woks[slot];
      const busy = wok.ingredient !== null;
      const flame = busy && !wok.burnt;
      // Flame.
      if (flame) {
        const flick = Math.sin(game.time * 9 + slot * 2) * 4;
        ctx.fillStyle = PALETTE.flameHot;
        ctx.beginPath();
        ctx.ellipse(box.x + box.w / 2, box.y + box.h + 6, 26 + flick, 12, 0, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = PALETTE.flame;
        ctx.beginPath();
        ctx.ellipse(box.x + box.w / 2, box.y + box.h + 4, 16 + flick * 0.5, 8, 0, Math.PI, 0);
        ctx.fill();
      }
      // Wok bowl.
      ctx.fillStyle = PALETTE.wok;
      ctx.beginPath();
      ctx.ellipse(box.x + box.w / 2, box.y + box.h / 2 + 8, box.w / 2, box.h / 2 - 6, 0, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#4a5060';
      ctx.beginPath();
      ctx.ellipse(box.x + box.w / 2, box.y + box.h / 2 + 8, box.w / 2 - 8, box.h / 2 - 12, 0, 0, Math.PI);
      ctx.fill();
      if (busy) {
        if (wok.burnt) {
          ctx.fillStyle = '#1c1c1c';
          ctx.beginPath();
          ctx.arc(box.x + box.w / 2, box.y + box.h / 2, 26, 0, Math.PI * 2);
          ctx.fill();
          text(ctx, 'GOSONG!', box.x + box.w / 2, box.y + box.h / 2 - 26, 14, PALETTE.bad, 900, 'center');
          text(ctx, 'klik untuk buang', box.x + box.w / 2, box.y + box.h + 26, 12, PALETTE.muted, 700, 'center');
        } else {
          drawIngredient(ctx, wok.ingredient, box.x + box.w / 2, box.y + box.h / 2, 30);
          const frac = Math.min(1, wok.progress);
          ctx.strokeStyle = wok.cooked ? PALETTE.good : '#f2c14e';
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.arc(box.x + box.w / 2, box.y + box.h / 2, 44, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
          ctx.stroke();
          text(
            ctx,
            wok.cooked ? 'MATANG — KLIK!' : 'menggoreng…',
            box.x + box.w / 2,
            box.y + box.h + 26,
            13,
            wok.cooked ? PALETTE.good : PALETTE.muted,
            800,
            'center',
          );
        }
      } else {
        text(ctx, 'wok kosong', box.x + box.w / 2, box.y + box.h + 26, 14, '#9aa0ad', 700, 'center');
      }
    });
  }

  function drawPlateArea(game) {
    const geo = layout();
    text(ctx, 'PIRING — RACIK PESANAN', 560, 232, 13, PALETTE.muted, 800);
    drawDishOnPlate(ctx, game.plate, 690, 318, 92);
    if (game.plate.length === 0) {
      text(ctx, 'Piring kosong — klik bahan di bawah', 690, 318, 15, PALETTE.muted, 700, 'center');
    } else {
      const names = game.plate.map((id) => INGREDIENT_BY_ID[id].name).join(' + ');
      text(ctx, names, 690, 406, 15, PALETTE.text, 700, 'center');
    }
    // Serve / trash buttons.
    ctx.fillStyle = '#2e9e4f';
    roundRect(ctx, geo.serve.x, geo.serve.y, geo.serve.w, geo.serve.h, 12);
    ctx.fill();
    text(ctx, 'SAJIKAN', geo.serve.x + geo.serve.w / 2, geo.serve.y + 27, 19, '#ffffff', 900, 'center');
    ctx.fillStyle = '#8a6a52';
    roundRect(ctx, geo.trash.x, geo.trash.y, geo.trash.w, geo.trash.h, 12);
    ctx.fill();
    text(ctx, 'BUANG', geo.trash.x + geo.trash.w / 2, geo.trash.y + 27, 16, '#ffffff', 800, 'center');
    if (game.popup && game.time < game.popupUntil) {
      ctx.fillStyle = '#2e9e4f';
      roundRect(ctx, 560, 196, 260, 34, 10);
      ctx.fill();
      text(ctx, game.popup, 690, 214, 17, '#ffffff', 900, 'center');
    }
  }

  function drawHelpPanel(game) {
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, 1004, 216, 268, 264, 14);
    ctx.fill();
    ctx.strokeStyle = '#e0c48f';
    ctx.lineWidth = 2;
    roundRect(ctx, 1004, 216, 268, 264, 14);
    ctx.stroke();
    text(ctx, 'CARA MAIN', 1024, 242, 16, PALETTE.text, 900);
    const lines = [
      '1. Klik bahan di meja',
      '    untuk isi piring.',
      '2. Ayam & telur harus',
      '    digoreng di wok dulu.',
      '3. Klik tiket pesanan',
      '    yang cocok untuk',
      '    menyajikan.',
      '4. Sajikan cepat =',
      '    tip lebih besar!',
      'Tombol 1–8: bahan',
      'S: sajikan · X: buang',
      'P: jeda · M: suara',
    ];
    lines.forEach((line, i) => text(ctx, line, 1024, 264 + i * 16, 14, PALETTE.text, 600));
    if (game.screen === SCREEN_PLAY) {
      text(ctx, `Disajikan ${game.served} · Terlewat ${game.missed}`, 1024, 466, 14, PALETTE.muted, 700);
    }
  }

  function drawCounter(game) {
    const geo = layout();
    geo.stations.forEach((box) => {
      const item = INGREDIENT_BY_ID[box.id];
      const onPlate = game.plate.includes(box.id);
      const inWok = game.woks.some((w) => w.ingredient === box.id);
      ctx.shadowColor = PALETTE.shadow;
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = onPlate || inWok ? '#ffe9b0' : '#fff8e7';
      roundRect(ctx, box.x, box.y, box.w, box.h, 14);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = onPlate || inWok ? '#e8a91c' : '#d8c08a';
      ctx.lineWidth = onPlate || inWok ? 3 : 2;
      roundRect(ctx, box.x, box.y, box.w, box.h, 14);
      ctx.stroke();
      drawIngredient(ctx, box.id, box.x + box.w / 2, box.y + 62, 40);
      text(ctx, item.name, box.x + box.w / 2, box.y + 122, 19, PALETTE.text, 800, 'center');
      text(ctx, item.cook > 0 ? 'goreng di wok' : 'langsung ke piring', box.x + box.w / 2, box.y + 146, 12, PALETTE.muted, 700, 'center');
      ctx.fillStyle = '#8a5a2b';
      ctx.beginPath();
      ctx.arc(box.x + box.w - 20, box.y + 20, 13, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, item.key, box.x + box.w - 20, box.y + 21, 14, '#ffffff', 900, 'center');
      if (onPlate) text(ctx, '✓ di piring', box.x + box.w / 2, box.y + 170, 13, PALETTE.good, 800, 'center');
      if (inWok) text(ctx, 'di wok…', box.x + box.w / 2, box.y + 170, 13, '#c97b2d', 800, 'center');
    });
  }

  function drawTitle(game, best) {
    ctx.fillStyle = 'rgba(43, 33, 24, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#fff8e7';
    roundRect(ctx, 290, 130, 700, 450, 20);
    ctx.fill();
    ctx.strokeStyle = PALETTE.plateRim;
    ctx.lineWidth = 3;
    roundRect(ctx, 290, 130, 700, 450, 20);
    ctx.stroke();
    text(ctx, 'WARUNG RUSH', 640, 196, 64, '#8a4f16', 900, 'center');
    text(ctx, 'Dapur Kilat — game memasak warung', 640, 240, 22, PALETTE.text, 700, 'center');
    drawIngredient(ctx, 'nasi', 520, 300, 34);
    drawIngredient(ctx, 'ayam', 590, 300, 34);
    drawIngredient(ctx, 'telur', 660, 300, 34);
    drawIngredient(ctx, 'sambal', 730, 300, 34);
    drawIngredient(ctx, 'teh', 790, 300, 34);
    const how = [
      'Pesanan datang di papan atas. Racik tiap hidangan dari bahan di meja,',
      'goreng ayam dan telur di wok, lalu sajikan sebelum pelanggan pergi.',
      'Sajian cepat dapat tip, sajian beruntun membangun kombo.',
      '',
      'Klik atau tekan 1–8 untuk bahan · S untuk sajikan · P untuk jeda',
    ];
    how.forEach((line, i) => text(ctx, line, 640, 356 + i * 26, 18, PALETTE.text, 600, 'center'));
    ctx.fillStyle = '#2e9e4f';
    roundRect(ctx, 490, 500, 300, 54, 14);
    ctx.fill();
    text(ctx, 'MULAI MEMASAK', 640, 528, 24, '#ffffff', 900, 'center');
    if (best > 0) text(ctx, `Shift terbaik: ${best} koin`, 640, 566, 16, PALETTE.muted, 700, 'center');
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(43, 33, 24, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, 'JEDA', 640, 330, 72, '#ffffff', 900, 'center');
    text(ctx, 'Tekan P atau klik untuk lanjut', 640, 390, 20, '#ffe9b0', 700, 'center');
  }

  function drawOver(game, best) {
    ctx.fillStyle = 'rgba(43, 33, 24, 0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#fff8e7';
    roundRect(ctx, 340, 120, 600, 470, 20);
    ctx.fill();
    ctx.strokeStyle = PALETTE.plateRim;
    ctx.lineWidth = 3;
    roundRect(ctx, 340, 120, 600, 470, 20);
    ctx.stroke();
    text(ctx, 'SHIFT SELESAI!', 640, 176, 48, '#8a4f16', 900, 'center');
    const stars = '★'.repeat(game.stars) + '☆'.repeat(3 - game.stars);
    text(ctx, stars, 640, 232, 44, '#e8a91c', 900, 'center');
    text(ctx, `${game.coins} koin`, 640, 296, 40, PALETTE.text, 900, 'center');
    text(ctx, `Hidangan disajikan: ${game.served}`, 640, 348, 20, PALETTE.text, 700, 'center');
    text(ctx, `Pesanan terlewat: ${game.missed}`, 640, 378, 20, PALETTE.text, 700, 'center');
    text(ctx, `Kombo terbaik: x${game.bestCombo}`, 640, 408, 20, PALETTE.text, 700, 'center');
    if (game.coins > best) text(ctx, 'Rekor baru!', 640, 442, 20, PALETTE.good, 900, 'center');
    else if (best > 0) text(ctx, `Terbaik: ${best} koin`, 640, 442, 18, PALETTE.muted, 700, 'center');
    ctx.fillStyle = '#2e9e4f';
    roundRect(ctx, 490, 480, 300, 54, 14);
    ctx.fill();
    text(ctx, 'MASAK LAGI', 640, 508, 24, '#ffffff', 900, 'center');
    text(ctx, 'Enter untuk main lagi', 640, 556, 14, PALETTE.muted, 700, 'center');
  }

  return {
    resize,
    draw(game, screen, best) {
      ctx.setTransform(canvas.width / FIELD.width, 0, 0, canvas.height / FIELD.height, 0, 0);
      drawKitchen();
      drawHeader(game, best);
      drawOrders(game);
      drawWoks(game);
      drawPlateArea(game);
      drawHelpPanel(game);
      drawCounter(game);
      if (screen === SCREEN_TITLE) drawTitle(game, best);
      else if (screen === SCREEN_PAUSED) drawPaused();
      else if (screen === SCREEN_OVER) drawOver(game, best);
    },
  };
}
