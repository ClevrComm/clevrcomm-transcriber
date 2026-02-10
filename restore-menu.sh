#!/bin/bash

# Restore Menu Script
# Allows the user to select a restore point (git tag) and roll back the codebase.

echo "========================================="
echo "      RESTORE POINT MENU"
echo "========================================="
echo ""

# Fetch all restore tags, sorted by date (reverse)
# Assumes tags are named restore-YYYYMMDD-HHMMSS
TAGS=$(git tag -l "restore-*" | sort -r)

if [ -z "$TAGS" ]; then
    echo "❌ No restore points found."
    exit 0
fi

# Arrays to store tag data
declare -a TAG_ARRAY
declare -a MSG_ARRAY

index=1
echo "Available Restore Points:"
echo "-----------------------------------------"
echo " #  | Date/Time       | Summary"
echo "----|-----------------|--------------------------------"

# Change IFS (Internal Field Separator) to handle newlines in loop
IFS=$'\n'
for tag in $TAGS; do
    # Extract timestamp from tag name (restore-YYYYMMDD-HHMMSS)
    # Format: YYYY-MM-DD HH:MM:SS
    raw_date=${tag#restore-}
    formatted_date="${raw_date:0:4}-${raw_date:4:2}-${raw_date:6:2} ${raw_date:9:2}:${raw_date:11:2}:${raw_date:13:2}"
    
    # Get commit message (first line)
    # Use 'git show -s --format=%s' to get the subject of the commit pointed to by tag
    # If the tag itself has a message, we might prefer that, but let's assume commit message for now as per plan
    # Actually, verify-changes.sh tags with -m "$SUMMARY", so we should get the tag message
    msg=$(git tag -n1 "$tag" | sed "s/^$tag //")
    
    if [ -z "$msg" ]; then
        msg="(No summary)"
    fi
    
    TAG_ARRAY[$index]=$tag
    MSG_ARRAY[$index]=$msg
    
    printf "%-3s | %-15s | %s\n" "$index" "$formatted_date" "$msg"
    
    ((index++))
done
IFS=$' \t\n' # Reset IFS

echo "-----------------------------------------"
echo " 0  | Cancel"
echo ""

read -p "Select a restore point to revert to (0-$((index-1))): " CHOICE

if [[ ! "$CHOICE" =~ ^[0-9]+$ ]] || [ "$CHOICE" -lt 0 ] || [ "$CHOICE" -ge "$index" ]; then
    echo "invalid selection."
    exit 1
fi

if [ "$CHOICE" -eq 0 ]; then
    echo "Operation cancelled."
    exit 0
fi

SELECTED_TAG=${TAG_ARRAY[$CHOICE]}
SELECTED_MSG=${MSG_ARRAY[$CHOICE]}

echo ""
echo "⚠ WARNING: This will perform a HARD RESET."
echo "   Current uncommitted changes will be LOST."
echo "   Target: $SELECTED_TAG ($SELECTED_MSG)"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" == "yes" ]; then
    echo "Restoring..."
    if git reset --hard "$SELECTED_TAG"; then
        echo ""
        echo "✅ Successfully restored to $SELECTED_TAG"
    else
        echo ""
        echo "❌ Restore failed."
        exit 1
    fi
else
    echo "Restore cancelled."
fi
