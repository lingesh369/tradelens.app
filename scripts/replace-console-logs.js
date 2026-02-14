#!/usr/bin/env node

/**
 * Script to replace console.log statements with logger utility
 * Usage: node scripts/replace-console-logs.js
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const DRY_RUN = process.argv.includes('--dry-run');

// Files to process
const patterns = [
  'src/**/*.ts',
  'src/**/*.tsx',
  'src/**/*.js',
  'src/**/*.jsx',
];

// Files to exclude
const excludePatterns = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/*.test.*',
  '**/*.spec.*',
];

const replacements = [
  {
    pattern: /console\.log\((.*?)\);?/g,
    replacement: (match, content) => {
      // Try to determine context
      if (content.includes('Auth') || content.includes('auth')) {
        return `logger.auth(${content});`;
      } else if (content.includes('API') || content.includes('api')) {
        return `logger.api(${content});`;
      } else if (content.includes('Payment') || content.includes('payment')) {
        return `logger.payment(${content});`;
      } else {
        return `logger.info(${content});`;
      }
    }
  },
  {
    pattern: /console\.error\((.*?)\);?/g,
    replacement: 'logger.error($1);'
  },
  {
    pattern: /console\.warn\((.*?)\);?/g,
    replacement: 'logger.warn($1);'
  },
  {
    pattern: /console\.debug\((.*?)\);?/g,
    replacement: 'logger.debug($1);'
  }
];

function shouldProcessFile(filePath) {
  return !excludePatterns.some(pattern => 
    filePath.includes(pattern.replace(/\*\*/g, ''))
  );
}

function needsLoggerImport(content) {
  return !content.includes("import { logger }") && 
         !content.includes("import { Logger }");
}

function addLoggerImport(content, filePath) {
  const ext = path.extname(filePath);
  const isReact = content.includes('import React') || content.includes('from "react"');
  
  // Find the last import statement
  const importRegex = /import .+ from .+;?\n/g;
  const imports = content.match(importRegex);
  
  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const importStatement = `import { logger } from '@/lib/logger';\n`;
    return content.replace(lastImport, lastImport + importStatement);
  } else {
    // No imports found, add at the top
    return `import { logger } from '@/lib/logger';\n\n${content}`;
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let replacementCount = 0;

  // Apply replacements
  replacements.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches) {
      replacementCount += matches.length;
      if (typeof replacement === 'function') {
        content = content.replace(pattern, replacement);
      } else {
        content = content.replace(pattern, replacement);
      }
      modified = true;
    }
  });

  // Add logger import if needed
  if (modified && needsLoggerImport(content)) {
    content = addLoggerImport(content, filePath);
  }

  if (modified) {
    if (DRY_RUN) {
      console.log(`[DRY RUN] Would update ${filePath} (${replacementCount} replacements)`);
    } else {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${filePath} (${replacementCount} replacements)`);
    }
  }

  return { modified, replacementCount };
}

async function main() {
  console.log('🔍 Searching for console.log statements...\n');
  
  if (DRY_RUN) {
    console.log('🏃 Running in DRY RUN mode - no files will be modified\n');
  }

  let totalFiles = 0;
  let modifiedFiles = 0;
  let totalReplacements = 0;

  for (const pattern of patterns) {
    const files = await glob(pattern, { ignore: excludePatterns });
    
    files.forEach(file => {
      if (shouldProcessFile(file)) {
        totalFiles++;
        const result = processFile(file);
        if (result.modified) {
          modifiedFiles++;
          totalReplacements += result.replacementCount;
        }
      }
    });
  }

  console.log('\n📊 Summary:');
  console.log(`   Total files scanned: ${totalFiles}`);
  console.log(`   Files modified: ${modifiedFiles}`);
  console.log(`   Total replacements: ${totalReplacements}`);
  
  if (DRY_RUN) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }
}

main();
