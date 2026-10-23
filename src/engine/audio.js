// Короткие синтезированные звуки (WebAudio, без файлов). Громкость низкая.
// AudioContext создаётся лениво — при первом звуке (браузеры требуют
// «жест» пользователя; нажатия клавиш им являются). Если WebAudio нет —
// все вызовы молча ничего не делают.

let audioCtx = null;

function getAudioCtx() {
  if (audioCtx) return audioCtx;
  if (typeof window === 'undefined') return null;

  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;

  try {
    audioCtx = new Ctor();
  } catch {
    audioCtx = null;
  }
  return audioCtx;
}

function tone(ctx, { type, from, to, start, duration, volume }) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, ctx.currentTime + start);
  if (to !== from) {
    oscillator.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + start + duration);
  }

  gain.gain.setValueAtTime(volume, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(ctx.currentTime + start);
  oscillator.stop(ctx.currentTime + start + duration);
}

// Рецепты звуков: { type, from, to, start, duration, volume }
const SOUNDS = {
  // Шелест: короткий «вжик» вверх при поднятии шпаргалки, вниз — при уборке
  cheat_up: [{ type: 'triangle', from: 320, to: 480, start: 0, duration: 0.08, volume: 0.05 }],
  cheat_down: [{ type: 'triangle', from: 480, to: 300, start: 0, duration: 0.08, volume: 0.05 }],

  // Тревога: два быстрых сигнала «!» над учителем
  warn: [
    { type: 'square', from: 880, to: 880, start: 0, duration: 0.09, volume: 0.05 },
    { type: 'square', from: 1174, to: 1174, start: 0.12, duration: 0.09, volume: 0.05 }
  ],

  // Поимка: низкий «бззз»
  caught: [{ type: 'sawtooth', from: 160, to: 60, start: 0, duration: 0.35, volume: 0.07 }],

  // Рост шкалы: лёгкий «тик» каждые 10 %
  tick: [{ type: 'sine', from: 1200, to: 1200, start: 0, duration: 0.03, volume: 0.03 }],

  // Смыкание шкал: короткий позитивный аккорд
  win: [
    { type: 'triangle', from: 523, to: 523, start: 0, duration: 0.18, volume: 0.06 },
    { type: 'triangle', from: 659, to: 659, start: 0.12, duration: 0.18, volume: 0.06 },
    { type: 'triangle', from: 784, to: 784, start: 0.24, duration: 0.3, volume: 0.06 }
  ]
};

export function initAudio() {
  // Контекст создаётся лениво при первом звуке — отдельный init не нужен.
}

export function play(name) {
  const recipe = SOUNDS[name];
  if (!recipe) return;

  const ctx = getAudioCtx();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') ctx.resume();
    for (const note of recipe) tone(ctx, note);
  } catch {
    // Звук — не критичная часть: любые сбои молча игнорируем
  }
}
