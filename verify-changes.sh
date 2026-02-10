#!/bin/bash

# Gatekeeper Verification Script
# This script ensures system integrity before commits.

echo "========================================="
echo "   GATEKEEPER: VERIFYING CHANGES..."
echo "========================================="

EXIT_CODE=0

# 1. E2E Test Suite
echo "[1/4] Running E2E Test Suite (verify_gemini.js)..."
if node verify_gemini.js; then
    echo "✅ E2E Tests Passed"
else
    echo "❌ E2E Tests FAILED"
    EXIT_CODE=1
fi

# 2. Architect Tool (Skipped - JS Project)
# echo "-----------------------------------------"
# echo "[2/4] Running Architect Tool (npx tsc --noEmit)..."
# if npx tsc --noEmit; then
#     echo "✅ Architect Check Passed"
# else
#     echo "❌ Architect Check FAILED"
#     EXIT_CODE=1
# fi

# 3. Log & Diff Check
echo "-----------------------------------------"
echo "[3/4] Checking Logs & Diffs..."

# Check for console.error in staged changes
echo "Checking for new console.error calls in staged files..."
if git diff --cached --unified=0 | grep -q "+.*console.error"; then
    echo "❌ FAILED: Found 'console.error' in staged changes. Please use proper error handling or logging."
    git diff --cached --unified=0 | grep "+.*console.error"
    EXIT_CODE=1
else
    echo "✅ No new console.error calls found."
fi

# Build Log Check
echo "Running 'npm run build' to check for build errors..."
rm -rf dist
npm run build > build_output.log 2>&1
BUILD_RES=$?

if grep -iqE "error|fatal|failed" build_output.log; then
    echo "❌ Build Log contained forbidden strings:"
    grep -iE "error|fatal|failed" build_output.log
    EXIT_CODE=1
elif [ $BUILD_RES -ne 0 ]; then
    echo "❌ Build failed with exit code $BUILD_RES"
    EXIT_CODE=1
else
    echo "✅ Build Log Clean"
fi

# 4. Pattern Check (Conventions)
echo "-----------------------------------------"
echo "[4/4] Verifying Code Patterns..."
# Example: Check for 'var' usage in staged JS/JSX files
if git diff --cached --name-only | grep -E "\.(js|jsx|ts|tsx)$" | xargs grep -l "var " > /dev/null 2>&1; then
     # Check if the 'var' is actually a new addition
     if git diff --cached --unified=0 | grep -q "+.*var "; then
        echo "❌ FAILED: Found 'var' usage. Use 'let' or 'const'."
        EXIT_CODE=1
     fi
fi

# Add more grep checks here as needed for specific project conventions
# e.g. ensuring components have a specific export style

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Pattern Check Passed"
fi


echo "========================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "   ALL CHECKS PASSED. PROTOCOL FOLLOWED."
    echo "========================================="
    
    # Create Restore Point
    echo ""
    echo "Creating Restore Point..."
    
    if [ -n "$1" ]; then
        SUMMARY="$1"
    else
        read -p "Enter a brief summary for this restore point (or press Enter to skip): " SUMMARY
    fi
    
    if [ -n "$SUMMARY" ]; then
        git add .
        git commit -m "$SUMMARY"
        
        # Create timestamped tag
        TAG_NAME="restore-$(date +%Y%m%d-%H%M%S)"
        git tag -a "$TAG_NAME" -m "$SUMMARY"
        
        echo "✅ Restore Point Created: $TAG_NAME"
        echo "   Summary: $SUMMARY"
    else
        echo "⚠ No summary provided. Skipping restore point creation."
    fi
    
    exit 0
else
    echo "   ❌ GATEKEEPER FAILED. FIX ERRORS BEFORE COMMITTING."
    echo "========================================="
    exit 1
fi
