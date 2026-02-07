#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

const pkgPath = path.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const current = pkg.version;
const [major, minor, patch] = current.split('.').map(Number);

const choices = [
  { key: '1', label: 'patch', desc: `${major}.${minor}.${patch} → ${major}.${minor}.${patch + 1}`, value: 'patch' },
  { key: '2', label: 'minor', desc: `${major}.${minor}.${patch} → ${major}.${minor + 1}.0`, value: 'minor' },
  { key: '3', label: 'major', desc: `${major}.${minor}.${patch} → ${major + 1}.0.0`, value: 'major' },
];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log(`\nCurrent version: ${current}\n`);
console.log('Select version bump:');
choices.forEach((c) => console.log(`  ${c.key}) ${c.label.padEnd(6)} ${c.desc}`));
console.log(`  4) cancel\n`);

rl.question('Choice (1-4): ', (answer) => {
  rl.close();
  const choice = choices.find((c) => c.key === answer.trim());
  if (answer.trim() === '4' || !choice) {
    console.log('Cancelled.');
    process.exit(0);
  }
  try {
    execSync(`npm version ${choice.value}`, { stdio: 'inherit' });
    console.log(`\nVersion bumped to ${choice.value}.`);
  } catch (err) {
    process.exit(1);
  }
});
