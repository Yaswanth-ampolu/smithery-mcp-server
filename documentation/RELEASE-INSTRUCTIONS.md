# Release Instructions for MCP Terminal Server

This document explains how to properly prepare and create a release for the MCP Terminal Server.

## Prerequisites

Before creating a release, ensure you have:
- A fully functional codebase with all tests passing
- Node.js installed for building the project
- Git for committing and pushing changes
- GitHub account with write access to the repository

## Creating a Release Package

1. **Prepare your codebase**
   - Make sure all changes are committed
   - Update version numbers in `package.json` and any relevant files

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Create a build directory for packaging**
   ```bash
   mkdir -p build/dist
   ```

4. **Copy necessary files to the build directory**
   ```bash
   # Copy compiled JavaScript
   cp -r dist/* build/dist/

   # Copy package.json and other necessary files
   cp package.json build/

   # Copy public folder (for web interface)
   cp -r public build/

   # Copy any necessary static files
   cp -r static build/ 2>/dev/null || true

   # Add a README if desired
   cp README.md build/ 2>/dev/null || true
   ```

5. **Install dependencies in the build directory**
   ```bash
   # Navigate to the build directory
   cd build

   # Install only production dependencies (excludes dev dependencies)
   npm install --production

   # Return to the project root
   cd ..
   ```

   This step is crucial as it ensures all required dependencies (including @modelcontextprotocol/sdk)
   are included in the release package. Without this step, the server will fail to start with
   "Cannot find package '@modelcontextprotocol/sdk'" errors.

6. **Create the tar.gz file**
   ```bash
   cd build
   tar -czf ../mcp-terminal.tar.gz .
   cd ..
   ```

   The important part is to create the archive from inside the build directory so that files are at the root of the archive.

7. **Verify the archive contents**
   ```bash
   mkdir -p verify-tmp
   tar -xzf mcp-terminal.tar.gz -C verify-tmp
   ls -la verify-tmp

   # Check if dist/main.js exists (required by the installer)
   if [ -f verify-tmp/dist/main.js ]; then
     echo "✅ Archive looks good! dist/main.js exists."
   else
     echo "❌ Archive is missing dist/main.js - this will cause installation to fail!"
   fi

   # Check if node_modules/@modelcontextprotocol/sdk exists (required dependency)
   if [ -d verify-tmp/node_modules/@modelcontextprotocol/sdk ]; then
     echo "✅ Dependencies look good! @modelcontextprotocol/sdk is present."
   else
     echo "❌ Archive is missing @modelcontextprotocol/sdk - this will cause the server to fail!"
   fi

   # Clean up
   rm -rf verify-tmp
   ```

## Creating a GitHub Release

1. **Go to the GitHub repository**
   - Navigate to: https://github.com/Yaswanth-ampolu/smithery-mcp-server

2. **Create a new release**
   - Click on "Releases" in the right sidebar
   - Click "Create a new release"
   - Tag version: `v1.0.0` (or whatever version you're creating)
   - Release title: "MCP Terminal Server v1.0.0"
   - Description: Add release notes, changes, and any important information
   - Upload the `mcp-terminal.tar.gz` file you created

3. **Publish the release**
   - Click "Publish release"

## Testing the Release

Before announcing the release, test the installation:

```bash
curl -o- https://github.com/Yaswanth-ampolu/smithery-mcp-server/raw/main/main/install-mcp.sh | bash
```

If installation succeeds, you should be able to start the server with:

```bash
mcp-terminal start
```

## Troubleshooting

### Common Issues

1. **"Error: dist/main.js not found in installation directory!"**
   - The tar.gz file structure is incorrect
   - Make sure dist/main.js is at the root of the archive

2. **"Cannot find package '@modelcontextprotocol/sdk'"**
   - The dependencies were not installed in the build directory
   - Make sure to run `npm install --production` in the build directory before creating the tar.gz
   - Alternatively, manually install the missing package: `npm install @modelcontextprotocol/sdk`

3. **"gzip: stdin: not in gzip format"**
   - The tar.gz file is not properly compressed
   - Recreate it using the commands above

4. **"Downloaded file is empty!"**
   - The GitHub release asset doesn't exist or has the wrong name
   - Make sure the file is named exactly "mcp-terminal.tar.gz"

### Verifying Archive Contents

To check what's in your tar.gz file:

```bash
tar -tzf mcp-terminal.tar.gz
```

You should see something like:
```
./
./dist/
./dist/main.js
./dist/[other files...]
./node_modules/
./node_modules/@modelcontextprotocol/
./node_modules/@modelcontextprotocol/sdk/
./package.json
./public/
./public/index.html
[etc...]
```

The presence of the `node_modules` directory with the required dependencies is essential for the server to function properly.

## Cleaning Up

After a successful release:

```bash
# Remove temporary files
rm -rf build
rm mcp-terminal.tar.gz
```