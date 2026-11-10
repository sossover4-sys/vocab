// ממיר את קובץ הוורד ל-src/data/words.json.
// הרצה: npm run convert
// קובץ הוורד רק נקרא – לא משתנה.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mammoth from 'mammoth';
import { parseWords } from './parse-words.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docxPath = join(root, 'אוצר מילים אנגלית.docx');
const fixesPath = join(root, 'scripts', 'fixes.json');
const outPath = join(root, 'src', 'data', 'words.json');

const { value: text } = await mammoth.extractRawText({ buffer: readFileSync(docxPath) });
const fixes = JSON.parse(readFileSync(fixesPath, 'utf8'));
const { words, report } = parseWords(text.split(/\r?\n/), fixes);

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(words, null, 1) + '\n', 'utf8');

console.log(`נכתבו ${words.length} מילים אל src/data/words.json`);
console.log(`שורות שדולגו: ${report.skipped.length}`);
console.log(`שורות שפוצלו: ${report.splitLines.join(' | ') || 'אין'}`);
console.log(`כפילויות שמוזגו: ${report.merged.join(', ') || 'אין'}`);
console.log(`תיקוני אנגלית: ${report.enFixed.length}`);
report.enFixed.forEach((f) => console.log('  ' + f));
console.log(`תיקוני עברית: ${report.heFixed.length}`);
report.heFixed.forEach((f) => console.log('  ' + f));
if (report.problems.length) {
  console.log('⚠ בעיות:');
  report.problems.forEach((p) => console.log('  ' + p));
  process.exitCode = 1;
}
const unusedEn = Object.keys(fixes.en || {}).filter((k) => !report.enFixed.some((f) => f.startsWith(k + ' →')));
if (unusedEn.length) console.log('⚠ תיקוני אנגלית שלא נמצאו:', unusedEn.join(', '));
