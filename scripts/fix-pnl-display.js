/**
 * Fix P&L display in ProfileHeader to show currency format
 */

import { readFileSync, writeFileSync } from 'fs';

const filePath = 'src/components/profile/ProfileHeader.tsx';
const content = readFileSync(filePath, 'utf8');

// Replace the pnl stat value calculation
const oldPattern = /value: calculatedStats \? `\$\$\{actualStats\.pnl\.toFixed\(2\)\}` : `\$\{actualStats\.pnl >= 0 \? '\+' : ''\}\$\{actualStats\.pnl\.toFixed\(1\)\}%`,/;

const newValue = `value: (() => {
        const sign = actualStats.pnl >= 0 ? '+' : '';
        const absValue = Math.abs(actualStats.pnl);
        let formatted;
        if (absValue >= 1000000) {
          formatted = \`\${(actualStats.pnl / 1000000).toFixed(2)}M\`;
        } else if (absValue >= 1000) {
          formatted = \`\${(actualStats.pnl / 1000).toFixed(2)}K\`;
        } else {
          formatted = actualStats.pnl.toFixed(2);
        }
        return \`\${sign}$\${formatted}\`;
      })(),`;

const newContent = content.replace(oldPattern, newValue);

if (newContent !== content) {
  writeFileSync(filePath, newContent, 'utf8');
  console.log('✅ Fixed P&L display in ProfileHeader.tsx');
} else {
  console.log('⚠️  Pattern not found or already fixed');
}
