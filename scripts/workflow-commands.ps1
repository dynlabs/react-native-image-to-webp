# GitHub CLI Workflow Commands Helper
# Make sure GitHub CLI is in PATH: $env:Path += ";C:\Program Files\GitHub CLI"

# List recent workflow runs
Write-Host "`n=== Recent Workflow Runs ===" -ForegroundColor Cyan
gh run list --limit 10

# View a specific workflow run (replace RUN_ID with actual ID)
# gh run view RUN_ID

# View logs for a specific workflow run
# gh run view RUN_ID --log

# View logs for a specific job in a workflow run
# gh run view RUN_ID --log --job JOB_ID

# Watch a workflow run in real-time
# gh run watch RUN_ID

# List all workflows
Write-Host "`n=== Available Workflows ===" -ForegroundColor Cyan
gh workflow list

# View runs for a specific workflow
# gh run list --workflow "E2E Tests iOS"

# View the latest run for a specific workflow
# gh run list --workflow "E2E Tests iOS" --limit 1

# View logs for the latest run of a specific workflow
# gh run list --workflow "E2E Tests iOS" --limit 1 --json databaseId --jq '.[0].databaseId' | ForEach-Object { gh run view $_ --log }

# Download artifacts from a workflow run
# gh run download RUN_ID

# View workflow file
# gh workflow view "E2E Tests iOS"

Write-Host "`n=== Quick Commands ===" -ForegroundColor Green
Write-Host "View latest iOS workflow run: gh run list --workflow 'E2E Tests iOS' --limit 1" -ForegroundColor Yellow
Write-Host "View latest Android workflow run: gh run list --workflow 'E2E Tests Android' --limit 1" -ForegroundColor Yellow
Write-Host "View all workflow runs: gh run list" -ForegroundColor Yellow
Write-Host "Watch a run: gh run watch RUN_ID" -ForegroundColor Yellow
Write-Host "View logs: gh run view RUN_ID --log" -ForegroundColor Yellow
