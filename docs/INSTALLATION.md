# Installation Guide for @open-game-system/store-bridge

This package is available on both npm and GitHub Packages. Follow the appropriate instructions below based on which registry you want to use.

## Installing from npm (Recommended for Production)

The package is publicly available on npm and can be installed without any special configuration:

```bash
# Install latest version
npm install @open-game-system/store-bridge

# Install specific version
npm install @open-game-system/store-bridge@1.20250330.0
```

## Installing from GitHub Packages (For PR Testing)

To install from GitHub Packages (useful for testing PR versions), you only need to:

1. Configure npm to use GitHub Packages for the @open-game-system scope
2. Install the package

### Step 1: Create or update your project's .npmrc file

Create a `.npmrc` file in your project root with:

```
@open-game-system:registry=https://npm.pkg.github.com
```

### Step 2: Install the package

```bash
# Install PR version
npm install @open-game-system/store-bridge@pr-123

# Or add to package.json
# "dependencies": {
#   "@open-game-system/store-bridge": "pr-123"
# }
```

## Troubleshooting

If you encounter issues installing the package:

1. **Registry Issues**: Verify your .npmrc is correctly configured.
2. **Scope Issues**: Always include the full package name with scope: `@open-game-system/store-bridge`.
3. **Version Issues**: Check that the requested version exists in the registry.

For further assistance, please open an issue on our GitHub repository. 