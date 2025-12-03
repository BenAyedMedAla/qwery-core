#!/bin/bash

# Test script for multiple Google Sheets functionality
# This script tests the CLI with two Google Sheets

SHEET1="https://docs.google.com/spreadsheets/d/1yfjcBF4X8waukFdI5u9ctkagFwAn-BRgM5IUCUK1Ay8/edit?gid=0#gid=0"
SHEET2="https://docs.google.com/spreadsheets/d/1sDa--f0yChIisw8IQA6MEC17jLd5dg4XHBWy1F_J07A/edit?gid=0#gid=0"

echo "=========================================="
echo "Testing Multiple Google Sheets Functionality"
echo "=========================================="
echo ""
echo "Sheet 1 (Users): $SHEET1"
echo "Sheet 2 (Employees): $SHEET2"
echo ""
echo "Starting CLI test..."
echo ""

# Create a temporary input file with commands
cat > /tmp/qwery-test-input.txt <<EOF
$SHEET1
$SHEET2
list all available views
show me the schema of all views
show me the first 5 rows from the users sheet
show me the first 5 rows from the employees sheet
join the two sheets on user id and show name, age, city, position, and dept_id
show me all active users with their positions
show me users from Sfax with their department information
count how many users are in each department
show me the average score by department
exit
EOF

# Run CLI with input file
cd /home/guepard/work/qwery-core
pnpm --filter cli start < /tmp/qwery-test-input.txt

# Cleanup
rm -f /tmp/qwery-test-input.txt

