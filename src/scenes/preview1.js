// Превью 1 — «Улица / МФТИ»: катсцена без реплик. Город — в preview1City.js,
// малые формы — в preview1Props.js; движение толпы — в game/crowd.js.
import { PREVIEW1 } from '../game/constants.js';
import { createHeroes, createExtras } from '../game/players.js';
import { startCrowdWalk, startCrowdEnter, stepCrowd, crowdEntered } from '../game/crowd.js';
import { drawCharacter, drawExtra } from '../engine/render.js';
import { createCutscene } from '../engine/cutscene.js';
import { scenes } from '../engine/scenes.js';
import { drawCity } from './preview1City.js';
import { drawProps, loadFounderFaces } from './preview1Props.js';
import { preview2Scene } from './preview2.js';

let heroes = null;
let extras = null;
let cutscene = null;
let leaving = false;
let trafficLightState = PREVIEW1.TRAFFIC_START; // 'red' | 'yellow' | 'green'

// Дверь здания: 0 — закрыта, 1 — открыта (створка уезжает в сторону)
let doorProgress = 0;
let doorOpening = false;

function goNext() {
  if (leaving) return;
  leaving = true;
  scenes.setScene(preview2Scene); // переход с fade 0.3 с делает scenes.js
}

function startDoorOpen() {
  doorOpening = true;
}

function crowdGone() {
  return crowdEntered(extras);
}

function animateDoor(dt) {
  if (!doorOpening) return;
  doorProgress = Math.min(1, doorProgress + dt / PREVIEW1.DOOR_OPEN_TIME);
}

// Герой пересёк порог тёмного проёма (центр выше DOOR_HIDE_Y) — мгновенно
// скрываем: круг полностью накрыт «нутром» двери, «мигания» не видно
function hideEnteredHeroes() {
  for (const hero of [heroes.dasha, heroes.sasha]) {
    if (hero.alpha > 0 && hero.y <= PREVIEW1.DOOR_HIDE_Y) hero.alpha = 0;
  }
}

export const preview1Scene = {
  init() {
    leaving = false;
    trafficLightState = PREVIEW1.TRAFFIC_START;
    doorProgress = 0;
    doorOpening = false;
    loadFounderFaces();
    heroes = createHeroes(PREVIEW1.START.dasha, PREVIEW1.START.sasha);
    extras = createExtras(PREVIEW1.EXTRAS_LAYOUT.start);

    cutscene = createCutscene([
      // Светофор: красный → жёлтый → зелёный
      { type: 'wait', time: PREVIEW1.TRAFFIC_RED_WAIT },   // стоят на красном
      { type: 'call', fn: () => { trafficLightState = 'yellow'; } },
      { type: 'wait', time: PREVIEW1.TRAFFIC_YELLOW_WAIT },
      { type: 'call', fn: () => { trafficLightState = 'green'; } },
      { type: 'wait', time: PREVIEW1.LIGHT_GREEN_DELAY },  // пауза на зелёном
      // Переход через дорогу: герои — к двери, толпа — маршрутом слева
      // от памятника (stage → finish), никого не ждём
      { type: 'call', fn: () => startCrowdWalk(extras) },
      { type: 'walk', to: PREVIEW1.HERO_ENTER, speed: PREVIEW1.WALK_SPEED },
      // Герои у двери: дверь открывается
      { type: 'call', fn: startDoorOpen },
      { type: 'wait', time: PREVIEW1.DOOR_OPEN_TIME },
      // Даша и Саша шагают ВГЛУБЬ тёмного проёма (за порог скрытия) и
      // исчезают в нём; толпа с этого момента идёт к двери ПАРАЛЛЕЛЬНО
      { type: 'call', fn: () => startCrowdEnter(extras) },
      { type: 'walk_one', who: 'dasha', to: PREVIEW1.HERO_INSIDE.dasha, speed: PREVIEW1.WALK_SPEED },
      { type: 'walk_one', who: 'sasha', to: PREVIEW1.HERO_INSIDE.sasha, speed: PREVIEW1.WALK_SPEED },
      // Переход — только когда скрылся последний персонаж
      { type: 'wait_until', done: crowdGone },
      { type: 'call', fn: goNext }
    ], heroes);
  },

  update(dt) {
    cutscene.update(dt);
    stepCrowd(extras, heroes, dt);
    hideEnteredHeroes();
    animateDoor(dt);
  },

  render(ctx) {
    drawCity(ctx);
    // Толпа — между фоном и малыми формами: скамейки и памятник её перекрывают
    for (const extra of extras) drawExtra(ctx, extra);
    // Герои — до малых форм: у двери их накрывает проём (вход «внутрь»)
    drawCharacter(ctx, heroes.dasha);
    drawCharacter(ctx, heroes.sasha);
    drawProps(ctx, trafficLightState, doorProgress);
    cutscene.render(ctx);
  },

  // Отладка из консоли/тестов: текущее состояние сцены
  get debug() {
    return { heroes, extras, trafficLightState, doorProgress, leaving };
  }
};
