// ==========================================================================
// GLASS PEDESTAL - Base Escalonada Limpia y Neutra de Alto Contraste
// ==========================================================================

import * as THREE from 'three';

export class Holotable {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    this.createSteppedGlassPedestal();

    this.scene.add(this.group);
  }

  createSteppedGlassPedestal() {
    // 1. Nivel Base Exterior (Blanco neutro / gris perla suave)
    const outerGeo = new THREE.CylinderGeometry(15.5, 16.2, 0.4, 32);
    const outerMat = new THREE.MeshPhongMaterial({
      color: 0xf8fafc,
      specular: 0xffffff,
      shininess: 30,
      transparent: true,
      opacity: 0.92
    });
    const outerDisc = new THREE.Mesh(outerGeo, outerMat);
    outerDisc.position.y = -0.5;
    this.group.add(outerDisc);

    // Borde redondeado exterior
    const rimGeo = new THREE.TorusGeometry(15.5, 0.09, 8, 32);
    const rimMat = new THREE.MeshPhongMaterial({
      color: 0xe2e8f0,
      specular: 0xffffff,
      shininess: 40,
      transparent: true,
      opacity: 0.85
    });
    const outerRim = new THREE.Mesh(rimGeo, rimMat);
    outerRim.rotation.x = Math.PI / 2;
    outerRim.position.y = -0.3;
    this.group.add(outerRim);

    // 2. Nivel Intermedio Escalonado
    const midGeo = new THREE.CylinderGeometry(13.6, 14.2, 0.35, 32);
    const midMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      specular: 0xffffff,
      shininess: 30,
      transparent: true,
      opacity: 0.88
    });
    const midDisc = new THREE.Mesh(midGeo, midMat);
    midDisc.position.y = -0.18;
    this.group.add(midDisc);

    // 3. Plataforma Superior
    const topGeo = new THREE.CylinderGeometry(12.2, 12.5, 0.2, 32);
    const topMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      specular: 0xffffff,
      shininess: 25,
      transparent: true,
      opacity: 0.85
    });
    const topDisc = new THREE.Mesh(topGeo, topMat);
    topDisc.position.y = 0.02;
    this.group.add(topDisc);

    // 4. Cuadrícula tenue sobre la plataforma
    const grid = new THREE.GridHelper(21.5, 21, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = 0.13;
    grid.material.transparent = true;
    grid.material.opacity = 0.45;
    this.group.add(grid);

    // Anillo grabado en la plataforma
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xe2e8f0,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(11.8, 12.0, 32), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.14;
    this.group.add(ring);
  }

  update(time) {
    // Rendimiento óptimo sin cálculos redundantes
  }
}
