/**
 * reducer.js
 * All reducer actions for the Family Tree application.
 */

import { generateId } from '../utils/familyUtils';

// ─── Initial State ────────────────────────────────────────────────────────────
export const initialState = {
  trees: [],
  persons: [],
  activeTreeId: null,
  navigationHistory: [],
};

// ─── Action Types ─────────────────────────────────────────────────────────────
export const ACTIONS = {
  CREATE_TREE:       'CREATE_TREE',
  DELETE_TREE:       'DELETE_TREE',
  ADD_PERSON:        'ADD_PERSON',
  UPDATE_PERSON:     'UPDATE_PERSON',
  DELETE_PERSON:     'DELETE_PERSON',
  LINK_SPOUSE:       'LINK_SPOUSE',
  ADD_CROSS_LINK:    'ADD_CROSS_LINK',
  REMOVE_CROSS_LINK: 'REMOVE_CROSS_LINK',
  SET_ACTIVE_TREE:   'SET_ACTIVE_TREE',
  PUSH_HISTORY:      'PUSH_HISTORY',
  POP_HISTORY:       'POP_HISTORY',
  ADD_TREE_LEVEL:    'ADD_TREE_LEVEL',
  LOAD_FROM_API:     'LOAD_FROM_API',   // replace state with fresh API data
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
export function familyReducer(state, action) {
  switch (action.type) {

    // LOAD_FROM_API
    // Replaces trees and persons with fresh data from the server.
    case ACTIONS.LOAD_FROM_API: {
      const { trees, persons } = action.payload;
      return { ...state, trees, persons };
    }

    // CREATE_TREE
    // payload: { treeName, rootPerson, spouseData?, numberOfChildren }
    case ACTIONS.CREATE_TREE: {
      const { treeName, rootPerson, spouseData, numberOfChildren } = action.payload;
      const treeId = generateId();
      const rootId = generateId();

      const root = {
        id: rootId,
        name: rootPerson.name,
        gender: rootPerson.gender,
        dob: rootPerson.dob || '',
        dod: rootPerson.dod || null,
        profilePhoto: rootPerson.profilePhoto || null,
        spouseId: null,
        anniversaryDate: null,
        treeId,
        parentId: null,
        children: [],
        level: 0,
        crossLinks: [],
        isPlaceholder: false,
      };

      const newPersons = [root];

      let spouse = null;
      if (spouseData && spouseData.name) {
        const spouseId = generateId();
        spouse = {
          id: spouseId,
          name: spouseData.name,
          gender: spouseData.gender || (rootPerson.gender === 'male' ? 'female' : 'male'),
          dob: spouseData.dob || '',
          dod: spouseData.dod || null,
          profilePhoto: spouseData.profilePhoto || null,
          spouseId: rootId,
          anniversaryDate: spouseData.anniversaryDate || null,
          treeId,
          parentId: null,
          children: [],
          level: 0,
          crossLinks: [],
          isPlaceholder: false,
        };
        root.spouseId = spouseId;
        root.anniversaryDate = spouseData.anniversaryDate || null;
        newPersons.push(spouse);
      }

      // Store the intended child count as metadata on the root (no placeholder nodes created).
      // Children are added explicitly via right-click > Add Child.
      const childCount = Math.min(Math.max(parseInt(numberOfChildren) || 0, 0), 20);
      root.expectedChildren = childCount;
      // root.children stays []

      const newTree = {
        id: treeId,
        name: treeName,
        rootPersonId: rootId,
        maxHeight: 3,
        createdAt: new Date().toISOString(),
      };

      return {
        ...state,
        trees: [...state.trees, newTree],
        persons: [...state.persons, ...newPersons],
        activeTreeId: treeId,
      };
    }

    // DELETE_TREE
    // payload: { treeId }
    case ACTIONS.DELETE_TREE: {
      const { treeId } = action.payload;
      const treePersonIds = new Set(
        state.persons.filter((p) => p.treeId === treeId).map((p) => p.id)
      );

      const updatedPersons = state.persons
        .filter((p) => p.treeId !== treeId)
        .map((p) => ({
          ...p,
          crossLinks: (p.crossLinks || []).filter(
            (cl) => !treePersonIds.has(cl.targetPersonId)
          ),
        }));

      return {
        ...state,
        trees: state.trees.filter((t) => t.id !== treeId),
        persons: updatedPersons,
        activeTreeId: state.activeTreeId === treeId ? null : state.activeTreeId,
        navigationHistory: state.navigationHistory.filter((id) => id !== treeId),
      };
    }

    // ADD_PERSON
    // payload: { person: Partial<Person>, parentId?, treeId, level, spouseData?, spouseOfId? }
    case ACTIONS.ADD_PERSON: {
      const { person, parentId, treeId, level, spouseData, spouseOfId } = action.payload;

      const tree = state.trees.find((t) => t.id === treeId);
      if (tree && level >= tree.maxHeight) {
        console.warn('ADD_PERSON: level exceeds maxHeight, aborting');
        return state;
      }

      const newId = person.id || generateId();
      const hasSpouseData = spouseData && spouseData.name;
      const spouseId = hasSpouseData ? generateId() : (spouseOfId || person.spouseId || null);

      const newPerson = {
        id: newId,
        name: person.name || 'Unknown',
        gender: person.gender || 'other',
        dob: person.dob || '',
        dod: person.dod || null,
        profilePhoto: person.profilePhoto || null,
        spouseId: spouseId,
        anniversaryDate: hasSpouseData
          ? (spouseData.anniversaryDate || null)
          : (person.anniversaryDate || null),
        treeId,
        parentId: parentId || null,
        children: [],
        level,
        crossLinks: [],
        isPlaceholder: false,
        siblingIndex: person.siblingIndex,
      };

      const updatedPersons = state.persons.map((p) => {
        if (p.id === parentId) {
          return { ...p, children: [...(p.children || []), newId] };
        }
        if (spouseOfId && p.id === spouseOfId) {
          return { ...p, spouseId: newId, anniversaryDate: person.anniversaryDate || null };
        }
        return p;
      });

      if (hasSpouseData) {
        const spousePerson = {
          id: spouseId,
          name: spouseData.name,
          gender: spouseData.gender || (person.gender === 'male' ? 'female' : 'male'),
          dob: spouseData.dob || '',
          dod: spouseData.dod || null,
          profilePhoto: null,
          spouseId: newId,
          anniversaryDate: spouseData.anniversaryDate || null,
          treeId,
          parentId: null,
          children: [],
          level,
          crossLinks: [],
          isPlaceholder: false,
        };
        return {
          ...state,
          persons: [...updatedPersons, newPerson, spousePerson],
        };
      }

      return {
        ...state,
        persons: [...updatedPersons, newPerson],
      };
    }

    // UPDATE_PERSON
    // payload: { personId, updates: Partial<Person> }
    case ACTIONS.UPDATE_PERSON: {
      const { personId, updates } = action.payload;
      // Find the person being updated so we can sync anniversaryDate to their spouse
      const personBeingUpdated = state.persons.find((p) => p.id === personId);
      const spouseId = personBeingUpdated?.spouseId;

      return {
        ...state,
        persons: state.persons.map((p) => {
          if (p.id === personId) return { ...p, ...updates };
          // If anniversaryDate is being changed, mirror it to the spouse
          if (spouseId && p.id === spouseId && 'anniversaryDate' in updates) {
            return { ...p, anniversaryDate: updates.anniversaryDate };
          }
          return p;
        }),
      };
    }

    // DELETE_PERSON
    // payload: { personId }
    case ACTIONS.DELETE_PERSON: {
      const { personId } = action.payload;
      const person = state.persons.find((p) => p.id === personId);
      if (!person) return state;

      function collectDescendants(id, allPersons) {
        const children = allPersons.filter((p) => p.parentId === id);
        return children.reduce(
          (acc, child) => [...acc, child.id, ...collectDescendants(child.id, allPersons)],
          []
        );
      }
      const toDelete = new Set([personId, ...collectDescendants(personId, state.persons)]);

      const updatedPersons = state.persons
        .filter((p) => !toDelete.has(p.id))
        .map((p) => ({
          ...p,
          children: (p.children || []).filter((cid) => !toDelete.has(cid)),
          spouseId: toDelete.has(p.spouseId) ? null : p.spouseId,
          crossLinks: (p.crossLinks || []).filter((cl) => !toDelete.has(cl.targetPersonId)),
        }));

      return {
        ...state,
        persons: updatedPersons,
      };
    }

    // LINK_SPOUSE
    // payload: { personId, spouseId, anniversaryDate? }
    case ACTIONS.LINK_SPOUSE: {
      const { personId, spouseId, anniversaryDate } = action.payload;
      if (personId === spouseId) return state;

      return {
        ...state,
        persons: state.persons.map((p) => {
          if (p.id === personId) {
            return { ...p, spouseId, anniversaryDate: anniversaryDate || p.anniversaryDate };
          }
          if (p.id === spouseId) {
            return { ...p, spouseId: personId, anniversaryDate: anniversaryDate || p.anniversaryDate };
          }
          return p;
        }),
      };
    }

    // ADD_CROSS_LINK
    // payload: { fromPersonId, toPersonId, relationshipLabel, reverseLabel? }
    case ACTIONS.ADD_CROSS_LINK: {
      const { fromPersonId, toPersonId, relationshipLabel, reverseLabel } = action.payload;
      return {
        ...state,
        persons: state.persons.map((p) => {
          if (p.id === fromPersonId) {
            const alreadyLinked = (p.crossLinks || []).some(
              (cl) => cl.targetPersonId === toPersonId
            );
            if (alreadyLinked) return p;
            return {
              ...p,
              crossLinks: [
                ...(p.crossLinks || []),
                { targetPersonId: toPersonId, relationshipLabel },
              ],
            };
          }
          if (p.id === toPersonId) {
            const alreadyLinked = (p.crossLinks || []).some(
              (cl) => cl.targetPersonId === fromPersonId
            );
            if (alreadyLinked) return p;
            return {
              ...p,
              crossLinks: [
                ...(p.crossLinks || []),
                {
                  targetPersonId: fromPersonId,
                  relationshipLabel: reverseLabel || relationshipLabel,
                },
              ],
            };
          }
          return p;
        }),
      };
    }

    // REMOVE_CROSS_LINK
    // payload: { fromPersonId, toPersonId }
    case ACTIONS.REMOVE_CROSS_LINK: {
      const { fromPersonId, toPersonId } = action.payload;
      return {
        ...state,
        persons: state.persons.map((p) => {
          if (p.id === fromPersonId || p.id === toPersonId) {
            const otherId = p.id === fromPersonId ? toPersonId : fromPersonId;
            return {
              ...p,
              crossLinks: (p.crossLinks || []).filter(
                (cl) => cl.targetPersonId !== otherId
              ),
            };
          }
          return p;
        }),
      };
    }

    // SET_ACTIVE_TREE
    // payload: { treeId }
    case ACTIONS.SET_ACTIVE_TREE: {
      return { ...state, activeTreeId: action.payload.treeId };
    }

    // PUSH_HISTORY
    // payload: { treeId }
    case ACTIONS.PUSH_HISTORY: {
      return {
        ...state,
        navigationHistory: [...state.navigationHistory, action.payload.treeId],
      };
    }

    // POP_HISTORY
    case ACTIONS.POP_HISTORY: {
      const history = [...state.navigationHistory];
      history.pop();
      return { ...state, navigationHistory: history };
    }

    // ADD_TREE_LEVEL
    // payload: { treeId }
    case ACTIONS.ADD_TREE_LEVEL: {
      return {
        ...state,
        trees: state.trees.map((t) =>
          t.id === action.payload.treeId
            ? { ...t, maxHeight: t.maxHeight + 1 }
            : t
        ),
      };
    }

    default:
      return state;
  }
}
