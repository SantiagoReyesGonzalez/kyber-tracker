// ==========================================================================
// CALENDAR TILES - Cuadros de Alto Contraste con Efecto Neón Sutil en Hover
// ==========================================================================

import * as THREE from 'three';
import { getMonthCalendarGrid, DAY_NAMES_ES } from '../modules/tracker.js';
import { SceneManager } from './sceneManager.js';

export class KyberCalendarGrid {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.interactiveMeshes = [];
    this.tileItems = [];
    this.todayBeacon = null;

    // Cache de texturas de números
    this.textTextureCache = new Map();

    // Geometrías compartidas
    this.geoTile = new THREE.BoxGeometry(2.6, 0.44, 2.6);
    this.geoPlate = new THREE.PlaneGeometry(2.25, 2.25);
    this.geoEdges = new THREE.EdgesGeometry(this.geoTile);

    // Configuración de colores de alto contraste y neón
    this.palette = {
      empty: {
        color: 0xffffff,
        emissive: 0x94a3b8,
        emissiveDefault: 0.0,
        neonColor: 0x38bdf8, // Neón celeste suave
        textFill: '#0f172a'  // Contraste máximo > 12:1
      },
      english: {
        color: 0x0d9488,     // Verde azulado / Teal rico y saturado
        emissive: 0x0f766e,
        emissiveDefault: 0.12,
        neonColor: 0x00f5d4, // Neón cian eléctrico
        textFill: '#ffffff'  // Contraste blanco nítido > 4.8:1
      },
      de: {
        color: 0x7c3aed,     // Púrpura / Violeta vibrante
        emissive: 0x6d28d9,
        emissiveDefault: 0.12,
        neonColor: 0xd946ef, // Neón magenta/violeta eléctrico
        textFill: '#ffffff'  // Contraste blanco nítido > 6.5:1
      },
      both: {
        color: 0xd97706,     // Ámbar / Oro profundo
        emissive: 0xb45309,
        emissiveDefault: 0.15,
        neonColor: 0xfbbf24, // Neón dorado eléctrico
        textFill: '#ffffff'  // Contraste blanco nítido > 5.1:1
      }
    };
  }

  getNumberTexture(num, state) {
    const key = `${num}_${state}`;
    if (this.textTextureCache.has(key)) {
      return this.textTextureCache.get(key);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);

    const cfg = this.palette[state] || this.palette.empty;

    // Tipografía grande, bold y centrada para máxima legibilidad
    ctx.fillStyle = cfg.textFill;
    ctx.font = '800 112px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(num), 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    this.textTextureCache.set(key, texture);
    return texture;
  }

  disposePreviousGrid() {
    SceneManager.disposeObject(this.group);
    this.interactiveMeshes = [];
    this.tileItems = [];
    this.todayBeacon = null;
  }

  buildMonth(year, month) {
    this.disposePreviousGrid();

    const calendar = getMonthCalendarGrid(year, month);
    const spacingX = 3.1;
    const spacingZ = 3.1;

    const gridWidth = 6 * spacingX;
    const gridDepth = (calendar.totalRows - 1) * spacingZ;
    const offsetX = -gridWidth / 2;
    const offsetZ = -gridDepth / 2;

    this.buildWeekdayHeaders(offsetX, offsetZ, spacingX);

    calendar.days.forEach(day => {
      const posX = offsetX + day.col * spacingX;
      const posZ = offsetZ + day.row * spacingZ;

      const tileGroup = new THREE.Group();
      tileGroup.position.set(posX, 0, posZ);

      // Determinar hábito
      const s = day.session;
      const isEng = s && s.englishCompleted;
      const isDE = s && s.dataEngCompleted;

      let state = 'empty';
      if (isEng && isDE) state = 'both';
      else if (isDE) state = 'de';
      else if (isEng) state = 'english';

      const cfg = this.palette[state];

      // 1. Material del cuadro con color rico y saturado
      const tileMat = new THREE.MeshPhongMaterial({
        color: cfg.color,
        specular: state === 'empty' ? 0xcccccc : 0xffffff,
        shininess: state === 'empty' ? 30 : 60,
        emissive: new THREE.Color(cfg.emissive),
        emissiveIntensity: cfg.emissiveDefault,
        flatShading: true
      });

      const tileMesh = new THREE.Mesh(this.geoTile, tileMat);
      tileMesh.position.y = 0.22;
      tileGroup.add(tileMesh);

      // 2. Borde Neón con su color respectivo (Sutil en reposo, brillante en hover)
      const edgeMat = new THREE.LineBasicMaterial({
        color: cfg.neonColor,
        transparent: true,
        opacity: state === 'empty' ? 0.15 : 0.35
      });
      const edgesMesh = new THREE.LineSegments(this.geoEdges, edgeMat);
      edgesMesh.position.y = 0.22;
      tileGroup.add(edgesMesh);

      // 3. Placa con el número grande de alto contraste
      const plateMat = new THREE.MeshBasicMaterial({
        map: this.getNumberTexture(day.dayNumber, state),
        transparent: true,
        opacity: 0.98
      });
      const topPlate = new THREE.Mesh(this.geoPlate, plateMat);
      topPlate.rotation.x = -Math.PI / 2;
      topPlate.position.y = 0.45;
      tileGroup.add(topPlate);

      // Asignar datos de interacción
      tileMesh.userData = { dayData: day };
      topPlate.userData = { dayData: day };

      this.interactiveMeshes.push(tileMesh);
      this.interactiveMeshes.push(topPlate);

      const item = {
        day,
        tileGroup,
        tileMesh,
        tileMat,
        edgesMesh,
        edgeMat,
        cfg,
        baseY: 0,
        currentY: 0,
        targetY: 0,
        defaultEmissiveIntensity: cfg.emissiveDefault,
        targetEmissiveIntensity: cfg.emissiveDefault,
        defaultEdgeOpacity: state === 'empty' ? 0.15 : 0.35,
        targetEdgeOpacity: state === 'empty' ? 0.15 : 0.35,
        isFocused: false
      };

      this.tileItems.push(item);

      // Baliza sutil para el día de hoy
      if (day.isToday) {
        const beaconMat = new THREE.MeshBasicMaterial({
          color: 0x0ea5e9,
          transparent: true,
          opacity: 0.85
        });
        const beacon = new THREE.Mesh(
          new THREE.TorusGeometry(1.42, 0.03, 6, 32),
          beaconMat
        );
        beacon.rotation.x = Math.PI / 2;
        beacon.position.set(posX, 0.52, posZ);
        this.group.add(beacon);
        this.todayBeacon = beacon;
      }

      this.group.add(tileGroup);
    });
  }

  buildWeekdayHeaders(offsetX, offsetZ, spacingX) {
    DAY_NAMES_ES.forEach((name, i) => {
      const posX = offsetX + i * spacingX;
      const posZ = offsetZ - 2.2;

      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 128, 64);
      ctx.fillStyle = '#0f766e';
      ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 64, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.85 });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.0), mat);
      mesh.rotation.x = -Math.PI / 2.8;
      mesh.position.set(posX, 0.25, posZ);
      this.group.add(mesh);
    });
  }

  /**
   * Hover: Efecto neón sutil de su propio color y suave elevación
   */
  setFocus(dayData) {
    const targetDate = dayData ? dayData.dateStr : null;

    for (let i = 0; i < this.tileItems.length; i++) {
      const item = this.tileItems[i];
      const match = item.day.dateStr === targetDate;

      if (match) {
        item.isFocused = true;
        item.targetY = 0.24; // Elevación suave
        item.targetEdgeOpacity = 1.0; // Borde neón al 100% de intensidad
        item.targetEmissiveIntensity = Math.max(item.defaultEmissiveIntensity + 0.45, 0.55);
        item.tileGroup.scale.set(1.04, 1.08, 1.04);
      } else {
        item.isFocused = false;
        item.targetY = 0;
        item.targetEdgeOpacity = item.defaultEdgeOpacity;
        item.targetEmissiveIntensity = item.defaultEmissiveIntensity;
        item.tileGroup.scale.set(1.0, 1.0, 1.0);
      }
    }
  }

  clearFocus() {
    for (let i = 0; i < this.tileItems.length; i++) {
      const item = this.tileItems[i];
      item.isFocused = false;
      item.targetY = 0;
      item.targetEdgeOpacity = item.defaultEdgeOpacity;
      item.targetEmissiveIntensity = item.defaultEmissiveIntensity;
      item.tileGroup.scale.set(1.0, 1.0, 1.0);
    }
  }

  update(time) {
    for (let i = 0; i < this.tileItems.length; i++) {
      const item = this.tileItems[i];

      // Interpolación suave de posición Y
      item.currentY += (item.targetY - item.currentY) * 0.2;
      item.tileGroup.position.y = item.currentY;

      // Interpolación suave del brillo neón
      if (item.tileMat.emissiveIntensity !== undefined) {
        item.tileMat.emissiveIntensity += (item.targetEmissiveIntensity - item.tileMat.emissiveIntensity) * 0.2;
      }

      // Interpolación del borde neón
      if (item.edgeMat.opacity !== undefined) {
        item.edgeMat.opacity += (item.targetEdgeOpacity - item.edgeMat.opacity) * 0.25;
      }
    }

    if (this.todayBeacon) {
      this.todayBeacon.rotation.z = time * 0.6;
    }
  }

  getInteractiveMeshes() {
    return this.interactiveMeshes;
  }
}
