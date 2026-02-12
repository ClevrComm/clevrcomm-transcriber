#!/bin/bash

# Initialize status tracking
MISSING_ITEMS=()
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting System Health Check..."
echo "--------------------------------"

# 1. Check if verify-changes.sh exists and is executable
if [ -f "./verify-changes.sh" ]; then
    if [ -x "./verify-changes.sh" ]; then
        echo -e "${GREEN}[OK]${NC} verify-changes.sh exists and is executable"
    else
        MISSING_ITEMS+=("verify-changes.sh exists but is NOT executable")
        echo -e "${RED}[FAIL]${NC} verify-changes.sh is not executable"
    fi
else
    MISSING_ITEMS+=("verify-changes.sh is missing")
    echo -e "${RED}[FAIL]${NC} verify-changes.sh is missing"
fi

# 2. Verify .git/hooks/pre-commit exists and points to the verification script
if [ -f ".git/hooks/pre-commit" ]; then
    if grep -q "verify-changes.sh" ".git/hooks/pre-commit"; then
        echo -e "${GREEN}[OK]${NC} .git/hooks/pre-commit is active"
    else
        MISSING_ITEMS+=(".git/hooks/pre-commit does not point to verify-changes.sh")
        echo -e "${RED}[FAIL]${NC} .git/hooks/pre-commit incorrect content"
    fi
else
    MISSING_ITEMS+=(".git/hooks/pre-commit is missing")
    echo -e "${RED}[FAIL]${NC} .git/hooks/pre-commit is missing"
fi

# 3. Check if .agent/rules/main.md contains the 'Update Protocol'
RULE_FILE=".agent/rules/main.md"
if [ -f "$RULE_FILE" ]; then
    if grep -q "Update Protocol" "$RULE_FILE"; then
        echo -e "${GREEN}[OK]${NC} Rule 'Update Protocol' found in $RULE_FILE"
    else
        MISSING_ITEMS+=("$RULE_FILE does not contain 'Update Protocol'")
        echo -e "${RED}[FAIL]${NC} 'Update Protocol' missing in $RULE_FILE"
    fi
else
    MISSING_ITEMS+=("$RULE_FILE is missing")
    echo -e "${RED}[FAIL]${NC} $RULE_FILE is missing"
fi

# 4. List the total number of restore-point tags currently saved
# Assuming tags format: restore-point-*
RESTORE_COUNT=$(git tag -l "restore-point-*" 2>/dev/null | wc -l | tr -d ' ')
if [ -z "$RESTORE_COUNT" ]; then RESTORE_COUNT=0; fi
echo "Total restore-point tags: $RESTORE_COUNT"

echo "--------------------------------"

# Final Status
if [ ${#MISSING_ITEMS[@]} -eq 0 ]; then
    echo -e "${GREEN}SYSTEM READY${NC}"
    exit 0
else
    echo -e "${RED}System check failed. The following items are missing or incorrect:${NC}"
    for item in "${MISSING_ITEMS[@]}"; do
        echo " - $item"
    done
    exit 1
fi
