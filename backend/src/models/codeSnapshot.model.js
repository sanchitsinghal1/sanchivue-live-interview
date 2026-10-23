// src/models/codeSnapshot.model.js
// Standalone snapshot store — used for code replay in the Evaluation Report.
// (We also embed snapshots inline on the Interview doc for quick access; this
// model is the authoritative long-term archive.)
import mongoose from 'mongoose';

const codeSnapshotSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    code: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
    // Why this snapshot was saved — drives the replay timeline UI.
    eventType: { type: String, enum: ['auto', 'run', 'submit'], default: 'auto' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

codeSnapshotSchema.index({ interviewId: 1, timestamp: 1 });

const CodeSnapshot = mongoose.model('CodeSnapshot', codeSnapshotSchema);
export default CodeSnapshot;
