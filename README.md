# Chess Climb Trainer

A focused tactics trainer for beginner Chess.com players (~400–500 Elo) who want to
climb to 800–1000. It drills the one habit that wins beginner games:

> **Checks, captures, threats. What is hanging? What is my opponent threatening?**

Every puzzle is hand-verified with [chess.js](https://github.com/jhlywa/chess.js) so
you never train on an illegal position or a wrong "solution."

## Why this app

At the beginner level, most games are decided by hanging pieces and missed one-move
tactics — not deep strategy. Chess Climb Trainer turns the core safety routine into a
repeatable drill: spot free material, find mate in one, avoid blunders, and learn to
ask the right questions *before* you move.

## Features

- **20 validated puzzles** spanning the patterns that decide beginner games: hanging
  pieces, free queen/rook, mate in 1 & 2, forks, pins, skewers, back-rank mates,
  discovered attacks, removing the defender, and blunder prevention.
- **Five training modes**
  - **Random** — a mix of puzzles near your level.
  - **Theme** — drill a single tactical idea.
  - **Weakness** — focuses on the themes you miss most.
  - **Daily Climb** — a fixed 10-puzzle set (3 free material, 2 mate, 3 tactics,
    2 blunder prevention).
  - **Checklist** — forces you to answer the 5 safety questions before the board
    will let you reveal.
- **Coaching feedback** — first wrong answer gives Hint 1, second gives Hint 2, third
  reveals the solution. Correct answers come with a short "why it works" lesson.
- **Three hints per puzzle** plus a post-puzzle mini-lesson: the pattern to remember,
  why beginners miss it, how to spot it, and the real-game question to ask.
- **Permanent 8-point checklist panel** always visible while you train.
- **Progress tracking** — overall & first-try accuracy, current/best streak, solved
  today, per-theme accuracy, and an interpreted dashboard that tells you what to train
  next.
- **Spaced-repetition review queue** so missed puzzles come back at the right time.
- **Difficulty adaptation** — keeps you in the 400–700 band until your accuracy earns
  harder puzzles.
- **Clean, calm, mobile-responsive UI** with color-coded feedback (green / red / amber).
  Themes stay hidden until you solve a puzzle (except in Theme mode).

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) build tooling
- [chess.js](https://github.com/jhlywa/chess.js) for move legality and puzzle validation
- [react-chessboard](https://github.com/Clariity/react-chessboard) for the board UI
- LocalStorage for progress (no backend, no account)

## Getting started

```bash
npm install
npm run dev      # start the dev server
```

Then open the printed local URL (default http://localhost:5173).

### Other scripts

```bash
npm run validate:puzzles   # verify every FEN, move, and mate with chess.js
npm run build              # typecheck (tsc -b) and bundle for production
npm run preview            # preview the production build locally
```

## How puzzles are validated

`npm run validate:puzzles` runs `scripts/validatePuzzles.ts`, which checks each puzzle:

- the FEN is legal and the side to move matches `sideToMove`;
- the difficulty is within range;
- every move in `solutionMoves` is legal in sequence;
- `bestMoveSan` / `bestMoveUci` match what chess.js actually generates;
- mate puzzles are *real* forced mates (verified by a recursive minimax search);
- no duplicate puzzle IDs.

The build is not shipped with any puzzle that fails these checks.

## Project structure

```
src/
  components/   ChessBoard, FeedbackPanel, HintPanel, Dashboard,
                ModeSelector, ChecklistPanel, ProgressStats
  data/         puzzles.ts        — the validated puzzle database
  types/        puzzle.ts, stats.ts
  utils/        chessValidation, progressStorage, puzzleSelector, spacedRepetition
  App.tsx       orchestration & game loop
  main.tsx
  index.css
scripts/
  validatePuzzles.ts
```

## Known limitations

- Each puzzle stores a single solution line, so an alternate strong move may be marked
  wrong even when it is also good.
- The 20-puzzle set is intentionally small and beginner-focused; it is meant for
  habit-building, not exhaustive coverage.
- Progress lives in your browser's LocalStorage — clearing site data resets it, and it
  does not sync across devices.

## Next improvements

- Accept multiple correct solution lines per puzzle.
- Grow the database (50+ puzzles) and add an "endgame safety" theme.
- Optional cloud sync / accounts for cross-device progress.
- Import your own missed positions from real games.

## License

MIT
