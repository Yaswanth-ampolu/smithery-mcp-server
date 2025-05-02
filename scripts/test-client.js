// Simple test client for the MCP server
import fetch from 'node-fetch';

async function testMcpServer() {
  // First, make a simple HTTP request to test if the server is running
  try {
    const pingResponse = await fetch('http://localhost:8080/');
    console.log('Server is running!');
    console.log('Status:', pingResponse.status);

    // For a more complete test, you would need to:
    // 1. Connect to the SSE endpoint
    // 2. Get a clientId
    // 3. Use that clientId in your tool invocation
    //
    // This requires an SSE client library, which is beyond the scope of this simple test

    console.log('\nTo test the server with Claude:');
    console.log('1. Make sure the server is running (./start-local-server.sh)');
    console.log('2. Tell Claude: "I have an MCP server running locally at http://localhost:8080. Please use this server to access my local system."');
    console.log('3. Ask Claude to perform tasks using the MCP tools');
  } catch (error) {
    console.error('Error connecting to server:', error.message);
    console.log('Make sure the server is running with ./start-local-server.sh');
  }
}

testMcpServer().catch(err => {
  console.error('Error testing MCP server:', err);
});
