/* eslint-disable no-console */
import { puzzles } from '../src/data/puzzles';
import { validatePuzzles } from '../src/utils/chessValidation';

const report = validatePuzzles(puzzles);

console.log('\nChess Climb Trainer — puzzle validation\n');
console.log(`Total puzzles : ${report.total}`);
console.log(`Valid         : ${report.valid}`);
console.log(`Invalid       : ${report.invalid}\n`);

for (const result of report.results) {
  if (result.valid) {
    console.log(`  ok   ${result.puzzleId}`);
  } else {
    console.log(`  FAIL ${result.puzzleId}`);
    for (const problem of result.problems) {
      console.log(`         - ${problem}`);
    }
  }
}

if (report.invalid > 0) {
  console.error(`\n${report.invalid} puzzle(s) failed validation.\n`);
  process.exit(1);
}

console.log('\nAll puzzles are valid.\n');
