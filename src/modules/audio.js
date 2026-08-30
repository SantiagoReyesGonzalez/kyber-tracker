// ==========================================================================
// KYBER AUDIO SYNTHESIZER - Web Audio API Sci-Fi Sound FX
// ==========================================================================

import { getAudioEnabled, setAudioEnabled } from '../store/storage.js';

let audioCtx = null;
let isAudioActive = getAudioEnabled();

function getContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleAudio() {
  isAudioActive = !isAudioActive;
  setAudioEnabled(isAudioActive);
  if (isAudioActive) {
    playHover();
  }
  return isAudioActive;
}

export function isAudioOn() {
  return isAudioActive;
}

/**
 * Sonido al pasar el cursor sobre un cristal Kyber (Bip holográfico sutil)
 */
export function playHover() {
  if (!isAudioActive) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {
    // Audio safe fallback
  }
}

/**
 * Sonido al seleccionar un cristal (Click holográfico táctil)
 */
export function playSelect() {
  if (!isAudioActive) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch (e) {
    // Audio safe fallback
  }
}

/**
 * Sonido de ignición de cristal Kyber / Sable de luz
 */
export function playKyberIgnite() {
  if (!isAudioActive) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Oscilador 1: Zumbido de plasma grave
    const oscLow = ctx.createOscillator();
    const gainLow = ctx.createGain();
    oscLow.type = 'sawtooth';
    oscLow.frequency.setValueAtTime(65, now);
    oscLow.frequency.exponentialRampToValueAtTime(110, now + 0.35);

    gainLow.gain.setValueAtTime(0.12, now);
    gainLow.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    oscLow.connect(gainLow);
    gainLow.connect(ctx.destination);
    oscLow.start(now);
    oscLow.stop(now + 0.45);

    // Oscilador 2: Destello de energía brillante
    const oscHigh = ctx.createOscillator();
    const gainHigh = ctx.createGain();
    oscHigh.type = 'sine';
    oscHigh.frequency.setValueAtTime(440, now);
    oscHigh.frequency.exponentialRampToValueAtTime(1760, now + 0.25);

    gainHigh.gain.setValueAtTime(0.1, now);
    gainHigh.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    oscHigh.connect(gainHigh);
    gainHigh.connect(ctx.destination);
    oscHigh.start(now);
    oscHigh.stop(now + 0.35);
  } catch (e) {
    // Audio safe fallback
  }
}

/**
 * Sonido celestial de maestría y celebración galáctica
 */
export function playMasteryCelebration() {
  if (!isAudioActive) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const notes = [440, 554.37, 659.25, 880, 1108.73]; // Acorde A Mayor brillante
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.06, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.65);
    });
  } catch (e) {
    // Audio safe fallback
  }
}

/**
 * Sonido de desvanecimiento / eliminación
 */
export function playDeactivate() {
  if (!isAudioActive) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    // Audio safe fallback
  }
}
