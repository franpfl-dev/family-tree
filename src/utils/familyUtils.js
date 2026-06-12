/**
 * familyUtils.js
 * Helper utility functions for the Family Tree application.
 */

// ─── Basic Lookups ────────────────────────────────────────────────────────────

/**
 * Get a person by their ID.
 * @param {string} id
 * @param {Array} persons
 * @returns {Object|undefined}
 */
export function getPersonById(id, persons) {
  return persons.find((p) => p.id === id);
}

/**
 * Get all direct children of a person.
 * @param {string} personId
 * @param {Array} persons
 * @returns {Array}
 */
export function getChildrenOf(personId, persons) {
  return persons.filter((p) => p.parentId === personId);
}

/**
 * Get the spouse of a person (if any).
 * @param {string} personId
 * @param {Array} persons
 * @returns {Object|undefined}
 */
export function getSpouseOf(personId, persons) {
  const person = getPersonById(personId, persons);
  if (!person || !person.spouseId) return undefined;
  return getPersonById(person.spouseId, persons);
}

/**
 * Get all persons belonging to a specific tree.
 * @param {string} treeId
 * @param {Array} persons
 * @returns {Array}
 */
export function getTreePersons(treeId, persons) {
  return persons.filter((p) => p.treeId === treeId);
}

/**
 * Get the root person of a tree.
 * @param {Object} tree  - FamilyTree object
 * @param {Array} persons
 * @returns {Object|undefined}
 */
export function getRootPerson(tree, persons) {
  return getPersonById(tree.rootPersonId, persons);
}

// ─── Tree Structure ───────────────────────────────────────────────────────────

/**
 * Build a nested tree structure from a flat persons list.
 * Returns a node: { person, children: [...nodes], spouse }
 *
 * @param {string} treeId
 * @param {Array} persons
 * @param {Array} trees
 * @returns {Object|null}
 */
export function buildTreeStructure(treeId, persons, trees) {
  const tree = trees.find((t) => t.id === treeId);
  if (!tree) return null;

  const treePersons = getTreePersons(treeId, persons);

  function buildNode(personId, depth = 0) {
    const person = getPersonById(personId, treePersons);
    if (!person) return null;

    const spouse = person.spouseId
      ? getPersonById(person.spouseId, persons) // spouse may be from another tree
      : null;

    const children = getChildrenOf(personId, treePersons)
      .sort((a, b) => {
        // Sort by index if available, then by name
        if (a.siblingIndex !== undefined && b.siblingIndex !== undefined) {
          return a.siblingIndex - b.siblingIndex;
        }
        return a.name.localeCompare(b.name);
      })
      .map((child) => buildNode(child.id, depth + 1))
      .filter(Boolean);

    return { person, spouse, children, depth };
  }

  return buildNode(tree.rootPersonId);
}

// ─── Cross-Links ──────────────────────────────────────────────────────────────

/**
 * Get all persons cross-linked to a given person.
 * Returns array of { person, relationshipLabel, direction }.
 *
 * @param {string} personId
 * @param {Array} persons
 * @returns {Array}
 */
export function getCrossLinkedPersons(personId, persons) {
  const person = getPersonById(personId, persons);
  if (!person || !person.crossLinks) return [];

  return person.crossLinks
    .map((link) => {
      const linked = getPersonById(link.targetPersonId, persons);
      if (!linked) return null;
      return {
        person: linked,
        relationshipLabel: link.relationshipLabel,
        targetPersonId: link.targetPersonId,
      };
    })
    .filter(Boolean);
}

// ─── Validation Helpers ───────────────────────────────────────────────────────

/**
 * Check if adding parentId → childId would create a circular link.
 * @param {string} potentialParentId
 * @param {string} potentialChildId
 * @param {Array} persons
 * @returns {boolean} true if circular
 */
export function wouldCreateCircularLink(potentialParentId, potentialChildId, persons) {
  // Walk up from potentialParentId; if we ever hit potentialChildId, it's circular
  let current = getPersonById(potentialParentId, persons);
  const visited = new Set();
  while (current) {
    if (current.id === potentialChildId) return true;
    if (visited.has(current.id)) break;
    visited.add(current.id);
    current = current.parentId ? getPersonById(current.parentId, persons) : null;
  }
  return false;
}

/**
 * Count total members in a tree (including spouses from other trees who are
 * displayed inline — we only count persons whose treeId matches).
 * @param {string} treeId
 * @param {Array} persons
 * @returns {number}
 */
export function countTreeMembers(treeId, persons) {
  return getTreePersons(treeId, persons).length;
}

// ─── Formatting Helpers ───────────────────────────────────────────────────────

/**
 * Format a date string "YYYY-MM-DD" to a readable format "12 Jun 2022".
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate();
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format a date string "YYYY-MM-DD" to a full readable format "12 June 2022".
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDateFull(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    const day = date.getDate();
    const month = date.toLocaleDateString('en-GB', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Generate a unique ID (UUID v4-like).
 * @returns {string}
 */
export function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get the tree name for a given person.
 * @param {Object} person
 * @param {Array} trees
 * @returns {string}
 */
export function getTreeName(person, trees) {
  if (!person) return '';
  const tree = trees.find((t) => t.id === person.treeId);
  return tree ? tree.name : 'Unknown';
}

/**
 * Search persons by name (case-insensitive partial match).
 * @param {string} query
 * @param {Array} persons
 * @returns {Array}
 */
export function searchPersons(query, persons) {
  if (!query || query.trim() === '') return [];
  const lower = query.toLowerCase();
  return persons.filter((p) => p.name && p.name.toLowerCase().includes(lower));
}
