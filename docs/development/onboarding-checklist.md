# Team Onboarding Checklist

Welcome to the bjornmelin-platform-io team! This checklist will help you get set up and familiar with our development workflow.

## 🎯 Overview

This onboarding process typically takes 2-3 hours and will get you ready to contribute effectively to the project.

## 📋 Pre-Onboarding (Before Day 1)

### Access & Accounts
- [ ] GitHub account created
- [ ] Added to GitHub organization/repository
- [ ] AWS account access (if needed)
- [ ] Slack/Discord access (if applicable)
- [ ] Email added to team distribution list

### Development Machine
- [ ] Development machine ready
- [ ] Admin/sudo access confirmed
- [ ] VPN access (if required)

## 🚀 Day 1: Environment Setup

### 1. Install Prerequisites (30 mins)

```bash
# Check Node.js version (need >= 18)
node --version

# Install pnpm globally
npm install -g pnpm

# Check pnpm version (need >= 9)
pnpm --version

# Install Git
# macOS: brew install git
# Ubuntu: sudo apt install git
# Windows: Download from git-scm.com

# Install AWS CLI
# macOS: brew install awscli
# Ubuntu: sudo apt install awscli
# Windows: Use MSI installer from AWS

# Install Docker (for E2E tests)
# Follow instructions at docker.com
```

### 2. Repository Setup (15 mins)

```bash
# Fork the repository (via GitHub UI)

# Clone your fork
git clone https://github.com/YOUR_USERNAME/bjornmelin-platform-io.git
cd bjornmelin-platform-io

# Add upstream remote
git remote add upstream https://github.com/bjornmelin/bjornmelin-platform-io.git

# Verify remotes
git remote -v
```

### 3. Project Setup (15 mins)

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Configure Git hooks
git config core.hooksPath .husky

# Set up commit template
git config --local commit.template .gitmessage

# Run initial build
pnpm build
```

### 4. Verify Setup (10 mins)

```bash
# Start development server
pnpm dev
# Visit http://localhost:3000

# Run tests
pnpm test

# Check linting
pnpm lint

# Test commit hooks
echo "test" > test.txt
git add test.txt
git commit -m "bad commit"  # Should fail
git commit -m "test: verify commit hooks"  # Should pass
git reset --hard HEAD~1
```

## 📚 Day 2: Documentation & Standards

### 1. Read Core Documentation (1 hour)
- [ ] Read [README.md](../../README.md)
- [ ] Read [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [ ] Read [Branching Strategy](./branching-strategy.md)
- [ ] Read [Conventional Commits Guide](./conventional-commits.md)
- [ ] Read [Coding Standards](./coding-standards.md)

### 2. Architecture Understanding (30 mins)
- [ ] Review [Architecture Overview](../architecture/README.md)
- [ ] Understand [Frontend Architecture](../architecture/frontend.md)
- [ ] Learn about [AWS Services](../architecture/aws-services.md)
- [ ] Review [Infrastructure as Code](../architecture/infrastructure.md)

### 3. Development Workflow (30 mins)
- [ ] Practice creating a feature branch
- [ ] Make a small change (fix typo, add comment)
- [ ] Commit with conventional format
- [ ] Create your first PR (can be closed after)

## 🛠️ Day 3: Hands-On Practice

### 1. Development Tasks (2 hours)

#### Task 1: Add a Simple Component
```bash
# Create branch
git checkout -b feature/welcome-badge

# Create component at src/components/shared/WelcomeBadge.tsx
# Write component with TypeScript and props
# Add unit test
# Update exports

# Commit
git add .
git commit -m "feat(components): add welcome badge component"
```

#### Task 2: Fix a Linting Issue
```bash
# Create branch
git checkout -b chore/fix-linting

# Run linting
pnpm lint

# Fix any issues found
pnpm format

# Commit
git commit -m "chore: fix linting issues"
```

#### Task 3: Add a Test
```bash
# Create branch
git checkout -b test/improve-coverage

# Find a component without tests
# Write comprehensive tests
# Run tests with coverage
pnpm test:coverage

# Commit
git commit -m "test: add tests for XYZ component"
```

### 2. Code Review Practice (30 mins)
- [ ] Review an open PR
- [ ] Leave constructive comments
- [ ] Understand review standards

## 🔧 Week 1: Deep Dive

### Technical Deep Dives

#### Day 4: Frontend Deep Dive
- [ ] Study Next.js App Router patterns
- [ ] Understand Server Components vs Client Components
- [ ] Review our component library
- [ ] Learn our styling approach (Tailwind + shadcn/ui)

#### Day 5: Infrastructure Deep Dive
- [ ] Understand AWS CDK basics
- [ ] Review our stack structure
- [ ] Learn about our deployment process
- [ ] Understand environment management

### First Real Contribution
- [ ] Pick a "good first issue" from GitHub
- [ ] Discuss approach with team
- [ ] Implement solution
- [ ] Submit PR for review

## 📊 Success Criteria

By the end of Week 1, you should be able to:

### Technical Skills
- [ ] Set up development environment independently
- [ ] Create and manage Git branches following our strategy
- [ ] Write commits following conventional format
- [ ] Run all test suites successfully
- [ ] Deploy to a development environment
- [ ] Debug common issues

### Process Knowledge
- [ ] Understand our Git workflow
- [ ] Know how to create quality PRs
- [ ] Participate in code reviews
- [ ] Follow our coding standards
- [ ] Use our documentation effectively

### Project Knowledge
- [ ] Understand project architecture
- [ ] Know key components and their purposes
- [ ] Understand our AWS infrastructure
- [ ] Know where to find help

## 🆘 Getting Help

### Resources
1. **Documentation**: Start with `/docs`
2. **README**: Check project README
3. **Issues**: Search existing issues
4. **Team**: Ask in Slack/Discord

### Key Contacts
- **Technical Lead**: [Name] - Architecture questions
- **DevOps Lead**: [Name] - Infrastructure/deployment
- **Frontend Lead**: [Name] - UI/UX questions
- **Onboarding Buddy**: [Assigned] - General questions

### Common Issues

#### Node/pnpm Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Git Hook Issues
```bash
# Reinstall husky
pnpm husky install
```

#### Build Issues
```bash
# Clear Next.js cache
rm -rf .next
pnpm build
```

#### Test Issues
```bash
# Clear test cache
pnpm test -- --clearCache
```

## 🎉 Week 2 and Beyond

### Intermediate Goals
- [ ] Lead a feature implementation
- [ ] Review PRs from others
- [ ] Contribute to documentation
- [ ] Suggest process improvements

### Advanced Goals
- [ ] Mentor new team members
- [ ] Contribute to architecture decisions
- [ ] Lead technical initiatives
- [ ] Present learnings to team

## 📝 Feedback

After your first week, please provide feedback on:
1. Onboarding process effectiveness
2. Documentation clarity
3. Tooling setup issues
4. Suggestions for improvement

## 🚀 Ready to Contribute!

Congratulations! You're now ready to make meaningful contributions to the project. Remember:

- **Ask questions** - We're here to help
- **Start small** - Build confidence with minor changes
- **Follow standards** - Consistency is key
- **Collaborate** - We're a team!

Welcome aboard! 🎊