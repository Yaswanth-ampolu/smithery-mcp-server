# MCP Server Configuration System

The MCP Server includes a configuration system that allows you to customize various aspects of the server's behavior. This document explains how the configuration system works and how to use it.

## Configuration File

The MCP Server stores its configuration in a file called `mcp-config.json` located in the MCP Terminal installation directory (typically `~/mcp-terminal`). The file is stored within the installation directory, not in the user's home directory. This file is automatically created when the server is first started, and it contains the following settings:

```json
{
  "port": 8080,
  "host": "0.0.0.0",
  "serverName": "MCP System Tools",
  "serverVersion": "1.0.0",
  "workspace": "/path/to/workspace",
  "logLevel": "info"
}
```

## Configuration Options

| Option | Description | Default Value |
|--------|-------------|---------------|
| `port` | The port on which the server listens for connections | `8080` |
| `host` | The host address to bind to | `"0.0.0.0"` |
| `serverName` | The name of the server | `"MCP System Tools"` |
| `serverVersion` | The version of the server | `"1.0.0"` |
| `workspace` | The path to the workspace directory | Determined automatically |
| `logLevel` | The logging level | `"info"` |

## Automatic Port Selection

One of the key features of the configuration system is automatic port selection. If the server is started and the configured port is already in use, the server will automatically find the next available port and update the configuration file accordingly.

This behavior ensures that:

1. Multiple instances of the MCP Server can run on the same machine
2. The server will always start, even if the default port is in use
3. The selected port is remembered for future server starts

## Environment Variables

You can override the configuration settings using environment variables:

| Environment Variable | Configuration Option |
|----------------------|----------------------|
| `PORT` | `port` |
| `MCP_SERVER_HOST` | `host` |
| `SERVER_NAME` | `serverName` |
| `SERVER_VERSION` | `serverVersion` |

For example, to start the server on port 9000:

```bash
PORT=9000 mcp-terminal start
```

## Command Line Options

The `mcp-terminal` command also accepts a `--port` option to specify the port:

```bash
mcp-terminal start --port 9000
```

This will override both the configuration file and environment variables.

## Checking the Configuration

You can view the current configuration by running:

```bash
mcp-terminal status
```

This will show the server status, including the configuration file contents if the server is running.

## Manually Editing the Configuration

You can manually edit the `mcp-config.json` file to change the configuration. The changes will take effect the next time the server is started.

```bash
# Edit the configuration file
nano ~/mcp-terminal/mcp-config.json
```

## Configuration Precedence

The server uses the following precedence order for configuration settings:

1. Command line options (highest priority)
2. Environment variables
3. Configuration file
4. Default values (lowest priority)

This means that if you specify a port using the `--port` option, it will override any port specified in the environment variables or configuration file.

## Troubleshooting

If you encounter issues with the configuration system, try the following:

1. Check the server log file (`~/mcp-terminal/mcp.log`) for error messages
2. Verify that the `mcp-config.json` file exists and is valid JSON
3. Try starting the server with explicit options: `mcp-terminal start --port 9000`
4. If all else fails, you can delete the `mcp-config.json` file and restart the server to recreate it with default values

### Configuration File in Wrong Location

If you find that the `mcp-config.json` file has been created in your home directory instead of in the MCP Terminal installation directory:

1. Stop the MCP server if it's running: `mcp-terminal stop`
2. Move the configuration file to the correct location:
   ```bash
   mv ~/mcp-config.json ~/mcp-terminal/mcp-config.json
   ```
3. Restart the server: `mcp-terminal start`

This issue has been fixed in recent versions, but if you upgraded from an older version, you might need to move the file manually.
