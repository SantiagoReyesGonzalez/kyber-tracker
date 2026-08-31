// ==========================================================================
// KYBER FOCUS SOUNDSCAPE - Generador de Audio Procedural Web Audio API
// 100% Nativo, Sin Archivos Externos, Cero Latencia, Funciona Offline
// ==========================================================================

class FocusSoundscape {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.currentTrack = 'none'; // 'brown', 'rain', 'binaural', 'none'
    this.volume = 0.6; // 0.0 a 1.0
    this.activeNodes = [];
  }

  getContext() {
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('AudioContext error:', e);
    }
    return this.audioCtx;
  }

  getMasterGain() {
    try {
      const ctx = this.getContext();
      if (!ctx) return null;
      if (!this.masterGain) {
        this.masterGain = ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);
        this.masterGain.connect(ctx.destination);
      }
      return this.masterGain;
    } catch (e) {
      return null;
    }
  }

  setVolume(val) {
    try {
      this.volume = Math.max(0, Math.min(1, val));
      if (this.masterGain && this.audioCtx) {
        this.masterGain.gain.setTargetAtTime(this.volume, this.audioCtx.currentTime, 0.05);
      }
    } catch (e) {}
  }

  stopAll(fadeDuration = 0.25) {
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;

    try {
      if (this.activeNodes.length > 0) {
        this.activeNodes.forEach(nodeGroup => {
          try {
            if (nodeGroup.gain && nodeGroup.gain.gain) {
              nodeGroup.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fadeDuration * 0.5);
            }
            if (nodeGroup.sources) {
              nodeGroup.sources.forEach(src => {
                try {
                  src.stop(ctx.currentTime + fadeDuration);
                } catch (e) {}
              });
            }
          } catch (e) {}
        });
        this.activeNodes = [];
      }
    } catch (e) {}
    this.currentTrack = 'none';
  }

  /**
   * 🌊 RUIDO MARRÓN (Brown Noise)
   * El sonido más efectivo para programación y concentración profunda
   */
  playBrownNoise() {
    try {
      this.stopAll(0.15);
      const ctx = this.getContext();
      if (!ctx) return;
      const master = this.getMasterGain();
      if (!master) return;

      const sampleRate = ctx.sampleRate || 44100;
      const bufferSize = sampleRate * 5; // 5 segundos en bucle
      const noiseBuffer = ctx.createBuffer(2, bufferSize, sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const output = noiseBuffer.getChannelData(channel);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Integrador con fuga para Brown Noise
          lastOut = (lastOut + 0.02 * white) / 1.02;
          output[i] = lastOut * 3.5;
        }
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filtro pasa-bajos cálido para suavizar agudos
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(360, ctx.currentTime);

      const trackGain = ctx.createGain();
      trackGain.gain.setValueAtTime(0.001, ctx.currentTime);
      trackGain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.3);

      whiteNoise.connect(filter);
      filter.connect(trackGain);
      trackGain.connect(master);

      whiteNoise.start(0);

      this.activeNodes.push({
        sources: [whiteNoise],
        gain: trackGain
      });
      this.currentTrack = 'brown';
    } catch (err) {
      console.warn('Error al reproducir Brown Noise:', err);
    }
  }

  /**
   * 🌧️ LLUVIA SUAVE (Gentle Rain)
   * Ideal para lectura, listening y absorción de conceptos
   */
  playRainSound() {
    try {
      this.stopAll(0.15);
      const ctx = this.getContext();
      if (!ctx) return;
      const master = this.getMasterGain();
      if (!master) return;

      const sampleRate = ctx.sampleRate || 44100;
      const bufferSize = sampleRate * 5;
      const noiseBuffer = ctx.createBuffer(2, bufferSize, sampleRate);

      for (let channel = 0; channel < 2; channel++) {
        const output = noiseBuffer.getChannelData(channel);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
      }

      const rainSource = ctx.createBufferSource();
      rainSource.buffer = noiseBuffer;
      rainSource.loop = true;

      // Filtro pasa-banda principal para emular lluvia
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1000, ctx.currentTime);
      bandpass.Q.setValueAtTime(0.65, ctx.currentTime);

      // Filtro pasa-altos suave para gotas brillantes
      const highpass = ctx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(450, ctx.currentTime);

      const trackGain = ctx.createGain();
      trackGain.gain.setValueAtTime(0.001, ctx.currentTime);
      trackGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.35);

      rainSource.connect(bandpass);
      bandpass.connect(highpass);
      highpass.connect(trackGain);
      trackGain.connect(master);

      rainSource.start(0);

      this.activeNodes.push({
        sources: [rainSource],
        gain: trackGain
      });
      this.currentTrack = 'rain';
    } catch (err) {
      console.warn('Error al reproducir Rain Sound:', err);
    }
  }

  /**
   * 🌌 ONDAS BINAURALES ALFA (10 Hz Flow State)
   * Estimula ondas cerebrales de calma y alta concentración
   */
  playBinauralAlpha() {
    try {
      this.stopAll(0.15);
      const ctx = this.getContext();
      if (!ctx) return;
      const master = this.getMasterGain();
      if (!master) return;

      const baseFreq = 200; // Canal izquierdo: 200 Hz
      const beatFreq = 10;  // Diferencia Alfa: 10 Hz -> Canal derecho: 210 Hz

      // Canal Izquierdo
      const oscL = ctx.createOscillator();
      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(baseFreq, ctx.currentTime);

      // Canal Derecho
      const oscR = ctx.createOscillator();
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(baseFreq + beatFreq, ctx.currentTime);

      let pannerL = null;
      let pannerR = null;
      try {
        if (typeof ctx.createStereoPanner === 'function') {
          pannerL = ctx.createStereoPanner();
          pannerL.pan.setValueAtTime(-1, ctx.currentTime);
          pannerR = ctx.createStereoPanner();
          pannerR.pan.setValueAtTime(1, ctx.currentTime);
        }
      } catch (e) {}

      // Pad armónico cálido de fondo
      const padOsc = ctx.createOscillator();
      padOsc.type = 'triangle';
      padOsc.frequency.setValueAtTime(baseFreq / 2, ctx.currentTime); // 100 Hz

      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(220, ctx.currentTime);

      const padGain = ctx.createGain();
      padGain.gain.setValueAtTime(0.12, ctx.currentTime);

      const trackGain = ctx.createGain();
      trackGain.gain.setValueAtTime(0.001, ctx.currentTime);
      trackGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);

      if (pannerL && pannerR) {
        oscL.connect(pannerL);
        pannerL.connect(trackGain);

        oscR.connect(pannerR);
        pannerR.connect(trackGain);
      } else {
        oscL.connect(trackGain);
        oscR.connect(trackGain);
      }

      padOsc.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(trackGain);

      trackGain.connect(master);

      oscL.start(0);
      oscR.start(0);
      padOsc.start(0);

      this.activeNodes.push({
        sources: [oscL, oscR, padOsc],
        gain: trackGain
      });
      this.currentTrack = 'binaural';
    } catch (err) {
      console.warn('Error al reproducir Binaural Alpha:', err);
    }
  }

  setSoundscape(type) {
    if (type === 'brown') {
      this.playBrownNoise();
    } else if (type === 'rain') {
      this.playRainSound();
    } else if (type === 'binaural') {
      this.playBinauralAlpha();
    } else {
      this.stopAll(0.3);
    }
  }

  getCurrentSoundscape() {
    return this.currentTrack;
  }
}

export const focusSoundscape = new FocusSoundscape();
