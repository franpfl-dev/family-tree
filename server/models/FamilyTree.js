/**
 * models/FamilyTree.js
 * Mongoose schema for a family tree.
 *
 * ID strategy: we use the existing client-side UUID strings as _id
 * (type String) so that no remapping is required when migrating from
 * localStorage and the frontend continues to use the same IDs.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const FamilyTreeSchema = new Schema(
  {
    _id:          { type: String, required: true },   // UUID string from client
    name:         { type: String, required: true, trim: true },
    rootPersonId: { type: String, ref: 'Person', default: null },
    maxHeight:    { type: Number, default: 3, min: 1, max: 20 },
  },
  {
    _id:       false,      // we supply our own _id
    timestamps: true,      // createdAt / updatedAt
    versionKey: false,
    toJSON: {
      // Always expose _id as "id" to the client so the frontend
      // doesn't need to know about MongoDB internals.
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('FamilyTree', FamilyTreeSchema);
