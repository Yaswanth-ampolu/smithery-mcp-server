#!/usr/bin/env node

/**
 * Simple script to test Claude Desktop connectivity to the MCP server
 * Run this on the client machine to verify connectivity
 */

const http = require('http');
const https = require('https');

// Claude Desktop configuration to test against
const config = {
  mcpServers: {
    "yaswanth-tools": {
      url: "http://172.16.16.54:8080/sse",
      command: "yaswanth-tools"
    }
  }
};

console.log('Testing connectivity to MCP server...');
console.log(`Server URL: ${config.mcpServers["yaswanth-tools"].url}`);

// Function to make HTTP/HTTPS requests
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, { method }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

// Test the connection
async function runTests() {
  try {
    // Test 1: Basic connectivity
    console.log('\n1. Testing basic connectivity...');
    const url = config.mcpServers["yaswanth-tools"].url.replace('/sse', '');
    const basicResult = await makeRequest(url);
    console.log(`Status code: ${basicResult.statusCode}`);
    console.log(`Basic connectivity: ${basicResult.statusCode === 200 ? 'SUCCESS' : 'FAILED'}`);
    
    // Test 2: SSE endpoint
    console.log('\n2. Testing SSE endpoint...');
    try {
      const sseUrl = config.mcpServers["yaswanth-tools"].url;
      const sseResult = await makeRequest(sseUrl);
      console.log(`Status code: ${sseResult.statusCode}`);
      console.log(`SSE endpoint: ${sseResult.statusCode === 200 ? 'SUCCESS' : 'FAILED'}`);
    } catch (err) {
      console.log('SSE endpoint test FAILED (This is expected - SSE connections stay open)');
      console.log('This is not an error if the connection was established but timed out');
    }
    
    console.log('\nIf both tests show SUCCESS or the SSE test timed out after connecting,');
    console.log('your MCP server should be properly accessible to Claude Desktop.');
    console.log('\nMake sure your Claude Desktop configuration is correct:');
    console.log(JSON.stringify(config, null, 2));
    
  } catch (err) {
    console.error('Error testing connectivity:', err.message);
    process.exit(1);
  }
}

runTests(); 