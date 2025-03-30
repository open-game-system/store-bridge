# Contributing to @open-game-system/store-bridge

Thank you for considering contributing to this project! Here's how you can help.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

1. **Fork** the repository
2. **Clone** your fork to your local machine
3. **Create a branch** for your changes
4. **Make your changes** with appropriate tests
5. **Run tests** to ensure everything works
6. **Push** your changes to your fork
7. **Submit a pull request** to the main repository

## Versioning

We follow a date-based versioning scheme with the format: `major.YYYYMMDD.patch`

- **major**: Major version number incremented for breaking changes
- **YYYYMMDD**: Date of the release in 8-digit format (e.g., 20240516 for May 16, 2024)
- **patch**: Counter for multiple releases on the same day (0, 1, 2, etc.)

### Version Examples

- `1.20240516.0` - First release on May 16, 2024
- `1.20240516.1` - Second release on May 16, 2024
- `1.20240517.0` - First release on May 17, 2024

### Automated Versioning

Our CI pipeline automatically handles versioning:

- **Main branch**: Each successful merge to main triggers a version bump
- **PR builds**: PRs are published with a format like `1.20240516.0-pr.123.a1b2c3d` (PR number and commit hash included)

### Installing Specific Versions

```bash
# Latest stable version
npm install @open-game-system/store-bridge

# Version from a specific PR
npm install @open-game-system/store-bridge@pr-123

# Exact version
npm install @open-game-system/store-bridge@1.20240516.0
```

## Development Setup

```bash
# Clone the repository
git clone https://github.com/open-game-system/store-bridge.git
cd store-bridge

# Install dependencies
npm install

# Run tests
npm test

# Check TypeScript
npm run typecheck

# Run linter
npm run lint

# Format code
npm run format
```

## Testing

We use Vitest for testing. Please add tests for new features or bug fixes. Run the tests with:

```bash
npm test
```

## TypeScript

This project is built with TypeScript. Make sure your code is properly typed and passes the TypeScript compiler checks:

```bash
npm run typecheck
```

## Code Style

We use Biome for code formatting and linting. Format your code with:

```bash
npm run format
```

And check for linting issues with:

```bash
npm run lint
```

## Commit Messages

Please use clear and meaningful commit messages. Follow these guidelines:

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Keep the first line under 72 characters
- Reference issues and pull requests after the first line

## Pull Requests

- Keep pull requests focused on a single change
- Include tests for your changes
- Update documentation as needed
- Make sure all tests pass before submitting

## Reporting Issues

When reporting issues, please include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Any relevant logs or error messages
- Environment information (OS, browser, etc.)

## License

By contributing to this project, you agree that your contributions will be licensed under the project's MIT License. 