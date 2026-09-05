// ==========================================================================
// KAIDIN CURVES DASHBOARD - Motor Analítico de Curvas Suaves (Bézier Splines)
// Métricas puras de alto impacto: Momentum Rodante, Kaizen 1% y Sinergia
// ==========================================================================

import { loadStudyData, loadHabitsConfig } from '../store/storage.js';
import { 
  formatDate, 
  parseDate, 
  getTodayStr, 
  formatReadableDate, 
  isHabitCompleted,
  DAY_NAMES_ES 
} from './tracker.js';

export class CurveDashboard {
  constructor(containerId = 'view-curves-panel') {
    this.container = document.getElementById(containerId);
    this.timeframe = '30d'; // '14d', '30d', '90d', 'year'
    this.activeHabitFilter = 'all'; // 'all' o habitId
    this.tooltipEl = null;
    this.cachedData = null;
    this.visibleHabits = new Set(['english', 'de', 'gym']);
  }

  /**
   * Genera el spline cúbico Catmull-Rom a SVG Bézier path
   */
  pointsToSplinePath(points, tension = 0.8) {
    if (!points || points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
      const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
      const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
      const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }

    return path;
  }

  /**
   * Obtiene la secuencia cronológica de días según el rango seleccionado
   */
  getDateRange(timeframe = this.timeframe) {
    const today = new Date();
    let daysCount = 30;
    if (timeframe === '14d') daysCount = 14;
    else if (timeframe === '30d') daysCount = 30;
    else if (timeframe === '90d') daysCount = 90;
    else if (timeframe === 'year') daysCount = 365;

    const dates = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push({
        dateStr: formatDate(d),
        dateObj: d,
        isToday: i === 0
      });
    }
    return dates;
  }

  /**
   * Procesa la serie de datos para el rango seleccionado
   */
  processSeries(dates) {
    const studyData = loadStudyData();
    const habitsConfig = loadHabitsConfig();
    const habitIds = habitsConfig.map(h => h.id);

    // Inicializar sets visibles si están vacíos
    if (this.visibleHabits.size === 0) {
      habitIds.forEach(id => this.visibleHabits.add(id));
    }

    let rollingAlpha = 0.25; // EMA 7 días aprox
    let currentEMA = 0.5; // Baseline neutral

    let totalSessionsAccum = 0;
    let totalTargetAccum = 0;
    let totalHoursAccum = 0;

    const habitCompletions = {};
    habitIds.forEach(id => {
      habitCompletions[id] = 0;
    });

    const series = dates.map((d, index) => {
      const session = studyData[d.dateStr] || null;
      let dayScore = 0;
      let completedInDay = 0;
      let totalHabitsCount = habitsConfig.length || 3;
      const dayHabitsStatus = {};

      habitsConfig.forEach(h => {
        const done = isHabitCompleted(session, h.id);
        dayHabitsStatus[h.id] = done;
        if (done) {
          completedInDay++;
          habitCompletions[h.id] = (habitCompletions[h.id] || 0) + 1;
        }
      });

      // Ratio de completitud del día (0 a 1)
      const dayRatio = totalHabitsCount > 0 ? (completedInDay / totalHabitsCount) : 0;
      
      // EMA Momentum
      if (index === 0) {
        currentEMA = dayRatio;
      } else {
        currentEMA = (rollingAlpha * dayRatio) + ((1 - rollingAlpha) * currentEMA);
      }

      const momentumScore = Math.min(100, Math.max(0, Math.round(currentEMA * 100)));

      // Acumulación para Kaizen 1%
      totalSessionsAccum += completedInDay;
      const idealDailyIncrement = 1.0 * Math.pow(1.006, index); // Proyección compuesta sutil
      totalTargetAccum += idealDailyIncrement;

      const hours = session && session.hours ? Number(session.hours) : (completedInDay * 1.0);
      totalHoursAccum += hours;

      return {
        dateStr: d.dateStr,
        dateObj: d.dateObj,
        isToday: d.isToday,
        session,
        dayRatio,
        completedInDay,
        dayHabitsStatus,
        momentumScore,
        currentEMA,
        totalSessionsAccum,
        totalTargetAccum: Math.round(totalTargetAccum * 10) / 10,
        hours
      };
    });

    // Calcular rolling consistency individual por hábito (ventana 7 días)
    const habitRollingSeries = {};
    habitIds.forEach(id => {
      habitRollingSeries[id] = series.map((pt, idx) => {
        const windowStart = Math.max(0, idx - 6);
        const windowItems = series.slice(windowStart, idx + 1);
        const count = windowItems.filter(p => p.dayHabitsStatus[id]).length;
        const rate = Math.round((count / windowItems.length) * 100);
        return {
          dateStr: pt.dateStr,
          rate,
          count
        };
      });
    });

    // Métricas ejecutivas finales
    const latestMomentum = series[series.length - 1].momentumScore;
    const weekAgoIdx = Math.max(0, series.length - 8);
    const prevMomentum = series[weekAgoIdx].momentumScore;
    const momentumDelta = latestMomentum - prevMomentum;

    let momentumTrend = 'Estable';
    let momentumTrendClass = 'trend-stable';
    let momentumArrow = '—';
    if (momentumDelta > 3) {
      momentumTrend = `Acelerando (+${momentumDelta}%)`;
      momentumTrendClass = 'trend-up';
      momentumArrow = '▲';
    } else if (momentumDelta < -3) {
      momentumTrend = `Desacelerando (${momentumDelta}%)`;
      momentumTrendClass = 'trend-down';
      momentumArrow = '▼';
    } else {
      momentumTrend = `Ritmo Constante (±${Math.abs(momentumDelta)}%)`;
    }

    // Factor Kaizen: Real vs Proyectado
    const finalActual = series[series.length - 1].totalSessionsAccum;
    const finalTarget = Math.max(1, series[series.length - 1].totalTargetAccum);
    const kaizenRatio = Math.round((finalActual / finalTarget) * 100) / 100;
    const kaizenDeltaPercent = Math.round(((finalActual - finalTarget) / finalTarget) * 100);

    // Hábito más fuerte
    let bestHabit = null;
    let maxDone = -1;
    habitsConfig.forEach(h => {
      const count = habitCompletions[h.id] || 0;
      if (count > maxDone) {
        maxDone = count;
        bestHabit = h;
      }
    });

    return {
      series,
      dates,
      habitsConfig,
      habitRollingSeries,
      habitCompletions,
      kpis: {
        latestMomentum,
        momentumTrend,
        momentumTrendClass,
        momentumArrow,
        kaizenRatio,
        kaizenDeltaPercent,
        bestHabit: bestHabit ? bestHabit.name : 'En progreso',
        bestHabitCount: maxDone,
        totalSessionsAccum,
        totalHoursAccum: Math.round(totalHoursAccum * 10) / 10
      }
    };
  }

  /**
   * Renderiza el módulo completo en el contenedor
   */
  render() {
    if (!this.container) {
      this.container = document.getElementById('view-curves-panel');
      if (!this.container) return;
    }

    const dates = this.getDateRange(this.timeframe);
    const data = this.processSeries(dates);
    this.cachedData = data;

    this.container.innerHTML = `
      <div class="curves-dashboard-root">
        <!-- 1. Encabezado del Dashboard y Selector de Rango -->
        <div class="curves-header-row">
          <div class="curves-title-group">
            <div class="curves-title-badge">
              <span class="pulse-dot"></span>
              <span>Análisis de Alta Precisión</span>
            </div>
            <h2 class="curves-main-title">Curvas de Progreso & Momentum</h2>
            <p class="curves-subtitle">Velocidad de consistencia, trayectoria Kaizen continua y armonía entre tus hábitos.</p>
          </div>

          <div class="curves-controls-group">
            <div class="curves-timeframe-pills" id="curves-timeframe-selector">
              <button class="timeframe-pill ${this.timeframe === '14d' ? 'active' : ''}" data-tf="14d">14 Días</button>
              <button class="timeframe-pill ${this.timeframe === '30d' ? 'active' : ''}" data-tf="30d">30 Días</button>
              <button class="timeframe-pill ${this.timeframe === '90d' ? 'active' : ''}" data-tf="90d">90 Días</button>
              <button class="timeframe-pill ${this.timeframe === 'year' ? 'active' : ''}" data-tf="year">Año</button>
            </div>
          </div>
        </div>

        <!-- 2. Tarjetas KPI Ejecutivas (Cero relleno) -->
        <div class="curves-kpi-grid">
          <div class="curve-kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">Índice de Momentum</span>
              <span class="kpi-tag ${data.kpis.momentumTrendClass}">${data.kpis.momentumArrow} ${data.kpis.momentumTrend}</span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-big-value">${data.kpis.latestMomentum}</span>
              <span class="kpi-unit">/ 100</span>
            </div>
            <div class="kpi-meter-bar">
              <div class="kpi-meter-fill" style="width: ${data.kpis.latestMomentum}%;"></div>
            </div>
            <p class="kpi-subtext">Media exponencial ponderada de cumplimiento diario.</p>
          </div>

          <div class="curve-kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">Aceleración Kaizen 1%</span>
              <span class="kpi-tag ${data.kpis.kaizenDeltaPercent >= 0 ? 'trend-up' : 'trend-down'}">
                ${data.kpis.kaizenDeltaPercent >= 0 ? '+' : ''}${data.kpis.kaizenDeltaPercent}%
              </span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-big-value">${data.kpis.kaizenRatio}x</span>
              <span class="kpi-unit">vs Teórico</span>
            </div>
            <div class="kpi-meter-bar">
              <div class="kpi-meter-fill kaizen-fill" style="width: ${Math.min(100, Math.round(data.kpis.kaizenRatio * 75))}%;"></div>
            </div>
            <p class="kpi-subtext">${data.kpis.kaizenDeltaPercent >= 0 ? 'Por encima de la tasa compuesta continua' : 'A pocas sesiones de alinearse con el 1%'}.</p>
          </div>

          <div class="curve-kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">Hábito Con Mayor Tracción</span>
              <span class="kpi-tag trend-focus">Líder</span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-big-value-text">${data.kpis.bestHabit}</span>
            </div>
            <div class="kpi-meter-bar">
              <div class="kpi-meter-fill habit-fill" style="width: 100%;"></div>
            </div>
            <p class="kpi-subtext">${data.kpis.bestHabitCount} sesiones completadas en este periodo.</p>
          </div>

          <div class="curve-kpi-card">
            <div class="kpi-header">
              <span class="kpi-label">Volumen Acumulado</span>
              <span class="kpi-tag trend-info">Total</span>
            </div>
            <div class="kpi-value-row">
              <span class="kpi-big-value">${data.kpis.totalSessionsAccum}</span>
              <span class="kpi-unit">sesiones (${data.kpis.totalHoursAccum}h)</span>
            </div>
            <div class="kpi-meter-bar">
              <div class="kpi-meter-fill volume-fill" style="width: 100%;"></div>
            </div>
            <p class="kpi-subtext">Compromiso real ejecutado en el rango seleccionado.</p>
          </div>
        </div>

        <!-- 3. Gráfica Principal: Curva de Momentum y Aceleración Rodante -->
        <div class="curve-card hero-chart-card">
          <div class="curve-card-header">
            <div class="chart-header-left">
              <h3 class="chart-card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                Curva de Momentum & Velocidad de Consistencia
              </h3>
              <p class="chart-card-desc">Sigue las ondas de aceleración y estabilidad en tu disciplina diaria.</p>
            </div>
            <div class="chart-legend-pills">
              <span class="legend-pill zone-optimal"><span class="pill-dot"></span> Zona Alta (&gt;80%)</span>
              <span class="legend-pill zone-cruising"><span class="pill-dot"></span> Estable (50-80%)</span>
              <span class="legend-pill zone-alert"><span class="pill-dot"></span> Riesgo (&lt;50%)</span>
            </div>
          </div>

          <div class="curve-canvas-wrap" id="momentum-chart-wrap">
            ${this.renderMomentumSVG(data)}
          </div>
        </div>

        <!-- 4. Fila Dual: Crecimiento Compuesto Kaizen + Balance Multihábito -->
        <div class="curves-dual-grid">
          <!-- Gráfica 2: Kaizen Compuesto -->
          <div class="curve-card">
            <div class="curve-card-header">
              <div class="chart-header-left">
                <h3 class="chart-card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                  Crecimiento Compuesto Kaizen (1% Diario)
                </h3>
                <p class="chart-card-desc">Trayectoria real acumulada vs. el avance exponencial matemático ($1.01^t$).</p>
              </div>
            </div>
            <div class="curve-canvas-wrap" id="kaizen-chart-wrap">
              ${this.renderKaizenSVG(data)}
            </div>
          </div>

          <!-- Gráfica 3: Balance Multihábito -->
          <div class="curve-card">
            <div class="curve-card-header">
              <div class="chart-header-left">
                <h3 class="chart-card-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                  Sinergia & Balance Multihábito
                </h3>
                <p class="chart-card-desc">Curvas simultáneas para balancear intelecto (Inglés y Data) con salud física (Gym).</p>
              </div>
              <div class="chart-habit-toggles" id="habit-toggles-container">
                ${data.habitsConfig.map(h => `
                  <button class="habit-toggle-btn ${this.visibleHabits.has(h.id) ? 'active' : ''}" data-hid="${h.id}" style="--h-color: ${h.color || '#38bdf8'}">
                    <span class="toggle-indicator" style="background-color: ${h.color || '#38bdf8'}"></span>
                    <span>${h.name}</span>
                  </button>
                `).join('')}
              </div>
            </div>
            <div class="curve-canvas-wrap" id="balance-chart-wrap">
              ${this.renderHabitBalanceSVG(data)}
            </div>
          </div>
        </div>

        <!-- Tooltip flotante interactivo para las 3 curvas -->
        <div id="curve-hover-tooltip" class="curve-hover-tooltip hidden"></div>
      </div>
    `;

    this.bindEvents();
  }

  /**
   * Genera el SVG para la Curva de Momentum (Hero Chart)
   */
  renderMomentumSVG(data) {
    const W = 960;
    const H = 260;
    const padL = 45;
    const padR = 25;
    const padT = 20;
    const padB = 40;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const series = data.series;
    const N = series.length;
    if (N === 0) return '';

    // Convertir datos a coordenadas SVG
    const points = series.map((pt, idx) => {
      const x = padL + (idx / Math.max(1, N - 1)) * innerW;
      const y = padT + (1 - (pt.momentumScore / 100)) * innerH;
      return { x, y, pt, idx };
    });

    const splineD = this.pointsToSplinePath(points, 0.85);

    // Área bajo la curva
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const baseY = padT + innerH;
    const areaD = `${splineD} L ${lastX.toFixed(1)} ${baseY} L ${firstX.toFixed(1)} ${baseY} Z`;

    // Líneas guía horizontales (80% óptima, 50% media)
    const y80 = padT + (1 - 0.8) * innerH;
    const y50 = padT + (1 - 0.5) * innerH;

    // Marcadores de fecha en el eje X (máximo 6 etiquetas legibles)
    const labelStep = Math.max(1, Math.floor(N / 6));
    const xLabels = [];
    for (let i = 0; i < N; i += labelStep) {
      xLabels.push(points[i]);
    }
    if (xLabels[xLabels.length - 1] !== points[N - 1]) {
      xLabels.push(points[N - 1]);
    }

    return `
      <svg class="curve-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" data-chart="momentum">
        <defs>
          <linearGradient id="grad-momentum-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.38"/>
            <stop offset="50%" stop-color="#818cf8" stop-opacity="0.16"/>
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
          </linearGradient>

          <linearGradient id="grad-momentum-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#38bdf8"/>
            <stop offset="50%" stop-color="#818cf8"/>
            <stop offset="100%" stop-color="#34d399"/>
          </linearGradient>

          <filter id="glow-momentum" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        <!-- Fondo y Guías de Zona -->
        <rect x="${padL}" y="${padT}" width="${innerW}" height="${y80 - padT}" fill="rgba(52, 211, 153, 0.03)" />
        <rect x="${padL}" y="${y80}" width="${innerW}" height="${y50 - y80}" fill="rgba(56, 189, 248, 0.02)" />

        <!-- Líneas guía -->
        <line x1="${padL}" y1="${y80}" x2="${W - padR}" y2="${y80}" class="guide-line optimal" stroke-dasharray="4 4" />
        <text x="${padL - 8}" y="${y80 + 4}" class="axis-label-y">80%</text>

        <line x1="${padL}" y1="${y50}" x2="${W - padR}" y2="${y50}" class="guide-line neutral" stroke-dasharray="4 4" />
        <text x="${padL - 8}" y="${y50 + 4}" class="axis-label-y">50%</text>

        <line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" class="axis-line" />
        <text x="${padL - 8}" y="${baseY + 4}" class="axis-label-y">0%</text>

        <!-- Etiquetas de Fechas en X -->
        ${xLabels.map(pt => {
          const parts = pt.pt.dateStr.split('-');
          const label = `${parts[2]}/${parts[1]}`;
          return `<text x="${pt.x}" y="${H - 12}" text-anchor="middle" class="axis-label-x">${label}</text>`;
        }).join('')}

        <!-- Área Sombreada -->
        <path d="${areaD}" fill="url(#grad-momentum-fill)" />

        <!-- Trazo Spline con Resplandor -->
        <path d="${splineD}" fill="none" stroke="url(#grad-momentum-stroke)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-momentum)" class="spline-stroke" />

        <!-- Mirilla interactiva (Crosshair) -->
        <line id="momentum-crosshair" class="crosshair-line hidden" x1="0" y1="${padT}" x2="0" y2="${baseY}" />
        <circle id="momentum-point" class="active-tracker-point hidden" r="6" />

        <!-- Zonas interactivas transparentes para cada día -->
        ${points.map((pt) => `
          <rect class="hit-column" x="${pt.x - (innerW / N / 2)}" y="${padT}" width="${innerW / N}" height="${innerH}" 
                data-idx="${pt.idx}" data-chart="momentum" />
        `).join('')}
      </svg>
    `;
  }

  /**
   * Genera el SVG para la Curva Kaizen (1% Diario vs Real)
   */
  renderKaizenSVG(data) {
    const W = 460;
    const H = 220;
    const padL = 40;
    const padR = 20;
    const padT = 20;
    const padB = 36;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const series = data.series;
    const N = series.length;
    if (N === 0) return '';

    const maxVal = Math.max(
      ...series.map(s => s.totalSessionsAccum),
      ...series.map(s => s.totalTargetAccum),
      10
    );

    // Coordenadas para la serie Real
    const actualPoints = series.map((pt, idx) => {
      const x = padL + (idx / Math.max(1, N - 1)) * innerW;
      const y = padT + (1 - (pt.totalSessionsAccum / maxVal)) * innerH;
      return { x, y, pt, idx };
    });

    // Coordenadas para la serie Teórica Kaizen
    const targetPoints = series.map((pt, idx) => {
      const x = padL + (idx / Math.max(1, N - 1)) * innerW;
      const y = padT + (1 - (pt.totalTargetAccum / maxVal)) * innerH;
      return { x, y, pt, idx };
    });

    const actualD = this.pointsToSplinePath(actualPoints, 0.7);
    const targetD = this.pointsToSplinePath(targetPoints, 0.7);

    const baseY = padT + innerH;
    const firstX = actualPoints[0].x;
    const lastX = actualPoints[actualPoints.length - 1].x;
    const areaD = `${actualD} L ${lastX.toFixed(1)} ${baseY} L ${firstX.toFixed(1)} ${baseY} Z`;

    return `
      <svg class="curve-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" data-chart="kaizen">
        <defs>
          <linearGradient id="grad-kaizen-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <!-- Eje Base -->
        <line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" class="axis-line" />
        <text x="${padL - 6}" y="${baseY + 4}" class="axis-label-y">0</text>
        <text x="${padL - 6}" y="${padT + 8}" class="axis-label-y">${Math.round(maxVal)}</text>

        <!-- Área Real -->
        <path d="${areaD}" fill="url(#grad-kaizen-area)" />

        <!-- Curva Teórica Kaizen (Punteada Dorada) -->
        <path d="${targetD}" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4 4" opacity="0.75" />

        <!-- Curva Real (Sólida Azul Esmeralda) -->
        <path d="${actualD}" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />

        <!-- Leyenda Interna -->
        <g transform="translate(${padL + 10}, ${padT + 10})">
          <line x1="0" y1="5" x2="16" y2="5" stroke="#38bdf8" stroke-width="3" />
          <text x="22" y="9" class="mini-legend-text">Real Acumulado</text>
          
          <line x1="120" y1="5" x2="136" y2="5" stroke="#f59e0b" stroke-width="2" stroke-dasharray="3 3" />
          <text x="142" y="9" class="mini-legend-text">Curva 1% Kaizen</text>
        </g>

        <!-- Mirilla interactiva -->
        <line id="kaizen-crosshair" class="crosshair-line hidden" x1="0" y1="${padT}" x2="0" y2="${baseY}" />
        <circle id="kaizen-point" class="active-tracker-point hidden" r="5" />

        <!-- Hit Columns -->
        ${actualPoints.map(pt => `
          <rect class="hit-column" x="${pt.x - (innerW / N / 2)}" y="${padT}" width="${innerW / N}" height="${innerH}" 
                data-idx="${pt.idx}" data-chart="kaizen" />
        `).join('')}
      </svg>
    `;
  }

  /**
   * Genera el SVG para el Balance Multihábito (Splines superpuestos)
   */
  renderHabitBalanceSVG(data) {
    const W = 460;
    const H = 220;
    const padL = 40;
    const padR = 20;
    const padT = 20;
    const padB = 36;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const series = data.series;
    const N = series.length;
    if (N === 0) return '';

    const baseY = padT + innerH;
    const pathsHtml = [];

    data.habitsConfig.forEach(h => {
      if (!this.visibleHabits.has(h.id)) return;

      const rollingData = data.habitRollingSeries[h.id] || [];
      const points = rollingData.map((pt, idx) => {
        const x = padL + (idx / Math.max(1, N - 1)) * innerW;
        const y = padT + (1 - (pt.rate / 100)) * innerH;
        return { x, y, pt, idx };
      });

      const splineD = this.pointsToSplinePath(points, 0.8);
      const color = h.color || '#38bdf8';

      pathsHtml.push(`
        <path d="${splineD}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round" opacity="0.92" />
      `);
    });

    return `
      <svg class="curve-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" data-chart="balance">
        <!-- Guías -->
        <line x1="${padL}" y1="${padT + 0.2 * innerH}" x2="${W - padR}" y2="${padT + 0.2 * innerH}" class="guide-line" stroke-dasharray="3 3" opacity="0.4" />
        <line x1="${padL}" y1="${baseY}" x2="${W - padR}" y2="${baseY}" class="axis-line" />
        <text x="${padL - 6}" y="${padT + 0.2 * innerH + 4}" class="axis-label-y">80%</text>
        <text x="${padL - 6}" y="${baseY + 4}" class="axis-label-y">0%</text>

        <!-- Trazos por hábito -->
        ${pathsHtml.join('')}

        <!-- Mirilla interactiva -->
        <line id="balance-crosshair" class="crosshair-line hidden" x1="0" y1="${padT}" x2="0" y2="${baseY}" />
        <circle id="balance-point" class="active-tracker-point hidden" r="5" />

        <!-- Hit Columns -->
        ${series.map((pt, idx) => {
          const x = padL + (idx / Math.max(1, N - 1)) * innerW;
          return `
            <rect class="hit-column" x="${x - (innerW / N / 2)}" y="${padT}" width="${innerW / N}" height="${innerH}" 
                  data-idx="${idx}" data-chart="balance" />
          `;
        }).join('')}
      </svg>
    `;
  }

  /**
   * Enlaza eventos de clic en temporalidad, toggles de hábitos e interacción de hover
   */
  bindEvents() {
    if (!this.container) return;

    // 1. Selector de Rango de Tiempo (14d, 30d, 90d, year)
    const tfBtns = this.container.querySelectorAll('.timeframe-pill');
    tfBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tf = btn.dataset.tf;
        if (tf && tf !== this.timeframe) {
          this.timeframe = tf;
          this.render();
        }
      });
    });

    // 2. Toggles de Hábitos para la gráfica de Balance
    const habitToggles = this.container.querySelectorAll('.habit-toggle-btn');
    habitToggles.forEach(btn => {
      btn.addEventListener('click', () => {
        const hid = btn.dataset.hid;
        if (this.visibleHabits.has(hid)) {
          // No permitir desmarcar todos
          if (this.visibleHabits.size > 1) {
            this.visibleHabits.delete(hid);
          }
        } else {
          this.visibleHabits.add(hid);
        }
        this.render();
      });
    });

    // 3. Hover en las columnas hit-column para todas las gráficas
    const tooltip = document.getElementById('curve-hover-tooltip');
    this.tooltipEl = tooltip;

    const hitCols = this.container.querySelectorAll('.hit-column');
    hitCols.forEach(col => {
      col.addEventListener('mouseenter', (e) => {
        const idx = Number(col.dataset.idx);
        const chartType = col.dataset.chart;
        this.showTooltip(idx, chartType, col, e);
      });

      col.addEventListener('mousemove', (e) => {
        this.updateTooltipPosition(e);
      });

      col.addEventListener('mouseleave', () => {
        this.hideTooltip();
      });
    });
  }

  /**
   * Muestra el tooltip flotante con los datos del día correspondiente
   */
  showTooltip(idx, chartType, hitCol, event) {
    if (!this.tooltipEl || !this.cachedData) return;
    const pt = this.cachedData.series[idx];
    if (!pt) return;

    const habits = this.cachedData.habitsConfig;
    const readableDate = formatReadableDate(pt.dateStr);

    let habitChips = habits.map(h => {
      const done = pt.dayHabitsStatus[h.id];
      const color = h.color || '#38bdf8';
      return `
        <span class="tooltip-habit-chip ${done ? 'done' : 'missed'}" style="--chip-color: ${color}">
          <span class="chip-status-icon">${done ? '✓' : '—'}</span>
          <span>${h.name}</span>
        </span>
      `;
    }).join('');

    let chartSpecificHtml = '';
    if (chartType === 'momentum') {
      chartSpecificHtml = `
        <div class="tooltip-metric-row">
          <span class="tt-metric-label">Índice Momentum:</span>
          <span class="tt-metric-val ${pt.momentumScore >= 80 ? 'green' : pt.momentumScore >= 50 ? 'blue' : 'amber'}">
            ${pt.momentumScore}/100
          </span>
        </div>
      `;
    } else if (chartType === 'kaizen') {
      chartSpecificHtml = `
        <div class="tooltip-metric-row">
          <span class="tt-metric-label">Sesiones Acumuladas:</span>
          <span class="tt-metric-val blue">${pt.totalSessionsAccum}</span>
        </div>
        <div class="tooltip-metric-row">
          <span class="tt-metric-label">Proyección Kaizen 1%:</span>
          <span class="tt-metric-val amber">${pt.totalTargetAccum}</span>
        </div>
      `;
    } else if (chartType === 'balance') {
      const balanceDetails = habits.map(h => {
        const rate = this.cachedData.habitRollingSeries[h.id][idx]?.rate || 0;
        return `
          <div class="tooltip-metric-row mini">
            <span class="tt-metric-label" style="color: ${h.color}">${h.name}:</span>
            <span class="tt-metric-val">${rate}% consistencia</span>
          </div>
        `;
      }).join('');
      chartSpecificHtml = `<div class="tooltip-balance-list">${balanceDetails}</div>`;
    }

    this.tooltipEl.innerHTML = `
      <div class="tooltip-date-header">${readableDate}</div>
      ${chartSpecificHtml}
      <div class="tooltip-habits-title">Hábitos del día:</div>
      <div class="tooltip-chips-wrap">${habitChips}</div>
    `;

    this.tooltipEl.classList.remove('hidden');
    this.updateTooltipPosition(event);

    // Mover la mirilla y el punto activo en el SVG actual
    const svg = hitCol.closest('svg');
    if (svg) {
      const crosshair = svg.querySelector('.crosshair-line');
      const activePoint = svg.querySelector('.active-tracker-point');
      const colX = Number(hitCol.getAttribute('x')) + (Number(hitCol.getAttribute('width')) / 2);

      if (crosshair) {
        crosshair.setAttribute('x1', colX);
        crosshair.setAttribute('x2', colX);
        crosshair.classList.remove('hidden');
      }

      if (activePoint) {
        let ptY = 100;
        if (chartType === 'momentum') {
          const innerH = 260 - 20 - 40;
          ptY = 20 + (1 - (pt.momentumScore / 100)) * innerH;
        } else if (chartType === 'kaizen') {
          const maxVal = Math.max(...this.cachedData.series.map(s => s.totalSessionsAccum), 10);
          const innerH = 220 - 20 - 36;
          ptY = 20 + (1 - (pt.totalSessionsAccum / maxVal)) * innerH;
        }
        activePoint.setAttribute('cx', colX);
        activePoint.setAttribute('cy', ptY);
        activePoint.classList.remove('hidden');
      }
    }
  }

  updateTooltipPosition(e) {
    if (!this.tooltipEl || this.tooltipEl.classList.contains('hidden')) return;
    const offset = 16;
    const ttW = 240;
    const ttH = 140;

    let left = e.clientX + offset;
    let top = e.clientY + offset;

    if (left + ttW > window.innerWidth) {
      left = e.clientX - ttW - offset;
    }
    if (top + ttH > window.innerHeight) {
      top = e.clientY - ttH - offset;
    }

    this.tooltipEl.style.left = `${left}px`;
    this.tooltipEl.style.top = `${top}px`;
  }

  hideTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.classList.add('hidden');
    }
    if (this.container) {
      const crosshairs = this.container.querySelectorAll('.crosshair-line, .active-tracker-point');
      crosshairs.forEach(el => el.classList.add('hidden'));
    }
  }
}
