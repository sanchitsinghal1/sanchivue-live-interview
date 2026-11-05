// src/models/bookmark.model.js
// A user's bookmarked (starred) question. Compound unique index on
// (userId, questionId) prevents duplicate bookmarks; both fields are also
// individually indexed for fast per-user / per-question lookups.
// `orgId` is denormalized so admins can audit which org a bookmark belongs to
// without an extra join.
import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

// A user can bookmark a given question exactly once.
bookmarkSchema.index({ userId: 1, questionId: 1 }, { unique: true });

bookmarkSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
export default Bookmark;
