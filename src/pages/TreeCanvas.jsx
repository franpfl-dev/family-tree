/**
 * TreeCanvas.jsx
 * Main tree visualization page (/tree/:treeId).
 * Phase 3+4+5: pan, layout, nodes, context menu, modals, minimap,
 * global search, PNG export, placeholder handling, mobile bottom-sheet.
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Download } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { buildLayout } from '../hooks/useTreeLayout';
import { getChildrenOf } from '../utils/familyUtils';
import { exportAsPng, useExportJson } from '../hooks/useExport';
import BreadcrumbBar from '../components/BreadcrumbBar';
import PersonNode from '../components/PersonNode';
import CoupleBlock from '../components/CoupleBlock';
import SVGConnectors from '../components/SVGConnectors';
import ContextMenu from '../components/ContextMenu';
import PersonEditModal from '../components/PersonEditModal';
import PersonDeleteModal from '../components/PersonDeleteModal';
import AddChildModal from '../components/AddChildModal';
import AddSpouseModal from '../components/AddSpouseModal';
import EditSpouseModal from '../components/EditSpouseModal';
import CrossLinkModal from '../components/CrossLinkModal';
import GlobalSearch from '../components/GlobalSearch';
import Minimap from '../components/Minimap';
import NodeTooltip from '../components/NodeTooltip';

export default function TreeCanvas() {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const { state, setActiveTree, addTreeLevel, deletePerson, deleteTree } = useAppContext();
  const { trees, persons } = state;
  const exportJson = useExportJson();

  const tree = trees.find((t) => t.id === treeId);
  const canvasRef = useRef(null); // for PNG export

  useEffect(() => {
    if (treeId) setActiveTree(treeId);
  }, [treeId, setActiveTree]);

  // ── Pan ──────────────────────────────────────────────────────────────────────
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null);
  const panAtDragStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e) => {
    if (e.target !== e.currentTarget && e.target.closest('[data-node]')) return;
    setContextMenu(null);
    setTooltipPerson(null);
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    panAtDragStart.current = pan;
    e.currentTarget.style.cursor = 'grabbing';
  }, [pan]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: panAtDragStart.current.x + dx, y: panAtDragStart.current.y + dy });
  }, [isDragging]);

  const handleMouseUp = useCallback((e) => {
    setIsDragging(false);
    dragStart.current = null;
    if (e.currentTarget) e.currentTarget.style.cursor = 'grab';
  }, []);

  // Touch pan
  const touchStart = useRef(null);
  const handleTouchStart = useCallback((e) => {
    if (e.target === e.currentTarget || !e.target.closest('[data-node]')) {
      setContextMenu(null);
      setTooltipPerson(null);
    }
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
    panAtDragStart.current = pan;
  }, [pan]);
  const handleTouchMove = useCallback((e) => {
    if (!touchStart.current) return;
    const t = e.touches[0];
    setPan({ x: panAtDragStart.current.x + (t.clientX - touchStart.current.x), y: panAtDragStart.current.y + (t.clientY - touchStart.current.y) });
  }, []);
  const handleTouchEnd = useCallback(() => { touchStart.current = null; }, []);

  // ── Highlight (cross-link navigation) ────────────────────────────────────────
  const [highlightedId, setHighlightedId] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlight = params.get('highlight');
    if (highlight) {
      setHighlightedId(highlight);
      // Auto-pan to highlighted node
      const pos = positions.get(highlight);
      if (pos) {
        const cx = window.innerWidth / 2;
        const cy = (window.innerHeight - 56) / 2;
        setPan({ x: cx - (pos.x + (pos.width || 0) / 2), y: cy - (pos.y + (pos.height || 0) / 2) });
      }
      setTimeout(() => setHighlightedId(null), 3500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── UI state ──────────────────────────────────────────────────────────────────
  const [contextMenu, setContextMenu] = useState(null);
  const [tooltipPerson, setTooltipPerson] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState(null);
  const [editModalPerson, setEditModalPerson] = useState(null);
  const [deleteModalPerson, setDeleteModalPerson] = useState(null);
  const [addChildParent, setAddChildParent] = useState(null);
  const [addSpousePerson, setAddSpousePerson] = useState(null);
  const [editSpousePerson, setEditSpousePerson] = useState(null);
  const [crossLinkPerson, setCrossLinkPerson] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Keyboard shortcut: / or Ctrl+K for search
  useEffect(() => {
    function handleKey(e) {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && !e.target.closest('input, textarea')) {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // ── Layout ────────────────────────────────────────────────────────────────────
  const { positions, canvasWidth, canvasHeight } = useMemo(
    () => buildLayout(tree, persons),
    [tree, persons]
  );

  // ── SVG connector pairs ───────────────────────────────────────────────────────
  const parentChildPairs = useMemo(() => {
    if (!tree) return [];
    const pairs = [];
    const treePersons = persons.filter((p) => p.treeId === tree.id);
    for (const person of treePersons) {
      const children = getChildrenOf(person.id, treePersons);
      for (const child of children) {
        if (positions.has(person.id) && positions.has(child.id)) {
          pairs.push({ parentId: person.id, childId: child.id });
        }
      }
    }
    return pairs;
  }, [tree, persons, positions]);

  // ── Node left click (Tooltip) ──────────────────────────────────────────────────
  const handleNodeLeftClick = useCallback((e, person) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu(null);
    setTooltipPerson(person);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  }, []);

  // ── Node right click (Context Menu) ───────────────────────────────────────────
  const handleNodeRightClick = useCallback((e, person) => {
    e.preventDefault();
    e.stopPropagation();
    setTooltipPerson(null);
    setContextMenu({ person, position: { x: e.clientX, y: e.clientY } });
  }, []);

  // ── Node long press (Context Menu on mobile) ──────────────────────────────────
  const handleNodeLongPress = useCallback((e, person) => {
    e.preventDefault();
    e.stopPropagation();
    setTooltipPerson(null);
    const touch = e.touches?.[0] || e.changedTouches?.[0] || e;
    setContextMenu({ person, position: { x: touch.clientX, y: touch.clientY } });
  }, []);

  // ── Resolve canonical parent of a couple ─────────────────────────────────────
  // When the user right-clicks a spouse card, we need to attach children to the
  // "main" person of the couple — the one whose parentId places them in the tree
  // hierarchy (i.e. the one that is NOT a pure spouse-only node). For the root
  // couple both have parentId === null, so we fall back to whoever has the tree's
  // rootPersonId, or whoever has an existing children[] array in the data.
  function resolveMainPersonForChild(person) {
    if (!person.spouseId) return person; // solo node, already main
    const partner = persons.find((p) => p.id === person.spouseId);
    if (!partner) return person;

    // If one of them is the tree root, that's the main person.
    if (tree && person.id === tree.rootPersonId) return person;
    if (tree && partner.id === tree.rootPersonId) return partner;

    // If one has a parentId and the other doesn't, the one WITH parentId is main.
    if (person.parentId && !partner.parentId) return person;
    if (partner.parentId && !person.parentId) return partner;

    // Fall back: prefer the one whose children array is non-empty,
    // otherwise just return the clicked person.
    if ((person.children || []).length > 0) return person;
    if ((partner.children || []).length > 0) return partner;
    return person;
  }

  // ── Context menu actions ───────────────────────────────────────────────────────
  function handleEditDetails(person) { setEditModalPerson(person); }

  function handleDeletePerson(person) { setDeleteModalPerson(person); }

  function handleConfirmDelete() {
    if (!deleteModalPerson) return;
    const isRoot = deleteModalPerson.level === 0;
    if (isRoot) {
      // Delete the whole tree
      deleteTree(treeId);
      setDeleteModalPerson(null);
      navigate('/');
    } else {
      deletePerson(deleteModalPerson.id);
      setDeleteModalPerson(null);
    }
  }

  function handleAddChild(person) {
    // Always attach to the canonical parent of the couple, not the spouse card.
    const mainPerson = resolveMainPersonForChild(person);
    if (mainPerson.level >= (tree?.maxHeight ?? 3) - 1) {
      alert(`Cannot add child beyond max depth (${tree?.maxHeight}). Use "Add Level Below" on a leaf node first.`);
      return;
    }
    setAddChildParent(mainPerson);
  }

  function handleAddSpouse(person) {
    // Re-read from live persons array to avoid stale closure.
    const livePerson = persons.find((p) => p.id === person.id) || person;
    if (livePerson.spouseId) {
      // Person already has a spouse — open the edit modal.
      setEditSpousePerson(livePerson);
    } else {
      // No spouse yet — open the add/link modal.
      setAddSpousePerson(livePerson);
    }
  }

  function handleAddCrossLink(person) { setCrossLinkPerson(person); }

  function handleAddLevelBelow() {
    if (tree) addTreeLevel(tree.id);
  }

  // ── Minimap pan ────────────────────────────────────────────────────────────────
  const handleMinimapPan = useCallback((x, y) => setPan({ x, y }), []);

  // ── PNG export ─────────────────────────────────────────────────────────────────
  async function handleExportPng() {
    if (!canvasRef.current) return;
    setIsExporting(true);
    await exportAsPng(canvasRef.current, tree?.name || 'family-tree');
    setIsExporting(false);
  }

  // ── Not found ──────────────────────────────────────────────────────────────────
  if (!tree) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <div style={{ textAlign: 'center', padding: '3rem', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-panel)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Tree Not Found</h2>
          <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>This family tree doesn't exist or was deleted.</p>
          <button onClick={() => navigate('/')} style={{ padding: '0.7rem 1.5rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--color-primary), #A0522D)', color: '#FFF8F0', fontFamily: 'var(--font-body)', fontWeight: 700, cursor: 'pointer' }}>
            ← Go Home
          </button>
        </div>
      </div>
    );
  }

  // ── Render nodes ───────────────────────────────────────────────────────────────
  const renderedNodes = [];
  const renderedIds = new Set();

  for (const [personId, pos] of positions.entries()) {
    if (renderedIds.has(personId)) continue;
    const person = persons.find((p) => p.id === personId);
    if (!person) continue;

    if (pos.isCouple && pos.isLeft) {
      const spousePerson = persons.find((p) => p.id === pos.spouseId);
      renderedIds.add(personId);
      if (spousePerson) renderedIds.add(spousePerson.id);
      renderedNodes.push(
        <CoupleBlock
          key={`couple-${personId}`}
          leftPerson={person}
          rightPerson={spousePerson}
          x={pos.coupleX}
          y={pos.y}
          onClickPerson={handleNodeLeftClick}
          onContextMenuPerson={handleNodeRightClick}
          onLongPressPerson={handleNodeLongPress}
          highlightedId={highlightedId}
        />
      );
    } else if (!pos.isCouple) {
      renderedIds.add(personId);
      renderedNodes.push(
        <PersonNode
          key={personId}
          person={person}
          x={pos.x}
          y={pos.y}
          onClick={handleNodeLeftClick}
          onContextMenu={handleNodeRightClick}
          onLongPress={handleNodeLongPress}
          isHighlighted={highlightedId === personId}
        />
      );
    }
  }

  const treePersonCount = persons.filter((p) => p.treeId === treeId).length;

  // ── Render ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'var(--color-bg)', position: 'relative' }}>
      {/* Breadcrumb with search */}
      <BreadcrumbBar tree={tree} onSearchClick={() => setSearchOpen(true)} />

      {/* Canvas area */}
      <div
        style={{
          position: 'absolute', inset: 0, paddingTop: '56px',
          cursor: isDragging ? 'grabbing' : 'grab',
          overflow: 'hidden',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Dot grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(212,169,106,0.18) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
        }} />

        {/* Pannable content */}
        <div
          ref={canvasRef}
          style={{
            position: 'absolute',
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
            width: canvasWidth,
            height: canvasHeight,
          }}
        >
          <SVGConnectors
            positions={positions}
            parentChildPairs={parentChildPairs}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />
          {renderedNodes}
        </div>
      </div>

      {/* ── Bottom status bar ────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(255,248,240,0.9)', backdropFilter: 'blur(8px)',
        border: '1px solid var(--color-border)', borderRadius: '20px',
        padding: '0.4rem 1rem', fontSize: '0.75rem',
        color: 'var(--color-muted)', fontFamily: 'var(--font-body)',
        boxShadow: 'var(--shadow-node)',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        pointerEvents: 'none',
        maxWidth: 'calc(100vw - 10rem)',
      }}>
        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{tree.name}</span>
        <span>·</span>
        {treePersonCount} members
        <span>·</span>
        Depth: {tree.maxHeight}
        <span style={{ opacity: 0.55, display: window.innerWidth < 640 ? 'none' : 'inline' }}>· Right-click nodes · Press / to search</span>
      </div>

      {/* ── Toolbar (right side) ─────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: '1.25rem', right: '1.25rem',
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        alignItems: 'center',
      }}>
        {/* Reset pan */}
        <IconToolBtn
          id="btn-reset-pan"
          title="Reset view (center)"
          onClick={() => setPan({ x: 0, y: 0 })}
          label="⊙"
        />
        {/* Export PNG */}
        <IconToolBtn
          id="btn-export-png"
          title="Export as PNG"
          onClick={handleExportPng}
          disabled={isExporting}
          label={isExporting ? '…' : <Camera size={16} />}
        />
        {/* Export JSON */}
        <IconToolBtn
          id="btn-export-json"
          title="Export data as JSON"
          onClick={exportJson}
          label={<Download size={16} />}
        />
      </div>

      {/* ── Minimap (5C) ─────────────────────────────────────────────────────── */}
      <Minimap
        positions={positions}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        pan={pan}
        onPanTo={handleMinimapPan}
      />

      {/* ── Context Menu ─────────────────────────────────────────────────────── */}
      {contextMenu && (
        <ContextMenu
          person={contextMenu.person}
          position={contextMenu.position}
          tree={tree}
          onClose={() => setContextMenu(null)}
          onEditDetails={handleEditDetails}
          onDeletePerson={handleDeletePerson}
          onAddChild={handleAddChild}
          onAddSpouse={handleAddSpouse}
          onAddCrossLink={handleAddCrossLink}
          onAddLevelBelow={handleAddLevelBelow}
        />
      )}

      {/* ── Tooltip ─────────────────────────────────────────────────────────── */}
      {tooltipPerson && tooltipPosition && (
        <NodeTooltip
          person={tooltipPerson}
          position={tooltipPosition}
          onClose={() => setTooltipPerson(null)}
        />
      )}

      {/* ── Global Search (5D) ───────────────────────────────────────────────── */}
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      {editModalPerson && (
        <PersonEditModal
          person={editModalPerson}
          tree={tree}
          onClose={() => setEditModalPerson(null)}
          onOpenAddSpouse={handleAddSpouse}
        />
      )}
      {deleteModalPerson && (
        <PersonDeleteModal
          person={deleteModalPerson}
          tree={tree}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModalPerson(null)}
        />
      )}
      {addChildParent && (
        <AddChildModal
          parentPerson={addChildParent}
          tree={tree}
          onClose={() => setAddChildParent(null)}
        />
      )}
      {addSpousePerson && (
        <AddSpouseModal
          person={addSpousePerson}
          tree={tree}
          onClose={() => setAddSpousePerson(null)}
        />
      )}
      {editSpousePerson && (
        <EditSpouseModal
          person={editSpousePerson}
          tree={tree}
          onClose={() => setEditSpousePerson(null)}
        />
      )}
      {crossLinkPerson && (
        <CrossLinkModal
          person={crossLinkPerson}
          onClose={() => setCrossLinkPerson(null)}
        />
      )}
    </div>
  );
}

// ── Small icon toolbar button ─────────────────────────────────────────────────
function IconToolBtn({ id, title, onClick, label, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      id={id}
      title={title}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '40px', height: '40px', borderRadius: '50%',
        border: '1px solid var(--color-border)',
        background: hovered ? 'var(--color-surface)' : 'rgba(255,248,240,0.92)',
        backdropFilter: 'blur(8px)',
        color: disabled ? 'var(--color-muted)' : 'var(--color-primary)',
        fontSize: '1rem', cursor: disabled ? 'default' : 'pointer',
        boxShadow: 'var(--shadow-node)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
      }}
    >
      {label}
    </button>
  );
}
