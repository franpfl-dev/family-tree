/**
 * CrossLinkModal.jsx
 * Modal to add a cross-link between persons across different trees.
 * 4D from CLAUDE.md: search all persons, select relationship label, dispatch ADD_CROSS_LINK.
 */

import React, { useState } from 'react';
import { Search, Link2, ChevronDown } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { searchPersons, getTreeName } from '../utils/familyUtils';
import { Modal, FormField, inputStyle, primaryBtnStyle, cancelBtnStyle } from './modalShared';

const RELATIONSHIP_SUGGESTIONS = [
  "Wife's Brother",
  "Wife's Sister",
  "Husband's Brother",
  "Husband's Sister",
  "Maternal Uncle",
  "Paternal Uncle",
  "Maternal Aunt",
  "Paternal Aunt",
  "Cousin",
  "Family Friend",
  "Brother-in-Law",
  "Sister-in-Law",
  "Nephew",
  "Niece",
  "Grandfather",
  "Grandmother",
  "Other",
];

export default function CrossLinkModal({ person, onClose }) {
  const { state, addCrossLink } = useAppContext();
  const { persons, trees } = state;

  const [query, setQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [relationshipLabel, setRelationshipLabel] = useState('');
  const [isCustomLabel, setIsCustomLabel] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [errors, setErrors] = useState({});

  const alreadyLinkedIds = new Set((person.crossLinks || []).map(cl => cl.targetPersonId));

  const searchResults = query.trim().length >= 2 && !selectedPerson
    ? searchPersons(query, persons).filter(p =>
        p.id !== person.id && !alreadyLinkedIds.has(p.id)
      )
    : [];

  function handleSelect(p) {
    setSelectedPerson(p);
    setQuery(p.name);
    setErrors({});
  }

  function handleRelationshipChange(e) {
    const val = e.target.value;
    setRelationshipLabel(val);
    setIsCustomLabel(val === 'Other');
    if (val !== 'Other') setCustomLabel('');
  }

  function handleSubmit() {
    const errs = {};
    if (!selectedPerson) errs.person = 'Please select a person to link.';
    const finalLabel = isCustomLabel ? customLabel.trim() : relationshipLabel;
    if (!finalLabel) errs.label = 'Please select or enter a relationship label.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    addCrossLink(person.id, selectedPerson.id, finalLabel);
    onClose();
  }

  return (
    <Modal
      title="Add Cross-Link"
      subtitle={`From: ${person.name} (${getTreeName(person, trees)})`}
      icon={<Link2 size={18} color="var(--color-link)" />}
      onClose={onClose}
    >
      <p style={{ color: 'var(--color-muted)', fontSize: '0.82rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
        Link this person to a relative in any other tree. Cross-links let you navigate between related families.
      </p>

      {/* Person search */}
      <FormField label="Search Person" id="cl-search" error={errors.person}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
          <input
            id="cl-search"
            autoFocus
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedPerson(null); setErrors({}); }}
            placeholder="Type name to search all trees..."
            style={{ ...inputStyle, paddingLeft: '2rem' }}
          />
        </div>
      </FormField>

      {/* Live search results */}
      {searchResults.length > 0 && (
        <div style={{
          border: '1px solid rgba(212,169,106,0.3)', borderRadius: '10px', overflow: 'hidden',
          marginBottom: '1rem', marginTop: '-0.5rem', maxHeight: '200px', overflowY: 'auto',
          boxShadow: 'var(--shadow-node)',
        }}>
          {searchResults.map(p => (
            <ResultRow key={p.id} person={p} treeName={getTreeName(p, trees)} onClick={() => handleSelect(p)} />
          ))}
        </div>
      )}

      {query.trim().length >= 2 && !selectedPerson && searchResults.length === 0 && (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '1rem', textAlign: 'center' }}>No persons found.</p>
      )}

      {/* Selected person chip */}
      {selectedPerson && (
        <div style={{
          background: 'rgba(26,107,138,0.06)', border: '1px solid rgba(26,107,138,0.25)',
          borderRadius: '10px', padding: '0.75rem', marginBottom: '1rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: selectedPerson.gender === 'female' ? 'linear-gradient(135deg, #FFB6C1, #FF8FAB)' : 'linear-gradient(135deg, #87CEEB, #4682B4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '0.9rem', fontWeight: 700, flexShrink: 0,
          }}>
            {selectedPerson.name?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: 'var(--color-link)', fontSize: '0.875rem' }}>{selectedPerson.name}</p>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.7rem' }}>{getTreeName(selectedPerson, trees)}</p>
          </div>
          <button onClick={() => { setSelectedPerson(null); setQuery(''); }} style={{ background: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>
            ✕
          </button>
        </div>
      )}

      {/* Relationship dropdown */}
      <FormField label="Relationship Label" id="cl-relationship" error={errors.label}>
        <div style={{ position: 'relative' }}>
          <select
            id="cl-relationship"
            value={relationshipLabel}
            onChange={handleRelationshipChange}
            style={{ ...inputStyle, appearance: 'none', paddingRight: '2rem' }}
          >
            <option value="">— Select relationship —</option>
            {RELATIONSHIP_SUGGESTIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <ChevronDown size={15} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
        </div>
      </FormField>

      {isCustomLabel && (
        <FormField label="Custom Relationship" id="cl-custom">
          <input
            id="cl-custom"
            autoFocus
            value={customLabel}
            onChange={e => setCustomLabel(e.target.value)}
            placeholder='e.g. "Second Cousin", "Step-Brother"'
            style={inputStyle}
          />
        </FormField>
      )}

      {selectedPerson && relationshipLabel && (
        <div style={{
          background: 'rgba(212,169,106,0.08)', border: '1px solid rgba(212,169,106,0.25)',
          borderRadius: '8px', padding: '0.625rem 0.875rem', marginBottom: '0.75rem',
          fontSize: '0.8rem', color: 'var(--color-text)', lineHeight: 1.6,
        }}>
          <strong>{person.name}</strong> is <em>{isCustomLabel ? (customLabel || '…') : relationshipLabel}</em> of <strong>{selectedPerson.name}</strong>
          <br />
          <span style={{ color: 'var(--color-muted)', fontSize: '0.72rem' }}>A bidirectional link will be added to both persons.</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
        <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
        <button id="btn-crosslink-submit" onClick={handleSubmit} style={primaryBtnStyle}>
          <Link2 size={15} /> Link Persons
        </button>
      </div>
    </Modal>
  );
}

function ResultRow({ person, treeName, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        padding: '0.625rem 0.875rem',
        background: hovered ? 'rgba(26,107,138,0.07)' : 'transparent',
        borderBottom: '1px solid rgba(212,169,106,0.12)',
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      <div style={{
        width: '30px', height: '30px', borderRadius: '50%',
        background: person.gender === 'female' ? 'linear-gradient(135deg, #FFB6C1, #FF8FAB)' : 'linear-gradient(135deg, #87CEEB, #4682B4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0,
      }}>
        {person.name?.charAt(0)?.toUpperCase()}
      </div>
      <div>
        <p style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.82rem' }}>{person.name}</p>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.68rem' }}>
          {treeName}
          {person.crossLinks?.length > 0 && ` · ${person.crossLinks.length} links`}
        </p>
      </div>
    </div>
  );
}
