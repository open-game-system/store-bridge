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