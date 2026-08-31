// ==========================================================================
// KYBER FOCUS TIMER - Motor de Temporización, Superación de Inercia y Auto-Registro
// ==========================================================================

import { focusSoundscape } from './focusSoundscape.js';
import { getTodayStr } from './tracker.js';
import { getSession, saveSession } from '../store/storage.js';
import { playKyberIgnite, playMasteryCelebration, playSelect, playDeactivate } from './audio.js';
import confetti from 'canvas-confetti';

export class FocusTimer {
  constructor(appContext) {
    this.ctx = appContext;

    this.state = 'idle'; // 'idle' | 'running' | 'paused' | 'completed'
    this.mode = 'friction_5'; // 'friction_5' | 'full_60'
    this.selectedHabit = 'english'; // 'english' | 'de' | 'both'
    this.singleGoal = '';
    this.selectedSoundscape = 'brown'; // 'brown' | 'rain' | 'binaural' | 'none'
    this.soundVolume = 0.6;

    this.durationSec = 300; // 5 min = 300s, 60 min = 3600s
    this.remainingSec = 300;
    this.totalAccumulatedSec = 0;

    this.timerInterval = null;
    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
    this.notify();
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify() {
    const data = this.getState();
    this.listeners.forEach(cb => {
      try { cb(data); } catch (e) { console.error('FocusTimer listener error:', e); }
    });
  }

  getState() {
    const minutes = Math.floor(this.remainingSec / 60);
    const seconds = this.remainingSec % 60;
    const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const progressPercent = this.durationSec > 0 
      ? Math.min(100, Math.round(((this.durationSec - this.remainingSec) / this.durationSec) * 100))
      : 0;

    return {
      state: this.state,
      mode: this.mode,
      selectedHabit: this.selectedHabit,
      singleGoal: this.singleGoal,
      selectedSoundscape: this.selectedSoundscape,
      soundVolume: this.soundVolume,
      durationSec: this.durationSec,
      remainingSec: this.remainingSec,
      totalAccumulatedSec: this.totalAccumulatedSec,
      timeFormatted,
      progressPercent
    };
  }

  setHabit(habit) {
    this.selectedHabit = habit;
    this.notify();
  }

  setGoal(goal) {
    this.singleGoal = goal;
    this.notify();
  }

  setSoundscape(soundType) {
    this.selectedSoundscape = soundType;
    if (this.state === 'running') {
      try {
        focusSoundscape.setSoundscape(soundType);
      } catch (e) {}
    }
    this.notify();
  }

  setVolume(vol) {
    this.soundVolume = vol;
    try {
      focusSoundscape.setVolume(vol);
    } catch (e) {}
    this.notify();
  }

  /**
   * ⚡ Iniciar Disparador Anti-Inercia (5 Minutos)
   */
  start5MinJumpstart() {
    this.stopTimerInterval();
    this.mode = 'friction_5';
    this.durationSec = 5 * 60; // 300s
    this.remainingSec = this.durationSec;
    this.totalAccumulatedSec = 0;
    this.state = 'running';

    try { playKyberIgnite(); } catch (e) {}
    try {
      focusSoundscape.setVolume(this.soundVolume);
      focusSoundscape.setSoundscape(this.selectedSoundscape);
    } catch (e) {}

    this.runTickLoop();
    this.notify();
  }

  /**
   * 🎯 Iniciar Hora Completa Directa (60 Minutos)
   */
  start60MinSession() {
    this.stopTimerInterval();
    this.mode = 'full_60';
    this.durationSec = 60 * 60; // 3600s
    this.remainingSec = this.durationSec;
    this.totalAccumulatedSec = 0;
    this.state = 'running';

    try { playKyberIgnite(); } catch (e) {}
    try {
      focusSoundscape.setVolume(this.soundVolume);
      focusSoundscape.setSoundscape(this.selectedSoundscape);
    } catch (e) {}

    this.runTickLoop();
    this.notify();
  }

  pause() {
    if (this.state !== 'running') return;
    this.state = 'paused';
    this.stopTimerInterval();
    try { focusSoundscape.stopAll(0.3); } catch (e) {}
    try { playSelect(); } catch (e) {}
    this.notify();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'running';
    try { playSelect(); } catch (e) {}
    try {
      focusSoundscape.setVolume(this.soundVolume);
      focusSoundscape.setSoundscape(this.selectedSoundscape);
    } catch (e) {}
    this.runTickLoop();
    this.notify();
  }

  stop() {
    this.stopTimerInterval();
    this.state = 'idle';
    this.remainingSec = this.durationSec;
    try { focusSoundscape.stopAll(0.2); } catch (e) {}
    try { playDeactivate(); } catch (e) {}
    this.notify();
  }

  stopTimerInterval() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  runTickLoop() {
    this.stopTimerInterval();
    this.timerInterval = setInterval(() => {
      if (this.state !== 'running') return;

      this.remainingSec--;
      this.totalAccumulatedSec++;

      // Fin del temporizador actual
      if (this.remainingSec <= 0) {
        if (this.mode === 'friction_5') {
          // 🎉 ¡Inercia rota con éxito! Transición automática a la hora completa sin frenar
          this.handleInertiaBroken();
        } else {
          // 🏆 ¡Hora de estudio completada!
          this.handleSessionCompleted();
        }
      } else {
        this.notify();
      }
    }, 1000);
  }

  /**
   * Superación de inercia: expande a la hora completa (55 min restantes)
   */
  handleInertiaBroken() {
    try { playKyberIgnite(); } catch (e) {}

    // Pequeño estallido de confeti sutil de aliento
    try {
      confetti({
        particleCount: 28,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#0071e3', '#5856d6', '#ff9500']
      });
    } catch (e) {}

    // Cambiar a modo 60 min y configurar los 55 min restantes
    this.mode = 'full_60';
    this.durationSec = 60 * 60; // 3600s
    this.remainingSec = 55 * 60; // 3300s
    this.notify();

    // Notificación en la app
    if (this.ctx && this.ctx.ui && this.ctx.ui.showToast) {
      this.ctx.ui.showToast('⚡ ¡Inercia rota! Modo flujo activado para completar tu hora.', 'success', 4500);
    }
  }

  /**
   * Finalización de la hora completa: auto-registro y celebración
   */
  handleSessionCompleted() {
    this.stopTimerInterval();
    this.state = 'completed';
    try { focusSoundscape.stopAll(0.5); } catch (e) {}
    try { playMasteryCelebration(); } catch (e) {}

    // Gran celebración con confeti
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    // Auto-registrar la sesión en Kyber Tracker para el día de hoy
    try {
      this.autoLogSession();
    } catch (e) {
      console.error('Error auto-logging session:', e);
    }

    this.notify();

    if (this.ctx && this.ctx.ui && this.ctx.ui.showToast) {
      this.ctx.ui.showToast('🏆 ¡Felicidades! Completaste tu hora de estudio y ha sido registrada.', 'success', 6000);
    }
  }

  /**
   * Registra automáticamente la sesión en el almacenamiento local
   */
  autoLogSession() {
    const todayStr = getTodayStr();
    const existing = getSession(todayStr) || {};

    const isEnglish = this.selectedHabit === 'english' || this.selectedHabit === 'both';
    const isDE = this.selectedHabit === 'de' || this.selectedHabit === 'both';

    // Combinar con temas existentes si los hay
    let combinedTopics = existing.topics || '';
    if (this.singleGoal && !combinedTopics.includes(this.singleGoal)) {
      combinedTopics = combinedTopics ? `${combinedTopics}, ${this.singleGoal}` : this.singleGoal;
    }

    saveSession(todayStr, {
      date: todayStr,
      englishCompleted: Boolean(existing.englishCompleted || isEnglish),
      dataEngCompleted: Boolean(existing.dataEngCompleted || isDE),
      topics: combinedTopics,
      notes: existing.notes || 'Completado mediante el Modo Enfoque Kyber.'
    });

    if (this.ctx && this.ctx.refreshAll) {
      this.ctx.refreshAll();
    }
  }
}
