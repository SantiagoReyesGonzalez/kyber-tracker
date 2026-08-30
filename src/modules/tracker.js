// ==========================================================================
// KYBER TRACKER ENGINE - Lógica de Negocio, Fechas, Rachas y Métricas
// ==========================================================================

import { loadStudyData } from '../store/storage.js';

export const MONTH_NAMES_ES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
];

export const DAY_NAMES_ES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
export const DAY_NAMES_FULL_ES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/**
 * Convierte un objeto Date a formato ISO YYYY-MM-DD
 */
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parsea un string YYYY-MM-DD en Date local
 */
export function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Obtiene la fecha de hoy en string YYYY-MM-DD
 */
export function getTodayStr() {
  return formatDate(new Date());
}

/**
 * Formato legible en español para fechas (Ej. "Viernes, 28 de Agosto")
 */
export function formatReadableDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = DAY_NAMES_FULL_ES[(date.getDay() + 6) % 7];
  const monthName = MONTH_NAMES_ES[m - 1];
  return `${dayName}, ${d} de ${monthName.charAt(0) + monthName.slice(1).toLowerCase()}`;
}

/**
 * Genera la cuadrícula de días para el mes y año dados
 */
export function getMonthCalendarGrid(year, month) {
  const todayStr = getTodayStr();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1);
  
  // Convertir Sunday=0 a Monday=0
  const startDayOfWeek = (firstDay.getDay() + 6) % 7; 
  
  const studyData = loadStudyData();
  const days = [];

  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const current = new Date(year, month, dayNum);
    const dateStr = formatDate(current);
    const dayOfWeek = (current.getDay() + 6) % 7;
    const isToday = dateStr === todayStr;
    const isFuture = dateStr > todayStr;
    const isPast = dateStr < todayStr;
    const session = studyData[dateStr] || null;

    const dayIndex = startDayOfWeek + (dayNum - 1);
    const col = dayIndex % 7; // 0..6 (Lun..Dom)
    const row = Math.floor(dayIndex / 7);

    days.push({
      dayNumber: dayNum,
      dateStr,
      dayOfWeek,
      col,
      row,
      isToday,
      isFuture,
      isPast,
      session
    });
  }

  return {
    year,
    month,
    monthName: MONTH_NAMES_ES[month],
    daysInMonth,
    startDayOfWeek,
    totalRows: Math.ceil((startDayOfWeek + daysInMonth) / 7),
    days
  };
}

/**
 * Genera los datos para el Heatmap Anual de 52 semanas (estilo GitHub / Linear)
 */
export function getYearHeatmapData(targetYear = new Date().getFullYear()) {
  const studyData = loadStudyData();
  const todayStr = getTodayStr();

  // Iniciar desde el primer lunes cercano al inicio del año o las últimas 52 semanas
  const endDate = new Date(targetYear, 11, 31);
  const startDate = new Date(targetYear, 0, 1);
  
  // Ajustar para que comience en Lunes
  const startDayOfWeek = (startDate.getDay() + 6) % 7;
  startDate.setDate(startDate.getDate() - startDayOfWeek);

  const weeks = [];
  let currentWeek = [];
  const curr = new Date(startDate);

  while (curr <= endDate || currentWeek.length > 0) {
    const dateStr = formatDate(curr);
    const dayOfWeek = (curr.getDay() + 6) % 7;
    const session = studyData[dateStr] || null;
    const isToday = dateStr === todayStr;
    const isFuture = dateStr > todayStr;
    const isPast = dateStr < todayStr;
    const inTargetYear = curr.getFullYear() === targetYear;

    let status = 'empty';
    let hours = 0;
    if (session) {
      const isEng = Boolean(session.englishCompleted);
      const isDE = Boolean(session.dataEngCompleted);
      if (isEng && isDE) {
        status = 'both';
        hours = 2;
      } else if (isDE) {
        status = 'de';
        hours = 1;
      } else if (isEng) {
        status = 'english';
        hours = 1;
      }
    } else if (isPast) {
      status = 'missed';
    }

    currentWeek.push({
      dateStr,
      dayNumber: curr.getDate(),
      month: curr.getMonth(),
      year: curr.getFullYear(),
      dayOfWeek,
      inTargetYear,
      isToday,
      isFuture,
      session,
      status,
      hours
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
      if (curr > endDate) break;
    }

    curr.setDate(curr.getDate() + 1);
  }

  return {
    year: targetYear,
    weeks
  };
}

/**
 * Calcula las rachas actuales consecutivas
 */
function calculateStreak(data, filterFn) {
  const today = new Date();
  const todayStr = formatDate(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  let currentCheck = today;
  let streak = 0;

  const hasToday = data[todayStr] && filterFn(data[todayStr]);
  const hasYesterday = data[yesterdayStr] && filterFn(data[yesterdayStr]);

  if (!hasToday && !hasYesterday) {
    return 0;
  }

  if (hasToday) {
    currentCheck = today;
  } else {
    currentCheck = yesterday;
  }

  while (true) {
    const checkStr = formatDate(currentCheck);
    const entry = data[checkStr];

    if (entry && filterFn(entry)) {
      streak++;
      currentCheck.setDate(currentCheck.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calcula el desglose semanal (cuántos días/horas se estudió en cada día de la semana)
 */
export function getWeeklyBreakdown() {
  const data = loadStudyData();
  const daysCount = [0, 0, 0, 0, 0, 0, 0]; // Lun, Mar, Mié, Jue, Vie, Sáb, Dom

  Object.values(data).forEach(s => {
    if (s.englishCompleted || s.dataEngCompleted) {
      const [y, m, d] = s.date.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const dayIndex = (date.getDay() + 6) % 7;
      daysCount[dayIndex]++;
    }
  });

  return daysCount;
}

/**
 * Obtiene el rango de fechas de la semana actual [lunes, domingo]
 */
export function getCurrentWeekRange() {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // 0=Lun, 6=Dom
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  
  return {
    startStr: formatDate(monday),
    endStr: formatDate(sunday),
    totalDays: 7
  };
}

/**
 * Calcula todas las métricas y estadísticas del sistema según el alcance:
 * - 'week': Semana actual (Lunes a Domingo)
 * - 'month': Mes seleccionado (1 al fin de mes)
 * - 'all': General / Histórico completo
 */
export function calculateMetrics(selectedYear, selectedMonth, scope = 'month') {
  const data = loadStudyData();
  const allSessions = Object.values(data);

  const isEnglish = (s) => Boolean(s.englishCompleted);
  const isDataEng = (s) => Boolean(s.dataEngCompleted);
  const isDual = (s) => Boolean(s.englishCompleted && s.dataEngCompleted);
  const isAny = (s) => Boolean(s.englishCompleted || s.dataEngCompleted);

  // Rachas actuales (calculadas siempre de manera continua)
  const englishStreak = calculateStreak(data, isEnglish);
  const deStreak = calculateStreak(data, isDataEng);
  const combinedStreak = calculateStreak(data, isAny);

  let filteredSessions = allSessions;
  let periodDays = 1;
  let periodLabel = 'MES';

  if (scope === 'week') {
    const weekRange = getCurrentWeekRange();
    filteredSessions = allSessions.filter(s => s.date >= weekRange.startStr && s.date <= weekRange.endStr);
    periodDays = 7;
    periodLabel = 'SEMANA';
  } else if (scope === 'all') {
    filteredSessions = allSessions;
    const dates = allSessions.map(s => s.date).sort();
    if (dates.length > 0) {
      const first = new Date(dates[0]);
      const now = new Date();
      const diffTime = Math.abs(now - first);
      periodDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    } else {
      periodDays = 1;
    }
    periodLabel = 'TOTAL';
  } else {
    // 'month' (por defecto)
    const pad = (n) => String(n).padStart(2, '0');
    const monthPrefix = `${selectedYear}-${pad(selectedMonth + 1)}`;
    filteredSessions = allSessions.filter(s => s.date.startsWith(monthPrefix));
    periodDays = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    periodLabel = 'MES';
  }

  const englishSessions = filteredSessions.filter(isEnglish);
  const deSessions = filteredSessions.filter(isDataEng);
  const dualSessions = filteredSessions.filter(isDual);
  const activeSessions = filteredSessions.filter(isAny);

  const activeDaysSet = new Set(activeSessions.map(s => s.date)).size;
  const coveragePercent = Math.min(100, Math.round((activeDaysSet / periodDays) * 100));

  return {
    scope,
    periodLabel,
    periodDays,
    english: {
      days: englishSessions.length,
      hours: englishSessions.length, // 1h fija por sesión
      streak: englishStreak
    },
    dataEngineering: {
      days: deSessions.length,
      hours: deSessions.length, // 1h fija por sesión
      streak: deStreak
    },
    global: {
      totalActiveDays: activeDaysSet,
      totalHours: englishSessions.length + deSessions.length,
      dualDays: dualSessions.length,
      combinedStreak,
      coveragePercent
    }
  };
}
