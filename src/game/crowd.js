// Движение толпы превью 1: маршруты-waypoints (start → stage → finish →
// enter) со случайными задержками, обход препятствий (AABB со слайдингом),
// «догон» отставших героев и исчезновение внутри тёмного проёма двери
// (по порогу DOOR_HIDE_Y — персонаж уже полностью накрыт «нутром»).
// Все константы — в preview1Constants.js.
import { PREVIEW1 } from './constants.js';

// Шаг попадает в расширенный прямоугольник препятствия (AABB по центру)?
function blockingRect(x, y) {
  return PREVIEW1.OBSTACLES.find(
    (o) => x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h
  );
}

// Какой край препятствия ближе: -1 — левый/верхний, +1 — правый/нижний
function nearestSide(value, a, b) {
  return Math.abs(value - a) <= Math.abs(value - b) ? -1 : 1;
}

// Раздаём каждому extra маршрут (waypoints): скорость = база × свой множитель,
// старт — со случайной задержкой (0…delayMax). routeFor(extra) — список точек
function setJourneys(extras, routeFor, delayMax) {
  for (const extra of extras) {
    extra.alpha = 1;
    extra.journey = {
      points: routeFor(extra),
      index: 0,
      speed: PREVIEW1.EXTRA_BASE_SPEED * extra.speedMultiplier,
      wait: Math.random() * delayMax,
      wallDir: 0
    };
  }
}

// Толпа идёт к ступенькам (после зелёного света): сначала «коридор» слева
// от памятника (stage), затем сбор у ступенек (finish)
export function startCrowdWalk(extras) {
  setJourneys(extras, (extra) => [
    PREVIEW1.EXTRAS_LAYOUT.stage[extra.id],
    PREVIEW1.EXTRAS_LAYOUT.finish[extra.id]
  ], PREVIEW1.EXTRA_DELAY_MAX);
}

// Толпа заходит в дверь (по очереди, с рандомной задержкой) — стартует
// параллельно с входом героев
export function startCrowdEnter(extras) {
  setJourneys(extras, (extra) => [PREVIEW1.EXTRAS_LAYOUT.enter[extra.id]],
    PREVIEW1.EXTRA_ENTER_DELAY_MAX);
}

// Шаг толпы к цели. Прямой шаг по обеим осям; упёршаяся в препятствие ось
// глушится (слайдинг). Если путь глушится впереди (зонд по направлению) —
// идём вдоль стены по прилегающей оси с долей скорости; сторона обхода
// фиксируется на всё время упора, чтобы не дёргаться. Внутри расширенного
// бокса двигаем свободно (выход из накладки). Отставшие ускоряются
// («догон»). Пересёк порог проёма (DOOR_HIDE_Y) — сразу скрываем.
export function stepCrowd(extras, heroes, dt) {
  const leadY = heroes ? Math.min(heroes.dasha.y, heroes.sasha.y) : -Infinity;
  // Скольжение вдоль стены — с долей базовой скорости
  const sidestepStep = PREVIEW1.EXTRA_BASE_SPEED * PREVIEW1.SIDESTEP_FRACTION * dt;

  for (const extra of extras) {
    // Уже в тёмном «нугре» двери (круг полностью накрыт проёмом) — скрываем
    if (extra.alpha > 0 && extra.y <= PREVIEW1.DOOR_HIDE_Y) extra.alpha = 0;

    const journey = extra.journey;
    if (!journey) continue;
    if (journey.wait > 0) {
      journey.wait -= dt;
      continue;
    }

    const to = journey.points[journey.index];
    const dx = to.x - extra.x;
    const dy = to.y - extra.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= 1) {
      if (journey.index < journey.points.length - 1) {
        journey.index += 1; // следующая точка маршрута
        journey.wallDir = 0;
        continue;
      }
      extra.x = to.x;
      extra.y = to.y;
      extra.journey = null;
      continue;
    }

    let speed = journey.speed;
    if (extra.y > leadY + PREVIEW1.CATCHUP.GAP) speed *= PREVIEW1.CATCHUP.FACTOR;

    const step = Math.min(distance, speed * dt);
    const ux = dx / distance;
    const uy = dy / distance;
    const probe = Math.max(3, step);
    const wallNow = !!blockingRect(extra.x, extra.y);
    const blocker = wallNow ? blockingRect(extra.x, extra.y)
      : blockingRect(extra.x + ux * probe, extra.y + uy * probe)
      || blockingRect(extra.x + ux * step, extra.y)
      || blockingRect(extra.x, extra.y + uy * step);

    if (blocker) {
      // Упор: скользим по прилегающей к ведущей оси стороне
      journey.wallDir = journey.wallDir || 0;
      if (Math.abs(uy) >= Math.abs(ux)) {
        // прогресс нужен по Y — ползём по X в сторону цели
        if (!journey.wallDir) {
          journey.wallDir = to.x <= blocker.x ? -1
            : to.x >= blocker.x + blocker.w ? 1
            : nearestSide(extra.x, blocker.x, blocker.x + blocker.w);
        }
        let nx = extra.x + journey.wallDir * sidestepStep;
        if (blockingRect(nx, extra.y)) {
          nx = extra.x - journey.wallDir * sidestepStep; // упёрлись в другой бокс
          if (!blockingRect(nx, extra.y)) journey.wallDir = -journey.wallDir;
          else nx = extra.x; // полностью зажаты — стоим этот кадр
        }
        extra.x = nx;
      } else {
        if (!journey.wallDir) {
          journey.wallDir = to.y <= blocker.y ? -1
            : to.y >= blocker.y + blocker.h ? 1
            : nearestSide(extra.y, blocker.y, blocker.y + blocker.h);
        }
        let ny = extra.y + journey.wallDir * sidestepStep;
        if (blockingRect(extra.x, ny)) {
          ny = extra.y - journey.wallDir * sidestepStep;
          if (!blockingRect(extra.x, ny)) journey.wallDir = -journey.wallDir;
          else ny = extra.y;
        }
        extra.y = ny;
      }
      continue;
    }

    // Путь свободен: прямой шаг, каждая ось независимо глушится у стены
    journey.wallDir = 0;
    const stepX = ux * step;
    const stepY = uy * step;
    if (wallNow || !blockingRect(extra.x + stepX, extra.y)) extra.x += stepX;
    if (wallNow || !blockingRect(extra.x, extra.y + stepY)) extra.y += stepY;
  }
}

// толпа зашла в дверь и скрылась в проёме
export function crowdEntered(extras) {
  return extras.every((extra) => !extra.journey && extra.alpha <= 0.001);
}
