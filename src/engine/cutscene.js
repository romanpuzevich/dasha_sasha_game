// Катсцена: последовательность команд с простым таймингом.
// Толпу двигает сама сцена (множители скорости и обход препятствий — в game/crowd.js).
// Команды:
//   { type: 'wait', time }                       — пауза, с
//   { type: 'wait_until', done }                 — ждать, пока done() вернёт true
//   { type: 'dialogue', text, time }             — реплика внизу, с
//   { type: 'popup', text, time }                — плашка-подсказка, с
//   { type: 'walk', to, speed }                  — шаг обоих героев, px/с
//   { type: 'walk_one', who: 'dasha'|'sasha', to, speed } — шаг одного героя
//   { type: 'call', fn }                         — действие (светофор, дверь, переход)
//   { type: 'show_cursor', pos: { x, y } }       — показать курсор-«мышку»
//   { type: 'move_cursor', to: { x, y }, dur }   — плавное перемещение курсора, с
//   { type: 'click_cursor', time }               — имитация клика (нажатие), с
//   { type: 'highlight_door', doorId, color, time } — подсветка двери + вспышка, с
//   { type: 'hide_cursor' }                      — спрятать курсор
// to: { x, y } для обоих или { dasha: {...}, sasha: {...} } по отдельности.
import { COLORS } from '../game/constants.js';
import { drawDialogue, drawPopup } from './ui.js';

function moveCharacter(character, target, speed, dt) {
  const dx = target.x - character.x;
  const dy = target.y - character.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return true;

  const step = Math.min(distance, speed * dt);
  character.x += (dx / distance) * step;
  character.y += (dy / distance) * step;
  character.dir = { x: dx / distance, y: dy / distance };

  return step >= distance - 0.001;
}

function targetFor(to, name) {
  return to[name] || to;
}

// Курсор-«мышка»: простая стрелка (полилиния); при нажатии чуть утоплена
function drawCursor(ctx, cursor) {
  ctx.save();
  ctx.translate(cursor.x, cursor.y);
  if (cursor.pressing > 0) ctx.translate(2, 2);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 32);
  ctx.lineTo(5.8, 26.6);
  ctx.lineTo(9.8, 35.2);
  ctx.lineTo(13.8, 33.4);
  ctx.lineTo(9.8, 24.8);
  ctx.lineTo(15.2, 24.8);
  ctx.closePath();
  ctx.fillStyle = COLORS.CURSOR_FILL;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.CURSOR_OUTLINE;
  ctx.stroke();
  ctx.restore();
}

export function createCutscene(commands, heroes) {
  let index = 0;
  let time = 0;
  let active = null;

  // Внутреннее состояние, которое рисует сама катсцена или читает сцена:
  // позиция курсора-«мышки», нажатие и подсветка выбранной двери
  const cursor = { x: 0, y: 0, visible: false, pressing: 0 };
  let doorHighlight = null;
  const state = { cursor, get doorHighlight() { return doorHighlight; } };

  function advance() {
    index += 1;
    beginCurrent();
  }

  function beginCurrent() {
    time = 0;
    active = index < commands.length ? commands[index] : null;

    // Мгновенные команды:
    if (active && active.type === 'call') {
      active.fn();
      advance();
      return;
    }
    if (active && active.type === 'show_cursor') {
      cursor.x = active.pos.x;
      cursor.y = active.pos.y;
      cursor.visible = true;
      advance();
      return;
    }
    if (active && active.type === 'hide_cursor') {
      cursor.visible = false;
      advance();
      return;
    }
  }

  function update(dt) {
    if (!active) return;
    time += dt;

    if (active.type === 'walk') {
      const dashaDone = moveCharacter(heroes.dasha, targetFor(active.to, 'dasha'), active.speed, dt);
      const sashaDone = moveCharacter(heroes.sasha, targetFor(active.to, 'sasha'), active.speed, dt);
      if (dashaDone && sashaDone) advance();
      return;
    }

    if (active.type === 'walk_one') {
      const who = active.who;
      if (moveCharacter(heroes[who], targetFor(active.to, who), active.speed, dt)) advance();
      return;
    }

    if (active.type === 'wait_until') {
      if (active.done()) advance();
      return;
    }

    if (active.type === 'move_cursor') {
      if (!active.from) active.from = { x: cursor.x, y: cursor.y };
      const p = Math.min(1, time / active.dur);
      cursor.x = active.from.x + (active.to.x - active.from.x) * p;
      cursor.y = active.from.y + (active.to.y - active.from.y) * p;
      if (time >= active.dur) advance();
      return;
    }

    if (active.type === 'click_cursor') {
      // Первая половина — «нажата», вторая — отпущена
      cursor.pressing = time < active.time * 0.5 ? 1 : 0;
      if (time >= active.time) {
        cursor.pressing = 0;
        advance();
      }
      return;
    }

    if (active.type === 'highlight_door') {
      // Подсветка держится после команды; flash — вспышка в начале
      doorHighlight = {
        doorId: active.doorId,
        color: active.color,
        flash: Math.max(0, 1 - time / active.time)
      };
      if (time >= active.time) advance();
      return;
    }

    if (time >= active.time) advance();
  }

  function render(ctx) {
    if (active) {
      if (active.type === 'dialogue') drawDialogue(ctx, active.text);
      else if (active.type === 'popup') drawPopup(ctx, active.text);
    }
    // Курсор — поверх всего
    if (cursor.visible) drawCursor(ctx, cursor);
  }

  beginCurrent();

  return {
    update,
    render,
    state,
    isDone() {
      return active === null;
    }
  };
}
