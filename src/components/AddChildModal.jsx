/**
 * AddChildModal.jsx
 * Modal to add a new child under a parent person.
 * Fields: Name, Gender, DOB, DOD toggle, Is Married toggle + spouse fields.
 */

import React, { useState } from 'react';
import { Baby, Heart } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { Modal, FormField, ToggleRow, inputStyle, primaryBtnStyle, cancelBtnStyle } from './modalShared';

export default function AddChildModal({ parentPerson, tree, onClose }) {
  const { addPerson } = useAppContext();

  const [form, setForm] = useState({ name: '', gender: 'male', dob: '', hasDod: false, dod: '' });
  const [isMarried, setIsMarried] = useState(false);
  const [spouseForm, setSpouseForm] = useState({ name: '', gender: 'female', dob: '', hasDod: false, dod: '', anniversaryDate: '' });
  const [errors, setErrors] = useState({});

  function update(field, value) { setForm(f => ({ ...f, [field]: value })); }
  function updateSpouse(field, value) { setSpouseForm(f => ({ ...f, [field]: value })); }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (isMarried && !spouseForm.name.trim()) errs.spouseName = 'Spouse name is required.';
    return errs;
  }

  function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    // Resolve the canonical "main" parent id for child attachment.
    // If the right-clicked person is part of a couple, we attach the new
    // child to the main (left) person in that couple so the child always
    // appears under the couple block — regardless of which card the user
    // right-clicked (main or spouse).
    const mainParentId = parentPerson.id;

    addPerson({
      person: {
        name: form.name.trim(),
        gender: form.gender,
        dob: form.dob,
        dod: form.hasDod ? form.dod : null,
      },
      parentId: mainParentId,
      treeId: tree.id,
      level: parentPerson.level + 1,
      spouseData: isMarried && spouseForm.name.trim() ? {
        name: spouseForm.name.trim(),
        gender: spouseForm.gender,
        dob: spouseForm.dob,
        dod: spouseForm.hasDod ? spouseForm.dod : null,
        anniversaryDate: spouseForm.anniversaryDate || null,
      } : null,
    });

    onClose();
  }

  return (
    <Modal title="Add Child" subtitle={`Under: ${parentPerson.name}`} icon={<Baby size={20} />} onClose={onClose}>
      <FormField label="Full Name *" id="ac-name" error={errors.name}>
        <input id="ac-name" autoFocus value={form.name} onChange={e => update('name', e.target.value)} placeholder="Child's full name" style={inputStyle} />
      </FormField>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
        <FormField label="Gender" id="ac-gender">
          <select id="ac-gender" value={form.gender} onChange={e => update('gender', e.target.value)} style={inputStyle}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </FormField>
        <FormField label="Date of Birth" id="ac-dob">
          <input id="ac-dob" type="date" value={form.dob} onChange={e => update('dob', e.target.value)} style={inputStyle} />
        </FormField>
      </div>

      <ToggleRow label="Deceased" value={form.hasDod} onChange={v => update('hasDod', v)} />
      {form.hasDod && (
        <FormField label="Date of Death" id="ac-dod">
          <input id="ac-dod" type="date" value={form.dod} onChange={e => update('dod', e.target.value)} style={inputStyle} />
        </FormField>
      )}

      <div style={{ borderTop: '1px solid rgba(212,169,106,0.2)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
        <ToggleRow
          label="Is Married / Was Married"
          value={isMarried}
          onChange={setIsMarried}
          icon={<Heart size={14} color={isMarried ? 'var(--color-accent)' : 'var(--color-muted)'} />}
        />
      </div>

      {isMarried && (
        <div style={{ animation: 'slideDown 0.2s ease', marginTop: '0.5rem' }}>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem', fontStyle: 'italic', marginBottom: '0.75rem' }}>
            A new spouse person will be created in this tree and automatically linked.
          </p>
          <FormField label="Spouse Full Name *" id="ac-spouse-name" error={errors.spouseName}>
            <input id="ac-spouse-name" value={spouseForm.name} onChange={e => updateSpouse('name', e.target.value)} placeholder="Spouse's full name" style={inputStyle} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <FormField label="Spouse Gender" id="ac-spouse-gender">
              <select id="ac-spouse-gender" value={spouseForm.gender} onChange={e => updateSpouse('gender', e.target.value)} style={inputStyle}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </FormField>
            <FormField label="Spouse DOB" id="ac-spouse-dob">
              <input id="ac-spouse-dob" type="date" value={spouseForm.dob} onChange={e => updateSpouse('dob', e.target.value)} style={inputStyle} />
            </FormField>
          </div>
          <FormField label="Anniversary Date" id="ac-anniversary">
            <input id="ac-anniversary" type="date" value={spouseForm.anniversaryDate} onChange={e => updateSpouse('anniversaryDate', e.target.value)} style={inputStyle} />
          </FormField>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
        <button id="btn-add-child-submit" onClick={handleSubmit} style={primaryBtnStyle}>
          <Baby size={15} /> Add Child
        </button>
      </div>

      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-8px) } to { opacity: 1; transform: none } }`}</style>
    </Modal>
  );
}
