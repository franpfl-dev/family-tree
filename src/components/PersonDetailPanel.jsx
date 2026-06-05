/**
 * PersonDetailPanel.jsx
 * Slide-in panel from the right to view/edit a person's details.
 * Sections: Personal Info, Marriage Info, Cross-Links
 */

import { useState, useRef } from 'react';
import { X, Upload, Heart, Link2, Trash2, Plus, ExternalLink } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { formatDateFull, getTreeName } from '../utils/familyUtils';

export default function PersonDetailPanel({ person, tree, onClose, onOpenCrossLinkModal }) {
  const { state, updatePerson, removeCrossLink, pushHistory, setActiveTree } = useAppContext();
  const { persons, trees } = state;
  const navigate = useNavigate();
  const photoRef = useRef(null);

  // Local form state
  const [form, setForm] = useState({
    name: person.name || '',
    gender: person.gender || 'other',
    dob: person.dob || '',
    hasDod: !!person.dod,
    dod: person.dod || '',
    profilePhoto: person.profilePhoto || null,
    anniversaryDate: person.anniversaryDate || '',
  });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const spouse = person.spouseId ? persons.find(p => p.id === person.spouseId) : null;
  const crossLinks = (person.crossLinks || []).map(cl => {
    const linked = persons.find(p => p.id === cl.targetPersonId);
    return { ...cl, linkedPerson: linked };
  }).filter(cl => cl.linkedPerson);

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }));
    setDirty(true);
    setSaved(false);
  }

  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => { update('profilePhoto', evt.target.result); };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleSave() {
    updatePerson(person.id, {
      name: form.name.trim() || person.name,
      gender: form.gender,
      dob: form.dob,
      dod: form.hasDod ? form.dod : null,
      profilePhoto: form.profilePhoto,
      anniversaryDate: form.anniversaryDate || null,
    });
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleRemoveCrossLink(targetPersonId) {
    removeCrossLink(person.id, targetPersonId);
  }

  function handleNavigateToCrossLink(linkedPerson) {
    pushHistory(tree.id);
    setActiveTree(linkedPerson.treeId);
    navigate(`/tree/${linkedPerson.treeId}?highlight=${linkedPerson.id}`);
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(44,26,14,0.35)',
          backdropFilter: 'blur(2px)',
          zIndex: 200,
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: '420px',
        maxWidth: '100vw',
        background: 'var(--color-surface)',
        borderLeft: '1px solid var(--color-border)',
        boxShadow: '-8px 0 32px rgba(44,26,14,0.18)',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.3s ease',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(212,169,106,0.25)',
          background: 'linear-gradient(135deg, rgba(253,240,224,0.8), rgba(255,248,240,0.95))',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '1.2rem', fontWeight: 700 }}>
              {person.isPlaceholder ? 'Fill In Details' : 'Person Details'}
            </h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
              {tree?.name} · Level {person.level}
            </p>
          </div>
          <button onClick={onClose} style={iconBtnStyle}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

          {/* ── Personal Info ──────────────────────────────────────────── */}
          <Section title="Personal Information">
            {/* Photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div
                onClick={() => photoRef.current?.click()}
                style={{
                  width: '84px', height: '84px', borderRadius: '50%',
                  background: form.profilePhoto
                    ? `url(${form.profilePhoto}) center/cover`
                    : form.gender === 'female'
                      ? 'linear-gradient(135deg, #FFB6C1, #FF8FAB)'
                      : 'linear-gradient(135deg, #87CEEB, #4682B4)',
                  border: '2px dashed var(--color-border)',
                  cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '1.5rem', fontWeight: 700,
                }}
              >
                {!form.profilePhoto && (form.name?.charAt(0)?.toUpperCase() || '?')}
              </div>
              <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              <div>
                <button type="button" onClick={() => photoRef.current?.click()} style={outlineBtnStyle}>
                  <Upload size={13} /> Change Photo
                </button>
                {form.profilePhoto && (
                  <button type="button" onClick={() => update('profilePhoto', null)} style={{ ...outlineBtnStyle, marginTop: '4px', color: 'var(--color-accent)', borderColor: 'rgba(192,57,43,0.3)' }}>
                    <X size={13} /> Remove
                  </button>
                )}
              </div>
            </div>

            <PanelField label="Full Name *" id="pd-name">
              <input
                id="pd-name"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                style={inputStyle}
              />
            </PanelField>

            <PanelField label="Gender" id="pd-gender">
              <select id="pd-gender" value={form.gender} onChange={e => update('gender', e.target.value)} style={inputStyle}>
                <option value="male">👨 Male</option>
                <option value="female">👩 Female</option>
                <option value="other">🧑 Other</option>
              </select>
            </PanelField>

            <PanelField label="Date of Birth" id="pd-dob">
              <input id="pd-dob" type="date" value={form.dob} onChange={e => update('dob', e.target.value)} style={inputStyle} />
            </PanelField>

            <ToggleRow
              label="Deceased"
              value={form.hasDod}
              onChange={v => update('hasDod', v)}
            />
            {form.hasDod && (
              <PanelField label="Date of Death" id="pd-dod">
                <input id="pd-dod" type="date" value={form.dod} onChange={e => update('dod', e.target.value)} style={inputStyle} />
              </PanelField>
            )}
          </Section>

          {/* ── Marriage Info ───────────────────────────────────────────── */}
          {spouse && (
            <Section title="Marriage" icon={<Heart size={14} color="var(--color-accent)" />}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.75rem', borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(253,240,224,0.5), rgba(255,248,240,0.8))',
                border: '1px solid rgba(212,169,106,0.25)',
                marginBottom: '0.75rem',
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: spouse.gender === 'female' ? 'linear-gradient(135deg, #FFB6C1, #FF8FAB)' : 'linear-gradient(135deg, #87CEEB, #4682B4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '0.9rem', fontWeight: 700, flexShrink: 0,
                  border: '1.5px solid var(--color-border)', overflow: 'hidden',
                }}>
                  {spouse.profilePhoto
                    ? <img src={spouse.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : spouse.name?.charAt(0)?.toUpperCase()
                  }
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.875rem' }}>{spouse.name}</p>
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.72rem' }}>
                    {getTreeName(spouse, trees)} · {spouse.dob ? `b. ${formatDateFull(spouse.dob)}` : 'DOB unknown'}
                  </p>
                </div>
              </div>

              <PanelField label="Wedding Anniversary" id="pd-anniversary">
                <input
                  id="pd-anniversary"
                  type="date"
                  value={form.anniversaryDate}
                  onChange={e => update('anniversaryDate', e.target.value)}
                  style={inputStyle}
                />
              </PanelField>
            </Section>
          )}

          {/* ── Cross-Links ─────────────────────────────────────────────── */}
          <Section title="Cross-Links" icon={<Link2 size={14} color="var(--color-link)" />}>
            {crossLinks.length === 0 ? (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.82rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                No cross-links yet. Link this person to relatives in other trees.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {crossLinks.map(cl => (
                  <CrossLinkRow
                    key={cl.targetPersonId}
                    link={cl}
                    trees={trees}
                    onRemove={() => handleRemoveCrossLink(cl.targetPersonId)}
                    onNavigate={() => handleNavigateToCrossLink(cl.linkedPerson)}
                  />
                ))}
              </div>
            )}

            <button
              id="btn-add-crosslink-from-panel"
              onClick={() => onOpenCrossLinkModal && onOpenCrossLinkModal(person)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '8px',
                border: '1px dashed var(--color-link)',
                background: 'rgba(26,107,138,0.05)',
                color: 'var(--color-link)',
                fontSize: '0.82rem',
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                width: '100%',
                justifyContent: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,107,138,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(26,107,138,0.05)'}
            >
              <Plus size={14} /> Add Cross-Link
            </button>
          </Section>
        </div>

        {/* Footer buttons */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(212,169,106,0.2)',
          display: 'flex', gap: '0.75rem', flexShrink: 0,
          background: 'var(--color-surface)',
        }}>
          <button onClick={onClose} style={{ ...outlineBtnStyle, flex: 1, padding: '0.65rem', justifyContent: 'center', fontSize: '0.875rem' }}>
            Cancel
          </button>
          <button
            id="btn-save-person"
            onClick={handleSave}
            disabled={!dirty}
            style={{
              flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              padding: '0.65rem',
              borderRadius: '9px', border: 'none',
              background: saved
                ? 'linear-gradient(135deg, #27AE60, #1E8449)'
                : dirty
                  ? 'linear-gradient(135deg, var(--color-primary), #A0522D)'
                  : 'rgba(212,169,106,0.2)',
              color: dirty || saved ? '#FFF8F0' : 'var(--color-muted)',
              fontSize: '0.875rem', fontWeight: 700, fontFamily: 'var(--font-body)',
              cursor: dirty ? 'pointer' : 'default',
              transition: 'all 0.2s',
            }}
          >
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(40px) } to { opacity: 1; transform: none } }
      `}</style>
    </>
  );
}

function CrossLinkRow({ link, trees, onRemove, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  const person = link.linkedPerson;
  const treeName = getTreeName(person, trees);

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        padding: '0.6rem 0.75rem',
        borderRadius: '9px',
        border: '1px solid rgba(26,107,138,0.2)',
        background: hovered ? 'rgba(26,107,138,0.05)' : 'rgba(26,107,138,0.02)',
        transition: 'background 0.15s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '50%',
        background: person.gender === 'female' ? 'linear-gradient(135deg, #FFB6C1, #FF8FAB)' : 'linear-gradient(135deg, #87CEEB, #4682B4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '0.82rem', fontWeight: 700, flexShrink: 0,
        overflow: 'hidden',
      }}>
        {person.profilePhoto
          ? <img src={person.profilePhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : person.name?.charAt(0)?.toUpperCase()
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, color: 'var(--color-text)', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {person.name}
        </p>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.68rem' }}>
          {link.relationshipLabel} · {treeName}
        </p>
      </div>
      <button
        onClick={onNavigate}
        title={`Go to ${person.name}'s tree`}
        style={{ ...iconBtnStyle, color: 'var(--color-link)', padding: '4px' }}
      >
        <ExternalLink size={13} />
      </button>
      <button
        onClick={onRemove}
        title="Remove cross-link"
        style={{ ...iconBtnStyle, color: 'var(--color-accent)', padding: '4px' }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ── Shared Primitives ─────────────────────────────────────────────────────────
function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.875rem' }}>
        {icon}
        <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '0.95rem', fontWeight: 700 }}>
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}

function PanelField({ label, id, children }) {
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <label htmlFor={id} style={{ display: 'block', color: 'var(--color-text)', fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.3rem' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', cursor: 'pointer', marginBottom: '0.25rem' }}
    >
      <span style={{ color: 'var(--color-text)', fontSize: '0.82rem', fontWeight: 600 }}>{label}</span>
      <div style={{
        width: '40px', height: '22px', borderRadius: '11px',
        background: value ? 'linear-gradient(135deg, var(--color-primary), #A0522D)' : 'rgba(212,169,106,0.3)',
        position: 'relative', transition: 'background 0.25s', flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: '3px', left: value ? '20px' : '3px',
          width: '16px', height: '16px', borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.25s',
        }} />
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%', padding: '0.55rem 0.75rem',
  borderRadius: '8px', border: '1.5px solid rgba(212,169,106,0.5)',
  background: 'var(--color-bg)', color: 'var(--color-text)',
  fontSize: '0.875rem', fontFamily: 'var(--font-body)', outline: 'none',
};

const iconBtnStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: 'var(--color-muted)', borderRadius: '6px', padding: '6px',
  transition: 'all 0.15s',
};

const outlineBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  padding: '0.4rem 0.75rem', borderRadius: '7px',
  border: '1px solid var(--color-border)', background: 'transparent',
  color: 'var(--color-muted)', fontSize: '0.78rem', fontWeight: 600,
  fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all 0.2s',
};
