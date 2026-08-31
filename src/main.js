// ==========================================================================
// KYBER TRACKER - Aplicación 2D Principal (Clean Tech, 144 FPS)
// Orquestador de Calendario, Heatmap, Métricas y Registro Diario
// ==========================================================================

import './style.css';
import { Calendar2D } from './modules/calendar2D.js';
import { UIManager } from './modules/ui.js';
import { FocusTimer } from './modules/focusTimer.js';

class KyberApp {
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
    this.calendar2D.renderMonth(this.currentYear, this.currentMonth, (day) => {
      this.ui.openDayModal(day);
    });

    // 2. Renderizar Heatmap Anual de 52 Semanas
    this.calendar2D.renderHeatmap(this.currentYear, (day) => {
      this.ui.openDayModal(day);
    });

    // 3. Renderizar Gráfico de Consistencia Semanal
    this.calendar2D.renderWeeklyChart();

    // 4. Actualizar Widget Superior de Registro de Hoy
    this.ui.updateTodayWidget();

    // 5. Actualizar Métricas y Rachas
    this.ui.updateMetricsDisplay();

    // 6. Actualizar Bitácora de Sesiones Recientes
    this.ui.renderJournalFeed();
  }
}

// Inicializar la aplicación de forma robusta e inmediata
function initApp() {
  if (!window.kyberApp) {
    try {
      window.kyberApp = new KyberApp();
    } catch (e) {
      console.error('Error inicializando KyberApp:', e);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
