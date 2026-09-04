// ==========================================================================
// KYBER TRACKER ENGINE - Lógica de Negocio, Fechas, Rachas y Métricas
// ==========================================================================

import { loadStudyData, loadCategoriesConfig, loadHabitsConfig } from '../store/storage.js';

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
    const habitsCompleted = [];

    if (session) {
      const isEng = isHabitCompleted(session, 'english');
      const isDE = isHabitCompleted(session, 'de');
      const isGym = isHabitCompleted(session, 'gym');

      if (isEng) habitsCompleted.push('english');
      if (isDE) habitsCompleted.push('de');
      if (isGym) habitsCompleted.push('gym');

      if (session.habits && typeof session.habits === 'object') {
        Object.entries(session.habits).forEach(([hId, val]) => {
          if (val && !habitsCompleted.includes(hId)) {
            habitsCompleted.push(hId);
          }
        });
      }

      if (isEng && isDE) {
        status = 'both';
        hours += 2;
        if (isGym) hours += 1;
      } else if (isDE) {
        status = 'de';
        hours += 1;
        if (isGym) hours += 1;
      } else if (isEng) {
        status = 'english';
        hours += 1;
        if (isGym) hours += 1;
      } else if (isGym) {
        status = 'gym';
        hours += 1;
      } else if (habitsCompleted.length > 0) {
        status = habitsCompleted[0];
        hours += 1;
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
      habitsCompleted,
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
 * Comprueba si un hábito específico fue completado en una sesión (100% retrocompatible)
 */
export function isHabitCompleted(session, habitId) {
  if (!session) return false;
  if (session.habits && typeof session.habits === 'object' && session.habits[habitId] !== undefined) {
    return Boolean(session.habits[habitId]);
  }
  if (habitId === 'english') return Boolean(session.englishCompleted);
  if (habitId === 'de') return Boolean(session.dataEngCompleted);
  return false;
}

/**
 * Obtiene los 7 días (Lunes a Domingo) de la semana que contiene a targetDate
 */
export function getWeekDaysForDate(targetDate = new Date()) {
  const dateObj = typeof targetDate === 'string' ? parseDate(targetDate) : new Date(targetDate);
  const todayStr = getTodayStr();
  const dayOfWeek = (dateObj.getDay() + 6) % 7; // 0=Lun, 6=Dom

  const monday = new Date(dateObj);
  monday.setDate(dateObj.getDate() - dayOfWeek);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const curr = new Date(monday);
    curr.setDate(monday.getDate() + i);
    const dateStr = formatDate(curr);
    days.push({
      dateStr,
      dateObj: curr,
      dayIndex: i, // 0..6
      dayNumber: curr.getDate(),
      dayNameShort: DAY_NAMES_ES[i],
      dayNameFull: DAY_NAMES_FULL_ES[i],
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
      isPast: dateStr < todayStr
    });
  }

  return {
    mondayStr: days[0].dateStr,
    sundayStr: days[6].dateStr,
    days
  };
}

/**
 * Calcula el progreso semanal detallado de un hábito para la semana actual
 * Soporta metas con días de descanso (ej. Gym con 5 días/semana)
 */
export function getWeeklyHabitProgress(habitId, targetDate = new Date(), studyData = null, habitConfig = null) {
  const data = studyData || loadStudyData();
  const weekInfo = getWeekDaysForDate(targetDate);
  const habits = habitConfig ? [habitConfig] : loadHabitsConfig();
  const conf = habitConfig || habits.find(h => h.id === habitId) || {
    id: habitId,
    name: habitId === 'gym' ? 'Gym / Entrenamiento' : habitId,
    targetDaysPerWeek: habitId === 'gym' ? 5 : 7,
    color: habitId === 'gym' ? '#30d158' : '#0071e3'
  };

  const targetDays = Number(conf.targetDaysPerWeek) || 7;
  let completedCount = 0;
  const daysBreakdown = [];

  weekInfo.days.forEach(d => {
    const session = data[d.dateStr] || null;
    const completed = isHabitCompleted(session, habitId);
    if (completed) completedCount++;

    daysBreakdown.push({
      ...d,
      completed,
      session
    });
  });

  // Identificar días de descanso permitidos
  const totalDaysInWeek = 7;
  const maxRestDaysAllowed = Math.max(0, totalDaysInWeek - targetDays);
  let restDaysIdentified = 0;

  daysBreakdown.forEach(d => {
    if (!d.completed && !d.isFuture) {
      if (restDaysIdentified < maxRestDaysAllowed) {
        d.isRest = true;
        restDaysIdentified++;
      } else {
        d.isRest = false;
      }
    } else {
      d.isRest = false;
    }
  });

  const percent = Math.min(100, Math.round((completedCount / targetDays) * 100));
  const isGoalMet = completedCount >= targetDays;
  const remainingDaysToGoal = Math.max(0, targetDays - completedCount);

  return {
    habitId,
    habitName: conf.name,
    habitColor: conf.color,
    targetDays,
    completedCount,
    percent,
    isGoalMet,
    remainingDaysToGoal,
    weekInfo,
    days: daysBreakdown
  };
}

/**
 * Calcula la racha consecutiva diaria de un hábito
 */
export function calculateStreak(data, filterFn) {
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
 * Calcula la racha de semanas consecutivas para metas flexibles (ej. Gym 5 días/semana)
 */
export function calculateWeeklyStreak(data, habitId, targetDaysPerWeek) {
  const now = new Date();
  let streakWeeks = 0;
  let currentMonday = new Date(now);
  const dayOfWeek = (now.getDay() + 6) % 7;
  currentMonday.setDate(now.getDate() - dayOfWeek);

  // Verificar la semana actual en curso
  const currentWeekInfo = getWeeklyHabitProgress(habitId, now, data, { targetDaysPerWeek });
  if (currentWeekInfo.isGoalMet) {
    streakWeeks++;
  }

  // Iterar semanas hacia atrás
  while (true) {
    currentMonday.setDate(currentMonday.getDate() - 7);
    const prevWeekInfo = getWeeklyHabitProgress(habitId, currentMonday, data, { targetDaysPerWeek });
    if (prevWeekInfo.isGoalMet) {
      streakWeeks++;
    } else {
      break;
    }
    if (streakWeeks > 104) break;
  }

  return streakWeeks;
}

/**
 * Calcula la racha activa de un hábito respetando los días de descanso permitidos:
 * - Si es diario (7 d/sem): racha de días consecutivos continuos.
 * - Si tiene meta semanal (ej. Gym 5 d/sem): cada sesión suma a la racha acumulada,
 *   y se toleran hasta (7 - targetDays) días de descanso seguidos sin perder la racha.
 */
export function calculateFlexibleStreak(data, habitId, targetDaysPerWeek = 7) {
  const targetDays = Number(targetDaysPerWeek) || 7;
  const maxRestGap = Math.max(0, 7 - targetDays);

  const today = new Date();
  let currentCheck = new Date(today);

  let foundRecent = false;
  let initialGap = 0;

  while (initialGap <= maxRestGap + 1) {
    const dStr = formatDate(currentCheck);
    if (data[dStr] && isHabitCompleted(data[dStr], habitId)) {
      foundRecent = true;
      break;
    }
    currentCheck.setDate(currentCheck.getDate() - 1);
    initialGap++;
  }

  if (!foundRecent) {
    return 0;
  }

  let streak = 0;
  let consecutiveRest = 0;

  while (true) {
    const checkStr = formatDate(currentCheck);
    const entry = data[checkStr];

    if (entry && isHabitCompleted(entry, habitId)) {
      streak++;
      consecutiveRest = 0;
    } else {
      consecutiveRest++;
      if (consecutiveRest > maxRestGap) {
        break;
      }
    }
    currentCheck.setDate(currentCheck.getDate() - 1);
  }

  return streak;
}

/**
 * Calcula el desglose semanal (cuántos días se completó alguna sesión de estudio o entreno)
 */
export function getWeeklyBreakdown() {
  const data = loadStudyData();
  const daysCount = [0, 0, 0, 0, 0, 0, 0]; // Lun, Mar, Mié, Jue, Vie, Sáb, Dom
  const habitsConfig = loadHabitsConfig();

  Object.values(data).forEach(s => {
    const anyDone = habitsConfig.some(h => isHabitCompleted(s, h.id));
    if (anyDone) {
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
  const categoriesConfig = loadCategoriesConfig();
  const habitsConfig = loadHabitsConfig();
  const allSessions = Object.values(data);

  const isEnglish = (s) => isHabitCompleted(s, 'english');
  const isDataEng = (s) => isHabitCompleted(s, 'de');
  const isGym = (s) => isHabitCompleted(s, 'gym');
  const isDual = (s) => isEnglish(s) && isDataEng(s);
  const isAny = (s) => habitsConfig.some(h => isHabitCompleted(s, h.id));

  // Rachas diarias
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
  const gymSessions = filteredSessions.filter(isGym);
  const activeSessions = filteredSessions.filter(isAny);

  const activeDaysSet = new Set(activeSessions.map(s => s.date)).size;
  const coveragePercent = Math.min(100, Math.round((activeDaysSet / periodDays) * 100));

  // Métricas individuales para cada hábito configurado
  const habitsMetrics = {};
  habitsConfig.forEach(habit => {
    const habitSessions = filteredSessions.filter(s => isHabitCompleted(s, habit.id));
    const targetDays = Number(habit.targetDaysPerWeek) || 7;
    const isDaily = targetDays === 7;
    const streak = calculateFlexibleStreak(data, habit.id, targetDays);

    const weeklyProgress = getWeeklyHabitProgress(habit.id, new Date(), data, habit);

    habitsMetrics[habit.id] = {
      id: habit.id,
      name: habit.name,
      categoryId: habit.categoryId,
      color: habit.color,
      icon: habit.icon,
      targetDaysPerWeek: Number(habit.targetDaysPerWeek) || 7,
      days: habitSessions.length,
      hours: habitSessions.length,
      streak,
      isWeeklyStreak: !isDaily,
      weeklyProgress
    };
  });

  // Métricas agrupadas por Categoría / Plan General
  const categoriesMetrics = {};
  categoriesConfig.forEach(cat => {
    const catHabits = habitsConfig.filter(h => h.categoryId === cat.id);
    const catHabitIds = catHabits.map(h => h.id);
    const catSessions = filteredSessions.filter(s => catHabitIds.some(id => isHabitCompleted(s, id)));
    const catActiveDays = new Set(catSessions.map(s => s.date)).size;

    let catHours = 0;
    catHabits.forEach(h => {
      catHours += (habitsMetrics[h.id]?.hours || 0);
    });

    categoriesMetrics[cat.id] = {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      description: cat.description,
      habits: catHabits.map(h => habitsMetrics[h.id]).filter(Boolean),
      totalDays: catActiveDays,
      totalHours: catHours
    };
  });

  let totalHoursSum = 0;
  Object.values(habitsMetrics).forEach(hm => {
    totalHoursSum += hm.hours;
  });

  return {
    scope,
    periodLabel,
    periodDays,
    english: habitsMetrics['english'] || {
      days: englishSessions.length,
      hours: englishSessions.length,
      streak: englishStreak
    },
    dataEngineering: habitsMetrics['de'] || {
      days: deSessions.length,
      hours: deSessions.length,
      streak: deStreak
    },
    gym: habitsMetrics['gym'] || {
      days: gymSessions.length,
      hours: gymSessions.length,
      streak: habitsMetrics['gym']?.streak || 0
    },
    habitsMetrics,
    categoriesMetrics,
    global: {
      totalActiveDays: activeDaysSet,
      totalHours: totalHoursSum > 0 ? totalHoursSum : (englishSessions.length + deSessions.length),
      dualDays: dualSessions.length,
      combinedStreak,
      coveragePercent
    }
  };
}

/**
 * Genera el SVG correspondiente al identificador de ícono
 */
export function getIconSvg(iconName, size = 18) {
  switch (iconName) {
    case 'dumbbell':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5v14M18 5v14M4 8v8M20 8v8M6 12h12"/></svg>`;
    case 'speech':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
    case 'database':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`;
    case 'code':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
    case 'book':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
    case 'heart':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
    case 'flame':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/></svg>`;
    case 'zap':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
    case 'briefcase':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
    case 'rocket':
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>`;
    case 'target':
    default:
      return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
  }
}
