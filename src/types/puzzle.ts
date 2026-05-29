export type PuzzleTheme =
  | 'Hanging piece'
  | 'Free queen'
  | 'Free rook'
  | 'Mate in 1'
  | 'Mate in 2'
  | 'Fork'
  | 'Knight fork'
  | 'Pin'
  | 'Skewer'
  | 'Back-rank mate'
  | 'Discovered attack'
  | 'Removing the defender'
  | 'Defending against a threat'
  | 'Avoid hanging a piece'
  | 'Checkmate threat'
  | 'Capture the undefended piece';

export type OutcomeType =
  | 'mate'
  | 'material win'
  | 'defensive move'
  | 'blunder prevention';

export type RatingBand = '300-500' | '500-700' | '700-1000';

export interface Puzzle {
  id: string;
  fen: string;
  sideToMove: 'w' | 'b';
  difficulty: number; // 300 - 1000
  theme: PuzzleTheme;
  tags: string[];
  /**
   * The full solution line in SAN, starting with the side-to-move's move.
   * For mate-in-2 puzzles this includes the opponent reply and the finishing move.
   */
  solutionMoves: string[];
  bestMoveSan: string;
  bestMoveUci: string;
  explanation: string;
  beginnerMistake: string;
  patternToRemember: string;
  howToSpot: string;
  hint1: string;
  hint2: string;
  hint3: string;
  commonWrongMoveExplanation: string;
  ratingBand: RatingBand;
  outcomeType: OutcomeType;
}
