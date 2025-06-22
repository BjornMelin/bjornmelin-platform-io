# Git Workflow Quick Reference Guide

A practical guide for day-to-day Git operations in the bjornmelin-platform-io project.

## 🚀 Quick Commands

### Daily Workflow

```bash
# Start new feature
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# Save work in progress
git add .
git commit -m "feat: work in progress"

# Update branch with latest
git fetch origin
git rebase origin/develop

# Push changes
git push origin feature/my-feature
```

### Common Operations

```bash
# Check status
git status

# View commit history
git log --oneline -10

# See what changed
git diff
git diff --staged

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all changes
git reset --hard HEAD
```

## 📝 Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Quick Examples

```bash
# Feature
git commit -m "feat(auth): add OAuth login"

# Bug fix
git commit -m "fix(api): handle null response"

# Docs
git commit -m "docs: update API documentation"

# Refactor
git commit -m "refactor(components): simplify Button logic"

# Test
git commit -m "test: add unit tests for auth service"
```

## 🌳 Branch Commands

### Creating Branches

```bash
# Feature branch
git checkout -b feature/user-dashboard

# Bug fix branch
git checkout -b fix/login-error

# Chore branch
git checkout -b chore/update-dependencies
```

### Managing Branches

```bash
# List all branches
git branch -a

# Switch branches
git checkout branch-name

# Delete local branch
git branch -d branch-name

# Delete remote branch
git push origin --delete branch-name

# Rename branch
git branch -m old-name new-name
```

## 🔄 Syncing with Remote

### Fetch and Pull

```bash
# Fetch all remotes
git fetch --all

# Pull latest from current branch
git pull

# Pull with rebase (cleaner history)
git pull --rebase

# Pull specific branch
git pull origin develop
```

### Push Changes

```bash
# Push to remote
git push

# Push new branch
git push -u origin feature/new-feature

# Force push (use carefully!)
git push --force-with-lease
```

## 🔀 Merging and Rebasing

### Rebase (Preferred for feature branches)

```bash
# Rebase on develop
git checkout feature/my-feature
git rebase develop

# Interactive rebase (squash commits)
git rebase -i HEAD~3

# Continue after resolving conflicts
git rebase --continue

# Abort rebase
git rebase --abort
```

### Merge (For release branches)

```bash
# Merge feature to develop
git checkout develop
git merge --no-ff feature/my-feature

# Merge with squash
git merge --squash feature/my-feature
```

## 🚨 Fixing Common Issues

### Merge Conflicts

```bash
# During merge/rebase
# 1. Fix conflicts in files
# 2. Stage resolved files
git add .
# 3. Continue
git rebase --continue
# or
git merge --continue
```

### Undo Operations

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo specific file changes
git checkout -- filename

# Revert a pushed commit
git revert <commit-hash>
```

### Clean Up

```bash
# Remove untracked files
git clean -fd

# Remove ignored files too
git clean -fdx

# Stash changes
git stash
git stash pop
git stash list
```

## 📊 Inspection Commands

### View History

```bash
# Detailed log
git log

# One line per commit
git log --oneline

# Graph view
git log --graph --oneline --all

# Search commits
git log --grep="fix"

# Show specific commit
git show <commit-hash>
```

### Check Differences

```bash
# Unstaged changes
git diff

# Staged changes
git diff --staged

# Compare branches
git diff develop..feature/my-feature

# Show file changes in commit
git show --name-only <commit-hash>
```

## 🏷️ Tags and Releases

```bash
# List tags
git tag

# Create tag
git tag -a v1.2.0 -m "Release version 1.2.0"

# Push tags
git push origin v1.2.0
git push origin --tags

# Delete tag
git tag -d v1.2.0
git push origin --delete v1.2.0
```

## 🛠️ Advanced Operations

### Cherry Pick

```bash
# Apply specific commit to current branch
git cherry-pick <commit-hash>

# Cherry pick without committing
git cherry-pick -n <commit-hash>
```

### Bisect (Find breaking commit)

```bash
# Start bisect
git bisect start
git bisect bad  # Current commit is bad
git bisect good <commit-hash>  # Known good commit

# Test and mark commits
git bisect good  # or bad

# End bisect
git bisect reset
```

### Reflog (Recover lost commits)

```bash
# Show reflog
git reflog

# Recover lost commit
git reset --hard <reflog-hash>
```

## 📋 Workflow Scenarios

### Scenario: Update Feature Branch

```bash
git checkout feature/my-feature
git fetch origin
git rebase origin/develop
# Resolve any conflicts
git push --force-with-lease
```

### Scenario: Squash Commits Before PR

```bash
# Interactive rebase
git rebase -i HEAD~5
# Change 'pick' to 'squash' for commits to combine
# Save and edit commit message
git push --force-with-lease
```

### Scenario: Split Large PR

```bash
# Create new branch from feature
git checkout feature/large-feature
git checkout -b feature/large-feature-part1

# Reset to specific commit
git reset --hard <commit-hash>

# Push first part
git push -u origin feature/large-feature-part1

# Switch back for second part
git checkout feature/large-feature
git checkout -b feature/large-feature-part2
```

## 🎯 Best Practices

### Do's ✅

1. **Commit often** with meaningful messages
2. **Pull regularly** to avoid conflicts
3. **Use branches** for all changes
4. **Rebase feature branches** to keep history clean
5. **Review changes** before committing
6. **Test** before pushing

### Don'ts ❌

1. **Don't commit directly to main/develop**
2. **Don't force push to shared branches**
3. **Don't commit sensitive data**
4. **Don't commit large files**
5. **Don't merge without review**
6. **Don't ignore conflicts**

## 🆘 Emergency Commands

```bash
# Abort everything and start fresh
git reset --hard origin/develop

# Recover deleted branch
git checkout -b recovered-branch <commit-hash>

# Fix wrong commit message (last commit only)
git commit --amend -m "New message"

# Remove file from staging
git reset HEAD filename

# Completely remove file from history (dangerous!)
git filter-branch --tree-filter 'rm -f path/to/file' HEAD
```

## 📚 Getting Help

```bash
# Git help
git help <command>
git <command> --help

# Show Git version
git --version

# Show config
git config --list
```

Remember: When in doubt, ask for help before using force commands!