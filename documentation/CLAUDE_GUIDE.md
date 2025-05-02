# Using Claude with Local MCP Server

This guide explains how to use Claude with your local MCP server to access your local system.

## Setup

1. Start the local MCP server:
   ```bash
   ./start-local-server.sh
   ```

2. The server will be running at `http://localhost:8080`

## Using with Claude

### Direct Local Access (Claude Pro)

If you're using Claude Pro in a web browser and it has access to your local network:

1. Tell Claude about your local MCP server:
   ```
   I have an MCP server running locally at http://localhost:8080. Please use this server to access my local system.
   ```

2. Claude should be able to make HTTP requests to your local server.

### Using a Tunnel (for Public Claude)

If you're using the public version of Claude or if Claude can't access your local network directly:

1. Install ngrok:
   ```bash
   npm install -g ngrok
   ```

2. Create a tunnel to your local server:
   ```bash
   ngrok http 8080
   ```

3. Ngrok will provide a public URL (e.g., `https://abcd1234.ngrok.io`)

4. Tell Claude about this URL:
   ```
   I have an MCP server running at https://abcd1234.ngrok.io (replace with your actual ngrok URL). Please use this server to access my local system.
   ```

## Example Prompts for Claude

Here are some example prompts you can use with Claude:

### List Files in a Directory
```
I have an MCP server running locally at http://localhost:8080. Can you list the files in my home directory?
```

### Create a File
```
I have an MCP server running locally at http://localhost:8080. Can you create a file called "test.txt" with the content "Hello, World!"?
```

### Run a Shell Command
```
I have an MCP server running locally at http://localhost:8080. Can you run the command "uname -a" to show my system information?
```

### Search for a Pattern in Files
```
I have an MCP server running locally at http://localhost:8080. Can you search for the pattern "function" in all JavaScript files in the current directory?
```

## Troubleshooting

- If Claude says it can't access your local server, try using ngrok as described above.
- Make sure your MCP server is running before asking Claude to use it.
- If you're using a firewall, make sure it allows connections to port 8080 (or whatever port you're using).
- If you're having issues with ngrok, try using a different tunnel service like localtunnel or Cloudflare Tunnel.
