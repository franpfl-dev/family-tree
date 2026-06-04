#!/usr/bin/env node
/**
 * scripts/migrateFromLocalStorage.js
 * ────────────────────────────────────────────────────────────────────────────
 * One-time migration: localStorage JSON export → MongoDB + Cloudinary.
 *
 * Usage:
 *   node scripts/migrateFromLocalStorage.js ./export.json
 *
 * The export.json is produced by the React app's "Export Data" button.
 * It contains: { trees: [...], persons: [...], activeTreeId, navigationHistory }
 *
 * What this script does:
 *   1. Reads the JSON file
 *   2. For each person with a base64 profilePhoto → upload to Cloudinary → swap with URL
 *   3. Insert FamilyTree documents into MongoDB (upsert by _id)
 *   4. Insert Person documents into MongoDB (upsert by _id)
 *   5. Print a summary
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const fs         = require('fs');
const path       = require('path');
const mongoose   = require('mongoose');
const cloudinary = require('cloudinary').v2;

// ── Configure Cloudinary ──────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// ── Models (inline schemas to avoid circular imports) ────────────────────────
const FamilyTree = require('../models/FamilyTree');
const Person     = require('../models/Person');

// ── Main ─────────────────────────────────────────────────────────────────────
async function migrate() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('❌  Usage: node migrateFromLocalStorage.js ./export.json');
    process.exit(1);
  }

  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`❌  File not found: ${absPath}`);
    process.exit(1);
  }

  // ── Load data ───────────────────────────────────────────────────────────────
  console.log(`\n📂  Reading: ${absPath}`);
  let data;
  try {
    data = JSON.parse(fs.readFileSync(absPath, 'utf-8'));
  } catch (e) {
    console.error('❌  Failed to parse JSON:', e.message);
    process.exit(1);
  }

  const trees   = data.trees   || [];
  const persons = data.persons || [];

  console.log(`    Found ${trees.length} tree(s) and ${persons.length} person(s).`);

  // ── Connect to MongoDB ──────────────────────────────────────────────────────
  console.log('\n🔌  Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('    Connected.\n');

  // ── Upload base64 photos → Cloudinary ────────────────────────────────────────
  let imagesUploaded = 0;
  let imagesFailed   = 0;

  console.log('🖼️   Uploading profile photos to Cloudinary...');
  for (const person of persons) {
    if (!person.profilePhoto || !person.profilePhoto.startsWith('data:')) continue;

    process.stdout.write(`    Uploading photo for "${person.name}" (${person.id || person._id})... `);
    try {
      const result = await cloudinary.uploader.upload(person.profilePhoto, {
        folder:         'family-tree/profile-photos',
        public_id:      `person_${person.id || person._id}`,
        overwrite:      true,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });
      person.profilePhoto = result.secure_url;
      imagesUploaded++;
      console.log('✅');
    } catch (err) {
      console.log(`⚠️  Failed: ${err.message}`);
      person.profilePhoto = null;   // save without photo
      imagesFailed++;
    }

    // Small delay to respect Cloudinary rate limits
    await sleep(200);
  }

  // ── Normalise documents: use _id from existing "id" field ────────────────────
  // The localStorage export uses { id: "uuid", ... } (no _id).
  // MongoDB needs _id. We map id → _id.
  const normTrees = trees.map((t) => ({
    ...t,
    _id: t.id || t._id,
  }));

  const normPersons = persons.map((p) => ({
    ...p,
    _id:      p.id || p._id,
    treeId:   p.treeId,
    parentId: p.parentId || null,
    children: p.children || [],
    crossLinks: (p.crossLinks || []).map((cl) => ({
      targetPersonId:    cl.targetPersonId,
      relationshipLabel: cl.relationshipLabel,
    })),
  }));

  // ── Insert trees ────────────────────────────────────────────────────────────
  console.log('\n🌳  Inserting trees into MongoDB...');
  let treesOk = 0;
  for (const tree of normTrees) {
    try {
      await FamilyTree.findByIdAndUpdate(
        tree._id,
        { $set: tree },
        { upsert: true, new: true, runValidators: false }
      );
      treesOk++;
      console.log(`    ✅ Tree: "${tree.name}" (${tree._id})`);
    } catch (err) {
      console.log(`    ❌ Tree "${tree.name}": ${err.message}`);
    }
  }

  // ── Insert persons ──────────────────────────────────────────────────────────
  console.log('\n👤  Inserting persons into MongoDB...');
  let personsOk     = 0;
  let personsFailed = 0;

  for (const person of normPersons) {
    try {
      await Person.findByIdAndUpdate(
        person._id,
        { $set: person },
        { upsert: true, new: true, runValidators: false }
      );
      personsOk++;
      process.stdout.write('.');
    } catch (err) {
      console.log(`\n    ❌ Person "${person.name}" (${person._id}): ${err.message}`);
      personsFailed++;
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  console.log('\n\n═══════════════════════════════════════════');
  console.log('  Migration complete!');
  console.log(`  Trees migrated:    ${treesOk} / ${trees.length}`);
  console.log(`  Persons migrated:  ${personsOk} / ${persons.length} (${personsFailed} failed)`);
  console.log(`  Photos uploaded:   ${imagesUploaded} (${imagesFailed} failed → saved without photo)`);
  console.log('═══════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

migrate().catch((err) => {
  console.error('\n❌  Migration failed:', err);
  process.exit(1);
});
