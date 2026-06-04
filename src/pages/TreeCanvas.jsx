/**
 * TreeCanvas.jsx
 * Main tree visualization page (/tree/:treeId).
 * Phase 3+4+5: pan, layout, nodes, context menu, modals, minimap,
 * global search, PNG export, placeholder handling, mobile bottom-sheet.
 *
 * Zoom/pan:
 *   - Mouse drag or single-finger drag → pan
 *   - Pinch (two-finger) → zoom (scale 0.3 – 2.0)
 *   - Bottom-right zoom buttons: zoom in, zoom out, fit-to-screen
 *   - On load: auto-fits the entire tree into the viewport
 *
 * Collapse/expand:
 *   - Every node with children has a toggle button (▼/▶)
 *   - Collapsed branches are excluded from layout — canvas compacts
 *   - collapsedIds is local state, resets on page reload
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { buildLayout, CANVAS_PAD_X, CANVAS_PAD_TOP } from '../hooks/useTreeLayout';
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

const MIN_SCALE = 0.3;
const MAX_SCALE = 2.0;
const HEADER_H = 56; // breadcrumb bar height

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

  // ── Collapse state — local only, resets on page reload ───────────────────────
  const [collapsedIds, setCollapsedIds] = useState(new Set());

  const toggleCollapse = useCallback((personId) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  }, []);

  // ── Zoom + Pan state ──────────────────────────────────────────────────────────
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null);
  const panAtDragStart = useRef({ x: 0, y: 0 });

  // ── Layout (collapse-aware) ───────────────────────────────────────────────────
  const { positions, canvasWidth, canvasHeight } = useMemo(
    () => buildLayout(tree, persons, collapsedIds),
    [tree, persons, collapsedIds]
  );

  // ── Fit to screen helper ──────────────────────────────────────────────────────
  const fitToScreen = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight - HEADER_H;
    const scaleX = vw / (canvasWidth + CANVAS_PAD_X * 2);
    const scaleY = vh / (canvasHeight + CANVAS_PAD_TOP * 2);
    const newScale = Math.min(Math.max(Math.min(scaleX, scaleY), MIN_SCALE), MAX_SCALE);

    const scaledW = canvasWidth * newScale;
    const scaledH = canvasHeight * newScale;
    setScale(newScale);
    setPan({ x: (vw - scaledW) / 2, y: (vh - scaledH) / 2 });
  }, [canvasWidth, canvasHeight]);

  // ── Fit to screen on first load / tree change ─────────────────────────────────
  const hasFit = useRef(false);
  useEffect(() => {
    if (!tree || canvasWidth <= 0) return;
    hasFit.current = false;
  }, [treeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!tree || canvasWidth <= 0 || hasFit.current) return;
    hasFit.current = true;
    fitToScreen();
  }, [tree, canvasWidth, canvasHeight, fitToScreen]);

  // ── Mouse pan ─────────────────────────────────────────────────────────────────
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

  // ── Mouse wheel zoom ──────────────────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setScale((prev) => {
      const next = Math.min(Math.max(prev + delta, MIN_SCALE), MAX_SCALE);
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const ratio = next / prev;
      setPan((p) => ({
        x: mouseX - ratio * (mouseX - p.x),
        y: mouseY - ratio * (mouseY - p.y),
      }));
      return next;
    });
  }, []);

  // ── Touch: single-finger pan + two-finger pinch-zoom ──────────────────────────
  const touchStart = useRef(null);
  const lastPinchDist = useRef(null);
  const scaleAtPinchStart = useRef(1);
  const panAtPinchStart = useRef({ x: 0, y: 0 });
  const pinchMidpointStart = useRef({ x: 0, y: 0 });

  const getTouchDist = (t1, t2) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e) => {
    if (e.target === e.currentTarget || !e.target.closest('[data-node]')) {
      setContextMenu(null);
      setTooltipPerson(null);
    }
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
      panAtDragStart.current = pan;
      lastPinchDist.current = null;
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      lastPinchDist.current = getTouchDist(t1, t2);
      scaleAtPinchStart.current = scale;
      panAtPinchStart.current = pan;
      pinchMidpointStart.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      };
      touchStart.current = null;
    }
  }, [pan, scale]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length === 1 && touchStart.current) {
      const t = e.touches[0];
      setPan({
        x: panAtDragStart.current.x + (t.clientX - touchStart.current.x),
        y: panAtDragStart.current.y + (t.clientY - touchStart.current.y),
      });
    } else if (e.touches.length === 2 && lastPinchDist.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const newDist = getTouchDist(t1, t2);
      const ratio = newDist / lastPinchDist.current;
      const newScale = Math.min(Math.max(scaleAtPinchStart.current * ratio, MIN_SCALE), MAX_SCALE);
      const mx = pinchMidpointStart.current.x;
      const my = pinchMidpointStart.current.y;
      const scaleRatio = newScale / scaleAtPinchStart.current;
      setScale(newScale);
      setPan({
        x: mx - scaleRatio * (mx - panAtPinchStart.current.x),
        y: my - scaleRatio * (my - panAtPinchStart.current.y),
      });
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    touchStart.current = null;
    lastPinchDist.current = null;
  }, []);

  // ── Highlight (cross-link navigation) ────────────────────────────────────────
  const [highlightedId, setHighlightedId] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlight = params.get('highlight');
    if (highlight) {
      setHighlightedId(highlight);
      const pos = positions.get(highlight);
      if (pos) {
        const cx = window.innerWidth / 2;
        const cy = (window.innerHeight - HEADER_H) / 2;
        setPan({ x: cx - (pos.x + (pos.width || 0) / 2) * scale, y: cy - (pos.y + (pos.height || 0) / 2) * scale });
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

  // ── SVG connector pairs — only between visible (placed) nodes ─────────────────
  const parentChildPairs = useMemo(() => {
    if (!tree) return [];
    const pairs = [];
    const treePersons = persons.filter((p) => p.treeId === tree.id);
    for (const person of treePersons) {
      const children = getChildrenOf(person.id, treePersons);
      for (const child of children) {
        // Only draw connector if child was placed (not collapsed away)
        if (positions.has(person.id) && positions.has(child.id)) {
          pairs.push({ parentId: person.id, childId: child.id });
        }
      }
    }
    return pairs;
  }, [tree, persons, positions]);

  // ── Helper: count all descendants (for collapse count badge) ─────────────────
  const countDescendants = useCallback((personId) => {
    const treePersons = persons.filter((p) => p.treeId === treeId);
    function count(id) {
      const children = getChildrenOf(id, treePersons);
      return children.reduce((sum, c) => sum + 1 + count(c.id), 0);
    }
    // Also count children of spouse (couple block)
    const person = treePersons.find((p) => p.id === personId);
    const spouseId = person?.spouseId;
    const spouseChildren = spouseId ? getChildrenOf(spouseId, treePersons) : [];
    return count(personId) + spouseChildren.reduce((sum, c) => sum + 1 + count(c.id), 0);
  }, [persons, treeId]);

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
  function resolveMainPersonForChild(person) {
    if (!person.spouseId) return person;
    const partner = persons.find((p) => p.id === person.spouseId);
    if (!partner) return person;
    if (tree && person.id === tree.rootPersonId) return person;
    if (tree && partner.id === tree.rootPersonId) return partner;
    if (person.parentId && !partner.parentId) return person;
    if (partner.parentId && !person.parentId) return partner;
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
      deleteTree(treeId);
      setDeleteModalPerson(null);
      navigate('/');
    } else {
      deletePerson(deleteModalPerson.id);
      setDeleteModalPerson(null);
    }
  }

  function handleAddChild(person) {
    const mainPerson = resolveMainPersonForChild(person);
    if (mainPerson.level >= (tree?.maxHeight ?? 3) - 1) {
      alert(`Cannot add child beyond max depth (${tree?.maxHeight}). Use "Add Level Below" on a leaf node first.`);
      return;
    }
    setAddChildParent(mainPerson);
  }

  function handleAddSpouse(person) {
    const livePerson = persons.find((p) => p.id === person.id) || person;
    if (livePerson.spouseId) {
      setEditSpousePerson(livePerson);
    } else {
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

  // ── Zoom button helpers ────────────────────────────────────────────────────────
  const zoomIn = useCallback(() => {
    setScale((prev) => {
      const next = Math.min(prev + 0.1, MAX_SCALE);
      const cx = window.innerWidth / 2;
      const cy = (window.innerHeight - HEADER_H) / 2;
      const ratio = next / prev;
      setPan((p) => ({
        x: cx - ratio * (cx - p.x),
        y: cy - ratio * (cy - p.y),
      }));
      return next;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(prev - 0.1, MIN_SCALE);
      const cx = window.innerWidth / 2;
      const cy = (window.innerHeight - HEADER_H) / 2;
      const ratio = next / prev;
      setPan((p) => ({
        x: cx - ratio * (cx - p.x),
        y: cy - ratio * (cy - p.y),
      }));
      return next;
    });
  }, []);

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
  const treePersons = persons.filter((p) => p.treeId === treeId);
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

      // Determine children for collapse toggle
      const coupleChildren = [
        ...getChildrenOf(personId, treePersons),
        ...(spousePerson ? getChildrenOf(spousePerson.id, treePersons) : []),
      ];
      const isCollapsed = collapsedIds.has(personId) || (spousePerson && collapsedIds.has(spousePerson.id));
      const hiddenCount = isCollapsed ? countDescendants(personId) : 0;

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
          hasChildren={coupleChildren.length > 0}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => toggleCollapse(personId)}
          hiddenCount={hiddenCount}
        />
      );
    } else if (!pos.isCouple) {
      renderedIds.add(personId);

      const nodeChildren = getChildrenOf(personId, treePersons);
      const isCollapsed = collapsedIds.has(personId);
      const hiddenCount = isCollapsed ? countDescendants(personId) : 0;

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
          hasChildren={nodeChildren.length > 0}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => toggleCollapse(personId)}
          hiddenCount={hiddenCount}
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

      {/* Canvas area — receives all pointer/touch events */}
      <div
        style={{
          position: 'absolute', inset: 0, paddingTop: `${HEADER_H}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
          overflow: 'hidden',
          touchAction: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
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

        {/* Pannable + scalable content */}
        <div
          ref={canvasRef}
          style={{
            position: 'absolute',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
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
        zIndex: 100,
      }}>
        <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{tree.name}</span>
        <span>·</span>
        {treePersonCount} members
        <span>·</span>
        Depth: {tree.maxHeight}
        <span className="status-bar-hint" style={{ opacity: 0.55 }}>· Right-click nodes · Press / to search</span>
        <span style={{ opacity: 0.7 }}>· {Math.round(scale * 100)}%</span>
      </div>

      {/* ── Zoom + Toolbar (right side, safe-area aware) ──────────────────────── */}
      <div className="zoom-toolbar">
        <IconToolBtn
          id="btn-zoom-in"
          title="Zoom in"
          onClick={zoomIn}
          label={<ZoomIn size={16} />}
        />
        <IconToolBtn
          id="btn-zoom-out"
          title="Zoom out"
          onClick={zoomOut}
          label={<ZoomOut size={16} />}
        />
        <IconToolBtn
          id="btn-fit-screen"
          title="Fit to screen"
          onClick={fitToScreen}
          label={<Maximize2 size={16} />}
        />
        <IconToolBtn
          id="btn-export-png"
          title="Export as PNG"
          onClick={handleExportPng}
          disabled={isExporting}
          label={isExporting ? '…' : <Camera size={16} />}
        />
        <IconToolBtn
          id="btn-export-json"
          title="Export data as JSON"
          onClick={exportJson}
          label={<Download size={16} />}
        />
      </div>

      {/* ── Minimap ─────────────────────────────────────────────────────────── */}
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

      {/* ── Global Search ───────────────────────────────────────────────────── */}
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
        width: '44px', height: '44px', borderRadius: '50%',
        border: '1px solid var(--color-border)',
        background: hovered ? 'var(--color-surface)' : 'rgba(255,248,240,0.92)',
        backdropFilter: 'blur(8px)',
        color: disabled ? 'var(--color-muted)' : 'var(--color-primary)',
        fontSize: '1rem', cursor: disabled ? 'default' : 'pointer',
        boxShadow: 'var(--shadow-node)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}
