# Multi-User MCP Server Deployment Guide

This document outlines strategies and best practices for deploying the MCP server in a multi-user environment where multiple instances need to run on the same physical server.

## Table of Contents

1. [Introduction](#introduction)
2. [Challenges in Multi-User Deployments](#challenges-in-multi-user-deployments)
3. [Port Management Strategies](#port-management-strategies)
4. [Implementation Options](#implementation-options)
5. [Recommended Approach](#recommended-approach)
6. [Configuration Management](#configuration-management)
7. [Deployment Process](#deployment-process)
8. [Monitoring and Management](#monitoring-and-management)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

## Introduction

In a shared server environment where multiple users need to run their own MCP server instances, port management becomes a critical issue. Each MCP server instance requires its own unique port to avoid conflicts. This document provides strategies for managing port allocation and configuration in such environments.

## Challenges in Multi-User Deployments

When deploying multiple MCP server instances on the same physical server, several challenges arise:

1. **Port Conflicts**: Each instance needs a unique port to avoid conflicts
2. **Resource Allocation**: CPU, memory, and disk resources must be shared fairly
3. **User Isolation**: Each user's data and processes should be isolated from others
4. **Configuration Management**: Each instance needs its own configuration
5. **Discovery**: Users need to know which port their instance is running on

## Port Management Strategies

There are several strategies for managing port allocation in a multi-user environment:

### 1. Static Port Assignment

Assign a specific port range to each user or instance.

**Pros:**
- Predictable port numbers
- Simple to implement
- Users always know their port

**Cons:**
- Requires manual configuration
- Doesn't scale well with many users
- Potential for conflicts if not managed carefully

### 2. Dynamic Port Assignment

Automatically assign ports from a pool when instances start.

**Pros:**
- Scales to many users
- No manual port configuration needed
- Efficient use of available ports

**Cons:**
- Users need to be informed of their assigned port
- Port may change between restarts
- Requires a port management system

### 3. Port Auto-Discovery

Implement a service discovery mechanism that allows clients to find their server instance.

**Pros:**
- Users don't need to know their port
- Handles port changes automatically
- Most scalable approach

**Cons:**
- More complex to implement
- Requires additional infrastructure
- May introduce latency in connections

## Implementation Options

### Option 1: User-Based Port Calculation

Assign ports based on a formula using the user ID or username.

```javascript
// Example: Calculate port based on username
function calculatePortForUser(username) {
  // Base port (e.g., 8080)
  const basePort = 8080;
  
  // Hash the username to a number between 0 and 999
  const hash = username.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0) % 1000;
  
  // Return base port + hash
  return basePort + hash;
}
```

### Option 2: Port Range Allocation

Allocate a range of ports to each user.

```javascript
// Example: Allocate a range of 10 ports per user
function getPortRangeForUser(userId) {
  const basePort = 8080;
  const portsPerUser = 10;
  const startPort = basePort + (userId * portsPerUser);
  const endPort = startPort + portsPerUser - 1;
  
  return {
    startPort,
    endPort,
    defaultPort: startPort
  };
}
```

### Option 3: Port Registry Service

Implement a central registry service that manages port assignments.

```javascript
// Example: Port registry service
class PortRegistry {
  constructor(startPort = 8080, endPort = 9080) {
    this.startPort = startPort;
    this.endPort = endPort;
    this.allocatedPorts = new Map(); // userId -> port
    this.usedPorts = new Set();
  }
  
  allocatePort(userId) {
    // If user already has a port, return it
    if (this.allocatedPorts.has(userId)) {
      return this.allocatedPorts.get(userId);
    }
    
    // Find the next available port
    for (let port = this.startPort; port <= this.endPort; port++) {
      if (!this.usedPorts.has(port)) {
        this.usedPorts.add(port);
        this.allocatedPorts.set(userId, port);
        return port;
      }
    }
    
    throw new Error('No available ports');
  }
  
  releasePort(userId) {
    if (this.allocatedPorts.has(userId)) {
      const port = this.allocatedPorts.get(userId);
      this.usedPorts.delete(port);
      this.allocatedPorts.delete(userId);
      return true;
    }
    return false;
  }
  
  getPort(userId) {
    return this.allocatedPorts.get(userId);
  }
}
```

### Option 4: Auto Port Selection with Retry

Enhance the current auto port selection mechanism to try a wider range of ports.

```javascript
// Example: Enhanced startServer function
function startServer(initialPort, maxPort = initialPort + 100) {
  let currentPort = initialPort;
  
  function tryPort(port) {
    httpServer.listen(port, HOST, () => {
      console.log(`MCP Server listening on ${HOST}:${port}`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} is already in use.`);
        
        if (currentPort < maxPort) {
          currentPort++;
          console.log(`Trying next port: ${currentPort}`);
          httpServer.close();
          tryPort(currentPort);
        } else {
          console.error(`Failed to start server. No available ports in range ${initialPort}-${maxPort}.`);
          process.exit(1);
        }
      } else {
        console.error('Error starting server:', err);
        process.exit(1);
      }
    });
  }
  
  tryPort(currentPort);
}
```

## Recommended Approach

For most multi-user deployments, we recommend a combination of approaches:

1. **Enhanced Auto Port Selection**: Modify the MCP server to automatically try a wider range of ports if the default port is in use.

2. **User-Specific Configuration Files**: Create a separate configuration file for each user that stores their assigned port.

3. **Port Persistence**: Once a port is assigned to a user, persist this information to ensure the same port is used on restart.

4. **Port Information API**: Add an endpoint that allows clients to query for their assigned port.

## Configuration Management

### User-Specific Environment Variables

Create a separate `.env` file for each user:

```
# .env.user123
PORT=8123
MCP_SERVER_HOST=0.0.0.0
SERVER_NAME=User123 MCP Server
SERVER_VERSION=1.0.0
```

### User-Specific Configuration Files

Create a separate configuration directory for each user:

```
/etc/mcp-server/
  ├── user1/
  │   └── config.json
  ├── user2/
  │   └── config.json
  └── user3/
      └── config.json
```

### Dynamic Configuration Loading

Modify the server to load configuration based on the user:

```javascript
function loadUserConfig(username) {
  const configPath = `/etc/mcp-server/${username}/config.json`;
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config;
  } catch (error) {
    console.warn(`Could not load config for user ${username}:`, error);
    return getDefaultConfig();
  }
}
```

## Deployment Process

### Step 1: Create User-Specific Directories

For each user, create:
- A configuration directory
- A workspace directory
- A logs directory

```bash
#!/bin/bash
# create_user_environment.sh

USERNAME=$1
BASE_DIR="/opt/mcp-server"

# Create directories
mkdir -p "${BASE_DIR}/users/${USERNAME}/config"
mkdir -p "${BASE_DIR}/users/${USERNAME}/workspace"
mkdir -p "${BASE_DIR}/users/${USERNAME}/logs"

# Set permissions
chown -R ${USERNAME}:${USERNAME} "${BASE_DIR}/users/${USERNAME}"
```

### Step 2: Generate User-Specific Configuration

```bash
#!/bin/bash
# generate_user_config.sh

USERNAME=$1
BASE_PORT=8080
USER_ID=$(id -u ${USERNAME})
USER_PORT=$((BASE_PORT + USER_ID % 1000))

cat > "/opt/mcp-server/users/${USERNAME}/config/config.json" << EOF
{
  "port": ${USER_PORT},
  "host": "0.0.0.0",
  "serverName": "${USERNAME} MCP Server",
  "serverVersion": "1.0.0",
  "workspace": "/opt/mcp-server/users/${USERNAME}/workspace"
}
EOF

chown ${USERNAME}:${USERNAME} "/opt/mcp-server/users/${USERNAME}/config/config.json"
```

### Step 3: Create User-Specific Startup Script

```bash
#!/bin/bash
# start_user_server.sh

USERNAME=$1
CONFIG_PATH="/opt/mcp-server/users/${USERNAME}/config/config.json"
LOG_PATH="/opt/mcp-server/users/${USERNAME}/logs/server.log"

# Start server with user-specific configuration
su - ${USERNAME} -c "cd /opt/mcp-server && NODE_ENV=production node src/main.js --config=${CONFIG_PATH} >> ${LOG_PATH} 2>&1 &"

# Store PID for management
PID=$!
echo ${PID} > "/opt/mcp-server/users/${USERNAME}/server.pid"
```

## Monitoring and Management

### Port Usage Monitoring

Create a script to monitor which ports are in use:

```bash
#!/bin/bash
# monitor_ports.sh

BASE_PORT=8080
MAX_PORT=9080

echo "Checking MCP server ports in use (${BASE_PORT}-${MAX_PORT}):"
for PORT in $(seq ${BASE_PORT} ${MAX_PORT}); do
  if netstat -tuln | grep ":${PORT} " > /dev/null; then
    PROCESS=$(lsof -i :${PORT} | grep LISTEN | awk '{print $2}')
    USER=$(ps -o user= -p ${PROCESS})
    echo "Port ${PORT}: IN USE by user ${USER} (PID: ${PROCESS})"
  else
    echo "Port ${PORT}: AVAILABLE"
  fi
done
```

### User Server Management

Create a management script for starting, stopping, and checking user servers:

```bash
#!/bin/bash
# manage_user_server.sh

USERNAME=$1
ACTION=$2
PID_FILE="/opt/mcp-server/users/${USERNAME}/server.pid"
CONFIG_PATH="/opt/mcp-server/users/${USERNAME}/config/config.json"

case ${ACTION} in
  start)
    if [ -f ${PID_FILE} ] && kill -0 $(cat ${PID_FILE}) 2>/dev/null; then
      echo "Server for user ${USERNAME} is already running"
    else
      echo "Starting server for user ${USERNAME}..."
      /opt/mcp-server/scripts/start_user_server.sh ${USERNAME}
    fi
    ;;
    
  stop)
    if [ -f ${PID_FILE} ]; then
      echo "Stopping server for user ${USERNAME}..."
      kill $(cat ${PID_FILE})
      rm ${PID_FILE}
    else
      echo "No running server found for user ${USERNAME}"
    fi
    ;;
    
  restart)
    $0 ${USERNAME} stop
    sleep 2
    $0 ${USERNAME} start
    ;;
    
  status)
    if [ -f ${PID_FILE} ] && kill -0 $(cat ${PID_FILE}) 2>/dev/null; then
      PORT=$(grep "port" ${CONFIG_PATH} | sed 's/[^0-9]//g')
      echo "Server for user ${USERNAME} is running on port ${PORT} (PID: $(cat ${PID_FILE}))"
    else
      echo "Server for user ${USERNAME} is not running"
    fi
    ;;
    
  *)
    echo "Usage: $0 <username> {start|stop|restart|status}"
    exit 1
    ;;
esac
```

## Security Considerations

### Port Binding Restrictions

By default, the MCP server binds to all interfaces (`0.0.0.0`). In a multi-user environment, consider binding each instance to localhost or a specific interface:

```javascript
// Bind to localhost only
const HOST = '127.0.0.1';
```

### User Isolation

Ensure each user can only access their own workspace:

```javascript
// Ensure workspace is within user's allowed directory
function validateWorkspacePath(workspace, username) {
  const userBaseDir = `/opt/mcp-server/users/${username}`;
  const normalizedPath = path.normalize(workspace);
  
  if (!normalizedPath.startsWith(userBaseDir)) {
    throw new Error(`Invalid workspace path: ${workspace}`);
  }
  
  return normalizedPath;
}
```

### Resource Limits

Consider implementing resource limits for each user's MCP server instance:

```bash
# Start server with resource limits
su - ${USERNAME} -c "cd /opt/mcp-server && ulimit -m 512000 && NODE_ENV=production node --max-old-space-size=512 src/main.js --config=${CONFIG_PATH} >> ${LOG_PATH} 2>&1 &"
```

## Troubleshooting

### Common Issues and Solutions

#### Port Already in Use

**Issue**: Server fails to start because the port is already in use.

**Solution**: 
1. Check if another MCP server instance is using the port:
   ```bash
   lsof -i :8080
   ```
2. If the port is in use, try a different port:
   ```bash
   PORT=8081 node src/main.js
   ```

#### Finding User's Port

**Issue**: User doesn't know which port their MCP server is running on.

**Solution**:
1. Check the user's configuration file:
   ```bash
   grep "port" /opt/mcp-server/users/${USERNAME}/config/config.json
   ```
2. Check which ports are in use by the user:
   ```bash
   lsof -i -a -u ${USERNAME} | grep LISTEN
   ```

#### Server Not Starting

**Issue**: User's MCP server fails to start.

**Solution**:
1. Check the logs:
   ```bash
   tail -n 100 /opt/mcp-server/users/${USERNAME}/logs/server.log
   ```
2. Verify the configuration file is valid:
   ```bash
   jq . /opt/mcp-server/users/${USERNAME}/config/config.json
   ```
3. Ensure the user has permission to the required directories:
   ```bash
   ls -la /opt/mcp-server/users/${USERNAME}/
   ```

## Conclusion

Deploying the MCP server in a multi-user environment requires careful planning for port management, configuration, and security. By following the recommendations in this guide, you can create a robust deployment that allows multiple users to run their own MCP server instances on the same physical server without conflicts.

The enhanced auto port selection approach, combined with user-specific configuration files, provides a good balance of simplicity and flexibility. For larger deployments, consider implementing a more sophisticated port registry service or service discovery mechanism.
