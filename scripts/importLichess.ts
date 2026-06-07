/**
 * Imports beginner puzzles from the Lichess open puzzle database (CC0) and
 * writes them to src/data/puzzles.generated.ts.
 *
 * Every imported puzzle is converted with chess.js and then run through the
 * project's own validatePuzzle() — anything that fails is dropped. We stream
 * the compressed database over the network and stop as soon as our per-theme
 * buckets are full, so we never download the whole 300 MB file.
 *
 * Run with:  npx tsx scripts/importLichess.ts
 */
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { writeFileSync } from 'node:fs';
import { Chess } from 'chess.js';
import type { Puzzle, PuzzleTheme, OutcomeType, RatingBand } from '../src/types/puzzle';
import { validatePuzzle } from '../src/utils/chessValidation';

const DB_URL = 'https://database.lichess.org/lichess_db_puzzle.csv.zst';

// How many of each theme we want, and quality gates.
const PER_THEME: Partial<Record<PuzzleTheme, number>> = {
  'Mate in 1': 26,
  'Mate in 2': 20,
  Fork: 20,
  'Knight fork': 18,
  Pin: 18,
  Skewer: 15,
  'Discovered attack': 15,
  'Removing the defender': 12,
  'Hanging piece': 22,
  'Free queen': 12,
  'Free rook': 12,
  'Capture the undefended piece': 20,
};
// Per-theme quota for the easier band (difficulty < 700) so beginners aren't
// starved of approachable puzzles. Mates are naturally rarer at low ratings.
const LOW_PER_THEME: Partial<Record<PuzzleTheme, number>> = {
  'Mate in 1': 16,
  'Mate in 2': 8,
  Fork: 12,
  'Knight fork': 10,
  Pin: 10,
  Skewer: 8,
  'Discovered attack': 8,
  'Removing the defender': 7,
  'Hanging piece': 12,
  'Free queen': 8,
  'Free rook': 8,
  'Capture the undefended piece': 12,
};
const LOW_BAND_MAX = 700; // difficulty < this counts as the "easy" band

const MIN_RATING = 400;
const MAX_RATING = 1100;
const MIN_POPULARITY = 85;
const MIN_PLAYS = 60;
const MAX_LINES = 2_500_000;
const MAX_SOLUTION_PLIES = 3; // 1 (mate-in-1 / one-mover) up to 3 (mate-in-2 / 2-mover)

interface Bucket {
  capHigh: number;
  capLow: number;
  items: Puzzle[];
  lowCount: number;
  highCount: number;
}

const buckets = new Map<PuzzleTheme, Bucket>();
for (const [theme, capHigh] of Object.entries(PER_THEME)) {
  buckets.set(theme as PuzzleTheme, {
    capHigh: capHigh as number,
    capLow: LOW_PER_THEME[theme as PuzzleTheme] ?? 0,
    items: [],
    lowCount: 0,
    highCount: 0,
  });
}

// Stop once every theme's HIGH-band quota is full. Low-band puzzles are rarer,
// so we grab whatever we find along the way rather than blocking on them.
function bucketsFull(): boolean {
  for (const b of buckets.values()) if (b.highCount < b.capHigh) return false;
  return true;
}

function ratingBandFor(d: number): RatingBand {
  if (d < 500) return '300-500';
  if (d < 700) return '500-700';
  return '700-1000';
}

function parseUci(uci: string): { from: string; to: string; promotion?: string } {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci.slice(4, 5) : undefined,
  };
}

/** Decide which of our themes a Lichess puzzle belongs to (or null to skip). */
function mapTheme(
  lichessThemes: Set<string>,
  firstMovePieceType: string,
  capturedType: string | undefined,
): PuzzleTheme | null {
  if (lichessThemes.has('mateIn1')) return 'Mate in 1';
  if (lichessThemes.has('mateIn2')) return 'Mate in 2';
  if (lichessThemes.has('fork')) return firstMovePieceType === 'n' ? 'Knight fork' : 'Fork';
  if (lichessThemes.has('pin')) return 'Pin';
  if (lichessThemes.has('skewer')) return 'Skewer';
  if (lichessThemes.has('discoveredAttack')) return 'Discovered attack';
  if (lichessThemes.has('deflection') || lichessThemes.has('attraction'))
    return 'Removing the defender';
  if (lichessThemes.has('hangingPiece')) {
    if (capturedType === 'q') return 'Free queen';
    if (capturedType === 'r') return 'Free rook';
    return capturedType ? 'Capture the undefended piece' : 'Hanging piece';
  }
  return null;
}

const SIDE_WORD = (s: 'w' | 'b') => (s === 'w' ? 'White' : 'Black');

interface Teaching {
  explanation: string;
  beginnerMistake: string;
  patternToRemember: string;
  howToSpot: string;
  hint1: string;
  hint2: string;
  hint3: string;
  commonWrongMoveExplanation: string;
}

function genTeaching(theme: PuzzleTheme, best: string, side: 'w' | 'b'): Teaching {
  const who = SIDE_WORD(side);
  const base = {
    hint3: `The move is ${best}.`,
    commonWrongMoveExplanation: `That move misses the point of the position. Re-check every check, capture and threat before deciding.`,
  };
  const map: Record<PuzzleTheme, Teaching> = {
    'Mate in 1': {
      explanation: `${best} delivers checkmate — the enemy king has no legal escape.`,
      beginnerMistake: 'Beginners grab material instead of looking for the immediate checkmate.',
      patternToRemember: 'Before anything else, ask: is there a check that ends the game right now?',
      howToSpot: 'Look at every check first. A check the king cannot answer is mate.',
      hint1: 'There is a forced checkmate in one move. Look at your checks.',
      hint2: 'Find the check that the king cannot escape, block, or capture out of.',
      ...base,
    },
    'Mate in 2': {
      explanation: `${best} forces mate in two: the opponent's only replies still lose to a finishing move.`,
      beginnerMistake: 'Beginners stop calculating after one move and miss the forced follow-up.',
      patternToRemember: 'A forcing first move (usually a check) leaves the opponent no good reply.',
      howToSpot: 'Start with checks. If every reply allows a second move that mates, you have it.',
      hint1: 'Start with a forcing move — a check that limits the king.',
      hint2: 'After your first move every reply is forced, and you mate on the next move.',
      ...base,
    },
    Fork: {
      explanation: `${best} forks two targets at once — the opponent cannot save both.`,
      beginnerMistake: 'Beginners attack one piece at a time and let the opponent defend.',
      patternToRemember: 'One move, two threats. Look for a square that hits two valuable pieces.',
      howToSpot: 'Scan for a move that attacks the king/queen/rook and another piece together.',
      hint1: 'One of your pieces can attack two targets in a single move.',
      hint2: 'Find the square that hits two valuable enemy pieces at once.',
      ...base,
    },
    'Knight fork': {
      explanation: `${best} is a knight fork — the knight attacks two pieces the opponent can't both rescue.`,
      beginnerMistake: 'Beginners overlook knight moves because they jump in an L-shape.',
      patternToRemember: 'Knights fork from a square that touches two valuable pieces at once.',
      howToSpot: 'Look for a knight landing square next to the king, queen, or a rook plus another piece.',
      hint1: 'Your knight can jump to a square that attacks two pieces.',
      hint2: 'Find the knight move that hits two valuable targets — often king and queen.',
      ...base,
    },
    Pin: {
      explanation: `${best} exploits a pin — a defender can't move without exposing something more valuable.`,
      beginnerMistake: 'Beginners forget a pinned piece is stuck and cannot really defend.',
      patternToRemember: 'A piece pinned to the king or queen is frozen — pile on or win it.',
      howToSpot: 'Look for enemy pieces lined up with their king or queen behind them.',
      hint1: 'One enemy piece is pinned and cannot move.',
      hint2: 'Attack or exploit the piece that is stuck in front of a more valuable one.',
      ...base,
    },
    Skewer: {
      explanation: `${best} is a skewer — the valuable piece must move and the one behind it falls.`,
      beginnerMistake: 'Beginners miss that a check can force a king to abandon a piece behind it.',
      patternToRemember: 'Skewer = pin in reverse: hit the big piece first, win the one behind.',
      howToSpot: 'Look for the enemy king or queen on the same line as another piece.',
      hint1: 'Attack the more valuable piece so it must move off the line.',
      hint2: 'When the front piece steps aside, you capture the piece behind it.',
      ...base,
    },
    'Discovered attack': {
      explanation: `${best} unleashes a discovered attack — moving one piece reveals an attack from another.`,
      beginnerMistake: 'Beginners only look at the piece they move, not the one behind it.',
      patternToRemember: 'Move one piece and a piece behind it suddenly attacks something.',
      howToSpot: 'Look for your own piece blocking a line from your rook, bishop, or queen.',
      hint1: 'Moving one piece opens an attack from a piece behind it.',
      hint2: 'Find the piece whose move both threatens something and reveals a second attack.',
      ...base,
    },
    'Removing the defender': {
      explanation: `${best} removes or distracts the defender, so the piece it was guarding falls.`,
      beginnerMistake: 'Beginners attack a defended piece without first dealing with its defender.',
      patternToRemember: 'Take or chase away the defender, then win what it was protecting.',
      howToSpot: 'Ask what is defending the key square or piece — then attack that defender.',
      hint1: 'A key enemy piece is only held up by one defender.',
      hint2: 'Eliminate or distract that defender first.',
      ...base,
    },
    'Hanging piece': {
      explanation: `${best} wins a piece that was left undefended.`,
      beginnerMistake: 'Beginners develop without checking which enemy pieces are unprotected.',
      patternToRemember: 'Free material first: always scan for undefended enemy pieces.',
      howToSpot: 'Count attackers and defenders on each enemy piece — zero defenders means free.',
      hint1: 'An enemy piece is hanging — nothing is defending it.',
      hint2: 'Capture the piece that has no defender.',
      ...base,
    },
    'Free queen': {
      explanation: `${best} wins the enemy queen, which was left hanging.`,
      beginnerMistake: 'Beginners assume a queen must be protected and never check.',
      patternToRemember: 'The queen is the biggest prize — always check if you can win it for free.',
      howToSpot: 'Look at the enemy queen: is anything actually defending it?',
      hint1: 'You can win the most valuable piece on the board.',
      hint2: 'The enemy queen is undefended — take it.',
      ...base,
    },
    'Free rook': {
      explanation: `${best} wins an undefended rook.`,
      beginnerMistake: 'Beginners overlook rooks sitting in the corner with no defender.',
      patternToRemember: 'Rooks are worth five points — never leave a free one on the board.',
      howToSpot: 'Scan the back rank and open files for an unprotected rook.',
      hint1: 'There is a rook you can win for nothing.',
      hint2: 'Capture the undefended rook.',
      ...base,
    },
    'Capture the undefended piece': {
      explanation: `${best} simply captures a piece the opponent failed to defend.`,
      beginnerMistake: 'Beginners miss free captures because they only look at their own plan.',
      patternToRemember: 'Every move, scan for enemy pieces with no defender.',
      howToSpot: 'Count defenders on each enemy piece; capture the one with none.',
      hint1: 'An enemy piece can be taken for free.',
      hint2: 'Find the undefended piece and capture it.',
      ...base,
    },
    // Themes not produced by the importer, but the type requires them.
    'Back-rank mate': {
      explanation: `${best} mates on the back rank.`,
      beginnerMistake: 'Forgetting the king is trapped behind its own pawns.',
      patternToRemember: 'A rook or queen on an open back rank can be mate.',
      howToSpot: 'Check if the enemy king has luft (an escape square).',
      hint1: 'Look at the back rank.',
      hint2: 'The king has no escape on the first rank.',
      ...base,
    },
    'Defending against a threat': {
      explanation: `${best} parries the opponent's threat.`,
      beginnerMistake: 'Only looking at your own attack, not the opponent’s.',
      patternToRemember: 'Always ask what the opponent is threatening.',
      howToSpot: 'Find the enemy threat, then the move that stops it.',
      hint1: 'The opponent is threatening something — deal with it.',
      hint2: 'Find the only move that defends.',
      ...base,
    },
    'Avoid hanging a piece': {
      explanation: `${best} keeps your pieces safe.`,
      beginnerMistake: 'Moving without checking what becomes undefended.',
      patternToRemember: 'Before you move, ask: does this hang anything?',
      howToSpot: 'Check each of your pieces for defenders after the move.',
      hint1: 'One move keeps all your pieces protected.',
      hint2: 'Avoid the move that drops material.',
      ...base,
    },
    'Checkmate threat': {
      explanation: `${best} sets up an unstoppable mate threat.`,
      beginnerMistake: 'Not converting an attack into a concrete mating threat.',
      patternToRemember: 'Create a threat the opponent cannot meet.',
      howToSpot: 'Look for a move that threatens mate next.',
      hint1: 'You can threaten checkmate.',
      hint2: 'Find the move the opponent cannot fully defend.',
      ...base,
    },
  };
  return map[theme];
}

interface Raw {
  id: string;
  fen: string;
  moves: string;
  rating: number;
  theme: PuzzleTheme;
}

function buildPuzzle(raw: Raw, side: 'w' | 'b', solutionSan: string[], best: { san: string; uci: string }, outcome: OutcomeType): Puzzle {
  const difficulty = Math.max(300, Math.min(1000, raw.rating));
  const t = genTeaching(raw.theme, best.san, side);
  return {
    id: `lichess-${raw.id}`,
    fen: raw.fen,
    sideToMove: side,
    difficulty,
    theme: raw.theme,
    tags: [raw.theme.toLowerCase().replace(/\s+/g, '-')],
    solutionMoves: solutionSan,
    bestMoveSan: best.san,
    bestMoveUci: best.uci,
    explanation: t.explanation,
    beginnerMistake: t.beginnerMistake,
    patternToRemember: t.patternToRemember,
    howToSpot: t.howToSpot,
    hint1: t.hint1,
    hint2: t.hint2,
    hint3: t.hint3,
    commonWrongMoveExplanation: t.commonWrongMoveExplanation,
    ratingBand: ratingBandFor(difficulty),
    outcomeType: outcome,
  };
}

function tryConvert(
  puzzleId: string,
  fen: string,
  movesField: string,
  rating: number,
  themesField: string,
): Puzzle | null {
  const uciList = movesField.split(' ');
  if (uciList.length < 2) return null;
  const solutionPlies = uciList.length - 1;
  if (solutionPlies < 1 || solutionPlies > MAX_SOLUTION_PLIES) return null;

  const board = new Chess(fen);
  // Apply the opponent's setup move to reach the position shown to the player.
  let setup;
  try {
    setup = board.move(parseUci(uciList[0]));
  } catch {
    return null;
  }
  if (!setup) return null;

  const puzzleFen = board.fen();
  const side = board.turn();

  // Convert the solution line (UCI -> SAN) by replaying it.
  const replay = new Chess(puzzleFen);
  const solutionSan: string[] = [];
  let firstSan = '';
  let firstUci = '';
  let firstPieceType = '';
  let firstCaptured: string | undefined;
  for (let i = 0; i < uciList.length - 1; i++) {
    const uciMove = parseUci(uciList[i + 1]);
    // The player only plays even-index solution moves; skip underpromotions there.
    if (i % 2 === 0 && uciMove.promotion && uciMove.promotion !== 'q') return null;
    let mv;
    try {
      mv = replay.move(uciMove);
    } catch {
      return null;
    }
    if (!mv) return null;
    solutionSan.push(mv.san);
    if (i === 0) {
      firstSan = mv.san;
      firstUci = `${mv.from}${mv.to}${mv.promotion ?? ''}`;
      firstPieceType = mv.piece;
      firstCaptured = mv.captured;
    }
  }

  const lichessThemes = new Set(themesField.split(' '));
  const theme = mapTheme(lichessThemes, firstPieceType, firstCaptured);
  if (!theme) return null;

  const bucket = buckets.get(theme);
  if (!bucket) return null;

  const difficulty = Math.max(300, Math.min(1000, rating));
  const isLow = difficulty < LOW_BAND_MAX;
  if (isLow && bucket.lowCount >= bucket.capLow) return null;
  if (!isLow && bucket.highCount >= bucket.capHigh) return null;

  // Outcome type.
  let outcome: OutcomeType = 'material win';
  if (theme === 'Mate in 1' || theme === 'Mate in 2') {
    if (!replay.isCheckmate()) return null;
    outcome = 'mate';
  } else if (!firstCaptured && solutionPlies === 1) {
    // A one-move non-capture that isn't mate is not a clean beginner win.
    return null;
  }

  const raw: Raw = { id: puzzleId, fen: puzzleFen, moves: movesField, rating, theme };
  const puzzle = buildPuzzle(raw, side, solutionSan, { san: firstSan, uci: firstUci }, outcome);

  const result = validatePuzzle(puzzle);
  if (!result.valid) return null;

  bucket.items.push(puzzle);
  if (isLow) bucket.lowCount++;
  else bucket.highCount++;
  return puzzle;
}

async function main() {
  console.log('Streaming Lichess puzzle database (stops once buckets are full)…');
  const child = spawn('bash', ['-c', `curl -s --max-time 240 "${DB_URL}" | zstd -dc`], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const rl = createInterface({ input: child.stdout!, crlfDelay: Infinity });

  let lines = 0;
  let kept = 0;
  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    rl.close();
    child.stdout?.destroy();
    try {
      child.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  };

  for await (const line of rl) {
    if (done) break;
    lines++;
    if (lines === 1 && line.startsWith('PuzzleId')) continue;
    if (lines > MAX_LINES) {
      finish();
      break;
    }

    const cols = line.split(',');
    if (cols.length < 8) continue;
    const [id, fen, moves, ratingStr, , popStr, playsStr, themes] = cols;
    const rating = Number(ratingStr);
    if (!Number.isFinite(rating) || rating < MIN_RATING || rating > MAX_RATING) continue;
    if (Number(popStr) < MIN_POPULARITY) continue;
    if (Number(playsStr) < MIN_PLAYS) continue;

    const puzzle = tryConvert(id, fen, moves, rating, themes);
    if (puzzle) {
      kept++;
      if (kept % 25 === 0) console.log(`  kept ${kept} puzzles (scanned ${lines} lines)…`);
    }

    if (bucketsFull()) {
      finish();
      break;
    }
  }
  finish();

  const all: Puzzle[] = [];
  for (const [theme, b] of buckets) {
    console.log(`  ${theme}: ${b.items.length} (low ${b.lowCount}/${b.capLow}, high ${b.highCount}/${b.capHigh})`);
    all.push(...b.items);
  }

  const header = `// AUTO-GENERATED by scripts/importLichess.ts — do not edit by hand.
// Source: Lichess open puzzle database (https://database.lichess.org/), CC0.
// Every puzzle here passed src/utils/chessValidation.ts validatePuzzle().
import type { Puzzle } from '../types/puzzle';

export const generatedPuzzles: Puzzle[] = ${JSON.stringify(all, null, 2)};
`;
  writeFileSync(new URL('../src/data/puzzles.generated.ts', import.meta.url), header);
  console.log(`\nWrote ${all.length} validated puzzles to src/data/puzzles.generated.ts`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
