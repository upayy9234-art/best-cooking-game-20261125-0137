// Warung Rush: Dapur Kilat — every tuning number, dish and colour in one place.
// The kitchen is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** One full shift (a day) lasts this long, in seconds. */
export const DAY_SECONDS = 150;

/** How many order tickets can wait on the rail at once. */
export const MAX_ORDERS = 4;

/** Seconds a ticket waits before the customer walks away. */
export const PATIENCE = { base: 34, perIngredient: 4, min: 26 };

/** How often a new order arrives; it speeds up as the day goes on. */
export const SPAWN = { first: 2.0, start: 6.5, end: 3.2, min: 3.0 };

/** Cooking: seconds on the wok before an item is ready, and the grace period
 *  before it burns. */
export const COOK = { chicken: 5.0, egg: 3.5, burnGrace: 3.5 };

/** Coins for a missed order, and the tip for a fast serve (share of price). */
export const MISS_PENALTY = 8;
export const TIP_SHARE = 0.6;

/** Combo: each consecutive serve without a miss adds this share of the price,
 *  up to this cap. */
export const COMBO = { step: 0.1, cap: 0.5 };

/** Stars on the day-over screen, by coins earned in the shift. */
export const STARS = { one: 150, two: 320, three: 500 };

/** Ingredients on the counter. `cook` names the wok time when the item must be
 *  fried before it can go on a plate; `key` is its keyboard shortcut. */
export const INGREDIENTS = [
  { id: 'nasi', name: 'Nasi', key: '1', color: '#f5efe0', dark: '#cbbf9e', cook: 0 },
  { id: 'mie', name: 'Mie', key: '2', color: '#f2c14e', dark: '#b98a1d', cook: 0 },
  { id: 'ayam', name: 'Ayam', key: '3', color: '#c97b2d', dark: '#7d4a12', cook: COOK.chicken },
  { id: 'telur', name: 'Telur', key: '4', color: '#f6e27a', dark: '#d9a400', cook: COOK.egg },
  { id: 'sayur', name: 'Sayur', key: '5', color: '#58b368', dark: '#2c7a3a', cook: 0 },
  { id: 'sambal', name: 'Sambal', key: '6', color: '#d93829', dark: '#8f1d12', cook: 0 },
  { id: 'kecap', name: 'Kecap', key: '7', color: '#4a2c17', dark: '#2a180a', cook: 0 },
  { id: 'teh', name: 'Es Teh', key: '8', color: '#e08a3c', dark: '#9c5a16', cook: 0 },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((item) => [item.id, item]));

/** The menu: every dish is a set of ingredients, in the order the ticket shows
 *  them. `weight` is how often the dish is ordered. */
export const DISHES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng', price: 18, weight: 5, recipe: ['nasi', 'telur', 'kecap', 'sayur'] },
  { id: 'mie-ayam', name: 'Mie Ayam', price: 20, weight: 5, recipe: ['mie', 'ayam', 'sayur'] },
  { id: 'sate-ayam', name: 'Sate Ayam', price: 22, weight: 4, recipe: ['ayam', 'sambal', 'kecap'] },
  { id: 'nasi-ayam', name: 'Nasi Ayam', price: 20, weight: 4, recipe: ['nasi', 'ayam', 'sambal'] },
  { id: 'mie-goreng', name: 'Mie Goreng', price: 19, weight: 4, recipe: ['mie', 'telur', 'kecap', 'sayur'] },
  { id: 'es-teh', name: 'Es Teh Manis', price: 6, weight: 3, recipe: ['teh'] },
];

/** A plate holds at most this many items. */
export const PLATE_MAX = 5;

export const PALETTE = {
  wall: '#f7e8c9',
  wallTile: '#f3ddb4',
  floor: '#b98a5a',
  counterTop: '#8a5a2b',
  counterFront: '#6e4520',
  rail: '#fff8e7',
  ticket: '#fffdf5',
  ticketEdge: '#d8c08a',
  plate: '#fdfdf8',
  plateRim: '#c9a86a',
  wok: '#3a3f4a',
  flame: '#ff9d2e',
  flameHot: '#ff5f2e',
  text: '#2b2118',
  muted: '#7a6a55',
  good: '#2e9e4f',
  warn: '#e08a00',
  bad: '#d93829',
  gold: '#f2c14e',
  panel: '#fff3d6',
  shadow: 'rgba(43, 33, 24, 0.25)',
};

export const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

/** Where the best shift is kept between visits (this browser only). */
export const BEST_KEY = 'warung-rush.best';
