// ==========================================================================
// KYBER AUTH MANAGER - Autenticación y Criptografía Web Crypto API
// Aislamiento Multi-usuario, Sesiones y Migración Automática de Datos
// ==========================================================================

const USERS_STORAGE_KEY = 'KYBER_USERS_V1';
const SESSION_STORAGE_KEY = 'KYBER_AUTH_SESSION_V1';
const LEGACY_STORAGE_KEY = 'KYBER_STUDY_TRACKER_DATA_V2';

// Lista de suscriptores al cambio de estado de autenticación
const authListeners = [];

/**
 * Convierte un ArrayBuffer en string hexadecimal
 */
function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Genera un salt criptográficamente seguro
 */
function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return bufferToHex(array);
}

/**
 * Genera el hash seguro de la contraseña usando SHA-256 con salt
 */
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Carga todos los usuarios registrados
 */
function getAllUsers() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Error al leer usuarios:', err);
    return [];
  }
}

/**
 * Guarda el listado de usuarios
 */
function saveAllUsers(users) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
  } catch (err) {
    console.error('Error al guardar usuarios:', err);
    return false;
  }
}

/**
 * Obtiene la sesión actual desde localStorage (Recordarme) o sessionStorage
 */
export function getCurrentUser() {
  try {
    // Primero verificar localStorage (Recordarme)
    const localSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (localSession) {
      return JSON.parse(localSession);
    }
    // Luego verificar sessionStorage (sesión temporal)
    const sessionSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionSession) {
      return JSON.parse(sessionSession);
    }
    return null;
  } catch (err) {
    console.error('Error al leer sesión actual:', err);
    return null;
  }
}

/**
 * Guarda la sesión del usuario autenticado
 */
function setSession(user, rememberMe = false) {
  const sessionData = {
    id: user.id,
    name: user.name,
    email: user.email,
    initials: getInitials(user.name),
    loggedInAt: new Date().toISOString()
  };

  const str = JSON.stringify(sessionData);
  if (rememberMe) {
    localStorage.setItem(SESSION_STORAGE_KEY, str);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } else {
    sessionStorage.setItem(SESSION_STORAGE_KEY, str);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  notifyAuthSubscribers(sessionData);
  return sessionData;
}

/**
 * Notifica a los observadores de cambio de sesión
 */
function notifyAuthSubscribers(user) {
  authListeners.forEach(callback => {
    try {
      callback(user);
    } catch (e) {
      console.error('Error en callback de autenticación:', e);
    }
  });
}

/**
 * Suscribirse a cambios en el estado de autenticación
 */
export function onAuthStateChanged(callback) {
  authListeners.push(callback);
  // Ejecutar inmediatamente con el estado actual
  callback(getCurrentUser());
  return () => {
    const idx = authListeners.indexOf(callback);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
}

/**
 * Obtiene las iniciales de un nombre (ej. "Santiago Reyes" -> "SR")
 */
export function getInitials(name) {
  if (!name) return 'KT';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Migra automáticamente los datos locales heredados a la cuenta del nuevo usuario
 */
function checkAndMigrateLegacyData(userId) {
  try {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const userKey = `KYBER_USER_DATA_${userId}`;
      // Solo migrar si el usuario no tiene datos previos
      if (!localStorage.getItem(userKey)) {
        localStorage.setItem(userKey, legacyRaw);
        console.log(`[Kyber Auth] Datos previos migrados con éxito a la cuenta del usuario: ${userId}`);
      }
      // Limpiar la clave legada para evitar re-migraciones duplicadas en otras cuentas
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Error durante la migración de datos:', err);
  }
}

/**
 * Registra un nuevo usuario
 */
export async function registerUser(name, email, password) {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanName || cleanName.length < 2) {
    return { success: false, error: 'Por favor ingresa un nombre válido (al menos 2 caracteres).' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { success: false, error: 'Por favor ingresa un correo electrónico válido.' };
  }

  if (!password || password.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const users = getAllUsers();
  const existing = users.find(u => u.email === cleanEmail);
  if (existing) {
    return { success: false, error: 'Ya existe una cuenta con este correo electrónico.' };
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const isFirstUser = users.length === 0;

  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    name: cleanName,
    email: cleanEmail,
    salt,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveAllUsers(users);

  // Si es la primera cuenta o existen datos legados pendientes, migrarlos automáticamente
  if (isFirstUser || localStorage.getItem(LEGACY_STORAGE_KEY)) {
    checkAndMigrateLegacyData(newUser.id);
  }

  // Iniciar sesión automáticamente
  const session = setSession(newUser, true);
  return { success: true, user: session };
}

/**
 * Inicia sesión con email y contraseña
 */
export async function loginUser(email, password, rememberMe = false) {
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail || !password) {
    return { success: false, error: 'Por favor completa todos los campos.' };
  }

  const users = getAllUsers();
  const user = users.find(u => u.email === cleanEmail);

  if (!user) {
    return { success: false, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' };
  }

  const testHash = await hashPassword(password, user.salt);
  if (testHash !== user.passwordHash) {
    return { success: false, error: 'Contraseña incorrecta.' };
  }

  const session = setSession(user, rememberMe);
  return { success: true, user: session };
}

/**
 * Cierra la sesión activa
 */
export function logoutUser() {
  localStorage.removeItem(SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  notifyAuthSubscribers(null);
  return true;
}
