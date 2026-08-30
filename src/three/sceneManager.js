// ==========================================================================
// SCENE MANAGER - Iluminación Calibrada de Estudio (Colores Vivos, Sin Lavado)
// ==========================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.width = container.clientWidth || window.innerWidth;
    this.height = container.clientHeight || window.innerHeight;

    // Escena principal
    this.scene = new THREE.Scene();

    // Fondo: Gradiente suave y equilibrado (Menta suave -> Blanco -> Lavanda)
    this.setupStudioBackground();
    this.scene.fog = new THREE.FogExp2(0xf8fafc, 0.008);

    this.camera = new THREE.PerspectiveCamera(38, this.width / this.height, 0.1, 1000);
    this.camera.position.set(0, 20, 26);

    // Renderizador WebGL calibrado sin sobreexposición
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
    this.renderer.shadowMap.enabled = false;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Exposición calibrada a 1.0 para preservar el contraste y saturación real
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);

    // Controles orbitales suaves y receptivos
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 55;
    this.controls.maxPolarAngle = Math.PI / 2.12;
    this.controls.target.set(0, 0.5, 0);

    // Animación de Cámara (Lerp)
    this.targetCamPos = null;
    this.targetControlsTarget = null;

    // Iluminación calibrada: suave, sin sobreexponer ni quemar los colores
    this.setupLights();

    // Eventos
    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);

    this.updateCallbacks = [];
  }

  setupStudioBackground() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 512, 0);
    gradient.addColorStop(0.0, '#c7ebe6');   // Menta suave neutra
    gradient.addColorStop(0.35, '#e6f4f1');  
    gradient.addColorStop(0.5, '#ffffff');   // Blanco puro
    gradient.addColorStop(0.65, '#ede9fe');  
    gradient.addColorStop(1.0, '#ddd6fe');   // Lavanda suave

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);

    const texture = new THREE.CanvasTexture(canvas);
    this.scene.background = texture;
    this.backgroundTexture = texture;
  }

  setupLights() {
    // 1. Luz de cielo y suelo equilibrada (sin quemar blancos)
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xf1f5f9, 0.85);
    this.scene.add(hemiLight);

    // 2. Luz de relleno ambiente tenue
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // 3. Luz direccional frontal para contraste limpio
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(12, 22, 14);
    this.scene.add(keyLight);

    // 4. Luz de relleno trasera suave
    const fillLight = new THREE.DirectionalLight(0xe0e7ff, 0.4);
    fillLight.position.set(-12, 16, -10);
    this.scene.add(fillLight);
  }

  onWindowResize() {
    this.width = this.container.clientWidth || window.innerWidth;
    this.height = this.container.clientHeight || window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));
  }

  registerUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  resetCamera() {
    this.targetCamPos = new THREE.Vector3(0, 20, 26);
    this.targetControlsTarget = new THREE.Vector3(0, 0.5, 0);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const time = performance.now() * 0.001;

    // Transición suave de cámara
    if (this.targetCamPos) {
      this.camera.position.lerp(this.targetCamPos, 0.08);
      if (this.camera.position.distanceTo(this.targetCamPos) < 0.1) {
        this.camera.position.copy(this.targetCamPos);
        this.targetCamPos = null;
      }
    }
    if (this.targetControlsTarget) {
      this.controls.target.lerp(this.targetControlsTarget, 0.08);
      if (this.controls.target.distanceTo(this.targetControlsTarget) < 0.1) {
        this.controls.target.copy(this.targetControlsTarget);
        this.targetControlsTarget = null;
      }
    }

    this.controls.update();

    for (let i = 0; i < this.updateCallbacks.length; i++) {
      this.updateCallbacks[i](time);
    }

    this.renderer.render(this.scene, this.camera);
  }

  static disposeObject(obj) {
    if (!obj) return;
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
    if (obj.children) {
      while (obj.children.length > 0) {
        const child = obj.children[0];
        obj.remove(child);
        SceneManager.disposeObject(child);
      }
    }
  }
}
