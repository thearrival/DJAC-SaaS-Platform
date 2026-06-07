/**
 * fix-home-encoding.mjs
 * Fixes Windows-1252-misread UTF-8 corruption in Home.tsx.
 * Run: node scripts/fix-home-encoding.mjs client/src/pages/Home.tsx
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const filePath = resolve(process.argv[2]);
let c = readFileSync(filePath, 'utf8');
let total = 0;

function fix(from, to, label) {
    const n = c.split(from).length - 1;
    if (n > 0) {
        c = c.replaceAll(from, to);
        console.log(`  [${n}x] ${label}`);
        total += n;
    }
}

// em dash: E2 80 94 → CP1252 â (U+00E2) + € (U+20AC) + " (U+201D)
fix('\u00E2\u20AC\u201D', '\u2014', 'em dash  â€" → —');

// en dash: E2 80 93 → CP1252 â (U+00E2) + € (U+20AC) + " (U+201C)
fix('\u00E2\u20AC\u201C', '\u2013', 'en dash  â€" → –');

// ellipsis: E2 80 A6 → CP1252 â (U+00E2) + € (U+20AC) + ¦ (U+00A6)
fix('\u00E2\u20AC\u00A6', '\u2026', 'ellipsis â€¦ → …');

// middle dot: C2 B7 → CP1252 Â (U+00C2) + · (U+00B7)
fix('\u00C2\u00B7', '\u00B7', 'middle dot Â· → ·');

// multiplication sign: C3 97 → CP1252 Ã (U+00C3) + × (U+00D7)
fix('\u00C3\u00D7', '\u00D7', 'multiply Ã— → ×');

// China flag 🇨🇳 (U+1F1E8 U+1F1F3)
// F0 9F 87 A8 + F0 9F 87 B3 → ð(F0) Ÿ(9F) ‡(87) ¨(A8) ð(F0) Ÿ(9F) ‡(87) ³(B3)
fix(
    '\u00F0\u0178\u2021\u00A8\u00F0\u0178\u2021\u00B3',
    '\u{1F1E8}\u{1F1F3}',
    'China flag ðŸ‡¨ðŸ‡³ → 🇨🇳'
);

// Saudi Arabia flag 🇸🇦 (U+1F1F8 U+1F1E6)
// F0 9F 87 B8 + F0 9F 87 A6 → ð(F0) Ÿ(9F) ‡(87) ¸(B8) ð(F0) Ÿ(9F) ‡(87) ¦(A6)
fix(
    '\u00F0\u0178\u2021\u00B8\u00F0\u0178\u2021\u00A6',
    '\u{1F1F8}\u{1F1E6}',
    'Saudi flag ðŸ‡¸ðŸ‡¦ → 🇸🇦'
);

if (total > 0) {
    writeFileSync(filePath, c, 'utf8');
    console.log(`\n✓ ${total} replacement(s) — ${filePath} updated.`);
} else {
    console.log('No changes made (patterns not found or already clean).');
}
