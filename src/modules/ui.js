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

import {
  getCurrentUser,
  registerUser,
  loginUser,
  logoutUser,
  onAuthStateChanged
} from '../store/auth.js';

export class UIManager {
  constructor(appContext) {
    this.ctx = appContext;
    this.historyFilter = 'all';
    this.currentView = 'calendar'; // 'calendar', 'heatmap', 'weekly'
    this.currentMetricsScope = getMetricsScope(); // 'week', 'month', 'all'

    this.cacheDOMElements();
    this.bindEvents();
    this.initAuth();
    this.updateAudioButtonState();
    this.updateThemeButtonState();
    this.updateMetricsScopeButtonState();
    this.initFocusTimer();
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

    // Quick Check-in Widget (Hoy / Fecha seleccionada)
    this.todayReadableDate = document.getElementById('today-readable-date');
    this.quickDateInput = document.getElementById('quick-date-input');
    this.todayStatusSummary = document.getElementById('today-status-summary');
    this.quickForm = document.getElementById('quick-checkin-form');
    this.quickEnglishCheck = document.getElementById('quick-english-check');
    this.quickDeCheck = document.getElementById('quick-de-check');
    this.quickTopicsInput = document.getElementById('quick-topics-input');
    this.tagChips = document.querySelectorAll('.tag-chip');

    // Focus Mode & Soundscape Elements
    this.soundscapeSelect = document.getElementById('soundscape-select');
    this.soundscapeVolume = document.getElementById('soundscape-volume');
    this.toggleZenBtn = document.getElementById('toggle-zen-btn');
    this.focusHabitBtns = document.querySelectorAll('.focus-habit-btn');
    this.focusGoalInput = document.getElementById('focus-goal-input');
    this.focusTimerDigits = document.getElementById('focus-timer-digits');
    this.focusModeLabel = document.getElementById('focus-mode-label');
    this.focusProgressFill = document.getElementById('focus-progress-fill');
    this.start5minBtn = document.getElementById('start-5min-btn');
    this.start60minBtn = document.getElementById('start-60min-btn');
    this.focusRunningControls = document.getElementById('focus-running-controls');
    this.focusPauseBtn = document.getElementById('focus-pause-btn');
    this.focusPauseLabel = document.getElementById('focus-pause-label');
    this.focusPauseIcon = document.getElementById('focus-pause-icon');
    this.focusStopBtn = document.getElementById('focus-stop-btn');

    // Zen Mode Overlay
    this.zenOverlay = document.getElementById('zen-overlay');
    this.closeZenBtn = document.getElementById('close-zen-btn');
    this.zenHabitPill = document.getElementById('zen-habit-pill');
    this.zenGoalText = document.getElementById('zen-goal-text');
    this.zenTimerDigits = document.getElementById('zen-timer-digits');
    this.zenModePill = document.getElementById('zen-mode-pill');
    this.zenProgressFill = document.getElementById('zen-progress-fill');
    this.zenSoundscapeStatus = document.getElementById('zen-soundscape-status');
    this.zenPauseBtn = document.getElementById('zen-pause-btn');
    this.zenPauseText = document.getElementById('zen-pause-text');
    this.zenPauseIcon = document.getElementById('zen-pause-icon');
    this.zenStopBtn = document.getElementById('zen-stop-btn');

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
    this.modalDateInput = document.getElementById('modal-date-input');
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

    // Modal de Confirmación Personalizado & Toast Container
    this.confirmModal = document.getElementById('confirm-modal');
    this.confirmTitle = document.getElementById('confirm-dialog-title');
    this.confirmMessage = document.getElementById('confirm-dialog-message');
    this.confirmOkBtn = document.getElementById('confirm-ok-btn');
    this.confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    this.confirmIconWrap = document.getElementById('confirm-icon-wrap');
    this.toastContainer = document.getElementById('toast-container');

    // Elementos de Autenticación & Perfil
    this.authOverlay = document.getElementById('auth-overlay');
    this.tabLoginBtn = document.getElementById('tab-login-btn');
    this.tabRegisterBtn = document.getElementById('tab-register-btn');
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.authAlertMessage = document.getElementById('auth-alert-message');
    this.loginEmailInput = document.getElementById('login-email-input');
    this.loginPasswordInput = document.getElementById('login-password-input');
    this.loginRememberCheck = document.getElementById('login-remember-check');
    this.registerNameInput = document.getElementById('register-name-input');
    this.registerEmailInput = document.getElementById('register-email-input');
    this.registerPasswordInput = document.getElementById('register-password-input');
    this.passwordToggleBtns = document.querySelectorAll('.password-toggle-btn');
    this.loginSubmitBtn = document.getElementById('login-submit-btn');
    this.registerSubmitBtn = document.getElementById('register-submit-btn');

    // Header Profile & Dropdown
    this.userProfileBtn = document.getElementById('user-profile-btn');
    this.userProfileDropdown = document.getElementById('user-profile-dropdown');
    this.headerUserAvatar = document.getElementById('header-user-avatar');
    this.headerUserName = document.getElementById('header-user-name');
    this.dropdownUserAvatar = document.getElementById('dropdown-user-avatar');
    this.dropdownUserName = document.getElementById('dropdown-user-name');
    this.dropdownUserEmail = document.getElementById('dropdown-user-email');
    this.logoutBtn = document.getElementById('logout-btn');
  }

  bindEvents() {
    // 1. Navegación de Mes
    if (this.prevMonthBtn) {
      this.prevMonthBtn.addEventListener('click', () => {
        playSelect();
        this.ctx.changeMonth(-1);
      });
    }

    if (this.nextMonthBtn) {
      this.nextMonthBtn.addEventListener('click', () => {
        playSelect();
        this.ctx.changeMonth(1);
      });
    }

    if (this.todayJumpBtn) {
      this.todayJumpBtn.addEventListener('click', () => {
        playSelect();
        this.ctx.jumpToToday();
      });
    }

    // 2. Theme Toggle (Modo Oscuro / Claro)
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // 3. Audio Toggle
    if (this.audioToggleBtn) {
      this.audioToggleBtn.addEventListener('click', () => {
        const active = toggleAudio();
        this.updateAudioButtonState();
        if (active) playKyberIgnite();
      });
    }

    // 3b. Selector de Alcance de Métricas (Semana | Mes | General)
    if (this.metricsScopeBtns) {
      this.metricsScopeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const scope = btn.dataset.scope;
          this.switchMetricsScope(scope);
          playSelect();
        });
      });
    }

    // 4. Quick Check-In (Soporta Hoy o Día Pasado Seleccionado)
    if (this.quickDateInput) {
      this.quickDateInput.addEventListener('change', () => {
        this.updateTodayWidget(this.quickDateInput.value);
        playSelect();
      });
    }

    if (this.quickForm) {
      this.quickForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleQuickCheckinSubmit();
      });
    }

    // Chips de etiquetas rápidas (#Speaking, #SQL, etc.)
    if (this.tagChips) {
      this.tagChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
          e.preventDefault();
          const tag = chip.dataset.tag;
          const forHabit = chip.dataset.for;

          // Activar el checkbox correspondiente y emitir change
          if (forHabit === 'english' && this.quickEnglishCheck) {
            this.quickEnglishCheck.checked = true;
            this.quickEnglishCheck.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (forHabit === 'de' && this.quickDeCheck) {
            this.quickDeCheck.checked = true;
            this.quickDeCheck.dispatchEvent(new Event('change', { bubbles: true }));
          }

          // Añadir etiqueta al input si no existe
          if (this.quickTopicsInput) {
            const currentVal = this.quickTopicsInput.value.trim();
            if (!currentVal.includes(`#${tag}`)) {
              this.quickTopicsInput.value = currentVal ? `${currentVal}, #${tag}` : `#${tag}`;
            }
          }
          playHover();
        });
      });
    }

    // 4b. View Switcher Tabs (Calendario | Heatmap | Semanal)
    if (this.viewTabBtns) {
      this.viewTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const view = btn.dataset.view;
          this.switchView(view);
          playSelect();
        });
      });
    }

    // Filtros del Heatmap Anual
    if (this.hmFilterBtns) {
      this.hmFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.hmFilterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const filter = btn.dataset.hmfilter;
          if (this.ctx && this.ctx.calendar2D) {
            this.ctx.calendar2D.setHeatmapFilter(filter, this.ctx.currentYear, (day) => this.openDayModal(day));
          }
          playHover();
        });
      });
    }

    // 5. Botón Planificar Otra Fecha
    if (this.openPlanModalBtn) {
      this.openPlanModalBtn.addEventListener('click', () => {
        playSelect();
        const targetDate = (this.quickDateInput && this.quickDateInput.value) ? this.quickDateInput.value : getTodayStr();
        this.openDayModal({ dateStr: targetDate, session: getSession(targetDate) });
      });
    }

    // 6. Modal de Día
    if (this.closeDialogBtn) this.closeDialogBtn.addEventListener('click', () => this.closeDayModal());
    if (this.modalCancelBtn) this.modalCancelBtn.addEventListener('click', () => this.closeDayModal());

    if (this.modalDateInput) {
      this.modalDateInput.addEventListener('change', () => {
        this.handleModalDateChange(this.modalDateInput.value);
      });
    }

    if (this.dialogForm) {
      this.dialogForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleModalFormSubmit();
      });
    }

    if (this.modalDeleteBtn) {
      this.modalDeleteBtn.addEventListener('click', () => {
        this.handleModalDelete();
      });
    }

    // 7. Drawer de Historial
    if (this.openHistoryBtn) {
      this.openHistoryBtn.addEventListener('click', () => {
        playSelect();
        this.openHistoryDrawer();
      });
    }

    if (this.closeDrawerBtn) {
      this.closeDrawerBtn.addEventListener('click', () => {
        this.closeHistoryDrawer();
      });
    }

    if (this.filterTabs) {
      this.filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          this.filterTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.historyFilter = tab.dataset.filter;
          this.renderHistoryList();
          playSelect();
        });
      });
    }

    // 8. Búsqueda en Bitácora
    if (this.journalSearchInput) {
      this.journalSearchInput.addEventListener('input', (e) => {
        this.renderJournalFeed(e.target.value.trim().toLowerCase());
      });
    }

    // 9. Respaldo y Limpieza de Datos
    if (this.exportJsonBtn) {
      this.exportJsonBtn.addEventListener('click', () => {
        exportDataAsJSON();
        playSelect();
      });
    }

    if (this.importJsonInput) {
      this.importJsonInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            await importDataFromJSON(file);
            playMasteryCelebration();
            this.ctx.refreshAll();
            this.showToast('¡Datos de estudio importados con éxito!', 'success');
          } catch (err) {
            this.showToast('Error al importar el archivo JSON.', 'error');
          }
        }
      });
    }

    if (this.clearAllDataBtn) {
      this.clearAllDataBtn.addEventListener('click', async () => {
        const confirmed = await this.showConfirm({
          title: 'Limpiar Todo',
          message: '¿Estás seguro de que deseas limpiar y reiniciar todos tus registros? Esta acción no se puede deshacer.',
          confirmText: 'Limpiar Datos',
          cancelText: 'Cancelar',
          type: 'danger'
        });

        if (confirmed) {
          clearAllData();
          playDeactivate();
          this.ctx.refreshAll();
          this.closeHistoryDrawer();
          this.showToast('Todos tus registros han sido eliminados.', 'info');
        }
      });
    }

    // 10. Eventos del Sistema de Autenticación
    this.bindAuthEvents();

    // 11. Delegación Global para Garantizar Respuesta Inmediata de Todos los Botones
    document.addEventListener('click', (e) => {
      // 11a. Chips de Hábito en Modo Enfoque (.focus-habit-btn)
      const habitBtn = e.target.closest('.focus-habit-btn');
      if (habitBtn) {
        e.preventDefault();
        document.querySelectorAll('.focus-habit-btn').forEach(b => b.classList.remove('active'));
        habitBtn.classList.add('active');
        const habit = habitBtn.dataset.focushabit;
        if (this.ctx && this.ctx.focusTimer) {
          this.ctx.focusTimer.setHabit(habit);
        }
        playHover();
        return;
      }

      // 11b. Botón ⚡ Arrancar 5 min (#start-5min-btn)
      const start5Btn = e.target.closest('#start-5min-btn');
      if (start5Btn) {
        e.preventDefault();
        const goalInput = document.getElementById('focus-goal-input');
        if (goalInput && this.ctx && this.ctx.focusTimer) {
          this.ctx.focusTimer.setGoal(goalInput.value.trim());
        }
        if (this.ctx && this.ctx.focusTimer) {
          this.ctx.focusTimer.start5MinJumpstart();
        }
        return;
      }

      // 11c. Botón 🎯 Hora Completa (#start-60min-btn)
      const start60Btn = e.target.closest('#start-60min-btn');
      if (start60Btn) {
        e.preventDefault();
        const goalInput = document.getElementById('focus-goal-input');
        if (goalInput && this.ctx && this.ctx.focusTimer) {
          this.ctx.focusTimer.setGoal(goalInput.value.trim());
        }
        if (this.ctx && this.ctx.focusTimer) {
          this.ctx.focusTimer.start60MinSession();
        }
        return;
      }

      // 11d. Botón Pausar / Reanudar (#focus-pause-btn / #zen-pause-btn)
      const pauseBtn = e.target.closest('#focus-pause-btn, #zen-pause-btn');
      if (pauseBtn) {
        e.preventDefault();
        if (this.ctx && this.ctx.focusTimer) {
          const state = this.ctx.focusTimer.getState();
          if (state.state === 'running') {
            this.ctx.focusTimer.pause();
          } else if (state.state === 'paused') {
            this.ctx.focusTimer.resume();
          }
        }
        return;
      }

      // 11e. Botón Modo Zen (#toggle-zen-btn)
      const zenBtn = e.target.closest('#toggle-zen-btn');
      if (zenBtn) {
        e.preventDefault();
        this.openZenMode();
        return;
      }

      // 11f. Botón Salir Zen (#close-zen-btn)
      const closeZenBtn = e.target.closest('#close-zen-btn');
      if (closeZenBtn) {
        e.preventDefault();
        this.closeZenMode();
        return;
      }

      // 11g. Clic en Día del Calendario (.calendar-day-card:not(.empty-offset))
      const dayCard = e.target.closest('.calendar-day-card:not(.empty-offset)');
      if (dayCard) {
        const dateStr = dayCard.dataset.date;
        if (dateStr) {
          this.openDayModal({ dateStr, session: getSession(dateStr) });
        }
        return;
      }

      // 11h. Botón Registrar Otra Fecha (#open-plan-modal-btn)
      const openPlanBtn = e.target.closest('#open-plan-modal-btn');
      if (openPlanBtn) {
        e.preventDefault();
        const quickDateInput = document.getElementById('quick-date-input');
        const targetDate = (quickDateInput && quickDateInput.value) ? quickDateInput.value : getTodayStr();
        this.openDayModal({ dateStr: targetDate, session: getSession(targetDate) });
        return;
      }
    });
  }

  updateAudioButtonState() {
    const on = isAudioOn();
    if (this.audioToggleBtn && this.audioIcon && this.audioLabel) {
      this.audioToggleBtn.classList.toggle('active', on);
      this.audioIcon.innerHTML = on 
        ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`
        : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
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
        this.themeIcon.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
        this.themeLabel.textContent = 'Oscuro';
        this.themeToggleBtn.classList.add('active');
      } else {
        this.themeIcon.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
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
   * Actualiza el widget de Registro Diario para la fecha activa (Hoy por defecto o fecha elegida)
   */
  updateTodayWidget(targetDateStr) {
    const todayStr = getTodayStr();
    const activeDateStr = targetDateStr || (this.quickDateInput && this.quickDateInput.value) || todayStr;

    if (this.quickDateInput && this.quickDateInput.value !== activeDateStr) {
      this.quickDateInput.value = activeDateStr;
    }

    if (activeDateStr === todayStr) {
      this.todayReadableDate.textContent = `Hoy (${formatReadableDate(todayStr)})`;
    } else {
      this.todayReadableDate.textContent = formatReadableDate(activeDateStr);
    }

    const session = getSession(activeDateStr);
    if (session) {
      this.quickEnglishCheck.checked = Boolean(session.englishCompleted);
      this.quickDeCheck.checked = Boolean(session.dataEngCompleted);
      this.quickTopicsInput.value = session.topics || '';

      const isDual = session.englishCompleted && session.dataEngCompleted;
      if (isDual) {
        this.todayStatusSummary.textContent = 'Dual Master (2h)';
        this.todayStatusSummary.className = 'today-status-chip active-dual';
      } else if (session.englishCompleted) {
        this.todayStatusSummary.textContent = 'Inglés (1h)';
        this.todayStatusSummary.className = 'today-status-chip active-single';
      } else if (session.dataEngCompleted) {
        this.todayStatusSummary.textContent = 'Data Eng (1h)';
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
    const activeDateStr = (this.quickDateInput && this.quickDateInput.value) ? this.quickDateInput.value : getTodayStr();
    const isEng = this.quickEnglishCheck.checked;
    const isDE = this.quickDeCheck.checked;
    const topics = this.quickTopicsInput.value.trim();

    if (!isEng && !isDE) {
      deleteSession(activeDateStr);
      playDeactivate();
      this.showToast(`Registro de ${formatReadableDate(activeDateStr)} borrado.`, 'info');
    } else {
      saveSession(activeDateStr, {
        date: activeDateStr,
        englishCompleted: isEng,
        dataEngCompleted: isDE,
        englishHours: isEng ? 1 : 0,
        dataEngHours: isDE ? 1 : 0,
        topics,
        notes: ''
      });

      if (isEng && isDE) {
        playMasteryCelebration();
        this.showToast(`¡Doble estudio guardado para ${formatReadableDate(activeDateStr)}! (2h)`, 'success');
      } else {
        playKyberIgnite();
        const habitName = isEng ? 'Inglés' : 'Data Engineering';
        this.showToast(`¡Sesión de ${habitName} guardada para ${formatReadableDate(activeDateStr)}! (1h)`, 'success');
      }
    }

    this.ctx.refreshAll();
  }

  /**
   * Modal de edición de fecha
   */
  openDayModal(dayData) {
    if (!dayData) return;
    const dateStr = dayData.dateStr || getTodayStr();
    this.populateModalForDate(dateStr, dayData.session);

    playSelect();
    this.dayModal.showModal();
  }

  populateModalForDate(dateStr, sessionData = null) {
    const session = sessionData || getSession(dateStr);

    this.dialogDateHidden.value = dateStr;
    if (this.modalDateInput) this.modalDateInput.value = dateStr;
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
  }

  handleModalDateChange(newDateStr) {
    if (!newDateStr) return;
    this.populateModalForDate(newDateStr);
  }

  closeDayModal() {
    this.dayModal.close();
  }

  handleModalFormSubmit() {
    const dateStr = (this.modalDateInput && this.modalDateInput.value) || this.dialogDateHidden.value;
    const isEng = this.modalEnglishCheck.checked;
    const isDE = this.modalDeCheck.checked;
    const topics = this.modalTopicsInput.value.trim();
    const notes = this.modalNotesTextarea.value.trim();

    if (!isEng && !isDE) {
      deleteSession(dateStr);
      playDeactivate();
      this.showToast(`Registro del ${formatReadableDate(dateStr)} borrado.`, 'info');
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
        this.showToast(`¡Doble estudio guardado para ${formatReadableDate(dateStr)}! (2h)`, 'success');
      } else {
        playKyberIgnite();
        const habitName = isEng ? 'Inglés' : 'Data Engineering';
        this.showToast(`¡Sesión de ${habitName} guardada para ${formatReadableDate(dateStr)}! (1h)`, 'success');
      }
    }

    this.closeDayModal();
    this.ctx.refreshAll();
  }

  async handleModalDelete() {
    const dateStr = (this.modalDateInput && this.modalDateInput.value) || this.dialogDateHidden.value;
    const confirmed = await this.showConfirm({
      title: 'Eliminar Registro',
      message: `¿Deseas eliminar el registro del día ${dateStr}?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (confirmed) {
      deleteSession(dateStr);
      playDeactivate();
      this.closeDayModal();
      this.ctx.refreshAll();
      this.showToast(`Registro del día ${dateStr} eliminado.`, 'info');
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
          <div class="empty-state-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
          </div>
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
      const badgeText = isDual ? 'Dual Master (2h)' :
                        session.englishCompleted ? 'Inglés (1h)' :
                        session.dataEngCompleted ? 'Data Eng (1h)' : '0h';

      card.innerHTML = `
        <div class="journal-item-top">
          <span class="j-date">${formatReadableDate(session.date)}</span>
          <span class="day-badge ${isDual ? 'badge-dual' : session.englishCompleted ? 'badge-english' : 'badge-de'}">${badgeText}</span>
        </div>
        ${session.topics ? `<div class="j-topics">Topic: ${session.topics}</div>` : ''}
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
          <div class="empty-state-icon">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
          </div>
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

  /**
   * ==========================================================================
   * GESTIÓN DE AUTENTICACIÓN Y PERFIL DE USUARIO
   * ==========================================================================
   */

  initAuth() {
    onAuthStateChanged((user) => {
      this.handleAuthStateChange(user);
    });
  }

  handleAuthStateChange(user) {
    if (user) {
      // Usuario autenticado
      if (this.authOverlay) this.authOverlay.classList.add('hidden');
      this.renderUserHeader(user);
      // Refrescar todos los componentes con los datos del usuario activo
      this.ctx.refreshAll();
    } else {
      // No hay sesión: mostrar modal de login obligatorio
      if (this.authOverlay) {
        this.authOverlay.classList.remove('hidden');
        this.clearAuthAlert();
      }
      this.renderUserHeader(null);
    }
  }

  renderUserHeader(user) {
    if (!this.userProfileBtn) return;

    if (user) {
      this.userProfileBtn.style.display = 'inline-flex';
      const initials = user.initials || 'KT';
      const firstName = (user.name || 'Usuario').split(' ')[0];

      if (this.headerUserAvatar) this.headerUserAvatar.textContent = initials;
      if (this.headerUserName) this.headerUserName.textContent = firstName;
      if (this.dropdownUserAvatar) this.dropdownUserAvatar.textContent = initials;
      if (this.dropdownUserName) this.dropdownUserName.textContent = user.name;
      if (this.dropdownUserEmail) this.dropdownUserEmail.textContent = user.email;
    } else {
      this.userProfileBtn.style.display = 'none';
      if (this.userProfileDropdown) this.userProfileDropdown.classList.add('hidden');
    }
  }

  bindAuthEvents() {
    // 1. Alternar pestañas Login / Registro
    if (this.tabLoginBtn && this.tabRegisterBtn) {
      this.tabLoginBtn.addEventListener('click', () => {
        this.switchAuthTab('login');
      });

      this.tabRegisterBtn.addEventListener('click', () => {
        this.switchAuthTab('register');
      });
    }

    // 2. Alternar visibilidad de contraseñas
    this.passwordToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        if (input) {
          const isPassword = input.type === 'password';
          input.type = isPassword ? 'text' : 'password';
          btn.title = isPassword ? 'Ocultar contraseña' : 'Mostrar contraseña';
          btn.style.opacity = isPassword ? '1' : '0.6';
        }
      });
    });

    // 3. Envío de Formulario de Login
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLoginSubmit();
      });
    }

    // 4. Envío de Formulario de Registro
    if (this.registerForm) {
      this.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleRegisterSubmit();
      });
    }

    // 5. Dropdown de Perfil en Header
    if (this.userProfileBtn && this.userProfileDropdown) {
      this.userProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isClosed = this.userProfileDropdown.classList.contains('hidden');
        this.userProfileDropdown.classList.toggle('hidden', !isClosed);
        this.userProfileBtn.setAttribute('aria-expanded', String(isClosed));
        playHover();
      });

      // Cerrar dropdown al hacer click fuera
      document.addEventListener('click', (e) => {
        if (!this.userProfileDropdown.classList.contains('hidden') &&
            !this.userProfileDropdown.contains(e.target) &&
            !this.userProfileBtn.contains(e.target)) {
          this.userProfileDropdown.classList.add('hidden');
          this.userProfileBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // 6. Botones de Acción del Dropdown
    const dropdownHistoryBtn = document.getElementById('dropdown-history-btn');
    if (dropdownHistoryBtn) {
      dropdownHistoryBtn.addEventListener('click', () => {
        this.userProfileDropdown.classList.add('hidden');
        this.userProfileBtn.setAttribute('aria-expanded', 'false');
        playSelect();
        this.openHistoryDrawer();
      });
    }

    const dropdownExportBtn = document.getElementById('dropdown-export-btn');
    if (dropdownExportBtn) {
      dropdownExportBtn.addEventListener('click', () => {
        this.userProfileDropdown.classList.add('hidden');
        this.userProfileBtn.setAttribute('aria-expanded', 'false');
        exportDataAsJSON();
        playSelect();
      });
    }

    // 7. Botón de Cerrar Sesión
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener('click', async () => {
        const confirmed = await this.showConfirm({
          title: 'Cerrar Sesión',
          message: '¿Deseas cerrar tu sesión actual?',
          confirmText: 'Cerrar Sesión',
          cancelText: 'Cancelar',
          type: 'warning'
        });

        if (confirmed) {
          playDeactivate();
          logoutUser();
          this.showToast('Sesión cerrada correctamente.', 'info');
        }
      });
    }
  }

  switchAuthTab(tab) {
    playSelect();
    this.clearAuthAlert();

    if (tab === 'login') {
      this.tabLoginBtn.classList.add('active');
      this.tabLoginBtn.setAttribute('aria-selected', 'true');
      this.tabRegisterBtn.classList.remove('active');
      this.tabRegisterBtn.setAttribute('aria-selected', 'false');

      this.loginForm.classList.remove('hidden');
      this.registerForm.classList.add('hidden');
    } else {
      this.tabRegisterBtn.classList.add('active');
      this.tabRegisterBtn.setAttribute('aria-selected', 'true');
      this.tabLoginBtn.classList.remove('active');
      this.tabLoginBtn.setAttribute('aria-selected', 'false');

      this.registerForm.classList.remove('hidden');
      this.loginForm.classList.add('hidden');
    }
  }

  async handleLoginSubmit() {
    const email = this.loginEmailInput.value;
    const password = this.loginPasswordInput.value;
    const rememberMe = this.loginRememberCheck.checked;

    this.loginSubmitBtn.disabled = true;
    this.loginSubmitBtn.style.opacity = '0.7';

    try {
      const result = await loginUser(email, password, rememberMe);
      if (result.success) {
        this.showAuthAlert('¡Bienvenido de vuelta!', 'success');
        playKyberIgnite();
        setTimeout(() => {
          this.loginPasswordInput.value = '';
          this.clearAuthAlert();
        }, 500);
      } else {
        this.showAuthAlert(result.error || 'Credenciales inválidas', 'error');
        playDeactivate();
      }
    } catch (err) {
      this.showAuthAlert('Ocurrió un error inesperado al iniciar sesión', 'error');
    } finally {
      this.loginSubmitBtn.disabled = false;
      this.loginSubmitBtn.style.opacity = '1';
    }
  }

  async handleRegisterSubmit() {
    const name = this.registerNameInput.value;
    const email = this.registerEmailInput.value;
    const password = this.registerPasswordInput.value;

    this.registerSubmitBtn.disabled = true;
    this.registerSubmitBtn.style.opacity = '0.7';

    try {
      const result = await registerUser(name, email, password);
      if (result.success) {
        this.showAuthAlert('¡Cuenta creada con éxito! Inicializando tu tracker...', 'success');
        playMasteryCelebration();
        setTimeout(() => {
          this.registerPasswordInput.value = '';
          this.clearAuthAlert();
        }, 600);
      } else {
        this.showAuthAlert(result.error || 'No se pudo crear la cuenta', 'error');
        playDeactivate();
      }
    } catch (err) {
      this.showAuthAlert('Ocurrió un error al procesar el registro', 'error');
    } finally {
      this.registerSubmitBtn.disabled = false;
      this.registerSubmitBtn.style.opacity = '1';
    }
  }

  showAuthAlert(message, type = 'error') {
    if (!this.authAlertMessage) return;
    this.authAlertMessage.textContent = message;
    this.authAlertMessage.className = `auth-alert alert-${type}`;
    this.authAlertMessage.classList.remove('hidden');
  }

  clearAuthAlert() {
    if (!this.authAlertMessage) return;
    this.authAlertMessage.textContent = '';
    this.authAlertMessage.className = 'auth-alert hidden';
  }

  /**
   * Muestra un modal de confirmación personalizado estilizado
   */
  showConfirm({
    title = 'Confirmación',
    message = '¿Estás seguro de realizar esta acción?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'warning'
  } = {}) {
    return new Promise((resolve) => {
      if (!this.confirmModal) {
        resolve(window.confirm(message));
        return;
      }

      this.confirmTitle.textContent = title;
      this.confirmMessage.textContent = message;
      this.confirmOkBtn.textContent = confirmText;
      this.confirmCancelBtn.textContent = cancelText;

      // Estilo de icono y botón según tipo ('danger', 'warning', 'info')
      this.confirmIconWrap.className = `confirm-icon-wrap icon-${type}`;
      if (type === 'danger') {
        this.confirmIconWrap.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;
        this.confirmOkBtn.className = 'btn-danger-primary';
      } else if (type === 'warning') {
        this.confirmIconWrap.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
        this.confirmOkBtn.className = 'btn-primary';
      } else {
        this.confirmIconWrap.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        this.confirmOkBtn.className = 'btn-primary';
      }

      const cleanup = () => {
        this.confirmOkBtn.removeEventListener('click', onOk);
        this.confirmCancelBtn.removeEventListener('click', onCancel);
        this.confirmModal.close();
      };

      const onOk = () => {
        cleanup();
        playSelect();
        resolve(true);
      };

      const onCancel = () => {
        cleanup();
        playHover();
        resolve(false);
      };

      this.confirmOkBtn.addEventListener('click', onOk);
      this.confirmCancelBtn.addEventListener('click', onCancel);

      playHover();
      this.confirmModal.showModal();
    });
  }

  /**
   * Muestra una notificación flotante tipo Toast
   */
  showToast(message, type = 'info', duration = 3500) {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    } else {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <span class="toast-message">${message}</span>
    `;

    this.toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });

    setTimeout(() => {
      toast.classList.remove('toast-show');
      toast.classList.add('toast-hide');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 350);
    }, duration);
  }

  /**
   * ==========================================================================
   * CONTROL DEL MOTOR DE ENFOQUE (FOCUS TIMER & ZEN MODE)
   * ==========================================================================
   */
  initFocusTimer() {
    if (!this.ctx || !this.ctx.focusTimer) return;

    // 1. Suscribirse a cambios de estado del temporizador
    this.ctx.focusTimer.subscribe((state) => {
      this.renderFocusTimerState(state);
    });

    // 2. Selección de Hábito para Foco (Inglés / Data Eng / Dual)
    this.focusHabitBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.focusHabitBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const habit = btn.dataset.focushabit;
        this.ctx.focusTimer.setHabit(habit);
        playHover();
      });
    });

    // 3. Misión / Objetivo
    if (this.focusGoalInput) {
      this.focusGoalInput.addEventListener('input', (e) => {
        this.ctx.focusTimer.setGoal(e.target.value.trim());
      });
    }

    // 4. Selector de Paisaje Sonoro & Volumen
    if (this.soundscapeSelect) {
      this.soundscapeSelect.addEventListener('change', (e) => {
        this.ctx.focusTimer.setSoundscape(e.target.value);
        playSelect();
      });
    }

    if (this.soundscapeVolume) {
      this.soundscapeVolume.addEventListener('input', (e) => {
        this.ctx.focusTimer.setVolume(parseFloat(e.target.value));
      });
    }

    // 5. Botón ⚡ Arrancar 5 min (Anti-Inercia)
    if (this.start5minBtn) {
      this.start5minBtn.addEventListener('click', () => {
        if (this.focusGoalInput) this.ctx.focusTimer.setGoal(this.focusGoalInput.value.trim());
        this.ctx.focusTimer.start5MinJumpstart();
      });
    }

    // 6. Botón 🎯 Hora Completa (60 min)
    if (this.start60minBtn) {
      this.start60minBtn.addEventListener('click', () => {
        if (this.focusGoalInput) this.ctx.focusTimer.setGoal(this.focusGoalInput.value.trim());
        this.ctx.focusTimer.start60MinSession();
      });
    }

    // 7. Pausar / Reanudar
    if (this.focusPauseBtn) {
      this.focusPauseBtn.addEventListener('click', () => {
        const state = this.ctx.focusTimer.getState();
        if (state.state === 'running') {
          this.ctx.focusTimer.pause();
        } else if (state.state === 'paused') {
          this.ctx.focusTimer.resume();
        }
      });
    }

    // 8. Detener
    if (this.focusStopBtn) {
      this.focusStopBtn.addEventListener('click', async () => {
        const confirmed = await this.showConfirm({
          title: 'Detener Sesión',
          message: '¿Deseas detener la sesión de concentración actual?',
          confirmText: 'Detener',
          cancelText: 'Continuar',
          type: 'warning'
        });
        if (confirmed) {
          this.ctx.focusTimer.stop();
        }
      });
    }

    // 9. Modo Zen (Pantalla Completa)
    if (this.toggleZenBtn && this.zenOverlay) {
      this.toggleZenBtn.addEventListener('click', () => {
        this.openZenMode();
      });
    }

    if (this.closeZenBtn) {
      this.closeZenBtn.addEventListener('click', () => {
        this.closeZenMode();
      });
    }

    // Atajo de teclado Escape para salir de Modo Zen
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.zenOverlay && !this.zenOverlay.classList.contains('hidden')) {
        this.closeZenMode();
      }
    });

    if (this.zenPauseBtn) {
      this.zenPauseBtn.addEventListener('click', () => {
        const state = this.ctx.focusTimer.getState();
        if (state.state === 'running') {
          this.ctx.focusTimer.pause();
        } else if (state.state === 'paused') {
          this.ctx.focusTimer.resume();
        } else {
          // Estado idle: iniciar disparador de 5 min directamente
          if (this.focusGoalInput) this.ctx.focusTimer.setGoal(this.focusGoalInput.value.trim());
          this.ctx.focusTimer.start5MinJumpstart();
        }
      });
    }

    if (this.zenStopBtn) {
      this.zenStopBtn.addEventListener('click', async () => {
        const state = this.ctx.focusTimer.getState();
        if (state.state === 'idle' || state.state === 'completed') {
          this.closeZenMode();
          return;
        }

        const confirmed = await this.showConfirm({
          title: 'Detener Sesión',
          message: '¿Deseas detener la sesión de concentración actual?',
          confirmText: 'Detener',
          cancelText: 'Continuar',
          type: 'warning'
        });
        if (confirmed) {
          this.ctx.focusTimer.stop();
          this.closeZenMode();
        }
      });
    }
  }

  openZenMode() {
    if (!this.zenOverlay) return;
    this.zenOverlay.classList.remove('hidden');
    playSelect();
  }

  closeZenMode() {
    if (!this.zenOverlay) return;
    this.zenOverlay.classList.add('hidden');
    playSelect();
  }

  renderFocusTimerState(state) {
    // 1. Actualizar Dígitos y Barra de Progreso
    if (this.focusTimerDigits) this.focusTimerDigits.textContent = state.timeFormatted;
    if (this.zenTimerDigits) this.zenTimerDigits.textContent = state.timeFormatted;
    if (this.focusProgressFill) this.focusProgressFill.style.width = `${state.progressPercent}%`;
    if (this.zenProgressFill) this.zenProgressFill.style.width = `${state.progressPercent}%`;

    // 2. Actualizar Etiquetas de Modo
    const modeText = state.mode === 'friction_5' ? '⚡ Superar Inercia (5 min)' : '🎯 Hora Completa (60 min)';
    if (this.focusModeLabel) this.focusModeLabel.textContent = modeText;
    if (this.zenModePill) this.zenModePill.textContent = state.mode === 'friction_5' ? '⚡ Superar Inercia' : '🎯 Hora Completa';

    // 3. Controles según Estado (idle / running / paused / completed)
    const isRunningOrPaused = state.state === 'running' || state.state === 'paused';
    if (this.start5minBtn) this.start5minBtn.classList.toggle('hidden', isRunningOrPaused);
    if (this.start60minBtn) this.start60minBtn.classList.toggle('hidden', isRunningOrPaused);
    if (this.focusRunningControls) this.focusRunningControls.classList.toggle('hidden', !isRunningOrPaused);

    // 4. Botón de Pausa / Reanudar en Widget
    const isPaused = state.state === 'paused';
    if (this.focusPauseLabel) this.focusPauseLabel.textContent = isPaused ? 'Reanudar' : 'Pausa';
    if (this.focusPauseIcon) {
      this.focusPauseIcon.innerHTML = isPaused
        ? `<polygon points="5 3 19 12 5 21 5 3"/>`
        : `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
    }

    // 4b. Botón de Pausa / Iniciar en Modo Zen
    if (this.zenPauseText) {
      if (state.state === 'idle' || state.state === 'completed') {
        this.zenPauseText.textContent = 'Iniciar 5 min';
        if (this.zenPauseIcon) this.zenPauseIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
      } else if (isPaused) {
        this.zenPauseText.textContent = 'Reanudar';
        if (this.zenPauseIcon) this.zenPauseIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
      } else {
        this.zenPauseText.textContent = 'Pausar';
        if (this.zenPauseIcon) this.zenPauseIcon.innerHTML = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
      }
    }

    // 5. Zen labels
    if (this.zenHabitPill) {
      this.zenHabitPill.textContent = state.selectedHabit === 'english' ? 'Inglés' :
                                      state.selectedHabit === 'de' ? 'Data Engineering' : 'Dual Master';
    }

    if (this.zenGoalText) {
      this.zenGoalText.textContent = state.singleGoal || 'Sesión de Concentración Activa';
    }

    if (this.zenSoundscapeStatus) {
      const soundLabels = {
        brown: '🌊 Paisaje sonoro activo: Ruido Marrón',
        rain: '🌧️ Paisaje sonoro activo: Lluvia Suave',
        binaural: '🌌 Paisaje sonoro activo: Frecuencia Alfa 10Hz',
        none: '🔇 Silencio'
      };
      this.zenSoundscapeStatus.textContent = soundLabels[state.selectedSoundscape] || 'Sonido Ambiente';
    }
  }
}

