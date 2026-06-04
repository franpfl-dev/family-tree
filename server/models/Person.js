/**
 * models/Person.js
 * Mongoose schema for a person in the family tree.
 *
 * profilePhoto stores a Cloudinary URL only — NEVER a base64 string.
 * All ID fields are String type to match the client UUID format.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const CrossLinkSchema = new Schema(
  {
    targetPersonId:    { type: String, ref: 'Person', required: true },
    relationshipLabel: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const PersonSchema = new Schema(
  {
    _id:             { type: String, required: true },          // UUID
    name:            { type: String, required: true, trim: true },
    gender:          { type: String, enum: ['male', 'female', 'other'], default: 'other' },
    dob:             { type: String, default: '' },             // "YYYY-MM-DD" string
    dod:             { type: String, default: null },           // null if alive
    profilePhoto:    {
      type: String,
      default: null,
      // Reject base64 strings at the schema level
      validate: {
        validator: (v) => !v || !v.startsWith('data:'),
        message:   'profilePhoto must be a Cloudinary URL, not a base64 string.',
      },
    },
    spouseId:        { type: String, ref: 'Person', default: null },
    anniversaryDate: { type: String, default: null },
    treeId:          { type: String, ref: 'FamilyTree', required: true },
    parentId:        { type: String, ref: 'Person', default: null },
    children:        [{ type: String, ref: 'Person' }],
    level:           { type: Number, required: true, min: 0 },
    crossLinks:      [CrossLinkSchema],
    isPlaceholder:   { type: Boolean, default: false },
    siblingIndex:    { type: Number, default: null },
    expectedChildren:{ type: Number, default: 0 },
    lastEditedAt:    { type: Date, default: null },
  },
  {
    _id:       false,
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Index for fast tree lookups
PersonSchema.index({ treeId: 1, level: 1 });
PersonSchema.index({ parentId: 1 });

module.exports = mongoose.model('Person', PersonSchema);
