@echo off
setlocal enabledelayedexpansion

echo ===== 1. git status =====
git --no-pager status
set status_output=!ERRORLEVEL!

echo.
echo ===== 2. Checking for staged changes and running diff --staged if present =====
git --no-pager diff --cached --quiet
if !ERRORLEVEL! neq 0 (
    echo Staged changes detected:
    echo.
    git --no-pager diff --staged --unified=3
) else (
    echo No staged changes detected.
)

echo.
echo ===== 3. Checking for unstaged changes and running diff if present =====
git --no-pager diff --quiet
if !ERRORLEVEL! neq 0 (
    echo Unstaged changes detected:
    echo.
    git --no-pager diff --unified=3
) else (
    echo No unstaged changes detected.
)

echo.
echo ===== 4. Checking if working tree is clean =====
git --no-pager status --porcelain
if !ERRORLEVEL! equ 0 (
    echo.
    echo Working tree status determined. Running diff main...HEAD if clean:
    git --no-pager diff main...HEAD --unified=3
)

echo.
echo ===== 5. Last 10 commits =====
git --no-pager log --oneline -10

endlocal
