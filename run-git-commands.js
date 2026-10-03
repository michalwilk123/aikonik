const { execSync } = require('child_process');
const path = require('path');

const repoPath = __dirname;

try {
  console.log('=== GIT STATUS ===');
  console.log(execSync('git status', { cwd: repoPath, encoding: 'utf-8' }));

  console.log('\n=== GIT LOG (10 commits) ===');
  console.log(execSync('git log --oneline -10', { cwd: repoPath, encoding: 'utf-8' }));

  console.log('\n=== LATEST COMMIT (show --stat) ===');
  console.log(execSync('git show --stat', { cwd: repoPath, encoding: 'utf-8' }));

  console.log('\n=== LATEST COMMIT (full diff) ===');
  console.log(execSync('git show', { cwd: repoPath, encoding: 'utf-8' }));
} catch (error) {
  console.error('Error running git commands:', error.message);
  process.exit(1);
}
