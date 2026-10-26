import type { MessageKey } from "./t";

/**
 * The calibration questions are produced by `/api/roadmap/calibration` with
 * stable ids (`q_seen`, `q_solo`, `q_explain`). These records map those ids onto
 * translatable copy; anything not listed falls back to the server's English
 * text, so adding a question on the server can never render a blank card.
 *
 * Written out explicitly so a mistyped key is a compile error.
 */
export const CALIBRATION_QUESTION_KEYS: Record<string, MessageKey> = {
  q_seen: "calibration.questions.q_seen.prompt",
  q_solo: "calibration.questions.q_solo.prompt",
  q_explain: "calibration.questions.q_explain.prompt",
};

/** Option labels by question id, in the order the server returns them. */
export const CALIBRATION_OPTION_KEYS: Record<string, MessageKey[]> = {
  q_seen: [
    "calibration.questions.q_seen.options.option1",
    "calibration.questions.q_seen.options.option2",
    "calibration.questions.q_seen.options.option3",
    "calibration.questions.q_seen.options.option4",
  ],
  q_solo: [
    "calibration.questions.q_solo.options.option1",
    "calibration.questions.q_solo.options.option2",
    "calibration.questions.q_solo.options.option3",
    "calibration.questions.q_solo.options.option4",
  ],
  q_explain: [
    "calibration.questions.q_explain.options.option1",
    "calibration.questions.q_explain.options.option2",
    "calibration.questions.q_explain.options.option3",
    "calibration.questions.q_explain.options.option4",
  ],
};
