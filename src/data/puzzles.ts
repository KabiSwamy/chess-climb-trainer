import type { Puzzle } from '../types/puzzle';

/**
 * Beginner-focused puzzle database for ~300-1000 Elo.
 *
 * Every FEN, side-to-move, and solution move in this file has been validated
 * with chess.js (see src/utils/chessValidation.ts and `npm run validate:puzzles`).
 * Mate puzzles are confirmed to be real, forced mates. Do not hand-edit a FEN
 * or solution move without re-running validation.
 */
export const puzzles: Puzzle[] = [
  {
    id: 'm1-backrank',
    fen: '6k1/5ppp/8/8/8/8/8/R6K w - - 0 1',
    sideToMove: 'w',
    difficulty: 350,
    theme: 'Mate in 1',
    tags: ['mate', 'back-rank', 'rook'],
    solutionMoves: ['Ra8#'],
    bestMoveSan: 'Ra8#',
    bestMoveUci: 'a1a8',
    explanation:
      'Ra8 is checkmate. The black king is boxed in by its own pawns on f7, g7 and h7, so when your rook controls the whole back rank the king has nowhere to run.',
    beginnerMistake:
      'Beginners often look for captures first and miss that a quiet rook move to the back rank is already game over.',
    patternToRemember:
      'A king trapped behind its own un-moved pawns is in permanent danger of a back-rank mate.',
    howToSpot:
      'When the enemy king has no luft (no open square in front of it), scan your rooks and queen for a path to its back rank.',
    hint1: 'The black king is trapped by its own pawns. It cannot move forward.',
    hint2: 'This is a back-rank mate. Look at the open 8th rank.',
    hint3: 'Move your rook all the way up the a-file.',
    commonWrongMoveExplanation:
      'There is nothing to capture here, so grabbing for material wastes the winning idea. The win is the quiet back-rank check.',
    ratingBand: '300-500',
    outcomeType: 'mate',
  },
  {
    id: 'm1-rook-e8',
    fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1',
    sideToMove: 'w',
    difficulty: 450,
    theme: 'Back-rank mate',
    tags: ['mate', 'back-rank', 'rook'],
    solutionMoves: ['Re8#'],
    bestMoveSan: 'Re8#',
    bestMoveUci: 'e1e8',
    explanation:
      'Re8 is mate. The rook lands on the back rank with check, and the king cannot escape because f7, g7 and h7 are all blocked by its own pawns and f8 is covered by the rook.',
    beginnerMistake:
      'Hesitating because the rook is "only" a rook. On a weak back rank one rook is enough to mate.',
    patternToRemember:
      'Rook to the back rank with the king walled in by pawns equals checkmate.',
    howToSpot:
      'Ask: is the enemy king stuck on its first rank? If yes, can a rook or queen reach that rank with check?',
    hint1: 'The king has no escape squares. Why?',
    hint2: 'Its own pawns trap it. A check on the 8th rank ends the game.',
    hint3: 'Lift your rook straight up the e-file.',
    commonWrongMoveExplanation:
      'Any other rook move just gives the opponent a free move to play h6 and make luft. Strike immediately.',
    ratingBand: '300-500',
    outcomeType: 'mate',
  },
  {
    id: 'remove-defender-mate',
    fen: '3r2k1/5ppp/8/8/8/8/5PPP/3RR1K1 w - - 0 1',
    sideToMove: 'w',
    difficulty: 600,
    theme: 'Removing the defender',
    tags: ['back-rank', 'removing-the-defender', 'mate', 'rook'],
    solutionMoves: ['Rxd8#'],
    bestMoveSan: 'Rxd8#',
    bestMoveUci: 'd1d8',
    explanation:
      "Rxd8 captures the only piece guarding black's back rank and delivers mate at the same time. The black rook was the lone defender; removing it ends the game instantly.",
    beginnerMistake:
      'Trading rooks "to be safe" or missing that capturing the defender is itself checkmate.',
    patternToRemember:
      'If one enemy piece is the only thing stopping a mate, capturing or removing it often IS the mate.',
    howToSpot:
      'Spot the would-be mate first (back rank), then ask: what single piece is preventing it? Can I take that piece?',
    hint1: 'Your opponent has only one defender of the back rank.',
    hint2: 'Remove the defender. What happens to the back rank then?',
    hint3: 'Capture the black rook on d8.',
    commonWrongMoveExplanation:
      'Re8+ first lets black block or trade with the d8 rook. Take the defender directly — it is mate in one.',
    ratingBand: '500-700',
    outcomeType: 'mate',
  },
  {
    id: 'free-queen',
    fen: '7k/8/8/4q3/8/8/8/4Q1K1 w - - 0 1',
    sideToMove: 'w',
    difficulty: 350,
    theme: 'Free queen',
    tags: ['hanging', 'capture', 'queen'],
    solutionMoves: ['Qxe5+'],
    bestMoveSan: 'Qxe5+',
    bestMoveUci: 'e1e5',
    explanation:
      'Qxe5+ wins the black queen for free. The two queens stand on the same file with nothing in between, and the black queen is completely undefended.',
    beginnerMistake:
      'Not checking whether the big enemy piece is actually defended before assuming it is untouchable.',
    patternToRemember:
      'Before anything else, ask: is the most valuable enemy piece defended? If not, take it.',
    howToSpot:
      'Scan the lines your queen and rooks control. An undefended enemy queen on one of those lines is a free queen.',
    hint1: 'Look at the most valuable black piece. Is anything defending it?',
    hint2: 'Your queen and the black queen share an open line.',
    hint3: 'Capture straight up the e-file.',
    commonWrongMoveExplanation:
      'Moving your king or any quiet move throws away a free queen. Grab it now.',
    ratingBand: '300-500',
    outcomeType: 'material win',
  },
  {
    id: 'free-rook',
    fen: '7k/8/8/3r4/8/8/8/3R2K1 w - - 0 1',
    sideToMove: 'w',
    difficulty: 350,
    theme: 'Free rook',
    tags: ['hanging', 'capture', 'rook'],
    solutionMoves: ['Rxd5'],
    bestMoveSan: 'Rxd5',
    bestMoveUci: 'd1d5',
    explanation:
      'Rxd5 simply wins the black rook. Both rooks are on the open d-file and the black rook has no defender.',
    beginnerMistake:
      'Overlooking that two rooks on the same open file means one of them can be captured if it is undefended.',
    patternToRemember:
      'Pieces facing each other on an open file: whoever is undefended gets taken.',
    howToSpot:
      'Follow each open file and diagonal your pieces sit on, and check what is at the far end.',
    hint1: 'Your rook and the black rook are on the same file.',
    hint2: 'The black rook is undefended.',
    hint3: 'Capture up the d-file.',
    commonWrongMoveExplanation:
      'Any other move lets black save or defend the rook. Take the free material immediately.',
    ratingBand: '300-500',
    outcomeType: 'material win',
  },
  {
    id: 'free-rook-2',
    fen: '6k1/8/8/8/1r6/8/8/1R4K1 w - - 0 1',
    sideToMove: 'w',
    difficulty: 400,
    theme: 'Free rook',
    tags: ['hanging', 'capture', 'rook'],
    solutionMoves: ['Rxb4'],
    bestMoveSan: 'Rxb4',
    bestMoveUci: 'b1b4',
    explanation:
      'Rxb4 wins the rook outright. The black rook on b4 sits on the open b-file in front of your rook with no protection.',
    beginnerMistake:
      'Assuming an enemy rook deep in your half must be defended. Always check.',
    patternToRemember:
      'An undefended piece on a file or rank your rook controls is just free material.',
    howToSpot:
      'Trace your rook’s file. Is there an enemy piece on it with no defender behind or beside it?',
    hint1: 'Look down the b-file from your rook.',
    hint2: 'Nothing is guarding the black rook.',
    hint3: 'Capture it.',
    commonWrongMoveExplanation:
      'Do not shuffle your king. A free rook will not wait — take it.',
    ratingBand: '300-500',
    outcomeType: 'material win',
  },
  {
    id: 'undefended-bishop',
    fen: '7k/8/8/4b3/8/8/8/4R1K1 w - - 0 1',
    sideToMove: 'w',
    difficulty: 400,
    theme: 'Capture the undefended piece',
    tags: ['hanging', 'capture', 'bishop'],
    solutionMoves: ['Rxe5'],
    bestMoveSan: 'Rxe5',
    bestMoveUci: 'e1e5',
    explanation:
      'Rxe5 wins the bishop for nothing. The bishop is on your rook’s file with no defender.',
    beginnerMistake:
      'Ignoring enemy minor pieces because they "are not the queen." A free bishop is still a winning advantage.',
    patternToRemember:
      'Undefended is undefended. Win any free piece, big or small.',
    howToSpot:
      'After every enemy move, ask: did they just leave a piece where one of my pieces attacks it for free?',
    hint1: 'The black bishop is sitting on your rook’s file.',
    hint2: 'Is it defended? No.',
    hint3: 'Take it.',
    commonWrongMoveExplanation:
      'There is no need to be fancy. Capture the free bishop.',
    ratingBand: '300-500',
    outcomeType: 'material win',
  },
  {
    id: 'hanging-knight',
    fen: '7k/8/8/3n4/8/8/8/3R2K1 w - - 0 1',
    sideToMove: 'w',
    difficulty: 400,
    theme: 'Hanging piece',
    tags: ['hanging', 'capture', 'knight'],
    solutionMoves: ['Rxd5'],
    bestMoveSan: 'Rxd5',
    bestMoveUci: 'd1d5',
    explanation:
      'Rxd5 wins the knight. It is undefended and stands right on your rook’s open file.',
    beginnerMistake:
      'Not noticing a knight is hanging because knights move in unfamiliar L-shapes.',
    patternToRemember:
      'A piece is "hanging" when it is attacked and not defended. Take hanging pieces.',
    howToSpot:
      'Each turn, count attackers vs defenders on every enemy piece you can reach.',
    hint1: 'The knight on d5 is on your rook’s file.',
    hint2: 'Nothing defends the knight.',
    hint3: 'Capture it up the d-file.',
    commonWrongMoveExplanation:
      'Any quiet move lets the knight escape. Win it now.',
    ratingBand: '300-500',
    outcomeType: 'material win',
  },
  {
    id: 'knight-fork-royal',
    fen: '6k1/3q4/8/8/4N3/8/8/6K1 w - - 0 1',
    sideToMove: 'w',
    difficulty: 650,
    theme: 'Knight fork',
    tags: ['fork', 'knight', 'tactics'],
    solutionMoves: ['Nf6+'],
    bestMoveSan: 'Nf6+',
    bestMoveUci: 'e4f6',
    explanation:
      'Nf6+ forks the king and queen. It checks the king on g8 and simultaneously attacks the queen on d7. After the king moves, Nxd7 wins the queen.',
    beginnerMistake:
      'Only looking at where the knight can capture, instead of where it can attack two things at once.',
    patternToRemember:
      'When the enemy king and queen are a knight’s-move apart, look for a knight check that hits both.',
    howToSpot:
      'Before moving, always check knight jumps that give check — they often fork something valuable behind the check.',
    hint1: 'The black king and queen are dangerously close together.',
    hint2: 'A knight can attack two squares at once. This is a fork.',
    hint3: 'Jump your knight to f6 with check.',
    commonWrongMoveExplanation:
      'Capturing or chasing the queen directly lets it run. The check forces the king to move first, then you take the queen.',
    ratingBand: '500-700',
    outcomeType: 'material win',
  },
  {
    id: 'queen-fork',
    fen: 'r5k1/8/8/8/8/8/8/3Q2K1 w - - 0 1',
    sideToMove: 'w',
    difficulty: 600,
    theme: 'Fork',
    tags: ['fork', 'queen', 'double-attack'],
    solutionMoves: ['Qd5+'],
    bestMoveSan: 'Qd5+',
    bestMoveUci: 'd1d5',
    explanation:
      'Qd5+ is a double attack. It checks the king on g8 along the long diagonal and attacks the undefended rook on a8 along the other diagonal. After the king moves, Qxa8 wins the rook.',
    beginnerMistake:
      'Forgetting that the queen attacks in many directions at once and can hit two targets in a single move.',
    patternToRemember:
      'Centralise the queen and look for a square that gives check AND attacks a loose piece.',
    howToSpot:
      'Look for an enemy king and a loose piece that share a line through one central square.',
    hint1: 'The black rook on a8 is undefended.',
    hint2: 'Can you attack the rook and check the king in one move?',
    hint3: 'Centralise your queen to d5.',
    commonWrongMoveExplanation:
      'Going straight for Qxa8?? walks into nothing here, but without the check black could defend or move the rook. The check wins it cleanly.',
    ratingBand: '500-700',
    outcomeType: 'material win',
  },
  {
    id: 'pawn-fork',
    fen: '6k1/8/2n1n3/8/3P4/8/6K1/8 w - - 0 1',
    sideToMove: 'w',
    difficulty: 500,
    theme: 'Fork',
    tags: ['fork', 'pawn', 'double-attack'],
    solutionMoves: ['d5'],
    bestMoveSan: 'd5',
    bestMoveUci: 'd4d5',
    explanation:
      'd5 forks both knights. The pawn attacks c6 and e6 at the same time, and the knights cannot both escape, so you win a piece for a pawn.',
    beginnerMistake:
      'Underestimating pawns. A humble pawn push can win a whole piece by attacking two at once.',
    patternToRemember:
      'A pawn attacks two squares diagonally — push it to fork two enemy pieces sitting on those squares.',
    howToSpot:
      'When two enemy pieces sit side by side, check whether a pawn can advance to attack both.',
    hint1: 'Two black knights are sitting close together.',
    hint2: 'What attacks two diagonal squares at once? A pawn.',
    hint3: 'Push your d-pawn forward one square.',
    commonWrongMoveExplanation:
      'Moving your king does nothing. The pawn push wins material by force.',
    ratingBand: '500-700',
    outcomeType: 'material win',
  },
  {
    id: 'skewer-file',
    fen: 'q7/8/8/k7/8/8/8/3R2K1 w - - 0 1',
    sideToMove: 'w',
    difficulty: 700,
    theme: 'Skewer',
    tags: ['skewer', 'rook', 'tactics'],
    solutionMoves: ['Ra1+'],
    bestMoveSan: 'Ra1+',
    bestMoveUci: 'd1a1',
    explanation:
      'Ra1+ skewers the king and queen. The king on a5 is checked along the a-file and must step aside, after which Rxa8 wins the queen behind it.',
    beginnerMistake:
      'Not realising a check can force the king off a line so you can take what was hiding behind it.',
    patternToRemember:
      'A skewer attacks a valuable piece in front; when it moves, you win the piece behind it.',
    howToSpot:
      'Look for the enemy king (or queen) lined up in front of another piece on the same rank, file or diagonal.',
    hint1: 'The black king and queen are on the same file.',
    hint2: 'Check the king. It must move off the file.',
    hint3: 'Swing your rook to a1 with check.',
    commonWrongMoveExplanation:
      'Without the check the queen simply moves away. The skewer forces the king to move first.',
    ratingBand: '700-1000',
    outcomeType: 'material win',
  },
  {
    id: 'pin-queen',
    fen: '6k1/8/8/6r1/8/8/6Q1/6K1 w - - 0 1',
    sideToMove: 'w',
    difficulty: 650,
    theme: 'Pin',
    tags: ['pin', 'queen', 'tactics'],
    solutionMoves: ['Qxg5+'],
    bestMoveSan: 'Qxg5+',
    bestMoveUci: 'g2g5',
    explanation:
      'Qxg5+ wins the rook. The black rook on g5 is pinned to its king on g8, so it cannot run and cannot be saved. You simply capture it.',
    beginnerMistake:
      'Not noticing that the rook is glued in place because moving it would expose the king to check.',
    patternToRemember:
      'A pinned piece cannot legally move — so it cannot defend itself or run away.',
    howToSpot:
      'Look down your queen’s and rooks’ lines: is an enemy piece stuck in front of its own king?',
    hint1: 'The black rook is on the same file as its own king.',
    hint2: 'That means the rook is pinned — it cannot move.',
    hint3: 'Capture the pinned rook up the g-file.',
    commonWrongMoveExplanation:
      'You do not need to set anything up — the rook is already pinned and helpless. Take it.',
    ratingBand: '500-700',
    outcomeType: 'material win',
  },
  {
    id: 'discovered-attack',
    fen: '3q2k1/8/8/3N4/8/8/8/3R2K1 w - - 0 1',
    sideToMove: 'w',
    difficulty: 750,
    theme: 'Discovered attack',
    tags: ['discovered-attack', 'knight', 'rook', 'tactics'],
    solutionMoves: ['Ne7+'],
    bestMoveSan: 'Ne7+',
    bestMoveUci: 'd5e7',
    explanation:
      'Ne7+ is a discovered attack. The knight moves with check to the king on g8, and stepping aside unveils your rook on d1 attacking the queen on d8. After the king deals with the check, Rxd8 wins the queen.',
    beginnerMistake:
      'Forgetting that moving a piece can open a line for the piece standing behind it.',
    patternToRemember:
      'When your own piece blocks a rook, bishop or queen, moving it can "discover" an attack — especially with check.',
    howToSpot:
      'Notice your own pieces standing in front of your rooks/bishops, lined up with an enemy target.',
    hint1: 'Your rook on d1 is blocked by your own knight.',
    hint2: 'If the knight moves with check, what does the rook suddenly attack?',
    hint3: 'Jump the knight to e7 with check.',
    commonWrongMoveExplanation:
      'Just lining the rook up is too slow — black defends the queen. The knight check wins a tempo so the rook collects the queen.',
    ratingBand: '700-1000',
    outcomeType: 'material win',
  },
  {
    id: 'mate-in-2-kq',
    fen: '7k/8/5K2/8/8/8/8/Q7 w - - 0 1',
    sideToMove: 'w',
    difficulty: 700,
    theme: 'Mate in 2',
    tags: ['mate', 'queen', 'endgame', 'mate-in-2'],
    solutionMoves: ['Kf7+', 'Kh7', 'Qg7#'],
    bestMoveSan: 'Kf7+',
    bestMoveUci: 'f6f7',
    explanation:
      'Kf7+ does not check, it boxes the king: it takes away g8 and g7. The only black move is Kh7, and then Qg7# is mate, with the queen protected by your king. This is the basic king-and-queen mating method: use the king to take squares, then deliver mate.',
    beginnerMistake:
      'Giving aimless checks with the queen, which lets the king wander instead of getting trapped.',
    patternToRemember:
      'In king-and-queen mates, the king takes escape squares and the queen delivers the final blow, protected by the king.',
    howToSpot:
      'When you are up a queen, drive the enemy king to the edge, bring your king close, then mate.',
    hint1: 'Do not check with the queen yet. Use your king first.',
    hint2: 'Take away the king’s escape squares by advancing your own king.',
    hint3: 'Play Kf7, then after Kh7, the queen mates on g7.',
    commonWrongMoveExplanation:
      'An immediate queen check just shoves the king around and can even stalemate. Bring the king up first.',
    ratingBand: '700-1000',
    outcomeType: 'mate',
  },
  {
    id: 'mate-in-2-ladder',
    fen: '7k/8/8/8/8/8/6R1/R6K w - - 0 1',
    sideToMove: 'w',
    difficulty: 750,
    theme: 'Mate in 2',
    tags: ['mate', 'rook', 'endgame', 'ladder', 'mate-in-2'],
    solutionMoves: ['Ra3', 'Kh7', 'Rh3#'],
    bestMoveSan: 'Ra3',
    bestMoveUci: 'a1a3',
    explanation:
      'This is the two-rook "ladder" (staircase) mate. Rg2 already cuts the king off on the g-file, so the king is stuck on the h-file. Ra3 prepares to check on the h-file; after Kh7, Rh3# is mate. The rooks fence the king to the edge.',
    beginnerMistake:
      'Checking with a rook that the king can simply walk toward, or letting the king escape the wall of rooks.',
    patternToRemember:
      'Two rooks mate by making a wall: one rook cuts off a file/rank, the other checks, then they climb like a ladder.',
    howToSpot:
      'With two rooks and a cornered king, keep one rook cutting off the king and use the other to check it toward the edge.',
    hint1: 'One of your rooks already traps the king on the h-file.',
    hint2: 'Bring the other rook to a safe square on the h-file’s neighbour rank, ready to check.',
    hint3: 'Play Ra3; after the king moves to h7, Rh3 is mate.',
    commonWrongMoveExplanation:
      'Checking right away on the wrong rank lets the king approach your rook and attack it. Set the ladder up first.',
    ratingBand: '700-1000',
    outcomeType: 'mate',
  },
  {
    id: 'defend-back-rank',
    fen: '4r1k1/5ppp/8/8/8/8/5PPP/1N4K1 w - - 0 1',
    sideToMove: 'w',
    difficulty: 600,
    theme: 'Defending against a threat',
    tags: ['defense', 'back-rank', 'luft', 'prophylaxis'],
    solutionMoves: ['h3'],
    bestMoveSan: 'h3',
    bestMoveUci: 'h2h3',
    explanation:
      'h3 makes "luft" (breathing room) for your king. Black was threatening Re1#, a back-rank mate. After h3 your king can escape to h2, so the mate disappears. Recognising and stopping the opponent’s threat is just as important as making your own.',
    beginnerMistake:
      'Only thinking about your own plans and walking into a back-rank mate you could have prevented with one little pawn move.',
    patternToRemember:
      'If your king is stuck behind its pawns and the enemy controls an open file to your back rank, make luft.',
    howToSpot:
      'Always ask "what is my opponent threatening?" If the answer is mate, deal with it before anything else.',
    hint1: 'What is BLACK threatening right now? Look at the e-file.',
    hint2: 'Re1 would be checkmate. Your king has no escape square.',
    hint3: 'Give your king an escape hole by pushing the h-pawn.',
    commonWrongMoveExplanation:
      'Grabbing space or moving the knight ignores the threat — Re1# ends the game. Defend first.',
    ratingBand: '500-700',
    outcomeType: 'defensive move',
  },
  {
    id: 'avoid-hanging-knight',
    fen: '6k1/3b4/5p2/4N3/8/8/8/6K1 w - - 0 1',
    sideToMove: 'w',
    difficulty: 550,
    theme: 'Avoid hanging a piece',
    tags: ['blunder-prevention', 'knight', 'safety', 'tempo'],
    solutionMoves: ['Nxd7'],
    bestMoveSan: 'Nxd7',
    bestMoveUci: 'e5d7',
    explanation:
      'Your knight on e5 is attacked by the pawn on f6 — if you do nothing it is lost. Nxd7 saves the knight with tempo AND wins the undefended bishop. The best way to rescue an attacked piece is often to make it do something useful.',
    beginnerMistake:
      'Leaving an attacked piece where it stands, or retreating it passively when a much stronger move was available.',
    patternToRemember:
      'When your piece is attacked, look first for a move that saves it while also gaining something.',
    howToSpot:
      'After the opponent moves, check: did they attack one of my pieces? If so, can I move it somewhere active?',
    hint1: 'Your knight is attacked by the f6 pawn. It cannot stay.',
    hint2: 'Where can the knight go that also wins something?',
    hint3: 'Capture the undefended bishop on d7 with your knight.',
    commonWrongMoveExplanation:
      'A passive retreat like Nf3 saves the knight but wins nothing. Nxd7 saves it and grabs a free bishop.',
    ratingBand: '500-700',
    outcomeType: 'blunder prevention',
  },
  {
    id: 'checkmate-threat-queen',
    fen: '6k1/5ppp/8/8/8/8/8/2Q4K w - - 0 1',
    sideToMove: 'w',
    difficulty: 500,
    theme: 'Checkmate threat',
    tags: ['mate', 'queen', 'back-rank'],
    solutionMoves: ['Qc8#'],
    bestMoveSan: 'Qc8#',
    bestMoveUci: 'c1c8',
    explanation:
      'Qc8 is checkmate. The queen reaches the back rank with check; the king is fenced in by its f7, g7 and h7 pawns and f8 is covered by the queen, so there is no escape.',
    beginnerMistake:
      'Treating the queen only as a capturing tool and missing a quiet mating move.',
    patternToRemember:
      'A queen reaching the enemy back rank against a king trapped by its own pawns is often instant mate.',
    howToSpot:
      'Spot the trapped king first; then find any of your pieces that can hit the back rank with check.',
    hint1: 'The black king is trapped on the back rank by its pawns.',
    hint2: 'Your queen can reach the 8th rank with check.',
    hint3: 'Slide the queen to c8.',
    commonWrongMoveExplanation:
      'A normal check like Qc8 is the point — do not waste time chasing pawns. It is mate immediately.',
    ratingBand: '500-700',
    outcomeType: 'mate',
  },
  {
    id: 'hanging-bishop',
    fen: '2k5/8/8/4b3/8/2B5/8/6K1 w - - 0 1',
    sideToMove: 'w',
    difficulty: 450,
    theme: 'Hanging piece',
    tags: ['hanging', 'capture', 'bishop', 'diagonal'],
    solutionMoves: ['Bxe5'],
    bestMoveSan: 'Bxe5',
    bestMoveUci: 'c3e5',
    explanation:
      'Bxe5 wins the bishop. The two bishops share the a1-h8 diagonal and the black bishop is undefended, so you simply take it for free.',
    beginnerMistake:
      'Not following your bishop’s long diagonal all the way to the end, where a free piece is waiting.',
    patternToRemember:
      'Bishops reach far across the board — always check what is at the end of their diagonal.',
    howToSpot:
      'Trace each of your bishops’ diagonals to the edge. An undefended enemy piece on that diagonal is free.',
    hint1: 'Your bishop and the black bishop are on the same diagonal.',
    hint2: 'The black bishop has no defender.',
    hint3: 'Capture along the diagonal to e5.',
    commonWrongMoveExplanation:
      'Moving the king wastes the chance. The bishop is hanging — take it.',
    ratingBand: '300-500',
    outcomeType: 'material win',
  },
];

export default puzzles;
