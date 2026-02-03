# GitHub CLI Workflow Output Guide

This guide shows you how to use GitHub CLI (`gh`) to read workflow outputs and logs.

## Setup

GitHub CLI is installed and authenticated. The PATH is configured in your PowerShell profile so `gh` will be available in new sessions.

For current session, add to PATH:
```powershell
$env:Path += ";C:\Program Files\GitHub CLI"
```

## Common Commands

### List Workflow Runs

```powershell
# List all recent workflow runs
gh run list

# List runs for a specific workflow
gh run list --workflow "E2E Tests iOS"

# List runs with more details
gh run list --limit 10
```

### View Workflow Run Details

```powershell
# View details of a specific run (replace RUN_ID with actual ID)
gh run view RUN_ID

# View logs for a specific run
gh run view RUN_ID --log

# View logs and watch for updates
gh run view RUN_ID --log --log-failed
```

### Watch Workflow Runs

```powershell
# Watch a workflow run in real-time
gh run watch RUN_ID

# Watch the latest run of a specific workflow
gh run list --workflow "E2E Tests iOS" --limit 1 --json databaseId --jq '.[0].databaseId' | ForEach-Object { gh run watch $_ }
```

### View Specific Job Logs

```powershell
# View logs for a specific job
gh run view RUN_ID --log --job JOB_ID

# List all jobs in a run
gh run view RUN_ID --json jobs --jq '.[] | "\(.name): \(.id)"'
```

### Download Artifacts

```powershell
# Download all artifacts from a workflow run
gh run download RUN_ID

# Download artifacts to a specific directory
gh run download RUN_ID --dir ./artifacts
```

### Workflow Management

```powershell
# List all workflows
gh workflow list

# View workflow file
gh workflow view "E2E Tests iOS"

# View workflow runs for a specific workflow
gh run list --workflow "E2E Tests iOS" --limit 5
```

## Quick Reference

### Get Latest Run ID for a Workflow

```powershell
# Get the latest run ID for iOS E2E tests
$runId = gh run list --workflow "E2E Tests iOS" --limit 1 --json databaseId --jq '.[0].databaseId'
gh run view $runId --log
```

### View Latest Failed Run

```powershell
# Get latest failed run
gh run list --limit 10 --json databaseId,status,conclusion,displayTitle | ConvertFrom-Json | Where-Object { $_.conclusion -eq "failure" } | Select-Object -First 1 | ForEach-Object { gh run view $_.databaseId --log }
```

### View Logs for Latest Run of Specific Workflow

```powershell
# View logs for latest iOS workflow run
gh run list --workflow "E2E Tests iOS" --limit 1 --json databaseId --jq '.[0].databaseId' | ForEach-Object { gh run view $_ --log }
```

## Available Workflows

Your repository has the following workflows:

- **E2E Tests iOS** - iOS end-to-end tests
- **E2E Tests Android** - Android end-to-end tests
- **Quality Checks** - Code quality and linting
- **Build Example iOS** - Build iOS example app
- **Build Example Android** - Build Android example app
- **Release** - Release workflow
- **Version Bump** - Version bump workflow

## Examples

### Example 1: Check Latest iOS Test Results

```powershell
$env:Path += ";C:\Program Files\GitHub CLI"
$latestRun = gh run list --workflow "E2E Tests iOS" --limit 1 --json databaseId,status,conclusion,displayTitle | ConvertFrom-Json
Write-Host "Status: $($latestRun.status)" -ForegroundColor Cyan
Write-Host "Conclusion: $($latestRun.conclusion)" -ForegroundColor Cyan
Write-Host "Title: $($latestRun.displayTitle)" -ForegroundColor Cyan
gh run view $latestRun.databaseId --log
```

### Example 2: Watch Latest Run

```powershell
$env:Path += ";C:\Program Files\GitHub CLI"
$runId = gh run list --workflow "E2E Tests iOS" --limit 1 --json databaseId --jq '.[0].databaseId'
gh run watch $runId
```

### Example 3: Download Artifacts from Latest Run

```powershell
$env:Path += ";C:\Program Files\GitHub CLI"
$runId = gh run list --workflow "E2E Tests iOS" --limit 1 --json databaseId --jq '.[0].databaseId'
gh run download $runId --dir ./workflow-artifacts
```

## Troubleshooting

### GitHub CLI not found

If `gh` command is not found, add it to PATH:
```powershell
$env:Path += ";C:\Program Files\GitHub CLI"
```

### Authentication Issues

Check authentication status:
```powershell
gh auth status
```

Re-authenticate if needed:
```powershell
gh auth login
```

### View Help

Get help for any command:
```powershell
gh run --help
gh workflow --help
```
