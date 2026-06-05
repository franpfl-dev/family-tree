/**
 * notifications.js
 * Browser Push Notification utilities.
 *
 * NOTE: Push Notifications require HTTPS in production.
 * On localhost they work over HTTP for development purposes.
 *
 * This module:
 *  - Requests notification permission
 *  - Stores preferences in localStorage
 *  - Checks today's date against all family events
 *  - Fires browser Notification API calls for matching dates
 */

const PREFS_KEY = 'familytree_notif_prefs';
const BANNER_KEY = 'familytree_notif_banner_dismissed';

/** Default notification preferences */
export const DEFAULT_PREFS = {
  enabled: false,
  birthdays: true,
  anniversaries: true,
  remembrances: true,
  reminderHour: 9, // 9 AM
};

/** Load preferences from localStorage */
export function loadNotifPrefs() {
  try {
    const saved = localStorage.getItem(PREFS_KEY);
    if (saved) return { ...DEFAULT_PREFS, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...DEFAULT_PREFS };
}

/** Save preferences to localStorage */
export function saveNotifPrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch { /* ignore */ }
}

/** Check if notification banner was dismissed */
export function isBannerDismissed() {
  return localStorage.getItem(BANNER_KEY) === '1';
}

/** Permanently dismiss the notification banner */
export function dismissBanner() {
  localStorage.setItem(BANNER_KEY, '1');
}

/** Check if browser supports notifications */
export function notificationsSupported() {
  return 'Notification' in window;
}

/** Current permission state */
export function notifPermission() {
  if (!notificationsSupported()) return 'denied';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

/** Request permission from the user */
export async function requestPermission() {
  if (!notificationsSupported()) return 'denied';
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    const prefs = loadNotifPrefs();
    saveNotifPrefs({ ...prefs, enabled: true });
  }
  return result;
}

/** Show a single notification immediately (for testing) */
export function showTestNotification() {
  if (notifPermission() !== 'granted') return;
  new Notification('🎉 Family Tree Notifications', {
    body: 'Notifications are working! You\'ll be reminded on birthdays, anniversaries, and remembrance days.',
    icon: '/favicon.svg',
  });
}

/**
 * Compare a date string "YYYY-MM-DD" to today's MM-DD.
 * Timezone-safe: compares month+day strings only.
 */
function isTodayMonthDay(dateStr) {
  if (!dateStr) return false;
  try {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayMD = `${mm}-${dd}`;
    const parts = dateStr.split('-');
    if (parts.length < 3) return false;
    return `${parts[1]}-${parts[2]}` === todayMD;
  } catch { return false; }
}

/** Calculate age / years since date */
function yearsSince(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    return now.getFullYear() - d.getFullYear();
  } catch { return null; }
}

const NOTIFIED_KEY = 'familytree_notified_dates'; // tracks what was already notified today

/** Return today's date string "YYYY-MM-DD" */
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/** Load already-notified set for today. Clears if it's a new day. */
function loadNotifiedSet() {
  try {
    const raw = localStorage.getItem(NOTIFIED_KEY);
    if (!raw) return new Set();
    const { date, ids } = JSON.parse(raw);
    if (date !== todayStr()) return new Set(); // new day — reset
    return new Set(ids);
  } catch { return new Set(); }
}

/** Save notified set */
function saveNotifiedSet(set) {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify({ date: todayStr(), ids: [...set] }));
  } catch { /* ignore */ }
}

/**
 * Build the list of notification payloads for today's events.
 * Does NOT fire them yet — just returns the list.
 */
function buildTodayNotifications(persons, trees, prefs) {
  const notifications = [];
  const seenCouples = new Set();

  for (const person of persons) {
    if (person.isPlaceholder) continue;
    const tree = trees.find((t) => t.id === person.treeId);
    const treeName = tree?.name || 'Family';

    if (prefs.birthdays && person.dob && isTodayMonthDay(person.dob)) {
      const age = yearsSince(person.dob);
      notifications.push({
        id: `bday-${person.id}`,
        type: 'birthday',
        title: `🎂 Happy Birthday ${person.name}!`,
        body: `${person.name} from ${treeName} turns ${age} today!`,
        icon: person.profilePhoto || '/favicon.svg',
        tag: `bday-${person.id}`,
        dateStr: person.dob,
      });
    }

    if (prefs.anniversaries && person.anniversaryDate && person.spouseId && isTodayMonthDay(person.anniversaryDate)) {
      const coupleKey = [person.id, person.spouseId].sort().join('-');
      if (!seenCouples.has(coupleKey)) {
        seenCouples.add(coupleKey);
        const spouse = persons.find((q) => q.id === person.spouseId);
        const years = yearsSince(person.anniversaryDate);
        const names = spouse ? `${person.name} & ${spouse.name}` : person.name;
        notifications.push({
          id: `anniv-${coupleKey}`,
          type: 'anniversary',
          title: `💍 Happy Anniversary!`,
          body: `${names} are celebrating ${years} years together today!`,
          icon: '/favicon.svg',
          tag: `anniv-${coupleKey}`,
          dateStr: person.anniversaryDate,
        });
      }
    }

    if (prefs.remembrances && person.dod && isTodayMonthDay(person.dod)) {
      const years = yearsSince(person.dod);
      notifications.push({
        id: `dod-${person.id}`,
        type: 'remembrance',
        title: `🕯️ Remembering ${person.name}`,
        body: `Today we remember ${person.name}. ${years} year${years !== 1 ? 's' : ''} since their passing.`,
        icon: '/favicon.svg',
        tag: `dod-${person.id}`,
        dateStr: person.dod,
      });
    }
  }
  return notifications;
}

/**
 * Fire a browser notification immediately and mark it as sent for today.
 */
function fireNotification(notif, notifiedSet) {
  if (notifiedSet.has(notif.id)) return; // already sent today
  notifiedSet.add(notif.id);
  saveNotifiedSet(notifiedSet);
  new Notification(notif.title, {
    body: notif.body,
    icon: notif.icon,
    tag: notif.tag,
  });
}

/**
 * Check all persons for today's events and schedule notifications.
 *
 * HOW IT WORKS:
 *  - If current time is BEFORE reminderHour → sets a setTimeout to fire at reminderHour
 *  - If current time is AFTER reminderHour → fires immediately (you opened the app late)
 *  - Each notification is only sent ONCE per day (tracked in localStorage)
 *
 * Call this on every app load.
 */
export function checkAndNotifyToday(persons, trees, prefs = null) {
  const p = prefs || loadNotifPrefs();
  if (!p.enabled || notifPermission() !== 'granted') return;

  const notifications = buildTodayNotifications(persons, trees, p);
  if (notifications.length === 0) return;

  const notifiedSet = loadNotifiedSet();
  const pendingNotifs = notifications.filter((n) => !notifiedSet.has(n.id));
  if (pendingNotifs.length === 0) return;

  // Calculate milliseconds until reminderHour today
  const now = new Date();
  const fireAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), p.reminderHour, 0, 0, 0);
  const msUntilFireTime = fireAt.getTime() - now.getTime();

  if (msUntilFireTime > 0) {
    // Schedule for later today
    setTimeout(() => {
      const freshNotifiedSet = loadNotifiedSet(); // re-read in case another tab fired them
      pendingNotifs.forEach((n) => fireNotification(n, freshNotifiedSet));
    }, msUntilFireTime);
  } else {
    // Past reminder time — fire now (user opened app late in the day)
    pendingNotifs.forEach((n) => fireNotification(n, notifiedSet));
  }
}

/**
 * Send today's event list to the Service Worker so it can also fire
 * notifications if the app is backgrounded (tab open but not in focus).
 */
export async function sendEventsToServiceWorker(persons, trees, prefs = null) {
  if (!('serviceWorker' in navigator)) return;
  const p = prefs || loadNotifPrefs();
  if (!p.enabled) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const notifications = buildTodayNotifications(persons, trees, p);
    reg.active?.postMessage({
      type: 'CHECK_TODAY_EVENTS',
      events: notifications,
      prefs: p,
    });
  } catch { /* SW not ready */ }
}

/**
 * Upcoming events — returns next N days of events across all persons.
 * Returns array of { type, personId, name, treeName, treeId, dateStr, daysAway, photo }
 * sorted by daysAway ascending.
 */
export function getUpcomingEvents(persons, trees, daysAhead = 30) {
  const events = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const seenCouples = new Set();

  for (const person of persons) {
    if (person.isPlaceholder) continue;
    const tree = trees.find((t) => t.id === person.treeId);
    const treeName = tree?.name || '';
    const treeId = tree?.id || '';

    function daysUntil(dateStr) {
      if (!dateStr) return null;
      try {
        const parts = dateStr.split('-');
        if (parts.length < 3) return null;
        const thisYear = today.getFullYear();
        let target = new Date(thisYear, parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        target.setHours(0, 0, 0, 0);
        let diff = Math.round((target - today) / 86400000);
        if (diff < 0) {
          // Check next year
          target = new Date(thisYear + 1, parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          diff = Math.round((target - today) / 86400000);
        }
        return diff <= daysAhead ? diff : null;
      } catch { return null; }
    }

    // Birthday
    if (person.dob) {
      const d = daysUntil(person.dob);
      if (d !== null) {
        events.push({ type: 'birthday', personId: person.id, name: person.name, treeName, treeId, dateStr: person.dob, daysAway: d, photo: person.profilePhoto });
      }
    }

    // Anniversary
    if (person.anniversaryDate && person.spouseId) {
      const coupleKey = [person.id, person.spouseId].sort().join('-');
      if (!seenCouples.has(coupleKey)) {
        seenCouples.add(coupleKey);
        const d = daysUntil(person.anniversaryDate);
        if (d !== null) {
          const spouse = persons.find((q) => q.id === person.spouseId);
          const coupleNames = spouse ? `${person.name} & ${spouse.name}` : person.name;
          events.push({ type: 'anniversary', personId: person.id, name: coupleNames, treeName, treeId, dateStr: person.anniversaryDate, daysAway: d, photo: null });
        }
      }
    }

    // Remembrance
    if (person.dod) {
      const d = daysUntil(person.dod);
      if (d !== null) {
        events.push({ type: 'remembrance', personId: person.id, name: person.name, treeName, treeId, dateStr: person.dod, daysAway: d, photo: person.profilePhoto });
      }
    }
  }

  return events.sort((a, b) => a.daysAway - b.daysAway);
}
