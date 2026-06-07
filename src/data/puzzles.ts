import type { Puzzle } from '../types/puzzle';
import { corePuzzles } from './puzzles.core';
import { generatedPuzzles } from './puzzles.generated';

/**
 * The full puzzle pool = hand-authored core puzzles (which cover the defensive
 * themes and carry bespoke teaching notes) + a large set of beginner puzzles
 * imported and validated from the Lichess open database.
 *
 * Every puzzle in both sources passes src/utils/chessValidation.ts. Regenerate
 * the imported set with `npm run import:puzzles`, then re-run
 * `npm run validate:puzzles`.
 */
export const puzzles: Puzzle[] = [...corePuzzles, ...generatedPuzzles];

export default puzzles;
