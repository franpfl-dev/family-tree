/**
 * routes/trees.js
 * CRUD routes for FamilyTree documents.
 *
 * GET    /api/trees            → all trees (without persons)
 * GET    /api/trees/:id        → one tree + all its persons
 * POST   /api/trees            → create tree
 * PUT    /api/trees/:id        → update tree metadata
 * DELETE /api/trees/:id        → delete tree + cascade-delete all persons in it
 */

const express    = require('express');
const router     = express.Router();
const FamilyTree = require('../models/FamilyTree');
const Person     = require('../models/Person');

// ── GET /api/trees ────────────────────────────────────────────────────────────
router.get('/', async (_req, res) => {
  const trees = await FamilyTree.find().sort({ createdAt: -1 });
  res.json({ success: true, data: trees });
});

// ── GET /api/trees/:id ────────────────────────────────────────────────────────
// Returns the tree + all its persons in one response (mirrors AppContext shape)
router.get('/:id', async (req, res) => {
  const tree = await FamilyTree.findById(req.params.id);
  if (!tree) return res.status(404).json({ success: false, message: 'Tree not found.' });

  const persons = await Person.find({ treeId: req.params.id });
  res.json({ success: true, data: { tree, persons } });
});

// ── GET /api/trees/all/full ───────────────────────────────────────────────────
// Returns ALL trees + ALL persons — used for the initial app load.
router.get('/all/full', async (_req, res) => {
  const trees   = await FamilyTree.find().sort({ createdAt: -1 });
  const persons = await Person.find();
  res.json({ success: true, data: { trees, persons } });
});

// ── POST /api/trees ───────────────────────────────────────────────────────────
// Body mirrors the CREATE_TREE reducer payload + already-generated IDs from client
router.post('/', async (req, res) => {
  const { tree, persons } = req.body;   // client sends both in one shot

  if (!tree || !tree._id || !tree.name) {
    return res.status(400).json({ success: false, message: 'tree._id and tree.name are required.' });
  }

  // Create the tree document
  const newTree = await FamilyTree.create(tree);

  // Optionally create associated persons (root + optional spouse) in bulk
  let createdPersons = [];
  if (Array.isArray(persons) && persons.length > 0) {
    // Strip any base64 photos before saving
    const cleaned = persons.map(sanitizePerson);
    createdPersons = await Person.insertMany(cleaned, { ordered: false });
  }

  res.status(201).json({ success: true, data: { tree: newTree, persons: createdPersons } });
});

// ── PUT /api/trees/:id ────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const allowed = ['name', 'maxHeight', 'rootPersonId'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const tree = await FamilyTree.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  if (!tree) return res.status(404).json({ success: false, message: 'Tree not found.' });

  res.json({ success: true, data: tree });
});

// ── DELETE /api/trees/:id ─────────────────────────────────────────────────────
// Cascade: remove all persons whose treeId matches + clean up crossLinks
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const tree = await FamilyTree.findByIdAndDelete(id);
  if (!tree) return res.status(404).json({ success: false, message: 'Tree not found.' });

  // Collect IDs of persons in this tree
  const treePersonIds = (await Person.find({ treeId: id }).select('_id')).map((p) => p._id);

  // Delete persons belonging to this tree
  await Person.deleteMany({ treeId: id });

  // Remove cross-links in OTHER trees that referenced any deleted person
  if (treePersonIds.length > 0) {
    await Person.updateMany(
      { 'crossLinks.targetPersonId': { $in: treePersonIds } },
      { $pull: { crossLinks: { targetPersonId: { $in: treePersonIds } } } }
    );
  }

  res.json({ success: true, message: `Tree "${tree.name}" and ${treePersonIds.length} persons deleted.` });
});

// ── Helper: strip base64 from profilePhoto ────────────────────────────────────
function sanitizePerson(p) {
  if (p.profilePhoto && p.profilePhoto.startsWith('data:')) {
    return { ...p, profilePhoto: null };
  }
  return p;
}

module.exports = router;
