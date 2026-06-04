/**
 * routes/persons.js
 * CRUD routes for Person documents + cross-link management.
 *
 * GET    /api/persons/tree/:treeId    → all persons in a tree
 * GET    /api/persons/:id             → single person
 * POST   /api/persons                 → create person (+ optional spouse)
 * PUT    /api/persons/:id             → update person
 * DELETE /api/persons/:id             → delete person + descendants
 *
 * POST   /api/persons/:id/crosslink            → add cross-link (both sides)
 * DELETE /api/persons/:id/crosslink/:targetId  → remove cross-link (both sides)
 *
 * POST   /api/persons/link-spouse     → link two existing persons as spouses
 */

const express = require('express');
const router  = express.Router();
const Person  = require('../models/Person');

// ── GET /api/persons/tree/:treeId ─────────────────────────────────────────────
router.get('/tree/:treeId', async (req, res) => {
  const persons = await Person.find({ treeId: req.params.treeId });
  res.json({ success: true, data: persons });
});

// ── GET /api/persons/:id ──────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const person = await Person.findById(req.params.id);
  if (!person) return res.status(404).json({ success: false, message: 'Person not found.' });
  res.json({ success: true, data: person });
});

// ── POST /api/persons ─────────────────────────────────────────────────────────
// Body: { person: PersonData, parentId?, treeId, level, spouseData? }
// Mirrors the ADD_PERSON reducer payload.
router.post('/', async (req, res) => {
  const { person, parentId, treeId, level, spouseData } = req.body;

  if (!person?._id || !treeId || level === undefined) {
    return res.status(400).json({ success: false, message: 'person._id, treeId, and level are required.' });
  }

  // Guard: no base64 photos
  if (person.profilePhoto?.startsWith('data:')) {
    return res.status(400).json({
      success: false,
      message: 'profilePhoto must be a Cloudinary URL, not a base64 string. Upload the photo first via POST /api/images/upload.',
    });
  }

  const newPerson = await Person.create({ ...person, treeId, level, parentId: parentId || null });

  // If parentId given, push newPerson._id into parent.children
  if (parentId) {
    await Person.findByIdAndUpdate(parentId, { $addToSet: { children: newPerson._id } });
  }

  let spousePerson = null;
  if (spouseData?._id && spouseData?.name) {
    spousePerson = await Person.create({
      ...spouseData,
      treeId,
      level,
      parentId:   null,
      spouseId:   newPerson._id,
      children:   [],
      crossLinks: [],
    });
    // Link back
    newPerson.spouseId = spousePerson._id;
    await newPerson.save();
  }

  res.status(201).json({
    success: true,
    data: { person: newPerson, spouse: spousePerson },
  });
});

// ── PUT /api/persons/:id ──────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const updates = { ...req.body };
  delete updates._id;   // never overwrite the id

  // Guard: no base64 photos
  if (updates.profilePhoto?.startsWith('data:')) {
    return res.status(400).json({
      success: false,
      message: 'profilePhoto must be a Cloudinary URL. Upload the photo first.',
    });
  }

  const person = await Person.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!person) return res.status(404).json({ success: false, message: 'Person not found.' });

  res.json({ success: true, data: person });
});

// ── DELETE /api/persons/:id ───────────────────────────────────────────────────
// Cascades: deletes the person + all their descendants.
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const person = await Person.findById(id);
  if (!person) return res.status(404).json({ success: false, message: 'Person not found.' });

  // Collect all descendant IDs recursively
  const toDelete = new Set([id]);
  await collectDescendants(id, toDelete);

  const toDeleteArr = [...toDelete];

  await Person.deleteMany({ _id: { $in: toDeleteArr } });

  // Remove from parent's children array
  if (person.parentId) {
    await Person.findByIdAndUpdate(person.parentId, { $pull: { children: id } });
  }

  // Unlink spouse
  if (person.spouseId) {
    await Person.findByIdAndUpdate(person.spouseId, { $set: { spouseId: null } });
  }

  // Remove any cross-links pointing to deleted persons
  await Person.updateMany(
    { 'crossLinks.targetPersonId': { $in: toDeleteArr } },
    { $pull: { crossLinks: { targetPersonId: { $in: toDeleteArr } } } }
  );

  res.json({ success: true, message: `Deleted ${toDeleteArr.length} person(s).`, deletedIds: toDeleteArr });
});

// ── POST /api/persons/link-spouse ─────────────────────────────────────────────
router.post('/link-spouse', async (req, res) => {
  const { personId, spouseId, anniversaryDate } = req.body;
  if (!personId || !spouseId) {
    return res.status(400).json({ success: false, message: 'personId and spouseId are required.' });
  }
  if (personId === spouseId) {
    return res.status(400).json({ success: false, message: 'A person cannot be their own spouse.' });
  }

  await Person.findByIdAndUpdate(personId, { $set: { spouseId, anniversaryDate: anniversaryDate || null } });
  await Person.findByIdAndUpdate(spouseId, { $set: { spouseId: personId, anniversaryDate: anniversaryDate || null } });

  res.json({ success: true, message: 'Spouses linked.' });
});

// ── POST /api/persons/:id/crosslink ───────────────────────────────────────────
router.post('/:id/crosslink', async (req, res) => {
  const { targetPersonId, relationshipLabel, reverseLabel } = req.body;
  const fromId = req.params.id;

  if (!targetPersonId || !relationshipLabel) {
    return res.status(400).json({ success: false, message: 'targetPersonId and relationshipLabel required.' });
  }

  // Add forward link (if not already present)
  await Person.findByIdAndUpdate(
    fromId,
    {
      $addToSet: {
        crossLinks: { targetPersonId, relationshipLabel },
      },
    },
    { runValidators: true }
  );

  // Add reverse link
  await Person.findByIdAndUpdate(
    targetPersonId,
    {
      $addToSet: {
        crossLinks: { targetPersonId: fromId, relationshipLabel: reverseLabel || relationshipLabel },
      },
    },
    { runValidators: true }
  );

  res.json({ success: true, message: 'Cross-link added on both sides.' });
});

// ── DELETE /api/persons/:id/crosslink/:targetId ───────────────────────────────
router.delete('/:id/crosslink/:targetId', async (req, res) => {
  const { id, targetId } = req.params;

  await Person.findByIdAndUpdate(id,       { $pull: { crossLinks: { targetPersonId: targetId } } });
  await Person.findByIdAndUpdate(targetId, { $pull: { crossLinks: { targetPersonId: id } } });

  res.json({ success: true, message: 'Cross-link removed on both sides.' });
});

// ── Helper: recursively collect descendant IDs ────────────────────────────────
async function collectDescendants(personId, set) {
  const children = await Person.find({ parentId: personId }).select('_id');
  for (const child of children) {
    if (!set.has(child._id)) {
      set.add(child._id);
      await collectDescendants(child._id, set);
    }
  }
}

module.exports = router;
