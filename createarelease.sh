#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default version
VERSION="1.0.0"

# Parse command line arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --version)
      VERSION="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --version VERSION  Specify the version number (default: 1.0.0)"
      echo "  --help             Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown parameter: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}=== MCP Terminal Server Release Creation ===${NC}"
echo -e "Creating release version: ${GREEN}${VERSION}${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found!${NC}"
  echo "Please run this script from the root of the MCP Terminal Server repository."
  exit 1
fi

# Step 1: Update version in package.json
echo -e "\n${YELLOW}Step 1: Updating version in package.json${NC}"
# Use sed to update the version in package.json
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS requires a different sed syntax
  sed -i '' "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$VERSION\"/" package.json
else
  # Linux sed syntax
  sed -i "s/\"version\": \"[0-9]*\.[0-9]*\.[0-9]*\"/\"version\": \"$VERSION\"/" package.json
fi
echo -e "${GREEN}✓ Version updated to $VERSION in package.json${NC}"

# Step 2: Build the project
echo -e "\n${YELLOW}Step 2: Building the project${NC}"
npm run build
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Build failed!${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Build completed successfully${NC}"

# Step 3: Create build directory for packaging
echo -e "\n${YELLOW}Step 3: Creating build directory${NC}"
mkdir -p build/dist
echo -e "${GREEN}✓ Build directory created${NC}"

# Step 4: Copy necessary files to the build directory
echo -e "\n${YELLOW}Step 4: Copying files to build directory${NC}"
# Copy compiled JavaScript
cp -r dist/* build/dist/
echo -e "${GREEN}✓ Copied dist/ to build/dist/${NC}"

# Copy package.json
cp package.json build/
echo -e "${GREEN}✓ Copied package.json to build/${NC}"

# Copy public folder (for web interface)
if [ -d "public" ]; then
  cp -r public build/
  echo -e "${GREEN}✓ Copied public/ to build/${NC}"
else
  mkdir -p build/public
  echo -e "${YELLOW}Warning: public/ directory not found, creating empty one${NC}"
fi

# Copy any necessary static files
if [ -d "static" ]; then
  cp -r static build/ 2>/dev/null
  echo -e "${GREEN}✓ Copied static/ to build/${NC}"
fi

# Add a README if it exists
if [ -f "README.md" ]; then
  cp README.md build/ 2>/dev/null
  echo -e "${GREEN}✓ Copied README.md to build/${NC}"
fi

# Step 5: Install dependencies in the build directory
echo -e "\n${YELLOW}Step 5: Installing dependencies in build directory${NC}"
# Navigate to the build directory
cd build

# Install only production dependencies (excludes dev dependencies)
echo -e "${BLUE}Running npm install --production${NC}"
npm install --production
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Dependency installation failed!${NC}"
  cd ..
  exit 1
fi

# Return to the project root
cd ..
echo -e "${GREEN}✓ Dependencies installed successfully${NC}"

# Step 6: Create the tar.gz file
echo -e "\n${YELLOW}Step 6: Creating tar.gz file${NC}"
cd build
tar -czf ../mcp-terminal.tar.gz .
cd ..
echo -e "${GREEN}✓ Created mcp-terminal.tar.gz${NC}"

# Step 7: Verify the archive contents
echo -e "\n${YELLOW}Step 7: Verifying archive contents${NC}"
mkdir -p verify-tmp
tar -xzf mcp-terminal.tar.gz -C verify-tmp
echo -e "${BLUE}Archive contents:${NC}"
ls -la verify-tmp

# Check if dist/main.js exists (required by the installer)
if [ -f verify-tmp/dist/main.js ]; then
  echo -e "${GREEN}✅ Archive looks good! dist/main.js exists.${NC}"
else
  echo -e "${RED}❌ Archive is missing dist/main.js - this will cause installation to fail!${NC}"
fi

# Check if node_modules/@modelcontextprotocol/sdk exists (required dependency)
if [ -d verify-tmp/node_modules/@modelcontextprotocol/sdk ]; then
  echo -e "${GREEN}✅ Dependencies look good! @modelcontextprotocol/sdk is present.${NC}"
else
  echo -e "${RED}❌ Archive is missing @modelcontextprotocol/sdk - this will cause the server to fail!${NC}"
fi

# Clean up
rm -rf verify-tmp
echo -e "${GREEN}✓ Archive verification completed${NC}"

# Final output
echo -e "\n${GREEN}=== Release Creation Complete ===${NC}"
echo -e "Release file: ${BLUE}mcp-terminal.tar.gz${NC}"
echo -e "Version: ${BLUE}${VERSION}${NC}"
echo -e "\nNext steps:"
echo -e "1. Test the release by running: ${YELLOW}curl -o- https://raw.githubusercontent.com/Yaswanth-ampolu/smithery-mcp-server/main/main/install-mcp.sh | bash${NC}"
echo -e "2. Create a GitHub release and upload the mcp-terminal.tar.gz file"
echo -e "3. Update the installation script if needed"

# Make the script executable
chmod +x createarelease.sh

exit 0
