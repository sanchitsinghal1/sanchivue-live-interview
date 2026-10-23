// Small local re-export of evaluation-related types to keep the evaluations
// route self-contained and avoid any circular import edge cases.
export { parseJSON, emptyRubric } from "@/lib/types";
export type {
  RubricScores,
  ProctoringLog,
} from "@/lib/types";
