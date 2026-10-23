// Уровень 2 — «Больная Ксюша»: вступительная катсцена (переписка в телефоне)
// и игровой процесс. Общажная комната: Ксюша лежит на кровати и болеет.
// Даша и Саша бегают по комнате (WASD / стрелки) и собирают таблетки:
// красные — только Даша, синие — только Саша. Каждая собранная таблетка
// +5 % к шкале здоровья; таблетка, которую не успели собрать, мигает и
// исчезает. На 100 % Ксюша вылечивается (фото меняется, зелёная галочка,
// плашка), затем анонс Уровня 3. Мебель — препятствия (AABB-слайдинг),
// стены — границы комнаты. Числа и тексты — в constants.js (LEVEL2),
// отрисовка — в level2Draw.js, переписка — в level2Chat.js.
import {
  WORLD_W, WORLD_H, PLAYER_RADIUS, LEVEL2, LEVEL2_TITLE, TEXTS
} from '../game/constants.js';
import { debugMenu } from '../engine/debugmenu.js';
import { play } from '../engine/audio.js';
import { drawPopupWrapped, drawLevelTitle, drawCenterText } from '../engine/ui.js';
import { drawCharacter } from '../engine/render.js';
import { scenes } from '../engine/scenes.js';
import { createHeroes } from '../game/players.js';
import { level3Scene } from './level3.js';
import { moveHero, hitsFurniture, circleHitsRect } from './level2Move.js';
import {
  drawRoom, drawKsyusha, drawWinCheck, drawPills, drawHealthBar, drawHints
} from './level2Draw.js';
import { drawPhoneChat } from './level2Chat.js';

let heroes = null;   // { dasha, sasha }
let pills = [];      // { x, y, color: 'red' | 'blue', life } — таблетки на полу
let health = LEVEL2.HEALTH_START; // шкала здоровья Ксюши, 0..1
let pillTimer = 0;   // до следующего спавна таблетки, с
let popupTimer = 0;  // видимость стартовой плашки, с
let elapsed = 0;     // время игровой фазы: название уровня и анимации, с
let phase = 'intro_chat'; // 'intro_chat' | 'game' | 'win'
let chatTime = 0;    // время переписки (intro_chat), с
let fade = 0;        // чёрная заливка: fade-out телефона → fade-in комнаты
let winTimer = 0;    // время плашки победы, с
let leaving = false; // уже уходим с уровня (на анонс Уровня 3)

const randRange = (min, max) => min + Math.random() * (max - min);

// Переписка: момент показа последнего сообщения и число уже видимых
const chatLastMsg = () => LEVEL2.CHAT.FIRST_DELAY +
  (LEVEL2.CHAT.MESSAGES.length - 1) * LEVEL2.CHAT.MSG_INTERVAL;

function chatVisibleCount() {
  const c = LEVEL2.CHAT;
  return chatTime < c.FIRST_DELAY ? 0
    : Math.min(c.MESSAGES.length, 1 + Math.floor((chatTime - c.FIRST_DELAY) / c.MSG_INTERVAL));
}

// ==== Таблетки ====

// Спавн на случайном свободном месте: не в мебели (с запасом) и не у стен
function spawnPill() {
  const p = LEVEL2.PILL;
  const room = LEVEL2.ROOM;
  for (let attempt = 0; attempt < 30; attempt++) {
    const x = randRange(room.x + p.MARGIN, room.x + room.w - p.w - p.MARGIN);
    const y = randRange(room.y + p.MARGIN, room.y + room.h - p.h - p.MARGIN);
    if (hitsFurniture({ x, y, w: p.w, h: p.h }, p.CLEARANCE)) continue;

    pills.push({
      x, y,
      color: Math.random() < 0.5 ? 'red' : 'blue',
      life: p.LIFETIME
    });
    return;
  }
  // 30 попыток не хватило — пропускаем спавн до следующего интервала
}

function updatePills(dt) {
  pillTimer -= dt;
  if (pillTimer <= 0 && pills.length < LEVEL2.PILL.MAX) {
    spawnPill();
    pillTimer = randRange(LEVEL2.PILL.SPAWN_MIN, LEVEL2.PILL.SPAWN_MAX);
  }

  for (let i = pills.length - 1; i >= 0; i--) {
    const pill = pills[i];
    // Таймер жизни: не успели собрать — таблетка мигает и исчезает
    pill.life = (pill.life ?? LEVEL2.PILL.LIFETIME) - dt;
    if (pill.life <= 0) {
      pills.splice(i, 1);
      continue;
    }

    // Сбор: только «свой» герой; чужая таблетка остаётся лежать
    const hero = heroes[LEVEL2.PILL.OWNER[pill.color]];
    const rect = { x: pill.x, y: pill.y, w: LEVEL2.PILL.w, h: LEVEL2.PILL.h };
    if (!circleHitsRect(hero.x, hero.y, PLAYER_RADIUS, rect)) continue;

    pills.splice(i, 1);
    health = Math.min(1, health + LEVEL2.PILL.GAIN);
    play('tick');
  }
}

// После плашки победы — анонс Уровня 3 (заглушка), не титул
function goNextLevel() {
  if (leaving) return;
  leaving = true;
  scenes.setScene(level3Scene);
}

// ==== Сцена ====

export const level2Scene = {
  init() {
    heroes = createHeroes(LEVEL2.START.dasha, LEVEL2.START.sasha);
    pills = [];
    health = LEVEL2.HEALTH_START;
    pillTimer = LEVEL2.PILL.FIRST_DELAY;
    popupTimer = 0;           // плашка «Ксюша заболела…» стартует после переписки
    elapsed = 0;
    phase = 'intro_chat';     // сначала — переписка в телефоне
    chatTime = 0;
    fade = 0;
    winTimer = 0;
    leaving = false;
    this.initialized = true;
  },

  update(dt) {
    if (!this.initialized) return; // сцену ещё не активировали через setScene → init()
    if (debugMenu.isOpen()) return; // отладочное меню открыто — сцена на паузе

    if (phase === 'intro_chat') { // катсцена: герои стоят, таблеток нет
      chatTime += dt;
      if (chatTime >= chatLastMsg() + LEVEL2.CHAT.END_PAUSE) {
        fade = Math.min(1, fade + dt / LEVEL2.CHAT.FADE); // fade-out телефона
        if (fade >= 1) {
          phase = 'game'; // комната проявляется из чёрного (fade гаснет)
          popupTimer = LEVEL2.POPUP_TIME;
          elapsed = 0;    // название уровня — вместе с комнатой
        }
      }
      return;
    }

    if (fade > 0) fade = Math.max(0, fade - dt / LEVEL2.CHAT.FADE); // fade-in комнаты

    elapsed += dt;
    if (popupTimer > 0) popupTimer -= dt;

    if (phase === 'win') { // ввод заблокирован: герои стоят, таблетки не спавнятся
      winTimer += dt;
      if (winTimer >= LEVEL2.WIN_PLATE_TIME) goNextLevel();
      return;
    }

    moveHero(heroes.dasha, dt);
    moveHero(heroes.sasha, dt);
    updatePills(dt);

    if (health >= 1) { // победа: Ксюша вылечилась
      phase = 'win';
      winTimer = 0;
      play('win');
    }
  },

  render(ctx) {
    if (!this.initialized) return; // защита от render() до init()

    if (phase === 'intro_chat') { // переписка в телефоне на чёрном фоне
      drawPhoneChat(ctx, chatVisibleCount(), 1 - fade);
      return;
    }

    drawRoom(ctx);
    drawPills(ctx, pills);
    drawKsyusha(ctx, phase === 'win');
    drawCharacter(ctx, heroes.dasha);
    drawCharacter(ctx, heroes.sasha);
    drawHealthBar(ctx, health);
    drawHints(ctx);
    drawLevelTitle(ctx, LEVEL2_TITLE, elapsed);

    if (popupTimer > 0) drawPopupWrapped(ctx, TEXTS.LEVEL2_START_POPUP);

    if (phase === 'win') {
      drawWinCheck(ctx);
      drawCenterText(ctx, TEXTS.LEVEL2_WIN);
    }

    if (fade > 0) { // fade-in комнаты после катсцены
      ctx.globalAlpha = fade;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      ctx.globalAlpha = 1;
    }
  },

  onKey(code) {
    if (code === 'Enter' && phase === 'win') goNextLevel(); // пропустить ожидание
  },

  get debug() {
    return { heroes, pills, health, phase, popupTimer, winTimer, elapsed, chatTime, fade };
  }
};
