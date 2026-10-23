// src/models/interviewNote.model.js
// Interviewer-authored notes per interview. Notes can be private (visible only to
// the interviewer) or shared (visible to other org admins / recruiters).
import mongoose from 'mongoose';

const interviewNoteSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true,
    },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', default: null },
    content: { type: String, required: true, maxlength: 10000 },
    isPrivate: { type: Boolean, default: true },
    // Optional link to a snapshot the note refers to.
    linkedSnapshotId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodeSnapshot', default: null },
  },
  { timestamps: true },
);

interviewNoteSchema.index({ interviewId: 1, createdAt: 1 });

const InterviewNote = mongoose.model('InterviewNote', interviewNoteSchema);
export default InterviewNote;
