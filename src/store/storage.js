// ==========================================================================
// KYBER STORAGE MANAGER - Persistencia LocalStorage y Respaldo JSON
// ==========================================================================

import { getCurrentUser } from './auth.js';

const LEGACY_STORAGE_KEY = 'KYBER_STUDY_TRACKER_DATA_V2';
const AUDIO_KEY = 'KYBER_AUDIO_ENABLED_V1';
const THEME_KEY = 'KYBER_THEME_MODE_V1';
const METRICS_SCOPE_KEY = 'KYBER_METRICS_SCOPE_V1';

const CATEGORIES_KEY = 'KYBER_CATEGORIES_CONFIG_V1';
const HABITS_KEY = 'KYBER_HABITS_CONFIG_V1';

/**
 * Categorías / Planes Generales por defecto
 */
export const DEFAULT_CATEGORIES = [
  {
    id: 'growth',
    name: 'Crecimiento Profesional',
    icon: 'briefcase',
    color: '#0071e3',
    description: 'Habilidades técnicas, idiomas y carrera'
  },
  {
    id: 'physical',
    name: 'Cuidado Físico',
    icon: 'heart',
    color: '#30d158',
    description: 'Entrenamiento, acondicionamiento y salud'
  }
];

/**
 * Hábitos / Subtemas por defecto
 */
export const DEFAULT_HABITS = [
  {
    id: 'english',
    categoryId: 'growth',
    name: 'Inglés',
    icon: 'speech',
    color: '#0071e3',
    targetDaysPerWeek: 7,
    tags: ['Speaking', 'Listening', 'Reading', 'Grammar'],
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'de',
    categoryId: 'growth',
    name: 'Data Engineering',
    icon: 'database',
    color: '#5856d6',
    targetDaysPerWeek: 7,
    tags: ['SQL', 'Python', 'Spark', 'Modeling'],
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'gym',
    categoryId: 'physical',
    name: 'Gym / Entrenamiento',
    icon: 'dumbbell',
    color: '#30d158',
    targetDaysPerWeek: 5,
    tags: ['Fuerza', 'Cardio', 'Pierna', 'Hipertrofia'],
    createdAt: '2026-01-01T00:00:00.000Z'
  }
];

/**
 * Obtiene la clave de almacenamiento adecuada para el usuario en sesión
 */
function getStorageKey() {
  const user = getCurrentUser();
  if (user && user.id) {
    return `KYBER_USER_DATA_${user.id}`;
  }
  return LEGACY_STORAGE_KEY;
}

function getCategoriesKey() {
  const user = getCurrentUser();
  if (user && user.id) {
    return `KYBER_USER_CATEGORIES_${user.id}`;
  }
  return CATEGORIES_KEY;
}

function getHabitsKey() {
  const user = getCurrentUser();
  if (user && user.id) {
    return `KYBER_USER_HABITS_${user.id}`;
  }
  return HABITS_KEY;
}

export function getAudioEnabled() {
  const val = localStorage.getItem(AUDIO_KEY);
  return val === null ? true : val === 'true';
}

export function setAudioEnabled(enabled) {
  localStorage.setItem(AUDIO_KEY, String(enabled));
}

export function getThemeMode() {
  const val = localStorage.getItem(THEME_KEY);
  // Default to 'dark' for comfort at night
  return val || 'dark';
}

export function setThemeMode(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function getMetricsScope() {
  const val = localStorage.getItem(METRICS_SCOPE_KEY);
  return val || 'month';
}

export function setMetricsScope(scope) {
  localStorage.setItem(METRICS_SCOPE_KEY, scope);
}

/**
 * Carga las categorías configuradas
 */
export function loadCategoriesConfig() {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_CATEGORIES;
    const raw = localStorage.getItem(getCategoriesKey());
    if (!raw) {
      saveCategoriesConfig(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const valid = parsed.filter(c => c && typeof c === 'object' && c.id).map(c => {
        if (c.id === 'physical' && (c.color === '#ff9500' || !c.color)) {
          return { ...c, color: '#30d158' };
        }
        return c;
      });
      return valid.length > 0 ? valid : DEFAULT_CATEGORIES;
    }
    return DEFAULT_CATEGORIES;
  } catch (err) {
    console.error('Error al cargar categorías:', err);
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategoriesConfig(categories) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(getCategoriesKey(), JSON.stringify(categories));
    return true;
  } catch (err) {
    console.error('Error al guardar categorías:', err);
    return false;
  }
}

/**
 * Carga los hábitos configurados
 */
export function loadHabitsConfig() {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_HABITS;
    const raw = localStorage.getItem(getHabitsKey());
    if (!raw) {
      saveHabitsConfig(DEFAULT_HABITS);
      return DEFAULT_HABITS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const valid = parsed.filter(h => h && typeof h === 'object' && h.id).map(h => {
        if (h.id === 'gym' && (h.color === '#ff9500' || !h.color)) {
          return { ...h, color: '#30d158' };
        }
        return h;
      });
      return valid.length > 0 ? valid : DEFAULT_HABITS;
    }
    return DEFAULT_HABITS;
  } catch (err) {
    console.error('Error al cargar hábitos:', err);
    return DEFAULT_HABITS;
  }
}

export function saveHabitsConfig(habits) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(getHabitsKey(), JSON.stringify(habits));
    return true;
  } catch (err) {
    console.error('Error al guardar hábitos:', err);
    return false;
  }
}

export function addCategory(categoryData) {
  const categories = loadCategoriesConfig();
  const id = categoryData.id || `cat_${Date.now()}`;
  const newCat = {
    id,
    name: categoryData.name || 'Nueva Categoría',
    icon: categoryData.icon || 'folder',
    color: categoryData.color || '#0071e3',
    description: categoryData.description || ''
  };
  categories.push(newCat);
  saveCategoriesConfig(categories);
  return newCat;
}

export function updateCategory(catId, data) {
  const categories = loadCategoriesConfig();
  const index = categories.findIndex(c => c.id === catId);
  if (index !== -1) {
    categories[index] = { ...categories[index], ...data };
    saveCategoriesConfig(categories);
    return categories[index];
  }
  return null;
}

export function deleteCategory(catId) {
  let categories = loadCategoriesConfig();
  categories = categories.filter(c => c.id !== catId);
  saveCategoriesConfig(categories);
  return categories;
}

export function addHabit(habitData) {
  const habits = loadHabitsConfig();
  const id = habitData.id || `habit_${Date.now()}`;
  const newHabit = {
    id,
    categoryId: habitData.categoryId || 'growth',
    name: habitData.name || 'Nuevo Hábito',
    icon: habitData.icon || 'target',
    color: habitData.color || '#0071e3',
    targetDaysPerWeek: Number(habitData.targetDaysPerWeek) || 7,
    tags: Array.isArray(habitData.tags) ? habitData.tags : (habitData.tags ? habitData.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
    createdAt: new Date().toISOString()
  };
  habits.push(newHabit);
  saveHabitsConfig(habits);
  return newHabit;
}

export function updateHabit(habitId, data) {
  const habits = loadHabitsConfig();
  const index = habits.findIndex(h => h.id === habitId);
  if (index !== -1) {
    habits[index] = { 
      ...habits[index], 
      ...data,
      targetDaysPerWeek: data.targetDaysPerWeek !== undefined ? Number(data.targetDaysPerWeek) : habits[index].targetDaysPerWeek,
      tags: Array.isArray(data.tags) ? data.tags : (data.tags !== undefined ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : habits[index].tags)
    };
    saveHabitsConfig(habits);
    return habits[index];
  }
  return null;
}

export function deleteHabit(habitId) {
  let habits = loadHabitsConfig();
  habits = habits.filter(h => h.id !== habitId);
  saveHabitsConfig(habits);
  return habits;
}

/**
 * Genera datos de muestra únicamente cuando el usuario lo solicita explícitamente
 */
export function generateSampleData(targetYear = new Date().getFullYear(), targetMonth = new Date().getMonth()) {
  const pad = (n) => String(n).padStart(2, '0');
  const samples = {};

  const sampleEvents = [
    { day: 2, english: true, de: false, gym: true, topics: 'Listening C1 & Business Idioms' },
    { day: 4, english: false, de: true, gym: true, topics: 'Apache Spark & DataFrames' },
    { day: 7, english: true, de: true, gym: true, topics: 'SQL Window Functions & Tech Pitch' },
    { day: 10, english: true, de: false, gym: false, topics: 'Pronunciation & Phrasal Verbs' },
    { day: 12, english: false, de: true, gym: true, topics: 'dbt & Dimensional Modeling' },
    { day: 15, english: true, de: true, gym: true, topics: 'Data Pipelines & English Reading' },
    { day: 18, english: false, de: true, gym: false, topics: 'Kafka Partitions & Brokers' },
    { day: 21, english: true, de: false, gym: true, topics: 'BBC 6 Minute English' },
    { day: 24, english: true, de: true, gym: true, topics: 'Databricks Lakehouse & System Design' },
    { day: 26, english: true, de: true, gym: false, topics: 'Dual Master Study' }
  ];

  sampleEvents.forEach(evt => {
    const dateStr = `${targetYear}-${pad(targetMonth + 1)}-${pad(evt.day)}`;
    samples[dateStr] = {
      date: dateStr,
      habits: {
        english: Boolean(evt.english),
        de: Boolean(evt.de),
        gym: Boolean(evt.gym)
      },
      englishCompleted: Boolean(evt.english),
      dataEngCompleted: Boolean(evt.de),
      englishHours: evt.english ? 1 : 0,
      dataEngHours: evt.de ? 1 : 0,
      totalHours: (evt.english ? 1 : 0) + (evt.de ? 1 : 0) + (evt.gym ? 1 : 0),
      topics: evt.topics,
      notes: 'Sesión de práctica enfocada.',
      updatedAt: new Date().toISOString()
    };
  });

  return samples;
}

/**
 * Normaliza un registro para garantizar propiedades consistentes (100% retrocompatible)
 */
export function normalizeSession(session) {
  if (!session) return null;
  const habits = session.habits && typeof session.habits === 'object' ? { ...session.habits } : {};

  // Sincronización retrocompatible bidireccional
  if (habits.english === undefined) {
    habits.english = Boolean(session.englishCompleted);
  }
  if (habits.de === undefined) {
    habits.de = Boolean(session.dataEngCompleted);
  }

  const englishCompleted = Boolean(habits.english);
  const dataEngCompleted = Boolean(habits.de);

  let calculatedHours = 0;
  Object.values(habits).forEach(val => {
    if (val) calculatedHours += 1;
  });

  return {
    ...session,
    habits,
    englishCompleted,
    dataEngCompleted,
    englishHours: englishCompleted ? 1 : 0,
    dataEngHours: dataEngCompleted ? 1 : 0,
    totalHours: calculatedHours > 0 ? calculatedHours : ((englishCompleted ? 1 : 0) + (dataEngCompleted ? 1 : 0))
  };
}

/**
 * Carga los datos almacenados en localStorage (Empieza 100% limpio y vacío)
 */
export function loadStudyData() {
  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {}; // Completamente limpio por defecto
    }
    const parsed = JSON.parse(raw);
    const normalized = {};
    for (const key in parsed) {
      normalized[key] = normalizeSession(parsed[key]);
    }
    return normalized;
  } catch (err) {
    console.error('Error al cargar datos:', err);
    return {};
  }
}

/**
 * Guarda el mapa completo de sesiones en localStorage
 */
export function saveStudyData(data) {
  try {
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (err) {
    console.error('Error al persistir datos:', err);
    return false;
  }
}

/**
 * Guarda o actualiza la sesión de un día específico (soporta saveSession(dateStr, data) o saveSession(data))
 */
export function saveSession(arg1, arg2) {
  let dateStr, sessionData;
  if (typeof arg1 === 'string') {
    dateStr = arg1;
    sessionData = arg2 || {};
  } else {
    sessionData = arg1 || {};
    dateStr = sessionData.date;
  }

  if (!dateStr) return null;

  const data = loadStudyData();
  data[dateStr] = {
    ...sessionData,
    date: dateStr,
    updatedAt: new Date().toISOString()
  };
  saveStudyData(data);
  return data;
}

/**
 * Elimina la sesión de una fecha
 */
export function deleteSession(dateStr) {
  const data = loadStudyData();
  if (data[dateStr]) {
    delete data[dateStr];
    saveStudyData(data);
  }
  return data;
}

/**
 * Limpia todos los datos almacenados
 */
export function clearAllData() {
  const key = getStorageKey();
  localStorage.removeItem(key);
  return {};
}

/**
 * Obtiene la sesión de una fecha específica
 */
export function getSession(dateStr) {
  const data = loadStudyData();
  return data[dateStr] || null;
}

/**
 * Exporta el archivo JSON para copia de seguridad
 */
export function exportDataAsJSON() {
  const data = loadStudyData();
  const habits = loadHabitsConfig();
  const categories = loadCategoriesConfig();
  const exportPayload = {
    version: '2.5',
    exportedAt: new Date().toISOString(),
    categories,
    habits,
    sessions: data
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kyber-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Importa un archivo JSON de respaldo
 */
export function importDataFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (typeof parsed === 'object' && parsed !== null) {
          if (parsed.sessions && typeof parsed.sessions === 'object') {
            saveStudyData(parsed.sessions);
            if (Array.isArray(parsed.categories)) saveCategoriesConfig(parsed.categories);
            if (Array.isArray(parsed.habits)) saveHabitsConfig(parsed.habits);
          } else {
            saveStudyData(parsed);
          }
          resolve(parsed);
        } else {
          reject(new Error('Formato de archivo JSON inválido.'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
