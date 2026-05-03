import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const srcRoot = join(root, 'client/src');

const allowedExact = new Set([
  'client/src/styles/tokens.css',
  'client/src/constants/index.js',
  'client/src/initialData.js',
]);

const allowedPrefixes = [
  'client/src/features/landing/',
];

const legacyDebtPrefixes = [
  'client/src/components/',
  'client/src/features/admin/',
  'client/src/features/auth/',
  'client/src/features/settings/',
  'client/src/features/academy/CreateOrganization.jsx',
  'client/src/features/academy/AcademyLayout.jsx',
  'client/src/features/academy/JoinOrganization.jsx',
  'client/src/features/academy/InvitationManager.jsx',
  'client/src/features/academy/PlayerRoster.jsx',
  'client/src/features/academy/TeamManagement.jsx',
  'client/src/features/academy/AcademySettings.jsx',
  'client/src/styles/academy.css',
];

const fileExtensions = new Set(['.css', '.js', '.jsx', '.ts', '.tsx']);
const colorLiteralPattern = /(?<!&)(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\))/g;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      files.push(...walk(full));
    } else if (fileExtensions.has(full.slice(full.lastIndexOf('.')))) {
      files.push(full);
    }
  }
  return files;
}

function isAllowed(path) {
  return allowedExact.has(path) || allowedPrefixes.some((prefix) => path.startsWith(prefix));
}

function isLegacyDebt(path) {
  return legacyDebtPrefixes.some((prefix) => path.startsWith(prefix));
}

function lineNumber(text, index) {
  return text.slice(0, index).split('\n').length;
}

const violations = [];
const legacy = [];

for (const file of walk(srcRoot)) {
  const path = relative(root, file);
  const text = readFileSync(file, 'utf8');
  const matches = [...text.matchAll(colorLiteralPattern)];
  if (matches.length === 0 || isAllowed(path)) continue;

  const target = isLegacyDebt(path) ? legacy : violations;
  for (const match of matches) {
    target.push({ path, line: lineNumber(text, match.index), value: match[0] });
  }
}

if (legacy.length > 0) {
  console.log(`Color guardrail: ${legacy.length} legacy literals remain in deferred areas.`);
}

if (violations.length > 0) {
  console.error('Color guardrail failed. Move these colours into client/src/styles/tokens.css or use semantic tokens:');
  for (const item of violations.slice(0, 80)) {
    console.error(`  ${item.path}:${item.line} ${item.value}`);
  }
  if (violations.length > 80) {
    console.error(`  ...and ${violations.length - 80} more.`);
  }
  process.exit(1);
}

console.log('Color guardrail passed for enforced areas.');
