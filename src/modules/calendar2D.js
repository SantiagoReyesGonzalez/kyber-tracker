import { 
  getMonthCalendarGrid, 
  getYearHeatmapData, 
  getWeeklyBreakdown,
  isHabitCompleted,
  DAY_NAMES_ES,
  MONTH_NAMES_ES,
  formatReadableDate,
  getIconSvg
} from './tracker.js';
import { loadHabitsConfig } from '../store/storage.js';

export class Calendar2D {
  constructor() {
    this.monthContainer = document.getElementById('monthly-calendar-grid');
    this.heatmapContainer = document.getElementById('annual-heatmap-grid');
    this.weeklyChartContainer = document.getElementById('weekly-chart-bars');
    this.heatmapFilter = 'all'; // 'all', 'english', 'de', 'both', 'gym'
  }

  /**
   * Renderiza la cuadrícula mensual de 7 columnas
   */
  renderMonth(year, month, onDayClick) {
    if (!this.monthContainer) return;
    this.monthContainer.innerHTML = '';

    const gridData = getMonthCalendarGrid(year, month);
    const habitsConfig = loadHabitsConfig();

    // 1. Cabeceras de días de la semana
    DAY_NAMES_ES.forEach(name => {
      const headerEl = document.createElement('div');
      headerEl.className = 'calendar-weekday-header';
      headerEl.textContent = name;
      this.monthContainer.appendChild(headerEl);
    });

    // 2. Celdas vacías antes del primer día del mes
    for (let i = 0; i < gridData.startDayOfWeek; i++) {
      const emptyEl = document.createElement('div');
      emptyEl.className = 'calendar-day-card empty-offset';
      this.monthContainer.appendChild(emptyEl);
    }

    // 3. Tarjetas de días del mes con animación en cascada suave
    gridData.days.forEach((day, index) => {
      try {
        const card = document.createElement('article');
        card.className = 'calendar-day-card';
        card.dataset.date = day.dateStr;
        card.style.animationDelay = `${Math.min(index * 14, 380)}ms`;

        const s = day.session;
        const isEng = isHabitCompleted(s, 'english');
        const isDE = isHabitCompleted(s, 'de');
        const isGym = isHabitCompleted(s, 'gym');
        const anyHabit = habitsConfig.some(h => isHabitCompleted(s, h.id));

        let statusClass = 'status-empty';
        let badgeHtml = '';

        if (isEng && isDE && isGym) {
          statusClass = 'status-both';
          badgeHtml = `
            <div class="day-badge badge-dual">
              <span class="badge-icon">★</span>
              <span class="badge-text">Dual + Gym</span>
            </div>
          `;
        } else if (isEng && isDE) {
          statusClass = 'status-both';
          badgeHtml = `
            <div class="day-badge badge-dual">
              <span class="badge-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></span>
              <span class="badge-text">Dual Master</span>
            </div>
          `;
        } else if (isDE) {
          statusClass = 'status-de';
          badgeHtml = `
            <div class="day-badge badge-de">
              <span class="badge-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
              <span class="badge-text">Data Eng</span>
            </div>
          `;
        } else if (isEng) {
          statusClass = 'status-english';
          badgeHtml = `
            <div class="day-badge badge-english">
              <span class="badge-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span>
              <span class="badge-text">Inglés</span>
            </div>
          `;
        } else if (isGym) {
          statusClass = 'status-gym';
          badgeHtml = `
            <div class="day-badge badge-gym">
              <span class="badge-icon"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5v14M18 5v14M4 8v8M20 8v8M6 12h12"/></svg></span>
              <span class="badge-text">Gym</span>
            </div>
          `;
        } else if (s && anyHabit) {
          const firstDone = habitsConfig.find(h => isHabitCompleted(s, h.id));
          statusClass = 'status-active';
          badgeHtml = `
            <div class="day-badge badge-dynamic" style="--badge-color: ${firstDone?.color || '#0071e3'};">
              <span class="badge-icon">${getIconSvg(firstDone?.icon || 'target', 10)}</span>
              <span class="badge-text">${firstDone?.name || 'Hábito'}</span>
            </div>
          `;
        } else if (day.isPast) {
          statusClass = 'status-missed';
          badgeHtml = `
            <div class="day-badge badge-missed">
              <span class="badge-icon"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
              <span class="badge-text">Sin registro</span>
            </div>
          `;
        } else {
          badgeHtml = `
            <div class="day-badge badge-empty">
              <span class="badge-text">+ Registrar</span>
            </div>
          `;
        }

        card.classList.add(statusClass);
        if (day.isToday) card.classList.add('is-today');
        if (day.isFuture) card.classList.add('is-future');

        // Chips de temas/notas si existen
        let topicsHtml = '';
        if (s && s.topics) {
          const topicsStr = String(s.topics);
          const cleanTopic = topicsStr.length > 28 ? topicsStr.substring(0, 26) + '...' : topicsStr;
          topicsHtml = `<div class="day-topics-preview" title="${topicsStr}">${cleanTopic}</div>`;
        }

        card.innerHTML = `
          <div class="day-card-header">
            <span class="day-number">${day.dayNumber}</span>
            ${day.isToday ? '<span class="today-pill">HOY</span>' : ''}
          </div>
          <div class="day-card-body">
            ${badgeHtml}
            ${topicsHtml}
          </div>
        `;

        card.addEventListener('click', () => {
          if (onDayClick) onDayClick(day);
        });

        this.monthContainer.appendChild(card);
      } catch (err) {
        console.error('Error al renderizar día:', day, err);
      }
    });
  }

  /**
   * Renderiza el Heatmap Anual de 52 semanas (estilo GitHub / Linear)
   */
  renderHeatmap(year, onCellClick) {
    if (!this.heatmapContainer) return;
    this.heatmapContainer.innerHTML = '';

    const heatmapData = getYearHeatmapData(year);
    const filter = this.heatmapFilter;
    const habitsConfig = loadHabitsConfig();

    // Contenedor principal de semanas
    const scrollWrap = document.createElement('div');
    scrollWrap.className = 'heatmap-scroll-wrapper';

    // Meses superiores
    const monthsRow = document.createElement('div');
    monthsRow.className = 'heatmap-months-row';
    const monthIntervals = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    monthIntervals.forEach(m => {
      const mSpan = document.createElement('span');
      mSpan.textContent = m;
      monthsRow.appendChild(mSpan);
    });
    scrollWrap.appendChild(monthsRow);

    // Grilla de semanas
    const gridEl = document.createElement('div');
    gridEl.className = 'heatmap-weeks-grid';

    heatmapData.weeks.forEach(week => {
      const colEl = document.createElement('div');
      colEl.className = 'heatmap-week-column';

      week.forEach(day => {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.dataset.date = day.dateStr;

        if (!day.inTargetYear) {
          cell.classList.add('out-of-year');
        } else {
          let cellStatus = day.status;
          const completed = day.habitsCompleted || [];

          // Aplicar filtro si está activo
          if (filter === 'all') {
            // Mantener cellStatus tal como viene
          } else if (filter === 'both') {
            if (completed.includes('english') && completed.includes('de')) {
              cellStatus = 'both';
            } else {
              cellStatus = 'empty';
            }
          } else if (filter === 'english') {
            if (completed.includes('english')) {
              cellStatus = 'english';
            } else {
              cellStatus = 'empty';
            }
          } else if (filter === 'de') {
            if (completed.includes('de')) {
              cellStatus = 'de';
            } else {
              cellStatus = 'empty';
            }
          } else if (filter === 'gym') {
            if (completed.includes('gym')) {
              cellStatus = 'gym';
            } else {
              cellStatus = 'empty';
            }
          } else {
            if (completed.includes(filter)) {
              cellStatus = filter;
              const hConf = habitsConfig.find(h => h.id === filter);
              if (hConf && hConf.color) {
                cell.style.backgroundColor = hConf.color;
                cell.style.borderColor = hConf.color;
              }
            } else {
              cellStatus = 'empty';
            }
          }

          cell.classList.add(`cell-${cellStatus}`);
          if (day.isToday) cell.classList.add('cell-today');

          // Tooltip nativo detallado
          let statusText = 'Sin Registro';
          if (day.session && completed.length > 0) {
            const parts = [];
            if (completed.includes('english') && completed.includes('de')) {
              parts.push('Dual Master (2h)');
            } else if (completed.includes('english')) {
              parts.push('Inglés (1h)');
            } else if (completed.includes('de')) {
              parts.push('Data Eng (1h)');
            }
            if (completed.includes('gym')) {
              parts.push('Gym (Entrenamiento)');
            }
            habitsConfig.forEach(h => {
              if (h.id !== 'english' && h.id !== 'de' && h.id !== 'gym' && completed.includes(h.id)) {
                parts.push(h.name);
              }
            });
            statusText = parts.join(' • ');
          } else if (day.status === 'missed') {
            statusText = 'Sin Registro (Día pasado)';
          }

          const topicsText = day.session && day.session.topics ? ` • ${day.session.topics}` : '';
          cell.setAttribute('title', `${formatReadableDate(day.dateStr)}: ${statusText}${topicsText}`);

          cell.addEventListener('click', () => {
            if (onCellClick) onCellClick(day);
          });
        }

        colEl.appendChild(cell);
      });

      gridEl.appendChild(colEl);
    });

    scrollWrap.appendChild(gridEl);
    this.heatmapContainer.appendChild(scrollWrap);
  }

  /**
   * Renderiza el desglose de consistencia semanal (Lun a Dom)
   */
  renderWeeklyChart() {
    if (!this.weeklyChartContainer) return;
    this.weeklyChartContainer.innerHTML = '';

    const counts = getWeeklyBreakdown();
    const maxCount = Math.max(...counts, 1);
    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    counts.forEach((count, idx) => {
      const percent = Math.round((count / maxCount) * 100);
      const col = document.createElement('div');
      col.className = 'weekly-bar-col';
      col.innerHTML = `
        <div class="bar-fill-track">
          <div class="bar-fill" style="height: ${Math.max(percent, 8)}%" title="${dayLabels[idx]}: ${count} sesiones">
            <span class="bar-count-label">${count}</span>
          </div>
        </div>
        <span class="bar-day-name">${dayLabels[idx]}</span>
      `;
      this.weeklyChartContainer.appendChild(col);
    });
  }

  setHeatmapFilter(filter, year, onCellClick) {
    this.heatmapFilter = filter;
    this.renderHeatmap(year, onCellClick);
  }
}
