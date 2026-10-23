// Уровень 1 — «Кабинет английского»: игровой процесс.
// Клавиша действия поднимает шпаргалку; учитель циклично «пишет» →
// «предупреждает» (!) → «смотрит». Шкалы растут только при письме, поимка
// при «взгляде» — штраф и заморозка. Обе шкалы полны — победа, катсцена,
// затем Уровень 2. Числа и координаты — в constants.js (LEVEL1, LEVEL1_FINAL),
// отрисовка — в level1Draw.js и level1Final.js.
import {
  WORLD_W, WORLD_H,
  COLOR_DASHA, COLOR_SASHA,
  LEVEL1, LEVEL1_FINAL, TEXTS, LEVEL1_TITLE
} from '../game/constants.js';
import { inputState } from '../engine/input.js';
import { debugMenu } from '../engine/debugmenu.js';
import { play } from '../engine/audio.js';
import { drawScales, drawLevelTitle } from '../engine/ui.js';
import { scenes } from '../engine/scenes.js';
import { faceImages } from '../game/players.js';
import { level2Scene } from './level2.js';
import { drawClassroom } from './level1Draw.js';
import { updateFinal, drawFinalOutro, drawFinalExit, drawFinalPlate } from './level1Final.js';

let heroes = null;    // { dasha, sasha } — круги героев со шкалой и шпаргалкой
let teacher = null;   // { state: 'writing' | 'warn' | 'looking', timer }
let freezeTimer = 0;  // заморозка после поимки (ввод игнорируется)
let flashTimer = 0;   // вспышка-фидбэк при поимке
let win = false;
let leaving = false;
let animTime = 0;     // время сцены: пульсация «!» и эффект названия уровня

const randRange = (min, max) => min + Math.random() * (max - min);
const clamp01 = (value) => (value < 0 ? 0 : value > 1 ? 1 : value);

function createHero(id, color) {
  const notebook = LEVEL1.NOTEBOOKS[id];
  const cheat = LEVEL1.CHEAT;
  return {
    id,
    ...LEVEL1.HEROES[id],
    color,
    // Фото-лицо может не успеть загрузиться — фолбэк в drawCharacter (круг)
    get faceImg() {
      return faceImages[`${id}FaceImg`] ?? null;
    },
    dir: { x: 0, y: -1 },   // оба смотрят вверх, на доску
    scale: 0,               // шкала 0..1
    lift: 0,                // шпаргалка: 0 спрятана — 1 поднята
    caught: false,          // уже пойман на текущем «взгляде»
    tickStep: 0,            // последняя пройденная ступень 10 % (звук «тик»)
    actionPrev: false,
    cheatX: notebook.x + notebook.w / 2 - cheat.w / 2,
    cheatY: notebook.y - cheat.peek // спрятана: виден только краешек
  };
}

// ==== Учитель ====

// Длительность письма: к концу уровня интервалы сокращаются
function writeDuration() {
  const p = (heroes.dasha.scale + heroes.sasha.scale) / 2;
  return randRange(
    LEVEL1.WRITE_MIN + (LEVEL1.WRITE_END_MIN - LEVEL1.WRITE_MIN) * p,
    LEVEL1.WRITE_MAX + (LEVEL1.WRITE_END_MAX - LEVEL1.WRITE_MAX) * p
  );
}

function setTeacherState(state) {
  teacher.state = state;
  if (state === 'writing') {
    teacher.timer = writeDuration();
  } else if (state === 'warn') {
    teacher.timer = LEVEL1.WARN_TIME;
  } else {
    teacher.timer = randRange(LEVEL1.LOOK_MIN, LEVEL1.LOOK_MAX);
    heroes.dasha.caught = false; heroes.sasha.caught = false; // новый взгляд
  }
}

function updateTeacher(dt) {
  teacher.timer -= dt;
  if (teacher.timer > 0) return;

  if (teacher.state === 'writing') {
    setTeacherState('warn');
    play('warn');
  } else if (teacher.state === 'warn') {
    setTeacherState('looking');
  } else {
    setTeacherState('writing');
  }
}

// ==== Шпаргалки и шкалы ====

function updateCheats(dt) {
  const frozen = freezeTimer > 0; // при заморозке ввод игнорируется
  for (const hero of [heroes.dasha, heroes.sasha]) {
    const action = !frozen && inputState[hero.id].action;
    if (action !== hero.actionPrev) {
      play(action ? 'cheat_up' : 'cheat_down');
      hero.actionPrev = action;
    }
    const diff = (action ? 1 : 0) - hero.lift;
    hero.lift = clamp01(hero.lift + Math.sign(diff) * LEVEL1.CHEAT.speed * dt);
  }
}

function growScales(dt) {
  if (teacher.state !== 'writing') return; // рост только при письме
  for (const hero of [heroes.dasha, heroes.sasha]) {
    if (hero.lift <= LEVEL1.CHEAT.active || hero.scale >= 1) continue;
    hero.scale = clamp01(hero.scale + LEVEL1.GROWTH_PER_SEC * dt);
    const step = Math.floor(hero.scale * 10 + 1e-9);
    if (step > hero.tickStep) {
      hero.tickStep = step;
      play('tick');
    }
  }
}

// Поимка: смотрит + шпаргалка поднята хотя бы у одного — пойманы ОБА
// (штраф обоим и общая заморозка), один раз за «взгляд».
function checkCatch() {
  if (teacher.state !== 'looking') return;
  const violated = heroes.dasha.lift > LEVEL1.CHEAT.active || heroes.sasha.lift > LEVEL1.CHEAT.active;
  if (!violated || heroes.dasha.caught) return; // caught — метка «в этом взгляде уже наказаны»

  for (const hero of [heroes.dasha, heroes.sasha]) {
    hero.caught = true;
    hero.scale = Math.max(0, hero.scale - LEVEL1.PENALTY);
    hero.tickStep = Math.floor(hero.scale * 10 + 1e-9);
  }
  freezeTimer = LEVEL1.FREEZE_TIME;
  flashTimer = LEVEL1.FLASH_TIME;
  play('caught');
}

function checkWin() {
  if (win || heroes.dasha.scale < 1 || heroes.sasha.scale < 1) return;
  win = true;
  freezeTimer = 0;
  play('win');
}

function goNext() {
  if (leaving) return;
  leaving = true;
  scenes.setScene(level2Scene);
}

// ==== Сцена ====

export const level1Scene = {
  init() {
    heroes = {
      dasha: createHero('dasha', COLOR_DASHA),
      sasha: createHero('sasha', COLOR_SASHA)
    };
    teacher = { state: 'writing', timer: 0 };
    setTeacherState('writing');
    freezeTimer = 0;
    flashTimer = 0;
    win = false;
    leaving = false;
    animTime = 0;
    // Финальная катсцена: 'game' → 'outro' → 'outro_exit' → 'outro_plate'
    // (реплики → расхождение → плашка); таймеры и фазы — в level1Final.js
    this.phase = 'game';
    this.replicaIndex = 0;
    this.replicaTimer = 0;
    this.exitShift = 0;
    this.plateTimer = 0;
    // Отладка: «Финал Уровня 1» в меню ставит флаг — сразу катсцена (шкалы полны)
    const startAt = typeof window !== 'undefined' ? window.__debugStartLevel1At : null;
    if (typeof window !== 'undefined') window.__debugStartLevel1At = null; // сброс
    if (startAt === 'outro') {
      this.phase = 'outro';
      heroes.dasha.scale = 1; heroes.sasha.scale = 1;
    }
    this.initialized = true;
  },

  update(dt) {
    if (!this.initialized) return; // сцену ещё не активировали через setScene → init()
    if (debugMenu.isOpen()) return; // отладочное меню открыто — сцена на паузе

    animTime += dt;
    if (updateFinal(this, dt, goNext)) return; // фаза катсцены — ввод игнорируется

    if (freezeTimer > 0) freezeTimer = Math.max(0, freezeTimer - dt);
    if (flashTimer > 0) flashTimer = Math.max(0, flashTimer - dt);
    updateTeacher(dt);
    updateCheats(dt);
    growScales(dt);
    checkCatch();
    checkWin();
    if (win) { // победа: ввод заблокирован, учитель замирает, старт катсцены
      this.phase = 'outro';
      this.replicaIndex = 0;
      this.replicaTimer = 0;
      setTeacherState('writing');
      heroes.dasha.lift = 0; heroes.sasha.lift = 0; // шпаргалки спрятаны
    }
  },

  render(ctx) {
    if (!this.initialized) return; // защита от render() до init()

    drawClassroom(ctx, heroes, teacher.state, animTime);

    // Шкалы-HUD: слева Саша, справа Даша, смыкаются в центре
    drawScales(
      ctx,
      { value: heroes.sasha.scale, color: COLOR_SASHA, label: TEXTS.SCALE_SASHA },
      { value: heroes.dasha.scale, color: COLOR_DASHA, label: TEXTS.SCALE_DASHA }
    );

    if (flashTimer > 0) { // короткая вспышка-фидбэк при поимке
      ctx.fillStyle = LEVEL1.FLASH_COLOR;
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    drawLevelTitle(ctx, LEVEL1_TITLE, animTime); // название уровня при старте

    if (this.phase === 'outro') {
      drawFinalOutro(ctx, this.replicaIndex, heroes);
    } else if (this.phase === 'outro_exit') {
      drawFinalExit(ctx, this.exitShift, heroes);
    } else if (this.phase === 'outro_plate') {
      drawFinalPlate(ctx, Math.min(1, this.plateTimer / LEVEL1_FINAL.PLATE_FADE));
    }
  },

  onKey(code) {
    if (code === 'Enter' && this.phase === 'outro_plate') goNext(); // пропустить
  },

  get debug() {
    return {
      heroes,
      teacherState: teacher && teacher.state,
      freeze: freezeTimer,
      flash: flashTimer,
      win,
      leaving,
      phase: this.phase,
      replicaIndex: this.replicaIndex,
      exitShift: this.exitShift
    };
  }
};
