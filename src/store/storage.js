// ==========================================================================
// KYBER STORAGE MANAGER - Persistencia LocalStorage y Respaldo JSON
// ==========================================================================

const STORAGE_KEY = 'KYBER_STUDY_TRACKER_DATA_V2';
const AUDIO_KEY = 'KYBER_AUDIO_ENABLED_V1';
const THEME_KEY = 'KYBER_THEME_MODE_V1';
const METRICS_SCOPE_KEY = 'KYBER_METRICS_SCOPE_V1';

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
 * Genera datos de muestra únicamente cuando el usuario lo solicita explícitamente
 */
export function generateSampleData(targetYear = new Date().getFullYear(), targetMonth = new Date().getMonth()) {
  const pad = (n) => String(n).padStart(2, '0');
  const samples = {};

  const sampleEvents = [
    { day: 2, english: true, de: false, topics: 'Listening C1 & Business Idioms' },
    { day: 4, english: false, de: true, topics: 'Apache Spark & DataFrames' },
    { day: 7, english: true, de: true, topics: 'SQL Window Functions & Tech Pitch' },
    { day: 10, english: true, de: false, topics: 'Pronunciation & Phrasal Verbs' },
    { day: 12, english: false, de: true, topics: 'dbt & Dimensional Modeling' },
    { day: 15, english: true, de: true, topics: 'Data Pipelines & English Reading' },
    { day: 18, english: false, de: true, topics: 'Kafka Partitions & Brokers' },
    { day: 21, english: true, de: false, topics: 'BBC 6 Minute English' },
    { day: 24, english: true, de: true, topics: 'Databricks Lakehouse & System Design' },
    { day: 26, english: true, de: true, topics: 'Dual Master Study' }
  ];

  sampleEvents.forEach(evt => {
    const dateStr = `${targetYear}-${pad(targetMonth + 1)}-${pad(evt.day)}`;
    samples[dateStr] = {
      date: dateStr,
      englishCompleted: Boolean(evt.english),
      dataEngCompleted: Boolean(evt.de),
      englishHours: evt.english ? 1 : 0,
      dataEngHours: evt.de ? 1 : 0,
      topics: evt.topics,
      notes: 'Sesión de práctica enfocada.',
      updatedAt: new Date().toISOString()
    };
  });

  return samples;
}

/**
 * Normaliza un registro para garantizar propiedades consistentes
 */
export function normalizeSession(session) {
  if (!session) return null;
  const englishCompleted = Boolean(session.englishCompleted);
  const dataEngCompleted = Boolean(session.dataEngCompleted);

  return {
    ...session,
    englishCompleted,
    dataEngCompleted,
    englishHours: englishCompleted ? 1 : 0,
    dataEngHours: dataEngCompleted ? 1 : 0
  };
}

/**
 * Carga los datos almacenados en localStorage (Empieza 100% limpio y vacío)
 */
export function loadStudyData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
  localStorage.removeItem(STORAGE_KEY);
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
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kyber-study-tracker-${new Date().toISOString().slice(0, 10)}.json`;
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
          saveStudyData(parsed);
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
