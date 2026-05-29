import { Chess } from 'chess.js';
import type { Puzzle } from '../types/puzzle';

export interface PuzzleValidationResult {
  puzzleId: string;
  valid: boolean;
  problems: string[];
}

export interface ValidationReport {
  total: number;
  valid: number;
  invalid: number;
  results: PuzzleValidationResult[];
}

/**
 * Returns true if the side to move in `fen` has a forced mate within `plyBudget`
 * half-moves. Used to confirm that mate puzzles are real, forced mates.
 */
function hasForcedMate(fen: string, plyBudget: number): boolean {
  const chess = new Chess(fen);
  if (chess.isCheckmate()) return true;
  if (plyBudget <= 0) return false;
  const moves = chess.moves();

  for (const move of moves) {
    const afterMove = new Chess(fen);
    afterMove.move(move);

    if (afterMove.isCheckmate()) return true;
    if (plyBudget - 1 <= 0) continue;
    if (afterMove.isStalemate() || afterMove.isDraw()) continue;

    const replies = afterMove.moves();
    if (replies.length === 0) continue;

    // Forced mate requires EVERY opponent reply to still lead to mate.
    let allRepliesLoseToMate = true;
    for (const reply of replies) {
      const afterReply = new Chess(afterMove.fen());
      afterReply.move(reply);
      if (!hasForcedMate(afterReply.fen(), plyBudget - 2)) {
        allRepliesLoseToMate = false;
        break;
      }
    }
    if (allRepliesLoseToMate) return true;
  }
  return false;
}

function toUci(move: { from: string; to: string; promotion?: string }): string {
  return `${move.from}${move.to}${move.promotion ?? ''}`;
}

export function validatePuzzle(puzzle: Puzzle): PuzzleValidationResult {
  const problems: string[] = [];

  // 1. FEN must be legal.
  let chess: Chess;
  try {
    chess = new Chess(puzzle.fen);
  } catch (err) {
    return {
      puzzleId: puzzle.id,
      valid: false,
      problems: [`Invalid FEN: ${(err as Error).message}`],
    };
  }

  // 2. Side to move must match.
  if (chess.turn() !== puzzle.sideToMove) {
    problems.push(
      `sideToMove mismatch: FEN to move is "${chess.turn()}", puzzle says "${puzzle.sideToMove}"`,
    );
  }

  // 3. Difficulty in range.
  if (puzzle.difficulty < 300 || puzzle.difficulty > 1000) {
    problems.push(`difficulty ${puzzle.difficulty} is outside 300-1000`);
  }

  // 4. Must have a solution.
  if (puzzle.solutionMoves.length === 0) {
    problems.push('no solution moves provided');
  }

  // 5. Every solution move must be legal when played in sequence.
  const line = new Chess(puzzle.fen);
  let firstMoveUci = '';
  let firstMoveSan = '';
  let lineBroke = false;
  for (let i = 0; i < puzzle.solutionMoves.length; i++) {
    const san = puzzle.solutionMoves[i];
    try {
      const move = line.move(san);
      if (i === 0) {
        firstMoveUci = toUci(move);
        firstMoveSan = move.san;
      }
    } catch {
      problems.push(`solution move #${i + 1} "${san}" is illegal in the current position`);
      lineBroke = true;
      break;
    }
  }

  // 6. SAN / UCI of the key move must match the puzzle metadata.
  if (!lineBroke && puzzle.solutionMoves.length > 0) {
    if (firstMoveSan !== puzzle.bestMoveSan) {
      problems.push(`bestMoveSan "${puzzle.bestMoveSan}" does not match generated SAN "${firstMoveSan}"`);
    }
    if (firstMoveUci !== puzzle.bestMoveUci) {
      problems.push(`bestMoveUci "${puzzle.bestMoveUci}" does not match generated UCI "${firstMoveUci}"`);
    }
  }

  // 7. Outcome checks.
  if (!lineBroke && puzzle.outcomeType === 'mate') {
    if (!line.isCheckmate()) {
      problems.push('outcomeType is "mate" but the solution line does not end in checkmate');
    }
    // Confirm the mate is actually forced from the start (not just one line).
    if (!hasForcedMate(puzzle.fen, puzzle.solutionMoves.length)) {
      problems.push('mate is not forced within the given number of moves');
    }
  }

  return { puzzleId: puzzle.id, valid: problems.length === 0, problems };
}

export function validatePuzzles(puzzles: Puzzle[]): ValidationReport {
  const results = puzzles.map(validatePuzzle);

  // Duplicate id check.
  const seen = new Map<string, number>();
  for (const p of puzzles) seen.set(p.id, (seen.get(p.id) ?? 0) + 1);
  for (const [id, count] of seen) {
    if (count > 1) {
      const r = results.find((x) => x.puzzleId === id);
      if (r) {
        r.problems.push(`duplicate puzzle id "${id}" appears ${count} times`);
        r.valid = false;
      }
    }
  }

  const valid = results.filter((r) => r.valid).length;
  return {
    total: puzzles.length,
    valid,
    invalid: puzzles.length - valid,
    results,
  };
}
