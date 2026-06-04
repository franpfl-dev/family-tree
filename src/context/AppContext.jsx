/**
 * AppContext.jsx
 * Global state management for the Family Tree application.
 *
 * Data layer (v2):
 *   - Primary source: MongoDB via Express API (src/services/api.js)
 *   - Fallback cache: localStorage (read if API unreachable, written after every API success)
 *   - React state: stays synchronous via useReducer; API calls are fire-and-forget
 *     synced in background. Optimistic updates keep the UI instant.
 *
 * Pattern:
 *   1. dispatch() → updates React state immediately (optimistic)
 *   2. apiSync() → mirrors the same change to the backend
 *   3. On API success → persist to localStorage cache
 *   4. On API failure → show error toast, but keep local state intact (offline mode)
 */

import React, {
  createContext, useContext, useReducer,
  useEffect, useCallback, useState, useRef,
} from 'react';
import { familyReducer, initialState, ACTIONS } from './reducer';
import * as api from '../services/api';

const AppContext = createContext(null);
const STORAGE_KEY = 'familyTreeAppState';

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  // ── Loading / error state for API ──────────────────────────────────────────
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError,   setApiError]   = useState(null);    // string | null
  const [toasts,     setToasts]     = useState([]);      // [{ id, message, type }]

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  // ── Reducer (local state — starts from localStorage cache) ────────────────
  const [state, dispatch] = useReducer(familyReducer, initialState, (init) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...init, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return init;
  });

  // ── Initial load: fetch from API, fall back to cache ─────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setApiLoading(true);
        const { trees, persons } = await api.fetchAll();
        if (!cancelled) {
          const hasLocalData = state.trees && state.trees.length > 0;
          const apiIsEmpty = (!trees || trees.length === 0);

          if (apiIsEmpty && hasLocalData) {
            console.warn('API is empty but local cache has data. Not overwriting cache.');
            addToast('Backend database is empty. Please export your local cache and run the migration script.', 'warning');
          } else {
            dispatch({ type: ACTIONS.LOAD_FROM_API, payload: { trees, persons } });
            persistCache({ ...state, trees, persons });
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('API unreachable, using localStorage cache:', err.message);
          setApiError('Could not reach the server. Showing cached data.');
          addToast('Server unreachable — showing cached data.', 'warning');
        }
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist cache after every successful state change ─────────────────────
  function persistCache(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }
  useEffect(() => { persistCache(state); }, [state]);

  // ── Toast helpers ─────────────────────────────────────────────────────────
  function addToast(message, type = 'error') {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }
  function dismissToast(id) { setToasts((t) => t.filter((x) => x.id !== id)); }

  // ── Generic API error handler ─────────────────────────────────────────────
  function handleApiError(err, context = '') {
    console.error(`API error${context ? ` (${context})` : ''}:`, err);
    addToast(err.message || 'An error occurred. Changes may not have saved.', 'error');
  }

  // ── Action Creators ───────────────────────────────────────────────────────

  const createTree = useCallback((payload) => {
    // Optimistic dispatch first
    dispatch({ type: ACTIONS.CREATE_TREE, payload });

    // Extract what the reducer will have created to sync to API.
    // We re-run a mini version to get the IDs that were generated.
    // Easier: read from state after dispatch via setTimeout(0).
    setTimeout(async () => {
      try {
        // Read freshest state
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const allPersons = saved.persons || [];
        const allTrees   = saved.trees   || [];
        const treeId = allTrees.at(-1)?.id;   // just-created tree is last
        if (!treeId) return;

        const tree           = allTrees.find((t) => t.id === treeId);
        const treePersons    = allPersons.filter((p) => p.treeId === treeId);

        // Map frontend {id} → backend {_id}
        const treeDoc       = { ...tree,       _id: tree.id       };
        const personDocs    = treePersons.map((p) => ({
          ...p, _id: p.id,
          profilePhoto: p.profilePhoto?.startsWith('data:') ? null : p.profilePhoto,
        }));

        await api.createTree(treeDoc, personDocs);
      } catch (err) {
        handleApiError(err, 'createTree');
      }
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteTree = useCallback((treeId) => {
    dispatch({ type: ACTIONS.DELETE_TREE, payload: { treeId } });
    api.deleteTree(treeId).catch((err) => handleApiError(err, 'deleteTree'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addPerson = useCallback((payload) => {
    dispatch({ type: ACTIONS.ADD_PERSON, payload });

    // After dispatch, find the newly-created person(s) from cache
    setTimeout(async () => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const persons = saved.persons || [];

        // The most recently added person is the one with no backend confirmation yet.
        // Match by name + treeId + level (reducer just added it).
        const { person: pData, parentId, treeId, level, spouseData } = payload;

        // Find the freshly created person in updated state
        const newPerson = [...persons]
          .reverse()
          .find((p) => p.name === pData.name && p.treeId === treeId && p.level === level);

        if (!newPerson) return;

        const spouse = spouseData?.name
          ? [...persons].reverse().find((p) => p.name === spouseData.name && p.treeId === treeId && p.level === level && p.spouseId === newPerson.id)
          : null;

        await api.createPerson({
          person:    { ...newPerson, _id: newPerson.id, profilePhoto: sanitizePhoto(newPerson.profilePhoto) },
          parentId:  parentId || null,
          treeId,
          level,
          spouseData: spouse ? { ...spouse, _id: spouse.id, profilePhoto: sanitizePhoto(spouse.profilePhoto) } : null,
        });
      } catch (err) {
        handleApiError(err, 'addPerson');
      }
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updatePerson = useCallback((personId, updates) => {
    dispatch({ type: ACTIONS.UPDATE_PERSON, payload: { personId, updates } });

    (async () => {
      try {
        // If the update includes a base64 photo, upload it first
        let cleanUpdates = { ...updates };
        if (cleanUpdates.profilePhoto?.startsWith('data:')) {
          const uploadResult = await api.uploadImage(cleanUpdates.profilePhoto);
          if (uploadResult.photoFailed) {
            addToast('Photo could not be saved — all other details were saved successfully.', 'warning');
            cleanUpdates.profilePhoto = null;
          } else {
            cleanUpdates.profilePhoto = uploadResult.url;
            // Also update local state with the CDN URL
            dispatch({ type: ACTIONS.UPDATE_PERSON, payload: { personId, updates: { profilePhoto: uploadResult.url } } });
          }
        }
        await api.updatePerson(personId, cleanUpdates);
      } catch (err) {
        handleApiError(err, 'updatePerson');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deletePerson = useCallback((personId) => {
    dispatch({ type: ACTIONS.DELETE_PERSON, payload: { personId } });
    api.deletePerson(personId).catch((err) => handleApiError(err, 'deletePerson'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const linkSpouse = useCallback((personId, spouseId, anniversaryDate) => {
    dispatch({ type: ACTIONS.LINK_SPOUSE, payload: { personId, spouseId, anniversaryDate } });
    api.linkSpouse(personId, spouseId, anniversaryDate)
      .catch((err) => handleApiError(err, 'linkSpouse'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addCrossLink = useCallback((fromPersonId, toPersonId, relationshipLabel, reverseLabel) => {
    dispatch({ type: ACTIONS.ADD_CROSS_LINK, payload: { fromPersonId, toPersonId, relationshipLabel, reverseLabel } });
    api.addCrossLink(fromPersonId, toPersonId, relationshipLabel, reverseLabel)
      .catch((err) => handleApiError(err, 'addCrossLink'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeCrossLink = useCallback((fromPersonId, toPersonId) => {
    dispatch({ type: ACTIONS.REMOVE_CROSS_LINK, payload: { fromPersonId, toPersonId } });
    api.removeCrossLink(fromPersonId, toPersonId)
      .catch((err) => handleApiError(err, 'removeCrossLink'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActiveTree = useCallback((treeId) => {
    dispatch({ type: ACTIONS.SET_ACTIVE_TREE, payload: { treeId } });
  }, []);

  const pushHistory = useCallback((treeId) => {
    dispatch({ type: ACTIONS.PUSH_HISTORY, payload: { treeId } });
  }, []);

  const popHistory = useCallback(() => {
    dispatch({ type: ACTIONS.POP_HISTORY });
  }, []);

  const addTreeLevel = useCallback((treeId) => {
    dispatch({ type: ACTIONS.ADD_TREE_LEVEL, payload: { treeId } });
    // Sync new maxHeight to backend
    setTimeout(async () => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const tree  = (saved.trees || []).find((t) => t.id === treeId);
        if (tree) await api.updateTree(treeId, { maxHeight: tree.maxHeight });
      } catch (err) {
        handleApiError(err, 'addTreeLevel');
      }
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Export ────────────────────────────────────────────────────────────────
  const exportData = useCallback(() => {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'family-tree-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importData = useCallback((jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.trees || !parsed.persons) throw new Error('Invalid data format');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      window.location.reload();
    } catch (err) {
      console.error('Failed to import data:', err);
      throw err;
    }
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    state,
    dispatch,
    // Loading / status
    apiLoading,
    apiError,
    toasts,
    dismissToast,
    addToast,
    // Action creators
    createTree,
    deleteTree,
    addPerson,
    updatePerson,
    deletePerson,
    linkSpouse,
    addCrossLink,
    removeCrossLink,
    setActiveTree,
    pushHistory,
    popHistory,
    addTreeLevel,
    // Data management
    exportData,
    importData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within an AppProvider');
  return ctx;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function sanitizePhoto(photo) {
  return photo?.startsWith('data:') ? null : (photo || null);
}

export default AppContext;
