// ==========================================================================
// KYBER TRAFFIC SYSTEM - Desactivado para máxima fluidez y limpieza de escena
// ==========================================================================

export class TrafficSystem {
  constructor(scene) {
    this.enabled = false;
  }

  update() {
    // Sin naves voladoras para mantener la escena despejada y 60 FPS
  }

  toggle() {
    return false;
  }
}
