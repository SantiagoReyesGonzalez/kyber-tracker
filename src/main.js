// ==========================================================================
// KAIDIN TRACKER - Aplicación 2D Principal (Clean Tech, 144 FPS)
// Orquestador de Calendario, Heatmap, Métricas y Registro Diario
// ==========================================================================

import './style.css';
import { Calendar2D } from './modules/calendar2D.js';
import { UIManager } from './modules/ui.js';
import { FocusTimer } from './modules/focusTimer.js';

class KaidinApp {
  constructor() {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth(); // 0-indexado (0: Enero .. 11: Diciembre)

    this.calendar2D = new Calendar2D();
    this.focusTimer = new FocusTimer(this);
    this.ui = new UIManager(this);

    this.refreshAll();
  }

  changeMonth(delta) {
    this.currentMonth += delta;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.refreshAll();
  }

  jumpToToday() {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();
    this.refreshAll();
  }

  refreshAll() {
    // 1. Renderizar Cuadrícula del Calendario Mensual 2D
    if (this.calendar2D) {
      this.calendar2D.renderMonth(this.currentYear, this.currentMonth, (day) => {
        if (this.ui) this.ui.openDayModal(day);
      });

      // 2. Renderizar Heatmap Anual de 52 Semanas
      this.calendar2D.renderHeatmap(this.currentYear, (day) => {
        if (this.ui) this.ui.openDayModal(day);
      });

      // 3. Renderizar Gráfico de Consistencia Semanal
      this.calendar2D.renderWeeklyChart();
    }

    // 4. Actualizar componentes UI
    if (this.ui) {
      this.ui.updateTodayWidget();
      this.ui.updateMetricsDisplay();
      this.ui.renderJournalFeed();
      this.ui.renderWeeklyGoalsProgress();
      if (this.ui.currentView === 'curves' && this.ui.curveDashboard) {
        this.ui.curveDashboard.render();
      }
    }
  }
}

// Inicializar la aplicación de forma robusta e inmediata
function initApp() {
  if (!window.kaidinApp && !window.kyberApp) {
    try {
      const app = new KaidinApp();
      window.kaidinApp = app;
      window.kyberApp = app; // Retrocompatibilidad para scripts y testing
    } catch (e) {
      console.error('Error inicializando KaidinApp:', e);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
