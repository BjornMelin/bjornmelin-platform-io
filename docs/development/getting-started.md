# Getting Started

This guide will help you set up your development environment for bjornmelin-platform-io.

## Prerequisites

- Node.js (24.x LTS; pinned via `.nvmrc`)
- Bun (pinned via `.bun-version`)
- AWS CLI configured with appropriate credentials
- Git

## Windows support

Development is supported on Windows via WSL2 (recommended). Run all `bun`/Node commands from inside
your WSL environment. Some helper scripts (for example `scripts/*.sh`) assume a POSIX shell and will
not work in plain PowerShell/CMD without a compatibility layer.

## Initial Setup

1. Clone the repository:

    ```bash
    git clone https://github.com/bjornmelin/bjornmelin-platform-io.git
    cd bjornmelin-platform-io
    ```

2. **Install dependencies:**

    ```bash
    bun install
    ```

3. **Set up environment variables (local):**

    ```bash
    # Local-only overrides (not committed)
    cp .env.example .env.local
    # Edit .env.local for developer-only values (optional)
    ```

    Production variables are provided by the GitHub Environment `production`;
    server-only values are in AWS SSM/Secrets, not in files.

## Development Server

Run the development server:

```bash
bun run dev
```

The site will be available at [http://localhost:3000](http://localhost:3000)

## Run with Docker

Build the image (ensure Docker Desktop/daemon is running):

```bash
docker build -t platform-io:node24 .
```

Run the container and access the site at <http://localhost:8080>:

```bash
docker run --rm -p 8080:80 platform-io:node24
```

Stop the container with Ctrl+C.

## Infrastructure Development

For working with AWS infrastructure:

1. Use AWS CDK without global install:

    ```bash
    bun run --cwd infrastructure cdk -- --version
    ```

2. Navigate to infrastructure directory:

    ```bash
    cd infrastructure
    ```

3. Install infrastructure dependencies:

    ```bash
    bun install
    ```

4. Deploy infrastructure:

    ```bash
    bun run deploy:all
    ```

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build production bundle
- `bun run start` - Serve static export
- `bun run lint` - Run Biome lint with autofix
- `bun run type-check` - Run TypeScript checks

## Project Structure

```text
.
├── src/                  # Application source code
├── public/              # Static files
├── infrastructure/      # AWS CDK infrastructure
└── docs/               # Documentation
```

## Code Style

- Biome handles linting and formatting (`bun run lint` / `bun run format`)
- TypeScript strict mode enabled

## Testing

Run tests:

```bash
bun run test
```

Run coverage or E2E tests:

```bash
bun run test:coverage
bun run test:e2e
```

## Common Issues

### AWS Credentials

Ensure your AWS credentials are properly configured in `~/.aws/credentials`
or through environment variables:

```bash
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
export AWS_DEFAULT_REGION="your_region"
```

### Port Already in Use

If port 3000 is already in use, you can specify a different port:

```bash
PORT=3001 bun run dev
```

## Next Steps

1. Review the [Architecture Overview](../architecture/README.md)
2. Explore the [API Documentation](../api/README.md)
3. Check the [Frontend Architecture](../architecture/frontend.md)

## Getting Help

If you encounter any issues:

1. Check the documentation
2. Review existing GitHub issues
3. Create a new issue with detailed information about your problem
