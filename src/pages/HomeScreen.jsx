/**
 * HomeScreen.jsx
 * The main landing page. Shows all family tree cards and a header.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TreePine, Trash2, Eye, Users, Calendar, ChevronRight, Download, Upload, Bell } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import {
  getRootPerson,
  getSpouseOf,
  countTreeMembers,
  formatDateShort,
} from '../utils/familyUtils';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import CalendarExportModal from '../components/CalendarExportModal';
import NotificationBanner from '../components/NotificationBanner';
import NotificationSettings from '../components/NotificationSettings';
import UpcomingEvents from '../components/UpcomingEvents';
import { checkAndNotifyToday, loadNotifPrefs, sendEventsToServiceWorker } from '../utils/notifications';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { state, deleteTree, exportData, importData } = useAppContext();
  const { trees, persons } = state;

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importError, setImportError] = useState('');
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [notifSettingsOpen, setNotifSettingsOpen] = useState(false);

  // Register service worker and check today's events on load
  useEffect(() => {
    // Register SW and send today's events to it
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => sendEventsToServiceWorker(persons, trees))
        .catch(() => {/* SW not critical */});
    }
    // Fire today's notifications via the main thread (with scheduling)
    const prefs = loadNotifPrefs();
    if (prefs.enabled) {
      checkAndNotifyToday(persons, trees, prefs);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleOpenTree(treeId) {
    navigate(`/tree/${treeId}`);
  }

  function handleDeleteConfirm() {
    if (deleteTarget) {
      deleteTree(deleteTarget);
      setDeleteTarget(null);
    }
  }

  function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        importData(evt.target.result);
      } catch {
        setImportError('Invalid JSON file. Please use a file exported from this app.');
        setTimeout(() => setImportError(''), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* ── Notification Banner ─────────────────────────────────────────── */}
      <NotificationBanner onPermissionGranted={() => {}} />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: '0 2px 12px rgba(123,63,0,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          minHeight: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          paddingTop: '0.5rem',
          paddingBottom: '0.5rem',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-primary), #A0522D)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(123,63,0,0.3)',
            }}>
              <TreePine size={22} color="#FFF8F0" />
            </div>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-primary)',
                fontSize: '1.5rem',
                fontWeight: 700,
                lineHeight: 1.1,
              }}>Family Tree</h1>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                {trees.length} {trees.length === 1 ? 'family' : 'families'} · {persons.length} members
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {trees.length > 0 && (
              <>
                {/* Calendar Export */}
                <button
                  id="btn-calendar-export"
                  onClick={() => setCalendarModalOpen(true)}
                  title="Export to Calendar"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-muted)',
                    fontSize: '0.8rem', fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-muted)'; }}
                >
                  <Calendar size={14} /> <span className="home-btn-label">Calendar</span>
                </button>

                {/* Notifications */}
                <button
                  id="btn-notif-settings"
                  onClick={() => setNotifSettingsOpen(true)}
                  title="Notification settings"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-muted)',
                    fontSize: '0.8rem', fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-muted)'; }}
                >
                  <Bell size={14} /> <span className="home-btn-label">Alerts</span>
                </button>

                {/* Export JSON */}
                <button
                  onClick={exportData}
                  title="Export data as JSON"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 0.875rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    color: 'var(--color-muted)',
                    fontSize: '0.8rem', fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-muted)'; }}
                >
                  <Download size={14} /> <span className="home-btn-label">Export</span>
                </button>
              </>
            )}

            <label
              title="Import JSON data"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-muted)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-muted)'; }}
            >
              <Upload size={14} /> <span className="home-btn-label">Import</span>
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </header>

      {/* ── Import Error Toast ─────────────────────────────────────────── */}
      {importError && (
        <div style={{
          position: 'fixed', top: '5rem', left: '50%', transform: 'translateX(-50%)',
          background: '#C0392B', color: '#fff', padding: '0.75rem 1.5rem',
          borderRadius: '8px', zIndex: 1000, fontSize: '0.875rem',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          {importError}
        </div>
      )}

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {trees.length === 0 ? (
          <EmptyState onCreateNew={() => navigate('/new-tree')} />
        ) : (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text)',
                fontSize: '1.75rem',
                fontWeight: 600,
              }}>Your Families</h2>
              <p style={{ color: 'var(--color-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
                Click on a tree to explore and manage your family members.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
              gap: '1.25rem',
            }}>
              {trees.map((tree) => (
                <FamilyTreeCard
                  key={tree.id}
                  tree={tree}
                  persons={persons}
                  onOpen={() => handleOpenTree(tree.id)}
                  onDelete={() => setDeleteTarget(tree.id)}
                />
              ))}

              {/* Add new card */}
              <AddNewCard onClick={() => navigate('/new-tree')} />
            </div>

            {/* ── Upcoming Events Widget ────────────────────────────── */}
            <UpcomingEvents />
          </>
        )}
      </main>

      {/* ── Delete Confirm Modal ───────────────────────────────────────── */}
      {deleteTarget && (
        <DeleteConfirmModal
          treeName={trees.find(t => t.id === deleteTarget)?.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Calendar Export Modal ──────────────────────────────────────── */}
      {calendarModalOpen && (
        <CalendarExportModal onClose={() => setCalendarModalOpen(false)} />
      )}

      {/* ── Notification Settings Modal ────────────────────────────────── */}
      {notifSettingsOpen && (
        <NotificationSettings onClose={() => setNotifSettingsOpen(false)} />
      )}
    </div>
  );
}

// ─── FamilyTreeCard ───────────────────────────────────────────────────────────
function FamilyTreeCard({ tree, persons, onOpen, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const root = getRootPerson(tree, persons);
  const spouse = root ? getSpouseOf(root.id, persons) : null;
  const memberCount = countTreeMembers(tree.id, persons);
  const createdDate = formatDateShort(tree.createdAt?.split('T')[0]);

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: `1px solid ${hovered ? 'var(--color-border)' : 'rgba(212,169,106,0.4)'}`,
        borderRadius: '16px',
        padding: '1.75rem',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: hovered ? 'var(--shadow-panel)' : 'var(--shadow-node)',
        transform: hovered ? 'translateY(-3px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tree header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #FDF0E0, #F5DEB3)',
            border: '1px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem',
            flexShrink: 0,
          }}>
            🌳
          </div>
          <div>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-primary)',
              fontSize: '1.2rem',
              fontWeight: 700,
              lineHeight: 1.2,
            }}>{tree.name}</h3>
            {createdDate && (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.72rem', marginTop: '2px' }}>
                Created {createdDate}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Root couple display */}
      <div style={{
        background: 'linear-gradient(135deg, #FDF0E0, #FFF8F0)',
        border: '1px solid rgba(212,169,106,0.3)',
        borderRadius: '10px',
        padding: '0.875rem',
      }}>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
          Root
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PersonPill person={root} />
          {spouse && (
            <>
              <span style={{ color: 'var(--color-accent)', fontSize: '1rem' }}>💍</span>
              <PersonPill person={spouse} />
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '1.25rem' }}>
        <Stat icon={<Users size={13} />} label="Members" value={memberCount} />
        <Stat icon={<TreePine size={13} />} label="Max Depth" value={`${tree.maxHeight} levels`} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.625rem', marginTop: '0.25rem' }}>
        <button
          id={`btn-open-tree-${tree.id}`}
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            padding: '0.6rem',
            borderRadius: '9px',
            border: 'none',
            background: 'linear-gradient(135deg, var(--color-primary), #A0522D)',
            color: '#FFF8F0',
            fontSize: '0.82rem',
            fontWeight: 700,
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(123,63,0,0.25)',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Eye size={14} /> Open Tree <ChevronRight size={13} />
        </button>
        <button
          id={`btn-delete-tree-${tree.id}`}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete tree"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0.6rem 0.85rem',
            borderRadius: '9px',
            border: '1px solid rgba(192,57,43,0.25)',
            background: 'rgba(192,57,43,0.06)',
            color: 'var(--color-accent)',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-body)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.12)'; e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(192,57,43,0.06)'; e.currentTarget.style.borderColor = 'rgba(192,57,43,0.25)'; }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

function PersonPill({ person }) {
  if (!person) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{
        width: '28px', height: '28px', borderRadius: '50%',
        background: person.gender === 'female'
          ? 'linear-gradient(135deg, #FFB6C1, #FF8FAB)'
          : 'linear-gradient(135deg, #87CEEB, #4682B4)',
        border: '1.5px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.7rem', color: '#fff', fontWeight: 700,
        overflow: 'hidden', flexShrink: 0,
      }}>
        {person.profilePhoto
          ? <img src={person.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : person.name?.charAt(0)?.toUpperCase() || '?'
        }
      </div>
      <span style={{ color: 'var(--color-text)', fontSize: '0.82rem', fontWeight: 600 }}>
        {person.name}
      </span>
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
      <span style={{ color: 'var(--color-muted)' }}>{icon}</span>
      <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>{label}:</span>
      <span style={{ color: 'var(--color-text)', fontSize: '0.75rem', fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function AddNewCard({ onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      style={{
        border: `2px dashed ${hovered ? 'var(--color-border)' : 'rgba(212,169,106,0.4)'}`,
        borderRadius: '16px',
        padding: '1.75rem',
        cursor: 'pointer',
        transition: 'all 0.25s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        minHeight: '200px',
        background: hovered ? 'rgba(212,169,106,0.05)' : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: '52px', height: '52px', borderRadius: '50%',
        background: hovered ? 'linear-gradient(135deg, var(--color-primary), #A0522D)' : 'rgba(212,169,106,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.25s',
      }}>
        <Plus size={24} color={hovered ? '#FFF8F0' : 'var(--color-border)'} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: 'var(--font-display)',
          color: hovered ? 'var(--color-primary)' : 'var(--color-muted)',
          fontSize: '1rem',
          fontWeight: 600,
          transition: 'color 0.2s',
        }}>Add New Family</p>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
          Start a new family tree
        </p>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onCreateNew }) {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
      {/* Decorative tree illustration */}
      <div style={{
        width: '120px', height: '120px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #FDF0E0, #F5DEB3)',
        border: '3px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '3.5rem', margin: '0 auto 2rem',
        boxShadow: '0 8px 32px rgba(123,63,0,0.12)',
      }}>
        🌳
      </div>

      <h2 style={{
        fontFamily: 'var(--font-display)',
        color: 'var(--color-primary)',
        fontSize: '2rem',
        fontWeight: 700,
        marginBottom: '0.75rem',
      }}>
        Your Story Starts Here
      </h2>
      <p style={{
        color: 'var(--color-muted)',
        fontSize: '1rem',
        maxWidth: '420px',
        margin: '0 auto 2.5rem',
        lineHeight: 1.7,
      }}>
        Create your first family tree to begin mapping your family's legacy across generations.
      </p>

      <button
        id="btn-create-first-tree"
        onClick={onCreateNew}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
          padding: '0.875rem 2rem',
          borderRadius: '12px',
          border: 'none',
          background: 'linear-gradient(135deg, var(--color-primary), #A0522D)',
          color: '#FFF8F0',
          fontSize: '1rem',
          fontWeight: 700,
          fontFamily: 'var(--font-body)',
          boxShadow: '0 4px 16px rgba(123,63,0,0.35)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(123,63,0,0.45)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(123,63,0,0.35)'; }}
      >
        <Plus size={20} /> Create Your First Family Tree
      </button>
    </div>
  );
}
