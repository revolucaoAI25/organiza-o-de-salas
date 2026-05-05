#!/usr/bin/env node
'use strict';

// Cross-platform build script — works on Windows, Mac and Linux.
// Uses only Node.js built-ins; no shell-specific commands like cp/rm.

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');
const FRONTEND = path.join(ROOT, 'frontend');
const BACKEND  = path.join(ROOT, 'backend');

function run(cmd, cwd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd });
}

// 1. Install + build frontend
run('npm install --include=dev', FRONTEND);
run('npm run build', FRONTEND);

// 2. Copy frontend/dist → backend/public (cross-platform)
const src  = path.join(FRONTEND, 'dist');
const dest = path.join(BACKEND, 'public');
console.log('\n> Copying frontend/dist → backend/public');
if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

// 3. Install + build backend
run('npm install --include=dev', BACKEND);
run('npm run build', BACKEND);

console.log('\n✓ Build concluído com sucesso!\n');
