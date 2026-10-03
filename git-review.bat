@echo off
setlocal enabledelayedexpansion

cd /d "C:\Users\Dolan\Desktop\hackyeah_2026\Hubmi_hub\hubmi.worktrees\copilot-worktree-2026-10-03T17-03-45"

echo === 1. GIT STATUS ===
git --no-pager status
set "status_output="
for /f %%A in ('git --no-pager status 2^>^&1') do set "status_output=!status_output! %%A"

echo.
echo === 2. GIT DIFF --STAGED ===
git --no-pager diff --staged

echo.
echo === 3. GIT DIFF (unstaged) ===
git --no-pager diff

echo.
echo === 4. GIT LOG --oneline -10 ===
git --no-pager log --oneline -10
