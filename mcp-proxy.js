#!/usr/bin/env node

const readline = require('readline');
const http = require('http');
const url = require('url');

// Setup readline interface for reading from stdin
const rl = readline.createInterface({
  input: process.stdin,
  output: null, // Don't use stdout for interface output
  terminal: false
});

// HTTP server URL to forward requests to
const HTTP_SERVER_URL = 'http://172.16.16.54:8080';
const parsedUrl = url.parse(HTTP_SERVER_URL);

// Log to stderr, not stdout
function log(message) {
  process.stderr.write(`[MCP Proxy] ${message}\n`);
}

log('Starting MCP proxy...');

// Handle incoming JSON-RPC messages from stdin
rl.on('line', (line) => {
  try {
    if (!line.trim()) return;
    
    log(`Received message: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
    const message = JSON.parse(line);
    
    // Handle initialize method specially to avoid timeout
    if (message.method === "initialize") {
      try {
        // Respond with a simple initialize response
        const response = {
          jsonrpc: '2.0',
          id: message.id,
          result: {
            serverInfo: {
              name: 'MCP Proxy',
              version: '1.0.0'
            },
            capabilities: {}
          }
        };
        
        const responseStr = JSON.stringify(response);
        const header = `Content-Length: ${Buffer.byteLength(responseStr, 'utf8')}\r\n\r\n`;
        process.stdout.write(header + responseStr);
        log('Responded to initialize request');
      } catch (initError) {
        log(`Error handling initialize: ${initError.message}`);
      }
    } else {
      // Forward all other requests to the HTTP server
      const postData = JSON.stringify(message);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: '/message',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            const response = {
              jsonrpc: '2.0',
              id: message.id,
              result: result
            };
            
            const responseStr = JSON.stringify(response);
            const header = `Content-Length: ${Buffer.byteLength(responseStr, 'utf8')}\r\n\r\n`;
            process.stdout.write(header + responseStr);
            log(`Forwarded response for method: ${message.method}`);
          } catch (err) {
            log(`Error parsing response: ${err.message}`);
            sendErrorResponse(message.id, -32603, "Internal error processing response");
          }
        });
      });
      
      req.on('error', (err) => {
        log(`Error forwarding request: ${err.message}`);
        sendErrorResponse(message.id, -32603, `Error connecting to server: ${err.message}`);
      });
      
      req.write(postData);
      req.end();
      log(`Forwarded request: ${message.method}`);
    }
  } catch (error) {
    log(`Error processing message: ${error.message}`);
  }
});

function sendErrorResponse(id, code, message) {
  const error = {
    jsonrpc: '2.0',
    id: id,
    error: {
      code: code,
      message: message
    }
  };
  
  const errorStr = JSON.stringify(error);
  const header = `Content-Length: ${Buffer.byteLength(errorStr, 'utf8')}\r\n\r\n`;
  process.stdout.write(header + errorStr);
}

// Handle process termination
process.on('SIGINT', () => {
  log('Shutting down proxy...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Shutting down proxy...');
  process.exit(0);
});

// Keep the process running
log('Proxy initialized and waiting for messages...'); 