#!/bin/bash

# Script to forcefully kill any process using a specific port
# Usage: ./force-kill-port.sh <port_number>

# Check if the script was called with a port number argument
if [ $# -ne 1 ]; then
  echo "Usage: $0 <port_number>"
  exit 1
fi

PORT=$1
echo "Looking for processes using port $PORT..."

# Try multiple methods to find processes using the port
# Method 1: lsof (Linux/macOS)
if command -v lsof &> /dev/null; then
  echo "Using lsof to find processes..."
  PIDS=$(lsof -t -i:$PORT 2>/dev/null)
  if [ -n "$PIDS" ]; then
    echo "Found process(es) with PIDs: $PIDS"
    for PID in $PIDS; do
      echo "Killing process $PID..."
      kill -9 $PID 2>/dev/null
    done
  fi
fi

# Method 2: netstat (Linux/Windows)
if command -v netstat &> /dev/null; then
  echo "Using netstat to find processes..."
  if [ "$(uname)" == "Linux" ]; then
    # Linux netstat
    PIDS=$(netstat -tlnp 2>/dev/null | grep ":$PORT " | awk '{print $7}' | cut -d'/' -f1 | sort -u)
  else
    # Windows/WSL netstat
    PIDS=$(netstat -ano | grep ":$PORT " | awk '{print $5}' | sort -u)
  fi
  
  if [ -n "$PIDS" ]; then
    echo "Found process(es) with PIDs from netstat: $PIDS"
    for PID in $PIDS; do
      if [ "$PID" != "-" ] && [ "$PID" != "Address" ]; then
        echo "Killing process $PID..."
        kill -9 $PID 2>/dev/null
      fi
    done
  fi
fi

# Method 3: fuser (Linux)
if command -v fuser &> /dev/null; then
  echo "Using fuser to find processes..."
  PIDS=$(fuser $PORT/tcp 2>/dev/null)
  if [ -n "$PIDS" ]; then
    echo "Found process(es) with PIDs from fuser: $PIDS"
    fuser -k $PORT/tcp 2>/dev/null
    echo "Killed processes using fuser."
  fi
fi

echo "Waiting for port to be free..."
sleep 2

# Verify if port is free
if command -v lsof &> /dev/null; then
  REMAINING=$(lsof -t -i:$PORT 2>/dev/null)
  if [ -n "$REMAINING" ]; then
    echo "Warning: Port $PORT still in use by PIDs: $REMAINING"
  else
    echo "Port $PORT is now free."
  fi
fi

# Special check for Windows
if [ "$(uname)" == "MINGW"* ] || [ "$(uname)" == "MSYS"* ]; then
  echo "Windows system detected, running additional cleanup..."
  # On Windows, use netstat to verify
  if netstat -ano | grep ":$PORT " > /dev/null; then
    echo "Warning: Port $PORT still in use on Windows."
  else
    echo "Port $PORT is now free on Windows."
  fi
fi

exit 0 