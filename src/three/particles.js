// ==========================================================================
// CRYSTAL PARTICLES & CELEBRATION - Limpio y despejado sin partículas flotantes
// ==========================================================================

import confetti from 'canvas-confetti';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    // Escena limpia y despejada: sin partículas flotantes de fondo ni alrededor del pedestal
  }

  update(time) {
    // No-op para mantener compatibilidad con el bucle de animación
  }

  triggerCelebration() {
    confetti({
      particleCount: 65,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#00f5d4', '#c77dff', '#ffb703', '#ffffff'],
      shapes: ['circle'],
      scalar: 1.0
    });
  }
}
