// Движение героев Уровня 2: ввод (WASD / стрелки), AABB-коллизии с мебелью
// со слайдингом по осям и границы комнаты (clamp по LEVEL2.ROOM).
import { PLAYER_RADIUS, LEVEL2 } from '../game/constants.js';
import { inputState } from '../engine/input.js';

const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

// Прямоугольник героя (AABB для столкновений с мебелью)
export function heroBox(x, y) {
  return { x: x - PLAYER_RADIUS, y: y - PLAYER_RADIUS, w: PLAYER_RADIUS * 2, h: PLAYER_RADIUS * 2 };
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Пересечение с мебелью; запас используется при спавне таблеток
export function hitsFurniture(box, clearance = 0) {
  const area = {
    x: box.x - clearance, y: box.y - clearance,
    w: box.w + clearance * 2, h: box.h + clearance * 2
  };
  return LEVEL2.COLLIDERS.some((c) => intersects(area, c));
}

// Круг-прямоугольник (герой наступает на таблетку)
export function circleHitsRect(cx, cy, r, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}

// Сдвиг по одной оси: если новая позиция пересекает мебель — не двигаемся
// (обе оси обрабатываются раздельно — так герой «слайдит» вдоль препятствия)
function moveAxis(hero, dx, dy, dt) {
  const nx = hero.x + dx * LEVEL2.PLAYER_SPEED * dt;
  const ny = hero.y + dy * LEVEL2.PLAYER_SPEED * dt;
  if (!hitsFurniture(heroBox(nx, ny))) {
    hero.x = nx;
    hero.y = ny;
  }
}

// Полный шаг героя за кадр
export function moveHero(hero, dt) {
  const st = inputState[hero.id];
  let dx = (st.right ? 1 : 0) - (st.left ? 1 : 0);
  let dy = (st.down ? 1 : 0) - (st.up ? 1 : 0);
  if (dx === 0 && dy === 0) return;

  if (dx && dy) { // диагональ не быстрее прямого хода
    dx *= Math.SQRT1_2;
    dy *= Math.SQRT1_2;
  }
  hero.dir = { x: Math.sign(dx), y: Math.sign(dy) };

  moveAxis(hero, dx, 0, dt);
  moveAxis(hero, 0, dy, dt);

  // Стены комнаты — границы; герой всегда остаётся внутри
  const room = LEVEL2.ROOM;
  hero.x = clamp(hero.x, room.x + PLAYER_RADIUS, room.x + room.w - PLAYER_RADIUS);
  hero.y = clamp(hero.y, room.y + PLAYER_RADIUS, room.y + room.h - PLAYER_RADIUS);
}
