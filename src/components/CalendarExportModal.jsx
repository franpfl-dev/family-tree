/**
 * CalendarExportModal.jsx
 * Modal for exporting family events as a .ics calendar file.
 *
 * Three tabs: All Trees / By Tree / By Person
 * Shows event counts and a big download button.
 * Includes collapsible "How to import?" instructions for Google/Apple/Outlook.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Download, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { collectEvents, countEventTypes, buildICS, downloadICS } from '../utils/icsExport';

const TABS = ['All Trees', 'By Tree', 'By Person'];

export default function CalendarExportModal({ onClose, defaultPersonId = null, defaultTab = null, defaultTreeId = null }) {
  const { state } = useAppContext();
  const { persons, trees } = state;

  const [activeTab, setActiveTab] = useState(
    defaultPersonId ? 'By Person' : defaultTab ? defaultTab : 'All Trees'
  );
  const [selectedTreeId, setSelectedTreeId] = useState(defaultTreeId || trees[0]?.id || '');
  const [personQuery, setPersonQuery] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState(defaultPersonId || '');
  const [showHowTo, setShowHowTo] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'By Person') searchRef.current?.focus();
  }, [activeTab]);

  // ── Filter persons for search ─────────────────────────────────────────────
  const personResults = useMemo(() => {
    if (!personQuery.trim()) return [];
    const q = personQuery.toLowerCase();
    return persons.filter((p) => !p.isPlaceholder && p.name?.toLowerCase().includes(q)).slice(0, 8);
  }, [persons, personQuery]);

  // ── Collect events based on active tab ───────────────────────────────────
  const events = useMemo(() => {
    if (activeTab === 'All Trees') return collectEvents(persons, trees);
    if (activeTab === 'By Tree') {
      const filtered = persons.filter((p) => p.treeId === selectedTreeId);
      return collectEvents(filtered, trees);
    }
    if (activeTab === 'By Person' && selectedPersonId) {
      const person = persons.find((p) => p.id === selectedPersonId);
      if (!person) return [];
      // Include spouse's anniversary too
      const personList = [person];
      return collectEvents(personList, trees);
    }
    return [];
  }, [activeTab, persons, trees, selectedTreeId, selectedPersonId]);

  const counts = useMemo(() => countEventTypes(events), [events]);
  const totalEvents = counts.birthday + counts.anniversary + counts.remembrance;

  function handleDownload() {
    if (events.length === 0) return;
    const ics = buildICS(events);
    const today = new Date().toISOString().split('T')[0];
    downloadICS(ics, `FamilyTree_Calendar_${today}.ics`);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(44,26,14,0.45)',
          zIndex: 900, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Export to Calendar"
        className="modal-fullscreen-mobile"
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '100%', maxWidth: '520px',
          maxHeight: '90vh',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '18px',
          boxShadow: '0 20px 60px rgba(44,26,14,0.28)',
          zIndex: 901,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem 0',
          borderBottom: '1px solid rgba(212,169,106,0.2)',
          paddingBottom: '1rem',
          background: 'linear-gradient(135deg, rgba(253,240,224,0.6), rgba(255,248,240,0.9))',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--color-primary), #A0522D)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem',
              }}>📅</div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '1.15rem', fontWeight: 700 }}>
                  Export to Calendar
                </h2>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.72rem' }}>
                  Download a .ics file for Google Calendar, Apple Calendar, or Outlook
                </p>
              </div>
            </div>
            <button onClick={onClose} style={{
              width: '32px', height: '32px', borderRadius: '50%', border: 'none',
              background: 'rgba(212,169,106,0.1)', color: 'var(--color-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.25rem', marginTop: '1rem' }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setDownloaded(false); }}
                style={{
                  flex: 1, padding: '0.45rem 0.5rem',
                  borderRadius: '8px', border: 'none',
                  background: activeTab === tab
                    ? 'linear-gradient(135deg, var(--color-primary), #A0522D)'
                    : 'rgba(212,169,106,0.1)',
                  color: activeTab === tab ? '#FFF8F0' : 'var(--color-muted)',
                  fontSize: '0.76rem', fontWeight: 600,
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >{tab}</button>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>

          {/* Tab: By Tree */}
          {activeTab === 'By Tree' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: 'var(--color-muted)', fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                Select family tree
              </label>
              <select
                value={selectedTreeId}
                onChange={(e) => { setSelectedTreeId(e.target.value); setDownloaded(false); }}
                style={{
                  width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                  border: '1.5px solid rgba(212,169,106,0.45)',
                  background: 'var(--color-bg)', color: 'var(--color-text)',
                  fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                }}
              >
                {trees.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Tab: By Person */}
          {activeTab === 'By Person' && (
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <label style={{ display: 'block', color: 'var(--color-muted)', fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                Search person
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
                <input
                  ref={searchRef}
                  value={personQuery}
                  onChange={(e) => { setPersonQuery(e.target.value); setSelectedPersonId(''); setDownloaded(false); }}
                  placeholder="Type a name…"
                  style={{
                    width: '100%', padding: '0.6rem 0.75rem 0.6rem 2rem',
                    borderRadius: '8px', border: '1.5px solid rgba(212,169,106,0.45)',
                    background: 'var(--color-bg)', color: 'var(--color-text)',
                    fontSize: '0.875rem', fontFamily: 'var(--font-body)',
                  }}
                />
              </div>
              {personResults.length > 0 && !selectedPersonId && (
                <div style={{
                  marginTop: '4px', borderRadius: '8px', border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)', overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(44,26,14,0.12)',
                }}>
                  {personResults.map((p) => {
                    const tree = trees.find((t) => t.id === p.treeId);
                    return (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPersonId(p.id); setPersonQuery(p.name); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                          padding: '0.5rem 0.75rem', border: 'none',
                          background: 'transparent', cursor: 'pointer', textAlign: 'left',
                          borderBottom: '1px solid rgba(212,169,106,0.1)',
                          fontFamily: 'var(--font-body)',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212,169,106,0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                          background: p.gender === 'female' ? 'linear-gradient(135deg,#FFB6C1,#FF8FAB)' : 'linear-gradient(135deg,#87CEEB,#4682B4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: '0.75rem', fontWeight: 700, overflow: 'hidden',
                        }}>
                          {p.profilePhoto
                            ? <img src={p.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : p.name?.charAt(0)?.toUpperCase()
                          }
                        </div>
                        <div>
                          <p style={{ color: 'var(--color-text)', fontSize: '0.82rem', fontWeight: 600 }}>{p.name}</p>
                          <p style={{ color: 'var(--color-muted)', fontSize: '0.68rem' }}>{tree?.name}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Event count summary */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(253,240,224,0.7), rgba(255,248,240,0.9))',
            border: '1px solid rgba(212,169,106,0.3)',
            borderRadius: '12px', padding: '1rem',
            marginBottom: '1.25rem',
          }}>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
              Events to export
            </p>
            {totalEvents === 0 ? (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                {activeTab === 'By Person' && !selectedPersonId ? 'Search for a person above' : 'No events found'}
              </p>
            ) : (
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                <CountChip emoji="🎂" label="Birthdays" count={counts.birthday} />
                <CountChip emoji="💍" label="Anniversaries" count={counts.anniversary} />
                <CountChip emoji="🕯️" label="Remembrances" count={counts.remembrance} />
              </div>
            )}
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={totalEvents === 0}
            style={{
              width: '100%', padding: '0.9rem',
              borderRadius: '12px', border: 'none',
              background: totalEvents === 0
                ? 'rgba(212,169,106,0.15)'
                : downloaded
                  ? 'linear-gradient(135deg, #27AE60, #1E8449)'
                  : 'linear-gradient(135deg, var(--color-primary), #A0522D)',
              color: totalEvents === 0 ? 'var(--color-muted)' : '#FFF8F0',
              fontSize: '1rem', fontWeight: 700,
              fontFamily: 'var(--font-body)', cursor: totalEvents === 0 ? 'default' : 'pointer',
              boxShadow: totalEvents === 0 ? 'none' : '0 4px 16px rgba(123,63,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              transition: 'all 0.2s',
              marginBottom: '0.75rem',
            }}
          >
            {downloaded ? '✅ Downloaded!' : (<><Download size={18} /> Download .ics file ({totalEvents} events)</>)}
          </button>

          <p style={{ textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.73rem', marginBottom: '1.25rem' }}>
            Open this file with Google Calendar, Apple Calendar, or Outlook to import all reminders automatically.
          </p>

          {/* App icon hints */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <AppHint label="Google Calendar" emoji="📅" />
            <AppHint label="Apple Calendar" emoji="🍎" />
            <AppHint label="Outlook" emoji="📧" />
          </div>

          {/* How to import — collapsible */}
          <div style={{
            border: '1px solid rgba(212,169,106,0.25)',
            borderRadius: '10px', overflow: 'hidden',
          }}>
            <button
              onClick={() => setShowHowTo(!showHowTo)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1rem', border: 'none', background: 'rgba(212,169,106,0.06)',
                color: 'var(--color-primary)', fontFamily: 'var(--font-body)',
                fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              How to import?
              {showHowTo ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {showHowTo && (
              <div style={{ padding: '1rem', background: 'rgba(253,246,236,0.5)' }}>
                <HowToSection
                  title="📅 Google Calendar"
                  steps={[
                    'Open Google Calendar on desktop',
                    'Click Settings gear → Import & Export',
                    'Click Import → select the downloaded .ics file',
                    'Choose which calendar to add events to',
                    'Click Import',
                  ]}
                />
                <HowToSection
                  title="🍎 Apple Calendar"
                  steps={[
                    'Open the .ics file on your iPhone or Mac',
                    'Tap "Add All" when prompted',
                  ]}
                />
                <HowToSection
                  title="📧 Outlook"
                  steps={[
                    'Open Outlook → File → Open & Export',
                    'Import/Export → Import an iCalendar file',
                    'Select the downloaded .ics file',
                  ]}
                  last
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function CountChip({ emoji, label, count }) {
  if (count === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
      <span>{emoji}</span>
      <span style={{ color: 'var(--color-text)', fontWeight: 700, fontSize: '1rem' }}>{count}</span>
      <span style={{ color: 'var(--color-muted)', fontSize: '0.78rem' }}>{label}</span>
    </div>
  );
}

function AppHint({ emoji, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px',
        background: 'rgba(212,169,106,0.1)', border: '1px solid rgba(212,169,106,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem',
      }}>{emoji}</div>
      <span style={{ color: 'var(--color-muted)', fontSize: '0.65rem', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

function HowToSection({ title, steps, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : '1rem' }}>
      <p style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.82rem', marginBottom: '0.4rem' }}>{title}</p>
      <ol style={{ paddingLeft: '1.25rem', margin: 0 }}>
        {steps.map((s, i) => (
          <li key={i} style={{ color: 'var(--color-muted)', fontSize: '0.78rem', marginBottom: '0.2rem', lineHeight: 1.5 }}>{s}</li>
        ))}
      </ol>
    </div>
  );
}
