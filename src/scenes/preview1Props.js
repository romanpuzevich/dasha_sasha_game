// Превью 1: малые формы улицы — скамейки, памятник, светофор.
// Все координаты и цвета — в constants.js.
import { PREVIEW1, TEXTS, COLORS } from '../game/constants.js';
import { drawCircle, drawText, loadImage, drawFace } from '../engine/render.js';

// Фото основателей грузятся фоном (как лица героев): пока картинки нет,
// медальон остаётся бронзовым кругом. Массив живёт до конца страницы.
let founderFaces = null;

// Вызывается из preview1Scene.init(); повторные вызовы игнорируются
export function loadFounderFaces() {
  if (founderFaces) return;

  const paths = PREVIEW1.MONUMENT.faces;
  founderFaces = new Array(paths.length).fill(null);
  paths.forEach((src, i) => {
    loadImage(src).then((img) => {
      if (img) {
        founderFaces[i] = img;
      } else {
        console.warn(`Не загрузилось ${src} — медальон рисуется бронзовым кругом`);
      }
    });
  });
}

// Скамейка стоит перпендикулярно фасаду: вертикальное сиденье со спинкой сверху
function drawBench(ctx, x, y) {
  const b = PREVIEW1.BENCH;
  ctx.fillStyle = COLORS.BENCH;
  ctx.fillRect(x, y, b.width, b.height);
  ctx.fillStyle = COLORS.BENCH_DARK;
  ctx.fillRect(x, y, b.width, b.backHeight);
}

// Одна скамейка справа над памятником, три — в столбик слева от ступенек
function drawBenches(ctx) {
  const b = PREVIEW1.BENCH;
  drawBench(ctx, b.right.x, b.right.y);
  for (const y of b.left.ys) drawBench(ctx, b.left.x, y);
}

// Памятник основателям МФТИ: постамент и три медальона с фото
function drawMonument(ctx) {
  const m = PREVIEW1.MONUMENT;
  ctx.fillStyle = COLORS.MONUMENT_STONE_DARK;
  ctx.fillRect(m.base.x, m.base.y, m.base.w, m.base.h);
  ctx.fillStyle = COLORS.MONUMENT_STONE;
  ctx.fillRect(m.pedestal.x, m.pedestal.y, m.pedestal.w, m.pedestal.h);

  for (let i = 0; i < m.medallionXs.length; i++) {
    const img = founderFaces ? founderFaces[i] : null;
    drawFace(ctx, img, m.medallionXs[i], m.medallionY, m.medallionRadius, COLORS.MONUMENT_BRONZE);
  }

  drawText(ctx, TEXTS.MONUMENT_LABEL, m.pedestal.x + m.pedestal.w / 2, m.pedestal.y + m.pedestal.h / 2, {
    size: m.labelFontSize,
    color: COLORS.MONUMENT_TEXT
  });
}

// Светофор: серый столб и тёмный корпус с тремя сигналами.
// Активный сигнал горит ярким цветом (красный / жёлтый / зелёный в порядке
// сверху вниз), остальные — потухшие тёмно-серые.
function drawTrafficLight(ctx, state) {
  const t = PREVIEW1.TRAFFIC_LIGHT;
  const h = t.housing;
  ctx.fillStyle = COLORS.TRAFFIC_POST;
  ctx.fillRect(t.post.x, t.post.y, t.post.w, t.post.h);

  ctx.fillStyle = COLORS.TRAFFIC_HOUSING;
  ctx.fillRect(h.x, h.y, h.w, h.h);

  const activeColors = {
    red: COLORS.TRAFFIC_RED,
    yellow: COLORS.TRAFFIC_YELLOW,
    green: COLORS.TRAFFIC_GREEN
  };
  for (let i = 0; i < 3; i++) {
    const lampColor = state && i === 0 && state === 'red' ? activeColors.red
      : state && i === 1 && state === 'yellow' ? activeColors.yellow
      : state && i === 2 && state === 'green' ? activeColors.green
      : COLORS.TRAFFIC_OFF;
    drawCircle(ctx, h.x + h.w / 2, h.y + (h.h * (i + 0.5)) / 3, t.lampRadius, lampColor);
  }
}

// Уличная дверь здания: рама, тёмное «нутро» и створка. openProgress 0..1 —
// створка уезжает в сторону на shiftX, открывая почти чёрный проём, ВНУТРЬ
// которого уходят персонажи (рама рисуется поверх героев: drawProps
// вызывается после drawCharacter)
function drawBuildingDoor(ctx, openProgress) {
  const d = PREVIEW1.BUILDING_DOOR;
  const shifted = openProgress * d.shiftX;

  // дверная коробка (рама) поверх персонажей
  ctx.fillStyle = COLORS.DOOR_LEAF_DARK;
  ctx.fillRect(d.x - 4, d.y - 4, d.w + 8, d.h + 8);

  // проём: тёмная рамка и почти чёрное «нутро» глубже
  ctx.fillStyle = COLORS.DOOR_OPENING;
  ctx.fillRect(d.x, d.y, d.w, d.h);
  ctx.fillStyle = COLORS.DOOR_VOID;
  ctx.fillRect(d.x + 6, d.y + 6, d.w - 12, d.h - 12);

  // створка, сдвинутая вправо
  ctx.fillStyle = COLORS.DOOR_LEAF_DARK;
  ctx.fillRect(d.x + shifted - 2, d.y - 2, d.w + 4, d.h + 4);
  ctx.fillStyle = COLORS.DOOR_LEAF;
  ctx.fillRect(d.x + shifted, d.y, d.w, d.h);
  // ручка створки
  drawCircle(ctx, d.x + shifted + d.w - 8, d.y + d.h / 2, 3, COLORS.DOOR_OPENING);
}

// Малые формы поверх города
export function drawProps(ctx, trafficLightState, doorProgress) {
  drawBenches(ctx);
  drawMonument(ctx);
  drawTrafficLight(ctx, trafficLightState);
  drawBuildingDoor(ctx, doorProgress || 0);
}
