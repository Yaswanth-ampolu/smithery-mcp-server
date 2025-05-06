# MCP Terminal Server

MCP Terminal Server provides terminal access and system tools via a clean web interface. It enables remote command execution, directory listing, and other terminal operations through a simple HTTP server.

![MCP Terminal Server](https://raw.githubusercontent.com/Yaswanth-ampolu/smithery-mcp-server/main/screenshots/terminal-server.png)

## Features

- 🚀 **Remote Terminal Access**: Execute shell commands from a web browser
- 📁 **Directory Listing**: Browse and list files in any directory
- 🔒 **Secure Local Installation**: Runs without requiring root access
- 🌐 **Web Interface**: Clean, modern UI for easy interaction
- 🔄 **Real-time Updates**: See command outputs as they happen
- 🛠️ **Easy Management**: Simple commands to start, stop, and manage the server

## Prerequisites

Before installing the MCP Terminal Server, ensure your system meets these requirements:

- **Node.js** (version 14 or higher)
- **curl** (for downloading the installation script)
- **tar** (for extracting the package)

## Quick Installation

Install the MCP Terminal Server with a single command:

```bash
curl -o- https://github.com/Yaswanth-ampolu/smithery-mcp-server/raw/main/main/install-mcp.sh | bash
```

This will:
1. Download the installation script
2. Check for dependencies
3. Download and extract the server files
4. Set up the necessary directories
5. Add the command to your PATH

## Manual Installation

If you prefer to inspect the script before running it:

1. Download the installation script:
   ```bash
   curl -o install-mcp.sh https://github.com/Yaswanth-ampolu/smithery-mcp-server/raw/main/main/install-mcp.sh
   ```

2. Review the script content:
   ```bash
   less install-mcp.sh
   ```

3. Run the installation:
   ```bash
   bash install-mcp.sh
   ```

## Usage

After installation, the MCP Terminal Server can be managed with the following commands:

### Starting the Server

```bash
mcp-terminal start
```

By default, the server starts on port 8080. To use a different port:

```bash
mcp-terminal start --port 9000
```

### Stopping the Server

```bash
mcp-terminal stop
```

### Checking Server Status

```bash
mcp-terminal status
```

This shows:
- Whether the server is running
- The PID of the running server
- Memory usage
- The URL to access the web interface

### Restarting the Server

```bash
mcp-terminal restart
```

### Uninstalling

To completely remove the MCP Terminal Server:

```bash
mcp-terminal uninstall
```

## Web Interface

Once the server is running, access the web interface at:

```
http://localhost:8080
```

(or the custom port you specified)

The web interface provides:
- A command execution tool
- A directory listing tool
- Real-time output display

## Configuration

The MCP Terminal Server stores its files in:
- `~/mcp-terminal` - Main installation directory
- `~/bin/mcp-terminal` - Command script

Log files and PID information are stored in:
- `~/mcp-terminal/mcp.log` - Server log file
- `~/mcp-terminal/mcp.pid` - Server PID file

## Troubleshooting

### Server Won't Start

If the server fails to start:

1. Check if Node.js is installed and version 14+:
   ```bash
   node -v
   ```

2. Check the log file for errors:
   ```bash
   tail -n 50 ~/mcp-terminal/mcp.log
   ```

3. Verify the installation directory exists:
   ```bash
   ls -la ~/mcp-terminal
   ```

### Port Already in Use

If the default port (8080) is already in use:

```bash
mcp-terminal start --port 9000
```

### Missing Command

If the `mcp-terminal` command is not found:

1. Ensure `~/bin` is in your PATH:
   ```bash
   echo $PATH
   ```

2. If not, add it manually:
   ```bash
   export PATH="$HOME/bin:$PATH"
   ```

3. For permanent addition, add to your shell configuration:
   ```bash
   echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

## Security Considerations

- The MCP Terminal Server executes commands with the same permissions as the user who started it
- It's recommended to run the server on a local network or behind a firewall
- Consider using a reverse proxy with authentication for public-facing deployments

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or feedback, please open an issue on the [GitHub repository](https://github.com/Yaswanth-ampolu/smithery-mcp-server/issues). 