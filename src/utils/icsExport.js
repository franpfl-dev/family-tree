/**
 * icsExport.js
 * Pure browser ICS calendar file generator.
 * No backend needed — generates a Blob and triggers download.
 *
 * Supports:
 *   - Birthday events (RRULE:FREQ=YEARLY)
 *   - Anniversary events (one per couple, RRULE:FREQ=YEARLY)
 *   - Death remembrance events (RRULE:FREQ=YEARLY)
 *   - VALARM reminders
 */

/** Format a Date to ICS YYYYMMDD string */
function toICSDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  } catch { return null; }
}

/** Get current year version of a date string "YYYY-MM-DD" → "CURRYEAR-MM-DD" */
function toCurrentYearDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length < 3) return null;
  const year = new Date().getFullYear();
  return `${year}-${parts[1]}-${parts[2]}`;
}

/** Escape ICS text field */
function esc(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

/** Fold long ICS lines (RFC 5545 §3.1) */
function foldLine(line) {
  if (line.length <= 75) return line;
  const chunks = [];
  chunks.push(line.slice(0, 75));
  let pos = 75;
  while (pos < line.length) {
    chunks.push(' ' + line.slice(pos, pos + 74));
    pos += 74;
  }
  return chunks.join('\r\n');
}

/** Build a single VEVENT block */
function buildEvent({ uid, summary, description, dateStr, alarmDaysBefore, alarmHour }) {
  const dtstart = toICSDate(toCurrentYearDate(dateStr));
  if (!dtstart) return '';

  // Calculate DTSTART for recurring: use current year
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstart}T000000Z`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtstart}`,
    'RRULE:FREQ=YEARLY',
    `SUMMARY:${esc(summary)}`,
    `DESCRIPTION:${esc(description)}`,
  ];

  // VALARM
  if (alarmDaysBefore > 0) {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(summary)}`,
      `TRIGGER:-P${alarmDaysBefore}DT${String(24 - alarmHour).padStart(2, '0')}H0M0S`,
      'END:VALARM',
    );
  } else {
    lines.push(
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${esc(summary)}`,
      `TRIGGER:T${String(alarmHour).padStart(2, '0')}H0M0S`,
      'END:VALARM',
    );
  }

  lines.push('END:VEVENT');
  return lines.map(foldLine).join('\r\n');
}

/**
 * Collect all calendar events from persons + trees.
 * Returns array of { type, summary, description, dateStr, uid, alarmDaysBefore, alarmHour }
 */
export function collectEvents(persons, trees) {
  const events = [];
  const seenCouples = new Set(); // prevent duplicate anniversary events

  for (const person of persons) {
    const tree = trees.find((t) => t.id === person.treeId);
    const treeName = tree?.name || 'Family Tree';

    // ── Birthday ─────────────────────────────────────────────────────────
    if (person.dob && !person.isPlaceholder) {
      events.push({
        type: 'birthday',
        uid: `familytree-bday-${person.id}`,
        summary: `🎂 ${person.name}'s Birthday`,
        description: `Birthday of ${person.name} from ${treeName}.`,
        dateStr: person.dob,
        alarmDaysBefore: 1,
        alarmHour: 9,
      });
    }

    // ── Anniversary ────────────────────────────────────────────────────────
    if (person.anniversaryDate && person.spouseId && !person.isPlaceholder) {
      const coupleKey = [person.id, person.spouseId].sort().join('-');
      if (!seenCouples.has(coupleKey)) {
        seenCouples.add(coupleKey);
        const spouse = persons.find((p) => p.id === person.spouseId);
        const names = spouse
          ? `${person.name} & ${spouse.name}`
          : person.name;
        events.push({
          type: 'anniversary',
          uid: `familytree-anniv-${coupleKey}`,
          summary: `💍 ${names}'s Anniversary`,
          description: `Wedding Anniversary — ${treeName}.`,
          dateStr: person.anniversaryDate,
          alarmDaysBefore: 1,
          alarmHour: 9,
        });
      }
    }

    // ── Death Remembrance ─────────────────────────────────────────────────
    if (person.dod && !person.isPlaceholder) {
      const dobLine = person.dob ? ` Born: ${person.dob}.` : '';
      events.push({
        type: 'remembrance',
        uid: `familytree-dod-${person.id}`,
        summary: `🕯️ Remembering ${person.name}`,
        description: `Remembrance of ${person.name} from ${treeName}.${dobLine} Passed: ${person.dod}.`,
        dateStr: person.dod,
        alarmDaysBefore: 0,
        alarmHour: 8,
      });
    }
  }

  return events;
}

/** Count events by type */
export function countEventTypes(events) {
  return events.reduce(
    (acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    },
    { birthday: 0, anniversary: 0, remembrance: 0 },
  );
}

/** Build the ICS file content string from an array of events */
export function buildICS(events) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FamilyTree//FamilyTree Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-TIMEZONE:${tz}`,
    'X-WR-CALNAME:Family Tree Events',
  ].join('\r\n');

  const body = events.map((ev) => buildEvent(ev)).filter(Boolean).join('\r\n');
  return `${header}\r\n${body}\r\nEND:VCALENDAR`;
}

/** Trigger a browser download of the .ics file */
export function downloadICS(icsContent, filename) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `FamilyTree_Calendar_${new Date().toISOString().split('T')[0]}.ics`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); document.body.removeChild(a); }, 1000);
}
