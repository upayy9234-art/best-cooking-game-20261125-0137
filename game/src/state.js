// The kitchen's rules, kept apart from drawing and input so the screenshot
// stager can play the same game the player plays. Every action returns an event
// name the main loop turns into a sound; tick() returns the events of one step.
import {
  COMBO,
  COOK,
  DAY_SECONDS,
  DISHES,
  INGREDIENT_BY_ID,
  MAX_ORDERS,
  MISS_PENALTY,
  PATIENCE,
  PLATE_MAX,
  SPAWN,
  STARS,
  TIP_SHARE,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

let nextOrderId = 1;

export function createGame(random) {
  return {
    random,
    screen: SCREEN_TITLE,
    time: 0,
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    orders: [],
    plate: [],
    woks: [
      { ingredient: null, progress: 0, cooked: false, burnt: false, announced: false },
      { ingredient: null, progress: 0, cooked: false, burnt: false, announced: false },
    ],
    spawnIn: SPAWN.first,
    shakeOrderId: 0,
    shakeUntil: 0,
    popup: null,
    popupUntil: 0,
    stars: 0,
  };
}

/** Start a fresh shift: clear the rail, the plate and the woks, reset the clock. */
export function startDay(game) {
  game.screen = SCREEN_PLAY;
  game.time = 0;
  game.coins = 0;
  game.served = 0;
  game.missed = 0;
  game.combo = 0;
  game.bestCombo = 0;
  game.orders = [];
  game.plate = [];
  game.woks = game.woks.map(() => ({
    ingredient: null, progress: 0, cooked: false, burnt: false, announced: false,
  }));
  game.spawnIn = SPAWN.first;
  game.shakeOrderId = 0;
  game.popup = null;
  game.stars = 0;
  return ['bell'];
}

function patienceFor(dish) {
  return Math.max(PATIENCE.min, PATIENCE.base + PATIENCE.perIngredient * dish.recipe.length);
}

function spawnOrder(game) {
  const dish = game.random.weighted(DISHES);
  const patience = patienceFor(dish);
  game.orders.push({
    id: nextOrderId,
    dish,
    patience,
    patienceMax: patience,
  });
  nextOrderId += 1;
  return 'bell';
}

/** Same ingredients, in any order, as the dish's recipe. */
export function plateMatches(game, dish) {
  if (game.plate.length !== dish.recipe.length) return false;
  const have = [...game.plate].sort().join(',');
  const want = [...dish.recipe].sort().join(',');
  return have === want;
}

/** Does the plate already hold this ingredient? A dish never needs one twice. */
function plateHas(game, id) {
  return game.plate.includes(id);
}

/**
 * Add an ingredient from the counter. Items that must fry go to a free wok;
 * the rest land straight on the plate. Returns the event for the sound.
 */
export function addIngredient(game, id) {
  if (game.screen !== SCREEN_PLAY) return 'none';
  const item = INGREDIENT_BY_ID[id];
  if (!item) return 'none';
  if (game.plate.length >= PLATE_MAX) return 'full';
  if (item.cook > 0) {
    if (plateHas(game, id)) return 'dup';
    const wok = game.woks.find((w) => w.ingredient === null);
    if (!wok) return 'nowok';
    wok.ingredient = id;
    wok.progress = 0;
    wok.cooked = false;
    wok.burnt = false;
    wok.announced = false;
    return 'wok';
  }
  if (plateHas(game, id)) return 'dup';
  game.plate.push(id);
  return 'add';
}

/** Lift a finished item off a wok onto the plate; a burnt one is thrown away. */
export function takeWok(game, slot) {
  if (game.screen !== SCREEN_PLAY) return 'none';
  const wok = game.woks[slot];
  if (!wok || !wok.ingredient) return 'empty';
  if (wok.burnt) {
    wok.ingredient = null;
    wok.progress = 0;
    wok.cooked = false;
    wok.burnt = false;
    return 'burnt';
  }
  if (!wok.cooked) return 'cooking';
  if (game.plate.length >= PLATE_MAX) return 'full';
  game.plate.push(wok.ingredient);
  wok.ingredient = null;
  wok.progress = 0;
  wok.cooked = false;
  return 'plate';
}

/** Throw the whole plate away (a wrong mix, or a burnt dish). */
export function clearPlate(game) {
  if (game.screen !== SCREEN_PLAY) return 'none';
  if (game.plate.length === 0) return 'empty';
  game.plate = [];
  return 'trash';
}

/**
 * Serve the plate to a ticket. A matching plate pays the price, a tip for the
 * patience left, and a combo bonus; a wrong plate shakes the ticket.
 */
export function serveTicket(game, orderId) {
  if (game.screen !== SCREEN_PLAY) return 'none';
  const order = game.orders.find((o) => o.id === orderId);
  if (!order) return 'none';
  if (game.plate.length === 0) return 'empty';
  if (!plateMatches(game, order.dish)) {
    game.shakeOrderId = orderId;
    game.shakeUntil = game.time + 0.4;
    return 'mismatch';
  }
  const patienceShare = order.patience / order.patienceMax;
  const tip = Math.round(order.dish.price * TIP_SHARE * patienceShare);
  const comboBonus = Math.round(order.dish.price * Math.min(COMBO.cap, COMBO.step * game.combo));
  const earned = order.dish.price + tip + comboBonus;
  game.coins += earned;
  game.served += 1;
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  game.orders = game.orders.filter((o) => o.id !== orderId);
  game.plate = [];
  game.popup = `+${earned} koin${game.combo > 1 ? `  ·  kombo x${game.combo}` : ''}`;
  game.popupUntil = game.time + 1.4;
  return 'serve';
}

/** Advance the clock, the woks, the patience bars and the order spawns. */
export function tick(game, dt) {
  const events = [];
  if (game.screen !== SCREEN_PLAY) return events;
  game.time += dt;
  if (game.time >= DAY_SECONDS) {
    game.time = DAY_SECONDS;
    game.screen = SCREEN_OVER;
    game.stars = game.coins >= STARS.three ? 3 : game.coins >= STARS.two ? 2 : game.coins >= STARS.one ? 1 : 0;
    events.push('over');
    return events;
  }

  // Woks: fry, then burn if forgotten.
  for (const wok of game.woks) {
    if (!wok.ingredient) continue;
    const item = INGREDIENT_BY_ID[wok.ingredient];
    wok.progress += dt / item.cook;
    if (!wok.cooked && wok.progress >= 1) {
      wok.cooked = true;
      events.push('cooked');
    }
    if (wok.cooked && !wok.burnt && wok.progress >= 1 + COOK.burnGrace / item.cook) {
      wok.burnt = true;
      events.push('burn');
    }
  }

  // Patience: a ticket that runs out walks away.
  for (const order of [...game.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) {
      game.orders = game.orders.filter((o) => o.id !== order.id);
      game.missed += 1;
      game.combo = 0;
      game.coins = Math.max(0, game.coins - MISS_PENALTY);
      events.push('expire');
    }
  }

  // New orders arrive faster as the day wears on.
  game.spawnIn -= dt;
  if (game.spawnIn <= 0 && game.orders.length < MAX_ORDERS) {
    events.push(spawnOrder(game));
    const pressure = game.time / DAY_SECONDS;
    const interval = SPAWN.start + (SPAWN.end - SPAWN.start) * pressure;
    game.spawnIn = Math.max(SPAWN.min, interval * game.random.range(0.8, 1.2));
  }
  return events;
}
