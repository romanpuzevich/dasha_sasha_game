// Отрисовка класса Уровня 1 (вынесена из level1.js — лимит 250 строк).
// Всё — примитивы Canvas; координаты берутся из LEVEL1/COLORS.
import {
  WORLD_W, WORLD_H,
  COLOR_OUTLINE, COLOR_TEXT,
  COLORS, LEVEL1, TEXTS
} from '../game/constants.js';
import { drawCircle, drawText, drawCharacter } from '../engine/render.js';

// Столешница с тёмным краем (парта класса, стол учителя)
function drawDeskRect(ctx, rect) {
  ctx.fillStyle = COLORS.DESK_EDGE;
  ctx.fillRect(rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6);
  ctx.fillStyle = COLORS.DESK_TOP;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

// Тетрадь: цветной прямоугольник с тёмной обводкой (герои, учитель, NPS)
function drawNotebook(ctx, rect) {
  ctx.fillStyle = COLORS.NOTEBOOK_EDGE;
  ctx.fillRect(rect.x - 2, rect.y - 2, rect.w + 4, rect.h + 4);
  ctx.fillStyle = rect.color;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

// Ручка: вертикальный корпус (вытянут по Y) с колпачком другого цвета
// сверху — у Даши, Саши и на столе учителя (данные в LEVEL1.HERO_PENS
// и LEVEL1.TEACHER_ITEMS.pens)
function drawPen(ctx, pen) {
  ctx.fillStyle = COLORS.NOTEBOOK_EDGE;
  ctx.fillRect(pen.x - 1, pen.y - 1, pen.w + 2, pen.h + 2);
  ctx.fillStyle = pen.cap;
  ctx.fillRect(pen.x, pen.y, pen.w, pen.capH);
  ctx.fillStyle = pen.color;
  ctx.fillRect(pen.x, pen.y + pen.capH, pen.w, pen.h - pen.capH);
}

// Стул: прямоугольное сиденье чуть ниже стола; x — центр сиденья,
// topY — верх (у учеников под партой, у учителя — под его столом)
function drawChair(ctx, centerX, topY) {
  const chair = LEVEL1.CHAIR;
  ctx.fillStyle = COLORS.CHAIR_EDGE;
  ctx.fillRect(centerX - chair.w / 2 - 2, topY - 2, chair.w + 4, chair.h + 4);
  ctx.fillStyle = COLORS.CHAIR;
  ctx.fillRect(centerX - chair.w / 2, topY, chair.w, chair.h);
}

function drawBackground(ctx) {
  ctx.fillStyle = COLORS.CLASS_FLOOR;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  ctx.fillStyle = COLORS.CLASS_WALL; // тёмная стена сверху (там же шкалы)
  ctx.fillRect(0, 0, WORLD_W, LEVEL1.WALL.h);

  const board = LEVEL1.BOARD;
  ctx.fillStyle = COLORS.BOARD_FRAME;
  ctx.fillRect(board.x - 6, board.y - 6, board.w + 12, board.h + 12);
  ctx.fillStyle = COLORS.BOARD;
  ctx.fillRect(board.x, board.y, board.w, board.h);
  ctx.fillStyle = COLORS.CHALK; // пара «меловых» строк
  ctx.fillRect(board.x + 20, board.y + 7, 90, 4);
  ctx.fillRect(board.x + 20, board.y + 15, 150, 4);
}

function drawTeacherFace(ctx, teacherState) {
  const t = LEVEL1.TEACHER;
  const looking = teacherState === 'looking';
  const feature = looking ? COLORS.TEACHER_ANGRY : COLOR_OUTLINE;

  ctx.strokeStyle = feature;
  ctx.lineWidth = 3;

  if (looking) {
    // злые глаза-точки и брови «домиком»
    drawCircle(ctx, t.x - 8, t.y - 2, 3.5, COLORS.TEACHER_ANGRY);
    drawCircle(ctx, t.x + 8, t.y - 2, 3.5, COLORS.TEACHER_ANGRY);
    ctx.beginPath();
    ctx.moveTo(t.x - 14, t.y - 12); ctx.lineTo(t.x - 4, t.y - 7);
    ctx.moveTo(t.x + 14, t.y - 12); ctx.lineTo(t.x + 4, t.y - 7);
    ctx.stroke();
  } else {
    // «пишет»: глаза опущены вниз короткими штрихами
    ctx.beginPath();
    ctx.moveTo(t.x - 12, t.y - 2); ctx.lineTo(t.x - 5, t.y - 2);
    ctx.moveTo(t.x + 5, t.y - 2); ctx.lineTo(t.x + 12, t.y - 2);
    ctx.stroke();
  }

  // рот: при «взгляде» — злая дуга, в остальное время нейтральная линия
  ctx.beginPath();
  if (looking) {
    ctx.moveTo(t.x - 6, t.y + 10); ctx.lineTo(t.x, t.y + 7); ctx.lineTo(t.x + 6, t.y + 10);
  } else {
    ctx.moveTo(t.x - 6, t.y + 9); ctx.lineTo(t.x + 6, t.y + 9);
  }
  ctx.stroke();
}

function drawTeacher(ctx, teacherState, animTime) {
  const t = LEVEL1.TEACHER;
  drawCircle(ctx, t.x, t.y, t.r, COLOR_OUTLINE);
  drawCircle(ctx, t.x, t.y, t.r - 2, COLORS.TEACHER_BODY);
  drawTeacherFace(ctx, teacherState);

  if (teacherState === 'warn') {
    const size = 30 + Math.sin(animTime * 14) * 3; // пульс «!»
    drawText(ctx, '!', t.x, t.y - t.r - 26, { size, color: COLORS.TEACHER_ANGRY });
  }
}

// Вещи на столе учителя: тетради разных цветов и ручки
function drawTeacherItems(ctx) {
  for (const notebook of LEVEL1.TEACHER_ITEMS.notebooks) drawNotebook(ctx, notebook);
  for (const pen of LEVEL1.TEACHER_ITEMS.pens) drawPen(ctx, pen);
}

// Шпаргалка: белый лист с синими полосками, выезжает ТОЛЬКО вверх по
// hero.lift; нижняя часть всегда перекрыта тетрадью (рисуется после)
function drawCheat(ctx, hero) {
  const cheat = LEVEL1.CHEAT;
  const y = hero.cheatY - hero.lift * cheat.lift;

  ctx.fillStyle = COLORS.CHEAT_PAPER;
  ctx.fillRect(hero.cheatX, y, cheat.w, cheat.h);
  ctx.strokeStyle = COLORS.NOTEBOOK_EDGE;
  ctx.lineWidth = 2;
  ctx.strokeRect(hero.cheatX, y, cheat.w, cheat.h);

  ctx.fillStyle = COLORS.CHEAT_LINE;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(hero.cheatX + cheat.inset, y + cheat.lineTop + i * cheat.lineGap, cheat.w - cheat.inset * 2, 3);
  }
}

// Тетрадь героя поверх шпаргалки: в спрятанном виде виден только краешек
function drawHeroNotebook(ctx, hero) {
  drawNotebook(ctx, {
    ...LEVEL1.NOTEBOOKS[hero.id],
    color: hero.id === 'dasha' ? COLORS.NOTEBOOK_DASHA : COLORS.NOTEBOOK_SASHA
  });
}

// Ручки героев рядом с их тетрадями
function drawHeroPens(ctx) {
  drawPen(ctx, LEVEL1.HERO_PENS.dasha);
  drawPen(ctx, LEVEL1.HERO_PENS.sasha);
}

// Соседи: кружки с белой надписью «NPS» за общей партой
function drawNpcs(ctx) {
  LEVEL1.NPCS.forEach((npc, index) => {
    drawCircle(ctx, npc.x, npc.y, LEVEL1.NPC_RADIUS, COLOR_OUTLINE);
    drawCircle(ctx, npc.x, npc.y, LEVEL1.NPC_RADIUS - 2, COLORS.NPC_COLORS[index % COLORS.NPC_COLORS.length]);
    drawText(ctx, TEXTS.NPS_LABEL, npc.x, npc.y, { size: 11, color: COLOR_TEXT });
  });
}

// Тетради соседей: по одной на парте над каждым «NPS», не перекрывая круг
function drawNpcNotebooks(ctx) {
  for (const notebook of LEVEL1.NPC_NOTEBOOKS) drawNotebook(ctx, notebook);
}

// Сапоги-ботфорты Даши: два чёрных голенища со стопами. В классе — у парты
// (LEVEL1.BOOTS_DASHA), в финальной катсцене — под её кругом
// (LEVEL1_FINAL.BOOTS_DASHA); рисуются ПОД кругом героя
export function drawBoots(ctx, boots) {
  const shaftW = 5;              // ширина голенища
  const footW = boots.w / 2;     // стопа чуть шире голенища
  const footH = 7;

  ctx.fillStyle = COLORS.BOOT;
  for (let i = 0; i < 2; i++) {
    const x = boots.x + i * footW;
    ctx.fillRect(x + (footW - shaftW) / 2, boots.y, shaftW, boots.h - footH);
    ctx.fillRect(x, boots.y + boots.h - footH, footW, footH);
  }
}

// Гайд по кнопкам: полупрозрачная плашка внизу экрана (не перекрывает
// персонажей, шпаргалки и стулья — всё выше y = GUIDE.y)
function drawGuide(ctx) {
  const guide = LEVEL1.GUIDE;
  ctx.fillStyle = COLORS.GUIDE_BG;
  ctx.fillRect(guide.x, guide.y, guide.w, guide.h);

  const centerX = guide.x + guide.w / 2;
  const centerY = guide.y + guide.h / 2;
  drawText(ctx, TEXTS.GUIDE_DASHA, centerX, centerY - guide.lineHeight / 2, {
    size: guide.font,
    color: COLOR_TEXT
  });
  drawText(ctx, TEXTS.GUIDE_SASHA, centerX, centerY + guide.lineHeight / 2, {
    size: guide.font,
    color: COLOR_TEXT
  });
}

// Весь кабинет: фон, стол учителя (вещи, учитель, стул), общая длинная парта
// со стульями героев и соседей, шпаргалки с тетрадями и ручками, сапоги
// Даши и гайд по кнопкам. Учитель «пульсирует» по animTime.
export function drawClassroom(ctx, heroes, teacherState, animTime) {
  drawBackground(ctx);

  drawChair(ctx, LEVEL1.TEACHER.x, LEVEL1.TEACHER_CHAIR.y);
  drawDeskRect(ctx, LEVEL1.TEACHER_DESK);
  drawTeacherItems(ctx);
  drawTeacher(ctx, teacherState, animTime);

  drawDeskRect(ctx, LEVEL1.DESK);
  drawChair(ctx, heroes.sasha.x, LEVEL1.CHAIR.y);
  drawChair(ctx, heroes.dasha.x, LEVEL1.CHAIR.y);
  LEVEL1.NPCS.forEach((npc) => drawChair(ctx, npc.x, LEVEL1.CHAIR.y));

  drawCharacter(ctx, heroes.sasha);
  drawCharacter(ctx, heroes.dasha);

  for (const hero of [heroes.sasha, heroes.dasha]) {
    drawCheat(ctx, hero);
    drawHeroNotebook(ctx, hero);
  }
  drawHeroPens(ctx);

  drawNpcs(ctx);
  drawNpcNotebooks(ctx);

  drawBoots(ctx, LEVEL1.BOOTS_DASHA);
  drawGuide(ctx);
}
