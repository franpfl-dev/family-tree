/**
 * NewTreeWizard.jsx
 * Multi-step form to create a new family tree.
 * Step 1: Tree Name
 * Step 2: Root Person + optional spouse + number of children
 * Step 3: Review & Confirm
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Check, TreePine, Heart,
  User, Upload, CalendarDays, Users, X,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatDateFull } from '../utils/familyUtils';

const TOTAL_STEPS = 3;

const emptyRootPerson = {
  name: '',
  gender: 'male',
  dob: '',
  hasDod: false,
  dod: '',
  profilePhoto: null,
};

const emptySpouse = {
  name: '',
  gender: 'female',
  dob: '',
  hasDod: false,
  dod: '',
  anniversaryDate: '',
};

export default function NewTreeWizard() {
  const navigate = useNavigate();
  const { createTree } = useAppContext();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  // Step 1 data
  const [treeName, setTreeName] = useState('');

  // Step 2 data
  const [rootPerson, setRootPerson] = useState({ ...emptyRootPerson });
  const [isMarried, setIsMarried] = useState(false);
  const [spouse, setSpouse] = useState({ ...emptySpouse });
  const [numberOfChildren, setNumberOfChildren] = useState(2);

  // Validation errors
  const [errors, setErrors] = useState({});

  // ── Navigation ──────────────────────────────────────────────────────────────
  function goNext() {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setErrors({});
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function validateStep(s) {
    const errs = {};
    if (s === 1) {
      if (!treeName.trim()) errs.treeName = 'Please enter a family name.';
    }
    if (s === 2) {
      if (!rootPerson.name.trim()) errs.rootName = 'Please enter the root person\'s name.';
      if (isMarried && !spouse.name.trim()) errs.spouseName = 'Please enter the spouse\'s name.';
    }
    return errs;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  function handleCreate() {
    createTree({
      treeName: treeName.trim(),
      rootPerson: {
        name: rootPerson.name.trim(),
        gender: rootPerson.gender,
        dob: rootPerson.dob,
        dod: rootPerson.hasDod ? rootPerson.dod : null,
        profilePhoto: rootPerson.profilePhoto,
      },
      spouseData: isMarried
        ? {
            name: spouse.name.trim(),
            gender: spouse.gender,
            dob: spouse.dob,
            dod: spouse.hasDod ? spouse.dod : null,
            anniversaryDate: spouse.anniversaryDate || null,
          }
        : null,
      numberOfChildren,
    });
    navigate('/');
  }

  // ── Photo upload ────────────────────────────────────────────────────────────
  function handlePhotoUpload(e, target) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (target === 'root') {
        setRootPerson((p) => ({ ...p, profilePhoto: evt.target.result }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: '0 2px 12px rgba(123,63,0,0.08)',
        padding: '0 2rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'transparent', border: 'none',
            color: 'var(--color-muted)', fontSize: '0.875rem',
            cursor: 'pointer', fontFamily: 'var(--font-body)',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-muted)'}
        >
          <ArrowLeft size={16} /> Home
        </button>
        <div style={{ width: '1px', height: '20px', background: 'var(--color-border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TreePine size={18} color="var(--color-primary)" />
          <span style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '1rem', fontWeight: 600 }}>
            New Family Tree
          </span>
        </div>
      </header>

      {/* ── Progress Bar ─────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--color-surface)', padding: '1.5rem 2rem', borderBottom: '1px solid rgba(212,169,106,0.2)' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
        </div>
      </div>

      {/* ── Step Content ─────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '640px', overflow: 'hidden' }}>
          <div style={{ animation: `slideIn${direction > 0 ? 'Right' : 'Left'} 0.3s ease` }}>
            {step === 1 && (
              <Step1TreeInfo
                treeName={treeName}
                setTreeName={setTreeName}
                errors={errors}
              />
            )}
            {step === 2 && (
              <Step2RootPerson
                rootPerson={rootPerson}
                setRootPerson={setRootPerson}
                isMarried={isMarried}
                setIsMarried={setIsMarried}
                spouse={spouse}
                setSpouse={setSpouse}
                numberOfChildren={numberOfChildren}
                setNumberOfChildren={setNumberOfChildren}
                handlePhotoUpload={handlePhotoUpload}
                errors={errors}
              />
            )}
            {step === 3 && (
              <Step3Review
                treeName={treeName}
                rootPerson={rootPerson}
                isMarried={isMarried}
                spouse={spouse}
                numberOfChildren={numberOfChildren}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Navigation ─────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        padding: '1.25rem 2rem',
      }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={step === 1 ? () => navigate('/') : goBack}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.7rem 1.25rem',
              borderRadius: '10px',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-muted)',
              fontSize: '0.9rem',
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <ArrowLeft size={16} /> {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <span style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
            Step {step} of {TOTAL_STEPS}
          </span>

          {step < TOTAL_STEPS ? (
            <button
              id="btn-wizard-next"
              onClick={goNext}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.7rem 1.5rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--color-primary), #A0522D)',
                color: '#FFF8F0',
                fontSize: '0.9rem',
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(123,63,0,0.3)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(123,63,0,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(123,63,0,0.3)'; }}
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              id="btn-wizard-create"
              onClick={handleCreate}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.7rem 1.5rem',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #27AE60, #1E8449)',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(39,174,96,0.35)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(39,174,96,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(39,174,96,0.35)'; }}
            >
              <Check size={16} /> Create Tree
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(40px) } to { opacity: 1; transform: none } }
        @keyframes slideInLeft  { from { opacity: 0; transform: translateX(-40px) } to { opacity: 1; transform: none } }
      `}</style>
    </div>
  );
}

// ─── Step Indicator ────────────────────────────────────────────────────────────
function StepIndicator({ currentStep, totalSteps }) {
  const labels = ['Tree Name', 'Root Person', 'Review'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const done = stepNum < currentStep;
        const active = stepNum === currentStep;
        return (
          <React.Fragment key={stepNum}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: done
                  ? 'linear-gradient(135deg, #27AE60, #1E8449)'
                  : active
                    ? 'linear-gradient(135deg, var(--color-primary), #A0522D)'
                    : 'rgba(212,169,106,0.2)',
                border: done || active ? 'none' : '2px solid rgba(212,169,106,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: done || active ? '#fff' : 'var(--color-muted)',
                fontWeight: 700,
                fontSize: '0.85rem',
                transition: 'all 0.3s',
                boxShadow: active ? '0 2px 10px rgba(123,63,0,0.3)' : 'none',
              }}>
                {done ? <Check size={16} /> : stepNum}
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: active ? 700 : 400,
                color: active ? 'var(--color-primary)' : done ? '#27AE60' : 'var(--color-muted)',
                transition: 'color 0.3s',
                whiteSpace: 'nowrap',
              }}>
                {labels[i]}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div style={{
                flex: 1, height: '2px',
                background: done ? '#27AE60' : 'rgba(212,169,106,0.3)',
                margin: '0 0.5rem', marginBottom: '1.2rem',
                transition: 'background 0.3s',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Step 1: Tree Info ────────────────────────────────────────────────────────
function Step1TreeInfo({ treeName, setTreeName, errors }) {
  return (
    <div>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #FDF0E0, #F5DEB3)',
          border: '2px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', margin: '0 auto 1rem',
          boxShadow: 'var(--shadow-node)',
        }}>🌳</div>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '1.75rem', fontWeight: 700 }}>
          Name Your Family
        </h2>
        <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem', lineHeight: 1.6 }}>
          Give your family tree a name. This is usually the family surname.
        </p>
      </div>

      <FormCard>
        <FormField
          id="inp-tree-name"
          label="Family Tree Name"
          placeholder='e.g. "Sharma Family" or "The Patels"'
          value={treeName}
          onChange={(e) => setTreeName(e.target.value)}
          error={errors.treeName}
          autoFocus
        />
        <p style={{ color: 'var(--color-muted)', fontSize: '0.78rem', marginTop: '0.5rem' }}>
          Tip: You can always rename the tree later.
        </p>
      </FormCard>
    </div>
  );
}

// ─── Step 2: Root Person ──────────────────────────────────────────────────────
function Step2RootPerson({
  rootPerson, setRootPerson,
  isMarried, setIsMarried,
  spouse, setSpouse,
  numberOfChildren, setNumberOfChildren,
  handlePhotoUpload,
  errors,
}) {
  const photoInputRef = useRef(null);

  function updateRoot(field, value) {
    setRootPerson((p) => ({ ...p, [field]: value }));
  }
  function updateSpouse(field, value) {
    setSpouse((s) => ({ ...s, [field]: value }));
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #FDF0E0, #F5DEB3)',
          border: '2px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', margin: '0 auto 1rem',
          boxShadow: 'var(--shadow-node)',
        }}>👴</div>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '1.75rem', fontWeight: 700 }}>
          Root Person
        </h2>
        <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem', lineHeight: 1.6 }}>
          Enter details for the oldest known ancestor — the root of this tree.
        </p>
      </div>

      {/* Root Person Card */}
      <FormCard title="Personal Information">
        {/* Photo upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div
            onClick={() => photoInputRef.current?.click()}
            style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: rootPerson.profilePhoto
                ? `url(${rootPerson.profilePhoto}) center/cover`
                : 'linear-gradient(135deg, #FDF0E0, #F5DEB3)',
              border: '2px dashed var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, overflow: 'hidden',
              transition: 'border-color 0.2s',
            }}
          >
            {!rootPerson.profilePhoto && <Upload size={20} color="var(--color-border)" />}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handlePhotoUpload(e, 'root')}
            style={{ display: 'none' }}
          />
          <div>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              style={{
                display: 'block',
                background: 'transparent', border: '1px solid var(--color-border)',
                padding: '0.35rem 0.875rem', borderRadius: '7px',
                color: 'var(--color-muted)', fontSize: '0.8rem',
                fontFamily: 'var(--font-body)', cursor: 'pointer',
                marginBottom: '0.25rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              Upload Photo
            </button>
            {rootPerson.profilePhoto && (
              <button
                type="button"
                onClick={() => updateRoot('profilePhoto', null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                  background: 'transparent', border: 'none',
                  color: 'var(--color-accent)', fontSize: '0.75rem',
                  fontFamily: 'var(--font-body)', cursor: 'pointer',
                }}
              >
                <X size={12} /> Remove
              </button>
            )}
            <p style={{ color: 'var(--color-muted)', fontSize: '0.72rem' }}>JPG, PNG up to 5MB</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <FormField
              id="inp-root-name"
              label="Full Name *"
              placeholder="e.g. Ramesh Sharma"
              value={rootPerson.name}
              onChange={(e) => updateRoot('name', e.target.value)}
              error={errors.rootName}
              autoFocus
            />
          </div>
          <FormSelect
            id="sel-root-gender"
            label="Gender"
            value={rootPerson.gender}
            onChange={(e) => updateRoot('gender', e.target.value)}
            options={[
              { value: 'male', label: '👨 Male' },
              { value: 'female', label: '👩 Female' },
              { value: 'other', label: '🧑 Other' },
            ]}
          />
          <FormField
            id="inp-root-dob"
            label="Date of Birth"
            type="date"
            value={rootPerson.dob}
            onChange={(e) => updateRoot('dob', e.target.value)}
          />
        </div>

        {/* Deceased toggle */}
        <ToggleRow
          id="tog-root-deceased"
          label="Deceased"
          value={rootPerson.hasDod}
          onChange={(v) => updateRoot('hasDod', v)}
        />
        {rootPerson.hasDod && (
          <FormField
            id="inp-root-dod"
            label="Date of Death"
            type="date"
            value={rootPerson.dod}
            onChange={(e) => updateRoot('dod', e.target.value)}
          />
        )}
      </FormCard>

      {/* Marriage section */}
      <FormCard style={{ marginTop: '1rem' }}>
        <ToggleRow
          id="tog-married"
          label="Is Married / Was Married"
          value={isMarried}
          onChange={setIsMarried}
          icon={<Heart size={15} color={isMarried ? 'var(--color-accent)' : 'var(--color-muted)'} />}
        />

        {isMarried && (
          <div style={{ marginTop: '1rem', animation: 'slideInRight 0.25s ease' }}>
            {/* Couple preview */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1rem', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(253,240,224,0.6), rgba(255,248,240,0.8))',
              border: '1px solid rgba(212,169,106,0.3)',
              marginBottom: '1.25rem',
            }}>
              <MiniPersonCard
                name={rootPerson.name || 'Root Person'}
                gender={rootPerson.gender}
                photo={rootPerson.profilePhoto}
              />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                <Heart size={20} color="var(--color-accent)" fill="var(--color-accent)" />
                <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)' }}>
                  {spouse.anniversaryDate ? formatDateFull(spouse.anniversaryDate) : 'Married'}
                </span>
              </div>
              <MiniPersonCard
                name={spouse.name || 'Spouse'}
                gender={spouse.gender}
                photo={null}
              />
            </div>

            {/* Spouse fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField
                  id="inp-spouse-name"
                  label="Spouse Full Name *"
                  placeholder="e.g. Sunita Sharma"
                  value={spouse.name}
                  onChange={(e) => updateSpouse('name', e.target.value)}
                  error={errors.spouseName}
                />
              </div>
              <FormSelect
                id="sel-spouse-gender"
                label="Spouse Gender"
                value={spouse.gender}
                onChange={(e) => updateSpouse('gender', e.target.value)}
                options={[
                  { value: 'male', label: '👨 Male' },
                  { value: 'female', label: '👩 Female' },
                  { value: 'other', label: '🧑 Other' },
                ]}
              />
              <FormField
                id="inp-spouse-dob"
                label="Spouse Date of Birth"
                type="date"
                value={spouse.dob}
                onChange={(e) => updateSpouse('dob', e.target.value)}
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField
                  id="inp-anniversary"
                  label="Wedding Anniversary"
                  type="date"
                  value={spouse.anniversaryDate}
                  onChange={(e) => updateSpouse('anniversaryDate', e.target.value)}
                />
              </div>
            </div>

            <ToggleRow
              id="tog-spouse-deceased"
              label="Spouse Deceased"
              value={spouse.hasDod}
              onChange={(v) => updateSpouse('hasDod', v)}
            />
            {spouse.hasDod && (
              <FormField
                id="inp-spouse-dod"
                label="Spouse Date of Death"
                type="date"
                value={spouse.dod}
                onChange={(e) => updateSpouse('dod', e.target.value)}
              />
            )}
          </div>
        )}
      </FormCard>

      {/* Number of children */}
      <FormCard style={{ marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} color="var(--color-primary)" />
            <span style={{ color: 'var(--color-text)', fontSize: '0.9rem', fontWeight: 600 }}>
              Number of Children
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setNumberOfChildren((n) => Math.max(0, n - 1))}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: '1.5px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-primary)',
                fontSize: '1.2rem', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >−</button>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: '1.5rem',
              color: 'var(--color-primary)', fontWeight: 700,
              minWidth: '2rem', textAlign: 'center',
            }}>{numberOfChildren}</span>
            <button
              type="button"
              onClick={() => setNumberOfChildren((n) => Math.min(20, n + 1))}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: '1.5px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-primary)',
                fontSize: '1.2rem', fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >+</button>
          </div>
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.78rem', marginTop: '0.625rem' }}>
          {numberOfChildren > 0
            ? `Planning for ${numberOfChildren} child${numberOfChildren !== 1 ? 'ren' : ''}. Add them from the tree view via right-click → Add Child.`
            : 'No children planned. You can add them later from the tree view via right-click → Add Child.'}
        </p>
      </FormCard>
    </div>
  );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────
function Step3Review({ treeName, rootPerson, isMarried, spouse, numberOfChildren }) {
  return (
    <div>
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(39,174,96,0.15), rgba(39,174,96,0.25))',
          border: '2px solid rgba(39,174,96,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', margin: '0 auto 1rem',
        }}>✅</div>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '1.75rem', fontWeight: 700 }}>
          Review & Confirm
        </h2>
        <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem', lineHeight: 1.6 }}>
          Everything looks good? Hit "Create Tree" to bring your family to life.
        </p>
      </div>

      <FormCard>
        {/* Tree name */}
        <ReviewRow label="Family Tree" value={treeName} icon="🌳" large />

        <div style={{ borderTop: '1px solid rgba(212,169,106,0.25)', margin: '1rem 0' }} />

        {/* Root + spouse preview */}
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>
            Root {isMarried ? 'Couple' : 'Person'}
          </p>

          {isMarried ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1rem', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(253,240,224,0.6), rgba(255,248,240,0.8))',
              border: '1px solid rgba(212,169,106,0.3)',
            }}>
              <MiniPersonCard name={rootPerson.name} gender={rootPerson.gender} photo={rootPerson.profilePhoto} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                <Heart size={18} color="var(--color-accent)" fill="var(--color-accent)" />
                {spouse.anniversaryDate && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--color-muted)' }}>
                    {formatDateFull(spouse.anniversaryDate)}
                  </span>
                )}
              </div>
              <MiniPersonCard name={spouse.name} gender={spouse.gender} photo={null} />
            </div>
          ) : (
            <div style={{ display: 'inline-block' }}>
              <MiniPersonCard name={rootPerson.name} gender={rootPerson.gender} photo={rootPerson.profilePhoto} />
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid rgba(212,169,106,0.25)', margin: '1rem 0' }} />

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          <SummaryBadge label="DOB" value={rootPerson.dob ? formatDateFull(rootPerson.dob) : '—'} />
          <SummaryBadge label="Deceased" value={rootPerson.hasDod ? 'Yes' : 'No'} />
          <SummaryBadge label="Children (planned)" value={numberOfChildren === 0 ? 'None' : numberOfChildren} />
        </div>

        {isMarried && spouse.anniversaryDate && (
          <div style={{ marginTop: '0.75rem' }}>
            <SummaryBadge label="Anniversary" value={formatDateFull(spouse.anniversaryDate)} />
          </div>
        )}

        <div style={{
          marginTop: '1.25rem', padding: '0.875rem',
          borderRadius: '8px',
          background: 'rgba(39,174,96,0.06)',
          border: '1px solid rgba(39,174,96,0.2)',
        }}>
          <p style={{ color: '#1E8449', fontSize: '0.82rem', lineHeight: 1.6 }}>
            <strong>Ready to create:</strong> "{treeName}" with {isMarried ? 'a couple' : 'a single person'} at the root.
            {numberOfChildren > 0 ? ` ${numberOfChildren} child${numberOfChildren !== 1 ? 'ren' : ''} can be added from the tree view.` : ''}
          </p>
        </div>
      </FormCard>
    </div>
  );
}

// ─── Reusable form primitives ─────────────────────────────────────────────────

function FormCard({ children, title, style = {} }) {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid rgba(212,169,106,0.35)',
      borderRadius: '14px',
      padding: '1.5rem',
      boxShadow: 'var(--shadow-node)',
      ...style,
    }}>
      {title && (
        <h3 style={{
          fontFamily: 'var(--font-display)',
          color: 'var(--color-primary)',
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '1.25rem',
        }}>{title}</h3>
      )}
      {children}
    </div>
  );
}

function FormField({ id, label, type = 'text', placeholder, value, onChange, error, autoFocus }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <label
        htmlFor={id}
        style={{ display: 'block', color: 'var(--color-text)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoFocus={autoFocus}
        style={{
          width: '100%',
          padding: '0.625rem 0.875rem',
          borderRadius: '8px',
          border: `1.5px solid ${error ? 'var(--color-accent)' : 'rgba(212,169,106,0.5)'}`,
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          fontSize: '0.9rem',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          fontFamily: 'var(--font-body)',
        }}
        onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
        onBlur={e => e.currentTarget.style.borderColor = error ? 'var(--color-accent)' : 'rgba(212,169,106,0.5)'}
      />
      {error && (
        <p style={{ color: 'var(--color-accent)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{error}</p>
      )}
    </div>
  );
}

function FormSelect({ id, label, value, onChange, options }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <label
        htmlFor={id}
        style={{ display: 'block', color: 'var(--color-text)', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.35rem' }}
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          padding: '0.625rem 0.875rem',
          borderRadius: '8px',
          border: '1.5px solid rgba(212,169,106,0.5)',
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          fontSize: '0.9rem',
          outline: 'none',
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({ id, label, value, onChange, icon }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.625rem 0',
        cursor: 'pointer',
      }}
      onClick={() => onChange(!value)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {icon}
        <span style={{ color: 'var(--color-text)', fontSize: '0.875rem', fontWeight: 600 }}>{label}</span>
      </div>
      <div
        id={id}
        role="switch"
        aria-checked={value}
        style={{
          width: '44px', height: '24px', borderRadius: '12px',
          background: value
            ? 'linear-gradient(135deg, var(--color-primary), #A0522D)'
            : 'rgba(212,169,106,0.3)',
          position: 'relative', transition: 'background 0.25s',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: '3px',
          left: value ? '22px' : '3px',
          width: '18px', height: '18px', borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
          transition: 'left 0.25s',
        }} />
      </div>
    </div>
  );
}

function MiniPersonCard({ name, gender, photo }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
      flex: 1,
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: photo
          ? `url(${photo}) center/cover`
          : gender === 'female'
            ? 'linear-gradient(135deg, #FFB6C1, #FF8FAB)'
            : 'linear-gradient(135deg, #87CEEB, #4682B4)',
        border: '2px solid var(--color-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem', color: '#fff', fontWeight: 700,
        overflow: 'hidden',
      }}>
        {!photo && (name?.charAt(0)?.toUpperCase() || '?')}
      </div>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: '0.82rem', fontWeight: 600,
        color: 'var(--color-text)', textAlign: 'center',
        maxWidth: '100px', wordBreak: 'break-word',
      }}>
        {name || '—'}
      </span>
    </div>
  );
}

function ReviewRow({ label, value, icon, large }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
      {icon && <span style={{ fontSize: '1.25rem' }}>{icon}</span>}
      <div>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <p style={{
          color: 'var(--color-primary)',
          fontSize: large ? '1.3rem' : '0.95rem',
          fontWeight: 700,
          fontFamily: large ? 'var(--font-display)' : 'var(--font-body)',
        }}>{value}</p>
      </div>
    </div>
  );
}

function SummaryBadge({ label, value }) {
  return (
    <div style={{
      padding: '0.625rem 0.75rem',
      borderRadius: '8px',
      background: 'rgba(212,169,106,0.08)',
      border: '1px solid rgba(212,169,106,0.2)',
    }}>
      <p style={{ color: 'var(--color-muted)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>{label}</p>
      <p style={{ color: 'var(--color-text)', fontSize: '0.8rem', fontWeight: 600 }}>{value}</p>
    </div>
  );
}
