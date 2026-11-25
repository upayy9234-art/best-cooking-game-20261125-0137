// Mouse and keyboard: every click and key is turned into one of the state's
// actions, and the action's event is handed back so the main loop can play the
// matching sound. Geometry comes from render.layout(), so a button is clicked
// exactly where it is drawn.
import { INGREDIENTS } from './config.js';
import { layout } from './render.js';
import {
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  addIngredient,
  clearPlate,
  plateMatches,
  serveTicket,
  takeWok,
} from './state.js';

function inside(box, x, y) {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

/** Serve the first ticket the plate matches; shake the first ticket otherwise. */
function serveFirstMatch(game) {
  const match = game.orders.find((order) => plateMatches(game, order.dish));
  if (match) return serveTicket(game, match.id);
  if (game.plate.length === 0) return 'empty';
  const first = game.orders[0];
  if (!first) return 'none';
  game.shakeOrderId = first.id;
  game.shakeUntil = game.time + 0.4;
  return 'mismatch';
}

export function createInput(canvas, hooks) {
  const { game, audio } = hooks;
  const geo = layout();

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
  }

  function act(eventName) {
    if (hooks.onEvent) hooks.onEvent(eventName);
  }

  function click(point) {
    audio.unlock();
    if (game.screen === SCREEN_TITLE) {
      hooks.onStart();
      return;
    }
    if (game.screen === SCREEN_OVER) {
      hooks.onRestart();
      return;
    }
    if (game.screen === SCREEN_PAUSED) {
      hooks.onResume();
      return;
    }
    if (inside(geo.mute, point.x, point.y)) {
      hooks.onToggleMute();
      return;
    }
    for (let i = 0; i < geo.stations.length; i += 1) {
      if (inside(geo.stations[i], point.x, point.y)) {
        act(addIngredient(game, geo.stations[i].id));
        return;
      }
    }
    for (let i = 0; i < geo.woks.length; i += 1) {
      if (inside(geo.woks[i], point.x, point.y)) {
        act(takeWok(game, i));
        return;
      }
    }
    for (let i = 0; i < game.orders.length; i += 1) {
      const box = geo.orders[i];
      if (box && inside(box, point.x, point.y)) {
        act(serveTicket(game, game.orders[i].id));
        return;
      }
    }
    if (inside(geo.serve, point.x, point.y)) {
      act(serveFirstMatch(game));
      return;
    }
    if (inside(geo.trash, point.x, point.y)) {
      act(clearPlate(game));
    }
  }

  function key(event) {
    const k = event.key.toLowerCase();
    audio.unlock();
    if (k === 'm') {
      hooks.onToggleMute();
      return;
    }
    if (game.screen === SCREEN_TITLE && (k === 'enter' || k === ' ')) {
      hooks.onStart();
      return;
    }
    if (game.screen === SCREEN_OVER && (k === 'enter' || k === ' ')) {
      hooks.onRestart();
      return;
    }
    if (k === 'p' || k === 'escape') {
      if (game.screen === SCREEN_PLAY) hooks.onPause();
      else if (game.screen === SCREEN_PAUSED) hooks.onResume();
      return;
    }
    if (game.screen !== SCREEN_PLAY) return;
    const station = INGREDIENTS.find((item) => item.key === k);
    if (station) {
      act(addIngredient(game, station.id));
      return;
    }
    if (k === 's' || k === 'enter') act(serveFirstMatch(game));
    else if (k === 'x' || k === 'backspace' || k === 'delete') act(clearPlate(game));
    else if (k === 'q') act(takeWok(game, 0));
    else if (k === 'w') act(takeWok(game, 1));
  }

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    click(toLogical(event));
  });
  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    key(event);
  });
}
