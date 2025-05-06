# Release Script for MCP Terminal Server

This document explains how to use the `createarelease.sh` script to automate the creation of release packages for the MCP Terminal Server.

## Overview

The `createarelease.sh` script automates the release creation process described in the [RELEASE-INSTRUCTIONS.md](RELEASE-INSTRUCTIONS.md) document. It performs the following steps:

1. Updates the version number in `package.json`
2. Builds the project
3. Creates a build directory for packaging
4. Copies necessary files to the build directory
5. Installs dependencies in the build directory
6. Creates the tar.gz file
7. Verifies the archive contents

## Prerequisites

Before using the script, ensure you have:

- A fully functional codebase with all tests passing
- Node.js installed for building the project
- Bash shell environment (Linux, macOS, or Windows with Git Bash)
- All changes committed to your repository

## Usage

### Basic Usage

To create a release with the default version (1.0.0):

```bash
./createarelease.sh
```

### Specifying a Version

To create a release with a specific version:

```bash
./createarelease.sh --version 1.2.3
```

### Getting Help

To see usage information:

```bash
./createarelease.sh --help
```

## Output

The script will create a file called `mcp-terminal.tar.gz` in the root directory of the project. This file contains all the necessary files for installation, including:

- Compiled JavaScript code in the `dist/` directory
- Package.json with the specified version
- Public folder for the web interface
- All production dependencies

## Verification

The script automatically verifies the archive contents to ensure:

1. The `dist/main.js` file exists (required by the installer)
2. The `@modelcontextprotocol/sdk` dependency is present

If any issues are found, the script will display warnings.

## After Creating a Release

After creating a release with the script, you should:

1. Test the release by installing it using the installation script
2. Create a GitHub release and upload the `mcp-terminal.tar.gz` file
3. Update the installation script if needed

## Troubleshooting

### Common Issues

1. **Build Failure**
   - Ensure all dependencies are installed: `npm install`
   - Fix any TypeScript errors in the codebase

2. **Dependency Installation Failure**
   - Check your internet connection
   - Ensure the package.json file is valid
   - Try running `npm install --production` manually in the build directory

3. **Missing Files in Archive**
   - If the verification step shows missing files, check the build directory structure
   - Ensure the build process completed successfully

### Manual Verification

You can manually verify the archive contents with:

```bash
mkdir -p verify-tmp
tar -xzf mcp-terminal.tar.gz -C verify-tmp
ls -la verify-tmp
```

## Customizing the Script

If you need to customize the release process, you can modify the `createarelease.sh` script. Common customizations include:

- Adding additional files to the build directory
- Changing the verification checks
- Modifying the build process

## Integration with CI/CD

The script can be integrated into CI/CD pipelines to automate release creation. For example, in GitHub Actions:

```yaml
jobs:
  create-release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: ./createarelease.sh --version ${{ github.ref_name }}
      - uses: actions/upload-artifact@v2
        with:
          name: mcp-terminal
          path: mcp-terminal.tar.gz
```

This will create a release package whenever a new tag is pushed to the repository.
