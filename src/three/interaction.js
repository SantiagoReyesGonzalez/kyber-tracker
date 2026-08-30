// ==========================================================================
// KYBER INTERACTION - Raycasting, Hover de Cristales y Selección Clean Tech
// ==========================================================================

import * as THREE from 'three';
import { playHover, playSelect } from '../modules/audio.js';

export class InteractionManager {
  constructor(camera, renderer, onSelectDay, onHoverDay, onHoverEnd) {
    this.camera = camera;
    this.domElement = renderer.domElement;
    this.onSelectDay = onSelectDay;
    this.onHoverDay = onHoverDay;
    this.onHoverEnd = onHoverEnd;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-9999, -9999);
    this.clientPos = { x: 0, y: 0 };

    this.interactiveTargets = [];
    this.hoveredDay = null;

    // Elementos del Tooltip Glassmorphism en DOM
    this.tooltipEl = document.getElementById('holo-tooltip');
    this.ttDateEl = document.getElementById('tt-date');
    this.ttIndicatorEl = document.getElementById('tt-indicator');
    this.ttStatusEl = document.getElementById('tt-status');
    this.ttTimeEl = document.getElementById('tt-time');
    this.ttTopicsEl = document.getElementById('tt-topics');
    this.ttTopicsRow = document.getElementById('tt-topics-row');

    this.bindEvents();
  }

  setTargets(targets) {
    this.interactiveTargets = targets;
  }

  bindEvents() {
    this.domElement.addEventListener('mousemove', (e) => {
      const rect = this.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.clientPos.x = e.clientX;
      this.clientPos.y = e.clientY;

      this.updateHover();
    });

    this.domElement.addEventListener('mouseleave', () => {
      this.clearHover();
    });

    this.domElement.addEventListener('click', (e) => {
      const rect = this.domElement.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveTargets, true);

      if (intersects.length > 0) {
        const item = intersects[0];
        const dayData = this.resolveDayData(item);
        if (dayData) {
          playSelect();
          this.onSelectDay(dayData);
        }
      }
    });
  }

  resolveDayData(intersect) {
    if (!intersect || !intersect.object) return null;
    let curr = intersect.object;
    while (curr) {
      if (curr.userData && curr.userData.dayData) {
        return curr.userData.dayData;
      }
      if (curr.userData && curr.userData.crystalItem && curr.userData.crystalItem.day) {
        return curr.userData.crystalItem.day;
      }
      curr = curr.parent;
    }
    return null;
  }

  updateHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.interactiveTargets, true);

    if (intersects.length > 0) {
      const item = intersects[0];
      const dayData = this.resolveDayData(item);

      if (dayData) {
        this.domElement.style.cursor = 'pointer';
        if (this.hoveredDay !== dayData.dateStr) {
          this.hoveredDay = dayData.dateStr;
          playHover();
          if (this.onHoverDay) this.onHoverDay(dayData);
        }
        this.updateTooltip(dayData);
      }
    } else {
      this.clearHover();
    }
  }

  clearHover() {
    if (this.hoveredDay) {
      this.hoveredDay = null;
      if (this.onHoverEnd) this.onHoverEnd();
    }
    this.domElement.style.cursor = 'default';
    if (this.tooltipEl) {
      this.tooltipEl.classList.add('hidden');
    }
  }

  updateTooltip(day) {
    if (!this.tooltipEl || !day) return;

    this.tooltipEl.classList.remove('hidden');
    this.tooltipEl.style.left = `${this.clientPos.x}px`;
    this.tooltipEl.style.top = `${this.clientPos.y}px`;

    this.ttDateEl.textContent = `FECHA // ${day.dateStr.replace(/-/g, '.')}`;

    const s = day.session;
    const isEng = s && s.englishCompleted;
    const isDE = s && s.dataEngCompleted;

    if (isEng && isDE) {
      this.ttIndicatorEl.textContent = 'DUAL MASTER';
      this.ttIndicatorEl.className = 'track-indicator both';
      this.ttStatusEl.textContent = 'Inglés + Data Engineering';
      this.ttTimeEl.textContent = '2 Horas Cumplidas';
    } else if (isDE) {
      this.ttIndicatorEl.textContent = 'DATA ENGINEERING';
      this.ttIndicatorEl.className = 'track-indicator de';
      this.ttStatusEl.textContent = 'Data Engineering (1h)';
      this.ttTimeEl.textContent = '1 Hora Cumplida';
    } else if (isEng) {
      this.ttIndicatorEl.textContent = 'INGLÉS';
      this.ttIndicatorEl.className = 'track-indicator english';
      this.ttStatusEl.textContent = 'Inglés (1h)';
      this.ttTimeEl.textContent = '1 Hora Cumplida';
    } else {
      this.ttIndicatorEl.textContent = 'SIN REGISTRO';
      this.ttIndicatorEl.className = 'track-indicator empty';
      this.ttStatusEl.textContent = day.isFuture ? 'Fecha Futura' : 'Sin Estudio';
      this.ttTimeEl.textContent = '0 Horas';
    }

    if (s && s.topics) {
      this.ttTopicsRow.style.display = 'flex';
      this.ttTopicsEl.textContent = s.topics;
    } else {
      this.ttTopicsRow.style.display = 'none';
    }
  }
}
