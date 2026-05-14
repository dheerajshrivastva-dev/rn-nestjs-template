#!/bin/bash

# This script stages the modified files and creates a commit.

# Stage the files
git add src/config/validation.schema.ts .env.example src/main.ts

# Commit the changes
git commit -m "feat: integrate Google OAuth and OpenTelemetry" -m "- Added Google OAuth environment variables to the validation schema to fix the Google Strategy initialization.
- Updated the .env.example file with the new Google OAuth variables.
- Re-enabled OpenTelemetry tracing by uncommenting the import in main.ts."

echo "Commit created successfully."
