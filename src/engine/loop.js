// Фиксированный игровой цикл: шаг симуляции 60 Гц, рендер по rAF.
// API: startLoop({ update, render }).

const STEP = 1 / 60; // фиксированный шаг симуляции, с
const MAX_DT = 0.25; // предел реального dt, чтобы не было «спирали смерти»

export function startLoop({ update, render }) {
  let lastTime = performance.now();
  let accumulator = 0;

  function frame(now) {
    // Следующий кадр планируем СРАЗУ: если update/render бросит исключение
    // (ошибка всё равно попадёт в консоль), цикл не умрёт навсегда и
    // экран не «застынет» чёрным
    requestAnimationFrame(frame);

    let dt = (now - lastTime) / 1000;
    lastTime = now;

    // Например, вкладка была в фоне — не догоняем всеми шагами сразу
    if (dt > MAX_DT) dt = MAX_DT;
    accumulator += dt;

    while (accumulator >= STEP) {
      update(STEP);
      accumulator -= STEP;
    }

    render();
  }

  requestAnimationFrame(frame);
}
