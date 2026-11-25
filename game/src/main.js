// Boot and the one loop: input is read every frame, the kitchen advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between four screens: title,
// play, paused and day over.
//
// ?seed=N fixes the order pattern. ?shot=start|play|serve|end (with &seed=N)
// stages that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import {
  SCREEN_OVER,
  SCREEN_PAUSED,
  SCREEN_PLAY,
  SCREEN_TITLE,
  createGame,
  startDay,
  tick,
} from './state.js';
import { createInput } from './input.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const game = createGame(createRandom(seed));
const audio = createAudio();
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts one visit.
  }
}

function announce(message) {
  status.textContent = message;
}

/** Play the sound for one state event, and announce serves for screen readers. */
function playEvent(eventName) {
  switch (eventName) {
    case 'add':
    case 'plate':
      audio.drop();
      break;
    case 'wok':
      audio.click();
      break;
    case 'cooked':
      audio.cooked();
      break;
    case 'serve':
      audio.serve();
      announce(`Tersaji! ${game.coins} koin.`);
      break;
    case 'mismatch':
    case 'full':
    case 'dup':
    case 'nowok':
    case 'cooking':
    case 'empty':
      audio.error();
      break;
    case 'burn':
      audio.burn();
      break;
    case 'expire':
      audio.expire();
      break;
    case 'bell':
      audio.bell();
      break;
    case 'over':
      audio.serve();
      announce(`Shift selesai. ${game.coins} koin, ${game.served} hidangan.`);
      break;
    default:
      break;
  }
  const frying = game.woks.some((w) => w.ingredient && !w.burnt);
  audio.setSizzle(frying && game.screen === SCREEN_PLAY);
}

function runShot(name) {
  const out = {};
  const scene = stageShot(name, game, out);
  let painted = 0;
  function paint() {
    renderer.draw(out.game, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  createInput(canvas, {
    game,
    audio,
    onEvent: playEvent,
    onStart() {
      playEvent('bell');
      startDay(game);
      announce('Shift dimulai. Racik pesanan pertama!');
    },
    onRestart() {
      playEvent('bell');
      startDay(game);
    },
    onPause() {
      game.screen = SCREEN_PAUSED;
    },
    onResume() {
      game.screen = SCREEN_PLAY;
    },
    onToggleMute() {
      const muted = audio.toggleMute();
      announce(muted ? 'Suara mati.' : 'Suara hidup.');
    },
  });

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    while (accumulator >= STEP) {
      accumulator -= STEP;
      const events = tick(game, STEP);
      for (const eventName of events) playEvent(eventName);
    }
    if (game.screen === SCREEN_OVER && game.coins > best) {
      best = game.coins;
      saveBest(best);
    }
    renderer.draw(game, game.screen, best);
    requestAnimationFrame(frame);
  }

  renderer.resize();
  window.addEventListener('resize', () => renderer.resize());
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
