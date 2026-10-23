// Финальная катсцена Уровня 1 (после победы) — вынесена из level1.js
// (лимит 250 строк): логика таймеров + отрисовка. Геометрия и тексты —
// в LEVEL1_FINAL. Кадры: реплика в белом окне → герои расходятся по бокам
// в разные стороны → плашка «Уровень 1 пройден!».
import {
  WORLD_W, WORLD_H, PLAYER_RADIUS,
  COLOR_DASHA, COLOR_SASHA,
  COLORS, LEVEL1_FINAL, TEXTS
} from '../game/constants.js';
import { drawCharacter, drawText } from '../engine/render.js';
import { drawCenterText } from '../engine/ui.js';
import { drawBoots } from './level1Draw.js';

// ==== Логика ====

// Таймеры катсцены; возвращает true, пока катсцена активна (ввод игнорируется).
// onFinish — переход к Уровню 2 после плашки (сюда передаётся goNext из level1.js).
export function updateFinal(scene, dt, onFinish) {
  if (scene.phase === 'outro') { // реплики идут по таймеру
    scene.replicaTimer += dt;
    if (scene.replicaTimer >= LEVEL1_FINAL.REPLICA_TIME) {
      scene.replicaTimer = 0;
      scene.replicaIndex += 1;
      if (scene.replicaIndex >= LEVEL1_FINAL.REPLICAS.length) {
        scene.phase = 'outro_exit'; // реплики кончились — герои расходятся
        scene.exitShift = 0;
      }
    }
    return true;
  }
  if (scene.phase === 'outro_exit') { // Даша вправо, Саша влево — за края экрана
    scene.exitShift += LEVEL1_FINAL.EXIT_SPEED * dt;
    const dashaGone = LEVEL1_FINAL.DASHA.x + scene.exitShift - PLAYER_RADIUS > WORLD_W;
    const sashaGone = LEVEL1_FINAL.SASHA.x - scene.exitShift + PLAYER_RADIUS < 0;
    if (dashaGone && sashaGone) {
      scene.phase = 'outro_plate'; // оба скрылись — плашка с fade-in
      scene.plateTimer = 0;
    }
    return true;
  }
  if (scene.phase === 'outro_plate') {
    scene.plateTimer += dt;
    if (scene.plateTimer >= LEVEL1_FINAL.PLATE_FADE + LEVEL1_FINAL.PLATE_TIME) onFinish();
    return true;
  }
  return false; // фаза 'game' — обычный геймплей
}

// ==== Отрисовка ====

// Перенос текста реплики по словам под ширину окна
function wrapText(ctx, text, maxWidth) {
  const lines = [];
  let line = '';

  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Белое окно реплики с тонкой тёмной рамкой
function drawDialog(ctx) {
  const d = LEVEL1_FINAL.DIALOG;
  ctx.fillStyle = COLORS.FINAL_DIALOG;
  ctx.fillRect(d.x, d.y, d.w, d.h);
  ctx.strokeStyle = COLORS.FINAL_DIALOG_EDGE;
  ctx.lineWidth = 2;
  ctx.strokeRect(d.x, d.y, d.w, d.h);
}

function drawOverlay(ctx) {
  ctx.fillStyle = `rgba(0, 0, 0, ${LEVEL1_FINAL.OVERLAY_ALPHA})`;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
}

// Пара героев (+ ботфорты Даши) на заданных X; сапоги всегда под Дашей
function drawCast(ctx, heroes, sashaX, dashaX, sashaAlpha, dashaAlpha) {
  const fin = LEVEL1_FINAL;
  drawBoots(ctx, { ...fin.BOOTS_DASHA, x: fin.BOOTS_DASHA.x + (dashaX - fin.DASHA.x) });
  drawCharacter(ctx, {
    x: sashaX, y: fin.SASHA.y, color: COLOR_SASHA,
    faceImg: heroes.sasha.faceImg, dir: { x: 1, y: 0 }, // смотрят друг на друга
    alpha: sashaAlpha
  });
  drawCharacter(ctx, {
    x: dashaX, y: fin.DASHA.y, color: COLOR_DASHA,
    faceImg: heroes.dasha.faceImg, dir: { x: -1, y: 0 },
    alpha: dashaAlpha
  });
}

// Реплика: текст — цветом говорящего, по центру окна (гориз. и верт.)
function drawReplica(ctx, replica) {
  const d = LEVEL1_FINAL.DIALOG;
  const color = replica.speaker === 'dasha' ? COLOR_DASHA : COLOR_SASHA;
  const lines = wrapText(ctx, replica.text, d.w - d.pad * 2);
  const firstY = d.y + d.h / 2 - ((lines.length - 1) * d.lineHeight) / 2;

  drawDialog(ctx);
  lines.forEach((line, index) => {
    drawText(ctx, line, d.x + d.w / 2, firstY + index * d.lineHeight, {
      size: d.font, color
    });
  });
}

// Кадр катсцены: затемнение, герои по бокам окна (молчащий приглушён),
// ботфорты под Дашей, белое окно с текущей репликой
export function drawFinalOutro(ctx, replicaIndex, heroes) {
  const fin = LEVEL1_FINAL;
  const replica = fin.REPLICAS[Math.min(replicaIndex, fin.REPLICAS.length - 1)];

  drawOverlay(ctx);
  drawCast(ctx, heroes, fin.SASHA.x, fin.DASHA.x,
    replica.speaker === 'sasha' ? 1 : fin.DIM_ALPHA,
    replica.speaker === 'dasha' ? 1 : fin.DIM_ALPHA);
  drawReplica(ctx, replica);
}

// Фаза расхождения: окна уже нет, Даша с ботфортами уходит вправо, Саша влево
export function drawFinalExit(ctx, shift, heroes) {
  const fin = LEVEL1_FINAL;
  drawOverlay(ctx);
  drawCast(ctx, heroes, fin.SASHA.x - shift, fin.DASHA.x + shift, 1, 1);
}

// Плашка «Уровень 1 пройден!» поверх затемнения; alpha — fade-in 0..1
export function drawFinalPlate(ctx, alpha) {
  drawOverlay(ctx);
  ctx.globalAlpha = alpha;
  drawCenterText(ctx, TEXTS.LEVEL1_WIN);
  ctx.globalAlpha = 1;
}
