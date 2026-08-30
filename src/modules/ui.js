// ==========================================================================
// KYBER UI MANAGER - Control Integral de la Aplicación 2D
// Quick Check-in, Calendario, Heatmap, Métricas, Bitácora y Modales
// ==========================================================================

import {
  formatDate,
  parseDate,
  getTodayStr,
  formatReadableDate,
  calculateMetrics,
  MONTH_NAMES_ES
} from './tracker.js';

import {
  loadStudyData,
  saveSession,
  deleteSession,
  getSession,
  clearAllData,
  exportDataAsJSON,
  importDataFromJSON,
  generateSampleData,
  saveStudyData,
  getThemeMode,
  setThemeMode,
  getMetricsScope,
  setMetricsScope
} from '../store/storage.js';

import {
  toggleAudio,
  isAudioOn,
  playHover,
  playSelect,
  playKyberIgnite,
  playMasteryCelebration,
  playDeactivate
} from './audio.js';

export class UIManager {
  constructor(appContext) {
    this.ctx = appContext;
    this.historyFilter = 'all';
    this.currentView = 'calendar'; // 'calendar', 'heatmap', 'weekly'
    this.currentMetricsScope = getMetricsScope(); // 'week', 'month', 'all'

    this.cacheDOMElements();
    this.bindEvents();
    this.updateAudioButtonState();
    this.updateThemeButtonState();
    this.updateMetricsScopeButtonState();
  }

  cacheDOMElements() {
    // Header & Navigation
    this.monthDisplay = document.getElementById('current-month-display');
    this.yearDisplay = document.getElementById('current-year-display');
    this.prevMonthBtn = document.getElementById('prev-month-btn');
    this.nextMonthBtn = document.getElementById('next-month-btn');
    this.todayJumpBtn = document.getElementById('today-jump-btn');
    this.themeToggleBtn = document.getElementById('theme-toggle-btn');
    this.themeIcon = document.getElementById('theme-icon');
    this.themeLabel = document.getElementById('theme-label');
    this.audioToggleBtn = document.getElementById('audio-toggle-btn');
    this.audioIcon = document.getElementById('audio-icon');
    this.audioLabel = document.getElementById('audio-label');
    this.openHistoryBtn = document.getElementById('open-history-btn');

    // Quick Check-in Widget (Hoy)
    this.todayReadableDate = document.getElementById('today-readable-date');
    this.todayStatusSummary = document.getElementById('today-status-summary');
    this.quickForm = document.getElementById('quick-checkin-form');
    this.quickEnglishCheck = document.getElementById('quick-english-check');
    this.quickDeCheck = document.getElementById('quick-de-check');
    this.quickTopicsInput = document.getElementById('quick-topics-input');
    this.tagChips = document.querySelectorAll('.tag-chip');

    // Metrics Ribbon & Scope Selector
    this.metricsScopeBtns = document.querySelectorAll('.metrics-scope-btn');
    this.statsEnglishDays = document.getElementById('stats-english-days');
    this.statsEnglishStreak = document.getElementById('stats-english-streak');
    this.statsEnglishSublabel = document.getElementById('stats-english-sublabel');
    this.statsDeDays = document.getElementById('stats-de-days');
    this.statsDeStreak = document.getElementById('stats-de-streak');
    this.statsDeSublabel = document.getElementById('stats-de-sublabel');
    this.statsDualDays = document.getElementById('stats-dual-days');
    this.statsMonthProgress = document.getElementById('stats-month-progress');
    this.statsDualSublabel = document.getElementById('stats-dual-sublabel');
    this.statsCoverageSublabel = document.getElementById('stats-coverage-sublabel');
    this.statsTotalHours = document.getElementById('stats-total-hours');
    this.statsCombinedStreak = document.getElementById('stats-combined-streak');
    this.statsHoursSublabel = document.getElementById('stats-hours-sublabel');

    // View Tabs
    this.viewTabBtns = document.querySelectorAll('.view-tab-btn');
    this.viewCalendarPanel = document.getElementById('view-calendar-panel');
    this.viewHeatmapPanel = document.getElementById('view-heatmap-panel');
    this.viewWeeklyPanel = document.getElementById('view-weekly-panel');
    this.openPlanModalBtn = document.getElementById('open-plan-modal-btn');

    // Heatmap Panel Controls
    this.heatmapYearLabel = document.getElementById('heatmap-year-label');
    this.hmFilterBtns = document.querySelectorAll('.hm-filter-btn');

    // Journal Feed
    this.journalFeedList = document.getElementById('journal-feed-list');
    this.journalSearchInput = document.getElementById('journal-search-input');

    // Dialog Modal (Para cualquier fecha)
    this.dayModal = document.getElementById('day-modal');
    this.modalDialogDate = document.getElementById('modal-dialog-date');
    this.dialogDateHidden = document.getElementById('dialog-date-hidden');
    this.modalEnglishCheck = document.getElementById('modal-english-check');
    this.modalDeCheck = document.getElementById('modal-de-check');
    this.modalTopicsInput = document.getElementById('modal-topics-input');
    this.modalNotesTextarea = document.getElementById('modal-notes-textarea');
    this.modalDeleteBtn = document.getElementById('modal-delete-btn');
    this.modalCancelBtn = document.getElementById('modal-cancel-btn');
    this.closeDialogBtn = document.getElementById('close-dialog-btn');
    this.dialogForm = document.getElementById('dialog-form');

    // Drawer Historial
    this.historyDrawer = document.getElementById('history-drawer');
    this.closeDrawerBtn = document.getElementById('close-drawer-btn');
    this.filterTabs = document.querySelectorAll('.drawer-filter-tabs .tab-btn');
    this.historyList = document.getElementById('history-list');
    this.exportJsonBtn = document.getElementById('export-json-btn');
    this.importJsonInput = document.getElementById('import-json-input');
    this.clearAllDataBtn = document.getElementById('clear-all-data-btn');
  }

  bindEvents() {
    // 1. Navegación de Mes
    this.prevMonthBtn.addEventListener('click', () => {
      playSelect();
      this.ctx.changeMonth(-1);
    });

    this.nextMonthBtn.addEventListener('click', () => {
      playSelect();
      this.ctx.changeMonth(1);
    });

    this.todayJumpBtn.addEventListener('click', () => {
      playSelect();
      this.ctx.jumpToToday();
    });

    // 2. Theme Toggle (Modo Oscuro / Claro)
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // 3. Audio Toggle
    this.audioToggleBtn.addEventListener('click', () => {
      const active = toggleAudio();
      this.updateAudioButtonState();
      if (active) playKyberIgnite();
    });

    // 3b. Selector de Alcance de Métricas (Semana | Mes | General)
    this.metricsScopeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const scope = btn.dataset.scope;
        this.switchMetricsScope(scope);
        playSelect();
      });
    });

    // 4. Quick Check-In de Hoy
    this.quickForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleQuickCheckinSubmit();
    });

    // Chips de etiquetas rápidas (#Speaking, #SQL, etc.)
    this.tagChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const tag = chip.dataset.tag;
        const forHabit = chip.dataset.for;

        // Activar el checkbox correspondiente
        if (forHabit === 'english') this.quickEnglishCheck.checked = true;
        if (forHabit === 'de') this.quickDeCheck.checked = true;

        // Añadir etiqueta al input si no existe
        const currentVal = this.quickTopicsInput.value.trim();
        if (!currentVal.includes(`#${tag}`)) {
          this.quickTopicsInput.value = currentVal ? `${currentVal}, #${tag}` : `#${tag}`;
        }
        playHover();
      });
    });

    // 4. View Switcher Tabs (Calendario | Heatmap | Semanal)
    this.viewTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        this.switchView(view);
        playSelect();
      });
    });

    // Filtros del Heatmap Anual
    this.hmFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.hmFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.hmfilter;
        this.ctx.calendar2D.setHeatmapFilter(filter, this.ctx.currentYear, (day) => this.openDayModal(day));
        playHover();
      });
    });

    // 5. Botón Planificar Otra Fecha
    this.openPlanModalBtn.addEventListener('click', () => {
      playSelect();
      const todayStr = getTodayStr();
      this.openDayModal({ dateStr: todayStr, session: getSession(todayStr) });
    });

    // 6. Modal de Día
    this.closeDialogBtn.addEventListener('click', () => this.closeDayModal());
    this.modalCancelBtn.addEventListener('click', () => this.closeDayModal());

    this.dialogForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleModalFormSubmit();
    });

    this.modalDeleteBtn.addEventListener('click', () => {
      this.handleModalDelete();
    });

    // 7. Drawer de Historial
    this.openHistoryBtn.addEventListener('click', () => {
      playSelect();
      this.openHistoryDrawer();
    });

    this.closeDrawerBtn.addEventListener('click', () => {
      this.closeHistoryDrawer();
    });

    this.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.historyFilter = tab.dataset.filter;
        this.renderHistoryList();
        playSelect();
      });
    });

    // 8. Búsqueda en Bitácora
    this.journalSearchInput.addEventListener('input', (e) => {
      this.renderJournalFeed(e.target.value.trim().toLowerCase());
    });

    // 9. Respaldo y Limpieza de Datos
    this.exportJsonBtn.addEventListener('click', () => {
      exportDataAsJSON();
      playSelect();
    });

    this.importJsonInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          await importDataFromJSON(file);
          playMasteryCelebration();
          this.ctx.refreshAll();
          alert('¡Datos de estudio importados con éxito!');
        } catch (err) {
          alert('Error al importar el archivo JSON.');
        }
      }
    });

    if (this.clearAllDataBtn) {
      this.clearAllDataBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas limpiar y reiniciar todos tus registros?')) {
          clearAllData();
          playDeactivate();
          this.ctx.refreshAll();
          this.closeHistoryDrawer();
        }
      });
    }
  }

  updateAudioButtonState() {
    const on = isAudioOn();
    if (this.audioToggleBtn) {
      this.audioToggleBtn.classList.toggle('active', on);
      this.audioIcon.textContent = on ? '🔊' : '🔇';
      this.audioLabel.textContent = on ? 'Audio' : 'Silencio';
    }
  }

  toggleTheme() {
    const current = getThemeMode();
    const next = current === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    document.documentElement.setAttribute('data-theme', next);
    this.updateThemeButtonState();
    playSelect();
  }

  updateThemeButtonState() {
    const theme = getThemeMode();
    document.documentElement.setAttribute('data-theme', theme);
    if (this.themeToggleBtn && this.themeIcon && this.themeLabel) {
      if (theme === 'dark') {
        this.themeIcon.textContent = '🌙';
        this.themeLabel.textContent = 'Oscuro';
        this.themeToggleBtn.classList.add('active');
      } else {
        this.themeIcon.textContent = '☀️';
        this.themeLabel.textContent = 'Claro';
        this.themeToggleBtn.classList.remove('active');
      }
    }
  }

  switchMetricsScope(scope) {
    this.currentMetricsScope = scope;
    setMetricsScope(scope);
    this.updateMetricsScopeButtonState();
    this.updateMetricsDisplay();
  }

  updateMetricsScopeButtonState() {
    this.metricsScopeBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scope === this.currentMetricsScope);
    });
  }

  switchView(viewName) {
    this.currentView = viewName;
    this.viewTabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    this.viewCalendarPanel.classList.toggle('hidden', viewName !== 'calendar');
    this.viewHeatmapPanel.classList.toggle('hidden', viewName !== 'heatmap');
    this.viewWeeklyPanel.classList.toggle('hidden', viewName !== 'weekly');

    if (viewName === 'heatmap') {
      this.ctx.calendar2D.renderHeatmap(this.ctx.currentYear, (day) => this.openDayModal(day));
    } else if (viewName === 'weekly') {
      this.ctx.calendar2D.renderWeeklyChart();
    }
  }

  /**
   * Actualiza el widget de Registro de Hoy
   */
  updateTodayWidget() {
    const todayStr = getTodayStr();
    this.todayReadableDate.textContent = formatReadableDate(todayStr);

    const session = getSession(todayStr);
    if (session) {
      this.quickEnglishCheck.checked = Boolean(session.englishCompleted);
      this.quickDeCheck.checked = Boolean(session.dataEngCompleted);
      this.quickTopicsInput.value = session.topics || '';

      const isDual = session.englishCompleted && session.dataEngCompleted;
      if (isDual) {
        this.todayStatusSummary.textContent = '⭐ Dual Master (2h)';
        this.todayStatusSummary.className = 'today-status-chip active-dual';
      } else if (session.englishCompleted) {
        this.todayStatusSummary.textContent = '🇬🇧 Inglés (1h)';
        this.todayStatusSummary.className = 'today-status-chip active-single';
      } else if (session.dataEngCompleted) {
        this.todayStatusSummary.textContent = '⚡ Data Eng (1h)';
        this.todayStatusSummary.className = 'today-status-chip active-single';
      } else {
        this.todayStatusSummary.textContent = 'Sin registrar';
        this.todayStatusSummary.className = 'today-status-chip';
      }
    } else {
      this.quickEnglishCheck.checked = false;
      this.quickDeCheck.checked = false;
      this.quickTopicsInput.value = '';
      this.todayStatusSummary.textContent = 'Sin registrar';
      this.todayStatusSummary.className = 'today-status-chip';
    }
  }

  handleQuickCheckinSubmit() {
    const todayStr = getTodayStr();
    const isEng = this.quickEnglishCheck.checked;
    const isDE = this.quickDeCheck.checked;
    const topics = this.quickTopicsInput.value.trim();

    if (!isEng && !isDE) {
      deleteSession(todayStr);
      playDeactivate();
    } else {
      saveSession(todayStr, {
        date: todayStr,
        englishCompleted: isEng,
        dataEngCompleted: isDE,
        englishHours: isEng ? 1 : 0,
        dataEngHours: isDE ? 1 : 0,
        topics,
        notes: ''
      });

      if (isEng && isDE) {
        playMasteryCelebration();
      } else {
        playKyberIgnite();
      }
    }

    this.ctx.refreshAll();
  }

  /**
   * Modal de edición de fecha
   */
  openDayModal(dayData) {
    if (!dayData) return;
    const dateStr = dayData.dateStr;
    const session = getSession(dateStr) || dayData.session;

    this.dialogDateHidden.value = dateStr;
    this.modalDialogDate.textContent = formatReadableDate(dateStr);

    if (session) {
      this.modalEnglishCheck.checked = Boolean(session.englishCompleted);
      this.modalDeCheck.checked = Boolean(session.dataEngCompleted);
      this.modalTopicsInput.value = session.topics || '';
      this.modalNotesTextarea.value = session.notes || '';
      this.modalDeleteBtn.classList.remove('hidden');
    } else {
      this.modalEnglishCheck.checked = false;
      this.modalDeCheck.checked = false;
      this.modalTopicsInput.value = '';
      this.modalNotesTextarea.value = '';
      this.modalDeleteBtn.classList.add('hidden');
    }

    playSelect();
    this.dayModal.showModal();
  }

  closeDayModal() {
    this.dayModal.close();
  }

  handleModalFormSubmit() {
    const dateStr = this.dialogDateHidden.value;
    const isEng = this.modalEnglishCheck.checked;
    const isDE = this.modalDeCheck.checked;
    const topics = this.modalTopicsInput.value.trim();
    const notes = this.modalNotesTextarea.value.trim();

    if (!isEng && !isDE) {
      deleteSession(dateStr);
      playDeactivate();
    } else {
      saveSession(dateStr, {
        date: dateStr,
        englishCompleted: isEng,
        dataEngCompleted: isDE,
        englishHours: isEng ? 1 : 0,
        dataEngHours: isDE ? 1 : 0,
        topics,
        notes
      });

      if (isEng && isDE) {
        playMasteryCelebration();
      } else {
        playKyberIgnite();
      }
    }

    this.closeDayModal();
    this.ctx.refreshAll();
  }

  handleModalDelete() {
    const dateStr = this.dialogDateHidden.value;
    if (confirm(`¿Eliminar el registro del día ${dateStr}?`)) {
      deleteSession(dateStr);
      playDeactivate();
      this.closeDayModal();
      this.ctx.refreshAll();
    }
  }

  /**
   * Actualiza el Dashboard de Métricas
   */
  updateMetricsDisplay() {
    const scope = this.currentMetricsScope || 'month';
    const metrics = calculateMetrics(this.ctx.currentYear, this.ctx.currentMonth, scope);

    // Inglés
    this.statsEnglishDays.textContent = metrics.english.days;
    this.statsEnglishStreak.textContent = metrics.english.streak;

    // Data Engineering
    this.statsDeDays.textContent = metrics.dataEngineering.days;
    this.statsDeStreak.textContent = metrics.dataEngineering.streak;

    // Dual Master & Cobertura
    this.statsDualDays.textContent = metrics.global.dualDays;
    this.statsMonthProgress.textContent = `${metrics.global.coveragePercent}%`;

    // Horas Totales y Racha Combinada
    this.statsTotalHours.textContent = `${metrics.global.totalHours}h`;
    this.statsCombinedStreak.textContent = metrics.global.combinedStreak;

    // Actualizar etiquetas dinámicas de período
    const suffix = metrics.periodLabel; // 'SEMANA' | 'MES' | 'TOTAL'
    if (this.statsEnglishSublabel) this.statsEnglishSublabel.textContent = `DÍAS (${suffix})`;
    if (this.statsDeSublabel) this.statsDeSublabel.textContent = `DÍAS (${suffix})`;
    if (this.statsDualSublabel) this.statsDualSublabel.textContent = `DÍAS (2H)`;
    if (this.statsCoverageSublabel) {
      this.statsCoverageSublabel.textContent = scope === 'week' ? '% SEMANA' : scope === 'month' ? '% MES' : '% GLOBAL';
    }
    if (this.statsHoursSublabel) this.statsHoursSublabel.textContent = `HORAS (${suffix})`;

    // Header Display
    this.monthDisplay.textContent = MONTH_NAMES_ES[this.ctx.currentMonth];
    this.yearDisplay.textContent = this.ctx.currentYear;
    this.heatmapYearLabel.textContent = this.ctx.currentYear;
  }

  /**
   * Renderiza el Feed de Bitácora / Historial Reciente
   */
  renderJournalFeed(searchQuery = '') {
    if (!this.journalFeedList) return;
    this.journalFeedList.innerHTML = '';

    const studyData = loadStudyData();
    const sortedEntries = Object.values(studyData).sort((a, b) => b.date.localeCompare(a.date));

    const filtered = sortedEntries.filter(item => {
      if (!searchQuery) return true;
      const combined = `${item.date} ${item.topics || ''} ${item.notes || ''}`.toLowerCase();
      return combined.includes(searchQuery);
    });

    if (filtered.length === 0) {
      this.journalFeedList.innerHTML = `
        <div class="empty-state-clean">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">Aún no hay sesiones registradas</div>
          <div class="empty-state-desc">Usa el panel de registro diario para marcar tu primera hora de estudio en Inglés o Data Engineering.</div>
        </div>
      `;
      return;
    }

    filtered.forEach(session => {
      const card = document.createElement('div');
      card.className = 'journal-item-card';

      const isDual = session.englishCompleted && session.dataEngCompleted;
      const badgeText = isDual ? '⭐ Dual Master (2h)' :
                        session.englishCompleted ? '🇬🇧 Inglés (1h)' :
                        session.dataEngCompleted ? '⚡ Data Eng (1h)' : '0h';

      card.innerHTML = `
        <div class="journal-item-top">
          <span class="j-date">${formatReadableDate(session.date)}</span>
          <span class="day-badge ${isDual ? 'badge-dual' : session.englishCompleted ? 'badge-english' : 'badge-de'}">${badgeText}</span>
        </div>
        ${session.topics ? `<div class="j-topics">📌 ${session.topics}</div>` : ''}
        ${session.notes ? `<div class="j-notes">"${session.notes}"</div>` : ''}
      `;

      card.addEventListener('click', () => {
        this.openDayModal({ dateStr: session.date, session });
      });

      this.journalFeedList.appendChild(card);
    });
  }

  /**
   * Drawer de Historial Lateral
   */
  openHistoryDrawer() {
    this.historyDrawer.classList.remove('hidden');
    this.renderHistoryList();
  }

  closeHistoryDrawer() {
    this.historyDrawer.classList.add('hidden');
  }

  renderHistoryList() {
    this.historyList.innerHTML = '';
    const studyData = loadStudyData();
    const sortedEntries = Object.values(studyData).sort((a, b) => b.date.localeCompare(a.date));

    const filtered = sortedEntries.filter(item => {
      if (this.historyFilter === 'english') return Boolean(item.englishCompleted && !item.dataEngCompleted);
      if (this.historyFilter === 'data-engineering') return Boolean(item.dataEngCompleted && !item.englishCompleted);
      if (this.historyFilter === 'both') return Boolean(item.englishCompleted && item.dataEngCompleted);
      return Boolean(item.englishCompleted || item.dataEngCompleted);
    });

    if (filtered.length === 0) {
      this.historyList.innerHTML = `
        <div class="empty-state-clean">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-title">Sin registros</div>
          <div class="empty-state-desc">Tus sesiones de estudio aparecerán aquí cuando las vayas completando.</div>
        </div>
      `;
      return;
    }

    filtered.forEach(session => {
      const card = document.createElement('div');
      const isDual = session.englishCompleted && session.dataEngCompleted;
      const typeClass = isDual ? 'card-both' : session.englishCompleted ? 'card-english' : 'card-de';

      card.className = `history-card ${typeClass}`;
      card.innerHTML = `
        <div class="hc-top">
          <span class="hc-date">${session.date}</span>
          <span class="hc-duration">${isDual ? '2h Dual' : '1h'}</span>
        </div>
        ${session.topics ? `<div class="hc-topics">${session.topics}</div>` : ''}
        ${session.notes ? `<div class="hc-notes">${session.notes}</div>` : ''}
      `;

      card.addEventListener('click', () => {
        this.closeHistoryDrawer();
        this.openDayModal({ dateStr: session.date, session });
      });

      this.historyList.appendChild(card);
    });
  }
}
