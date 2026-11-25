// The screenshot scenes behind ?shot=start|play|serve|end. Each one plays the
// real rules forward from a fresh day, steered by a small autopilot that uses
// the same state functions the player's clicks use, so the frame is what a
// short game really looks like and the same seed always gives the same frame.
import { DAY_SECONDS, INGREDIENT_BY_ID, STEP } from './config.js';
import {
  SCREEN_OVER,
  SCREEN_PLAY,
  SCREEN_TITLE,
  addIngredient,
  plateMatches,
  serveTicket,
  startDay,
  takeWok,
  tick,
} from './state.js';

const START_SECONDS = 6;
const PLAY_LIMIT_SECONDS = 60;
const SERVE_LIMIT_SECONDS = 90;

/** The first ticket the plate could still become, given what is on it. */
function targetOrder(game) {
  return game.orders.find((order) => game.plate.every((id) => order.dish.recipe.includes(id))) ?? null;
}

/**
 * One autopilot decision: lift a cooked item, serve a finished plate, clear a
 * plate that fits no ticket, or start the target dish's next ingredient.
 */
function autopilot(game) {
  // Lift anything finished off the woks first.
  for (let slot = 0; slot < game.woks.length; slot += 1) {
    const wok = game.woks[slot];
    if (wok.ingredient && wok.cooked && !wok.burnt) {
      takeWok(game, slot);
      return;
    }
    if (wok.ingredient && wok.burnt) {
      takeWok(game, slot);
      return;
    }
  }
  // Serve a plate that matches a ticket.
  const match = game.orders.find((order) => plateMatches(game, order.dish));
  if (match) {
    serveTicket(game, match.id);
    return;
  }
  // A plate that fits no ticket is thrown away.
  const target = targetOrder(game);
  if (game.plate.length > 0 && !target) {
    game.plate = [];
    return;
  }
  if (!target) return;
  // The target dish's next missing ingredient.
  const next = target.dish.recipe.find((id) => !game.plate.includes(id) && !game.woks.some((w) => w.ingredient === id));
  if (!next) return;
  addIngredient(game, next);
}

function runSteps(game, seconds, stopWhen, drive) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (stopWhen && stopWhen(game)) break;
    if (drive !== false) autopilot(game);
    tick(game, STEP);
    if (game.screen !== SCREEN_PLAY) break;
  }
}

/**
 * Set a fresh `game` (built with `random`) to the named scene (start, play,
 * serve or end; any other name is start) and return the screen to draw over
 * it and the best score to show. The game itself is returned through `out`.
 */
export function stageShot(name, game, out) {
  startDay(game);
  if (name !== 'play' && name !== 'serve' && name !== 'end') {
    // Title: let the first orders arrive, but nobody cooks yet.
    runSteps(game, START_SECONDS, null, false);
    game.screen = SCREEN_TITLE;
    out.game = game;
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'play') {
    runSteps(game, PLAY_LIMIT_SECONDS, (g) => g.plate.length >= 2 && g.woks.some((w) => w.ingredient !== null));
    out.game = game;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'serve') {
    // Play until a plate is complete, but do not serve it yet: the stop check
    // runs before the autopilot, so the finished plate stays on screen.
    runSteps(game, SERVE_LIMIT_SECONDS, (g) => g.orders.some((o) => plateMatches(g, o.dish)));
    // Start one more fry for the next ticket, so a wok is busy in the frame.
    const next = game.orders.find((o) => !plateMatches(game, o.dish));
    if (next) {
      const fry = next.dish.recipe.find((id) => INGREDIENT_BY_ID[id].cook > 0);
      if (fry) addIngredient(game, fry);
    }
    runSteps(game, 1.2, null, false);
    out.game = game;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  // end: play the whole shift.
  runSteps(game, DAY_SECONDS + 5, () => false);
  out.game = game;
  return { screen: game.screen === SCREEN_OVER ? SCREEN_OVER : SCREEN_PLAY, best: game.coins };
}
