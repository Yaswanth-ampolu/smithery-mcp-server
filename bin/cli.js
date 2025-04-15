#!/usr/bin/env node

/**
 * CLI entry point for the MCP server
 * This allows the package to be installed globally and run as a command
 */

// Using CommonJS require for better compatibility in global installs
const path = require('path');
const fs = require('fs');
const url = require('url');

// Log the current execution context
console.log(`Starting MCP Terminal Tools CLI`);
console.log(`Process directory: ${process.cwd()}`);
console.log(`Node version: ${process.version}`);

// Check if the script file exists
console.log(`CLI script path: ${__filename}`);
try {
  fs.accessSync(__filename, fs.constants.R_OK);
  console.log(`CLI script exists and is readable`);
} catch (err) {
  console.error(`Error accessing CLI script: ${err.message}`);
}

// Get this script's directory
let __dirname;
try {
  // ESM environment
  __dirname = path.dirname(url.fileURLToPath(import.meta.url));
  console.log(`Detected ESM environment, dirname: ${__dirname}`);
  // Continue with ESM imports
  runWithESM();
} catch (error) {
  // CommonJS environment
  __dirname = __dirname || path.dirname(require.caller?.filename || __filename);
  console.log(`Detected CommonJS environment, dirname: ${__dirname}`);
  // Continue with CommonJS
  runWithCommonJS();
}

async function runWithESM() {
  const packageRoot = path.resolve(__dirname, '..');

  // Possible entry points in priority order
  const possibleEntryPoints = [
    path.join(packageRoot, 'dist', 'main.js'),
    path.join(packageRoot, 'dist', 'smithery-adapter.js')
  ];

  // Find the first entry point that exists
  let entryPointToRun = null;
  for (const entryPoint of possibleEntryPoints) {
    if (fs.existsSync(entryPoint)) {
      entryPointToRun = entryPoint;
      break;
    }
  }

  if (!entryPointToRun) {
    console.error(`Error: Cannot find any main application file.`);
    console.error(`Checked: ${possibleEntryPoints.join(', ')}`);
    console.error('Did you build the project? Try running "npm run build" first.');
    process.exit(1);
  }

  console.log(`Starting MCP server from: ${entryPointToRun}`);

  // Execute the entry point
  import(entryPointToRun).catch(err => {
    console.error('Error starting the application:', err);
    process.exit(1);
  });
}

function runWithCommonJS() {
  const packageRoot = path.resolve(__dirname, '..');

  // Possible entry points in priority order (using .cjs extension for CommonJS)
  const possibleEntryPoints = [
    path.join(packageRoot, 'dist', 'main.js'),
    path.join(packageRoot, 'dist', 'smithery-adapter.js')
  ];

  // Find the first entry point that exists
  let entryPointToRun = null;
  for (const entryPoint of possibleEntryPoints) {
    if (fs.existsSync(entryPoint)) {
      entryPointToRun = entryPoint;
      break;
    }
  }

  if (!entryPointToRun) {
    console.error(`Error: Cannot find any main application file.`);
    console.error(`Checked: ${possibleEntryPoints.join(', ')}`);
    console.error('The package may not be built correctly.');
    
    // Attempt to build the package if src directory exists
    if (fs.existsSync(path.join(packageRoot, 'src'))) {
      console.log('Attempting to build the package...');
      try {
        require('child_process').execSync('npx tsc -p tsconfig.json', {
          cwd: packageRoot,
          stdio: 'inherit'
        });
        console.log('Build successful, retrying...');
        
        // Check again after building
        for (const entryPoint of possibleEntryPoints) {
          if (fs.existsSync(entryPoint)) {
            entryPointToRun = entryPoint;
            break;
          }
        }
        
        if (!entryPointToRun) {
          console.error('Build completed but still cannot find entry point.');
          process.exit(1);
        }
      } catch (error) {
        console.error('Failed to build the package:', error);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }

  console.log(`Starting MCP server from: ${entryPointToRun}`);

  // Execute the entry point
  try {
    require(entryPointToRun);
  } catch (err) {
    console.error('Error starting the application:', err);
    process.exit(1);
  }
} 