/**
 * AddSpouseModal.jsx
 * Modal to add or link a spouse for a person.
 * Two tabs: "Create New" person, or "Link Existing" person from any tree.
 */

import { useState } from 'react';
import { Heart, Search, UserPlus, Link2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { searchPersons, getTreeName, generateId } from '../utils/familyUtils';
import { Modal, FormField, ToggleRow, inputStyle, primaryBtnStyle, cancelBtnStyle } from './modalShared';

export default function AddSpouseModal({ person, tree, onClose }) {
  const { state, addPerson, linkSpouse } = useAppContext();
  const { persons, trees } = state;

  const [tab, setTab] = useState('create');

  // Create new spouse form
  const [form, setForm] = useState({
    name: '',
    gender: person.gender === 'male' ? 'female' : 'male',
    dob: '',
    hasDod: false,
    dod: '',
    anniversaryDate: '',
  });
  const [errors, setErrors] = useState({});

  // Link existing
  const [query, setQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [anniversaryDate, setAnniversaryDate] = useState('');

  function update(field, value) { setForm(f => ({ ...f, [field]: value })); }

  const searchResults = query.trim().length >= 2
    ? searchPersons(query, persons).filter(p =>
        p.id !== person.id && !p.spouseId && p.id !== person.spouseId
      )
    : [];

  function handleCreateSubmit() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (person.spouseId) errs.general = 'This person already has a spouse. Remove the existing spouse first.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const newSpouseId = generateId();

    addPerson({
      person: {
        id: newSpouseId,
        name: form.name.trim(),
        gender: form.gender,
        dob: form.dob,
        dod: form.hasDod ? form.dod : null,
        anniversaryDate: form.anniversaryDate || null,
        spouseId: person.id,
      },
      parentId: null,
      treeId: tree.id,
      level: person.level,
      spouseOfId: person.id,
    });
    onClose();
  }

  function handleLinkSubmit() {
    if (!selectedPerson) { setErrors({ link: 'Please select a person to link.' }); return; }
    if (person.spouseId) { setErrors({ link: 'This person already has a spouse.' }); return; }
    linkSpouse(person.id, selectedPerson.id, anniversaryDate || null);
    onClose();
  }

  return (
    <Modal
      title={person.spouseId ? 'Edit Spouse' : 'Add / Link Spouse'}
      subtitle={`For: ${person.name}`}
      icon={<Heart size={18} color="var(--color-accent)" />}
      onClose={onClose}
    >
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'rgba(212,169,106,0.1)', borderRadius: '10px', padding: '4px' }}>
        <TabBtn id="tab-create-spouse" active={tab === 'create'} onClick={() => setTab('create')} icon={<UserPlus size={14} />} label="Create New" />
        <TabBtn id="tab-link-spouse" active={tab === 'link'} onClick={() => setTab('link')} icon={<Link2 size={14} />} label="Link Existing" />
      </div>

      {errors.general && (
        <div style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: '8px', padding: '0.625rem 0.875rem', marginBottom: '1rem', color: 'var(--color-accent)', fontSize: '0.82rem' }}>
          {errors.general}
        </div>
      )}

      {/* Create New tab */}
      {tab === 'create' && (
        <div>
          <FormField label="Full Name *" id="sp-name" error={errors.name}>
            <input id="sp-name" autoFocus value={form.name} onChange={e => update('name', e.target.value)} placeholder="Spouse's full name" style={inputStyle} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <FormField label="Gender" id="sp-gender">
              <select id="sp-gender" value={form.gender} onChange={e => update('gender', e.target.value)} style={inputStyle}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </FormField>
            <FormField label="Date of Birth" id="sp-dob">
              <input id="sp-dob" type="date" value={form.dob} onChange={e => update('dob', e.target.value)} style={inputStyle} />
            </FormField>
          </div>
          <ToggleRow label="Deceased" value={form.hasDod} onChange={v => update('hasDod', v)} />
          {form.hasDod && (
            <FormField label="Date of Death" id="sp-dod">
              <input id="sp-dod" type="date" value={form.dod} onChange={e => update('dod', e.target.value)} style={inputStyle} />
            </FormField>
          )}
          <FormField label="Anniversary Date" id="sp-anniversary">
            <input id="sp-anniversary" type="date" value={form.anniversaryDate} onChange={e => update('anniversaryDate', e.target.value)} style={inputStyle} />
          </FormField>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.72rem', marginBottom: '1rem', lineHeight: 1.6 }}>
            After creating, use "Link Existing" tab or the context menu to link them as spouses.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button id="btn-create-spouse-submit" onClick={handleCreateSubmit} style={primaryBtnStyle}>
              <UserPlus size={15} /> Create Person
            </button>
          </div>
        </div>
      )}

      {/* Link Existing tab */}
      {tab === 'link' && (
        <div>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.82rem', marginBottom: '1rem', lineHeight: 1.6 }}>
            Search for a person already in any tree to link as spouse. Only unlinked persons are shown.
          </p>

          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
            <input
              id="sp-search"
              autoFocus={tab === 'link'}
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedPerson(null); }}
              placeholder="Type name to search..."
              style={{ ...inputStyle, paddingLeft: '2rem' }}
            />
          </div>

          {searchResults.length > 0 && !selectedPerson && (
            <div style={{ border: '1px solid rgba(212,169,106,0.3)', borderRadius: '10px', overflow: 'hidden', marginBottom: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
              {searchResults.map(p => (
                <PersonRow key={p.id} person={p} trees={trees} selected={false} onClick={() => setSelectedPerson(p)} />
              ))}
            </div>
          )}

          {query.length >= 2 && searchResults.length === 0 && !selectedPerson && (
            <p style={{ color: 'var(--color-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '1rem', fontStyle: 'italic' }}>No unlinked persons found.</p>
          )}

          {selectedPerson && (
            <div style={{ background: 'rgba(39,174,96,0.06)', border: '1px solid rgba(39,174,96,0.25)', borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem' }}>
              <p style={{ color: '#1E8449', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                ✓ Selected: {selectedPerson.name} ({getTreeName(selectedPerson, trees)})
              </p>
              <FormField label="Anniversary Date (optional)" id="link-anniversary">
                <input id="link-anniversary" type="date" value={anniversaryDate} onChange={e => setAnniversaryDate(e.target.value)} style={inputStyle} />
              </FormField>
              <button onClick={() => { setSelectedPerson(null); setQuery(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'var(--font-body)' }}>
                Clear selection
              </button>
            </div>
          )}

          {errors.link && <p style={{ color: 'var(--color-accent)', fontSize: '0.78rem', marginBottom: '0.75rem' }}>{errors.link}</p>}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button
              id="btn-link-spouse-submit"
              onClick={handleLinkSubmit}
              disabled={!selectedPerson}
              style={{ ...primaryBtnStyle, opacity: selectedPerson ? 1 : 0.5, cursor: selectedPerson ? 'pointer' : 'default' }}
            >
              <Link2 size={15} /> Link as Spouse
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function TabBtn({ id, active, onClick, icon, label }) {
  return (
    <button
      id={id}
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
        padding: '0.5rem', borderRadius: '8px', border: 'none',
        background: active ? 'var(--color-surface)' : 'transparent',
        color: active ? 'var(--color-primary)' : 'var(--color-muted)',
        fontSize: '0.82rem', fontWeight: active ? 700 : 500,
        fontFamily: 'var(--font-body)', cursor: 'pointer',
        boxShadow: active ? '0 1px 6px rgba(123,63,0,0.12)' : 'none',
        transition: 'all 0.2s',
      }}
    >
      {icon} {label}
    </button>
  );
}

function PersonRow({ person, trees, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        padding: '0.625rem 0.875rem',
        background: hovered ? 'rgba(212,169,106,0.08)' : 'transparent',
        borderBottom: '1px solid rgba(212,169,106,0.15)',
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      <div style={{
        width: '30px', height: '30px', borderRadius: '50%',
        background: person.gender === 'female' ? 'linear-gradient(135deg, #FFB6C1, #FF8FAB)' : 'linear-gradient(135deg, #87CEEB, #4682B4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
      }}>
        {person.name?.charAt(0)?.toUpperCase()}
      </div>
      <div>
        <p style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.82rem' }}>{person.name}</p>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.68rem' }}>{getTreeName(person, trees)} · Level {person.level}</p>
      </div>
    </div>
  );
}
