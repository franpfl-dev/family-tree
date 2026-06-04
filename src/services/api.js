/**
 * services/api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin wrapper around fetch() for all backend API calls.
 * All methods return the parsed JSON `data` field on success,
 * or throw an Error with a human-readable message on failure.
 *
 * Base URL is read from the VITE_API_URL env var (defaults to localhost:5000).
 */

const BASE = import.meta.env.VITE_API_URL || '';   // empty = use Vite proxy in dev

// ── Core fetch helper ─────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  let json;
  try { json = await res.json(); } catch { json = {}; }

  if (!res.ok && res.status !== 207) {
    throw Object.assign(
      new Error(json.message || `API error ${res.status}`),
      { status: res.status, data: json }
    );
  }
  return json;    // { success, data, message, ... }
}

// ── Image upload ──────────────────────────────────────────────────────────────
/**
 * Upload a base64 data URI to Cloudinary via the backend.
 * Returns: { url: "https://res.cloudinary.com/..." }
 *          or { photoFailed: true, message: "..." } on Cloudinary failure.
 */
export async function uploadImage(base64) {
  return apiFetch('/api/images/upload', {
    method: 'POST',
    body:   JSON.stringify({ base64 }),
  });
}

// ── Trees ─────────────────────────────────────────────────────────────────────

/** Fetch all trees + all persons in one request (used at app load). */
export async function fetchAll() {
  const json = await apiFetch('/api/trees/all/full');
  return json.data;   // { trees, persons }
}

/** Create a new tree with its initial persons. */
export async function createTree(tree, persons = []) {
  const json = await apiFetch('/api/trees', {
    method: 'POST',
    body:   JSON.stringify({ tree, persons }),
  });
  return json.data;
}

/** Update tree metadata (name, maxHeight, …). */
export async function updateTree(id, updates) {
  const json = await apiFetch(`/api/trees/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(updates),
  });
  return json.data;
}

/** Delete tree + all its persons. */
export async function deleteTree(id) {
  return apiFetch(`/api/trees/${id}`, { method: 'DELETE' });
}

// ── Persons ───────────────────────────────────────────────────────────────────

/** Create a person (+ optional spouse). */
export async function createPerson(payload) {
  // payload: { person, parentId, treeId, level, spouseData? }
  const json = await apiFetch('/api/persons', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });
  return json.data;   // { person, spouse }
}

/** Update a person's fields. */
export async function updatePerson(id, updates) {
  const json = await apiFetch(`/api/persons/${id}`, {
    method: 'PUT',
    body:   JSON.stringify(updates),
  });
  return json.data;
}

/** Delete a person (+ descendants). */
export async function deletePerson(id) {
  return apiFetch(`/api/persons/${id}`, { method: 'DELETE' });
}

/** Link two persons as spouses. */
export async function linkSpouse(personId, spouseId, anniversaryDate) {
  return apiFetch('/api/persons/link-spouse', {
    method: 'POST',
    body:   JSON.stringify({ personId, spouseId, anniversaryDate }),
  });
}

// ── Cross-links ───────────────────────────────────────────────────────────────

export async function addCrossLink(fromId, targetPersonId, relationshipLabel, reverseLabel) {
  return apiFetch(`/api/persons/${fromId}/crosslink`, {
    method: 'POST',
    body:   JSON.stringify({ targetPersonId, relationshipLabel, reverseLabel }),
  });
}

export async function removeCrossLink(fromId, targetId) {
  return apiFetch(`/api/persons/${fromId}/crosslink/${targetId}`, { method: 'DELETE' });
}
