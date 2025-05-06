#!/bin/bash
# Script to kill any process using port 8080

PORT=8080

echo "Looking for processes using port $PORT..."

# Find processes using the port
PID=$(lsof -i:$PORT -t)

if [ -z "$PID" ]; then
  echo "✓ No process is using port $PORT."
else
  echo "Found process(es) using port $PORT: $PID"
  echo "Killing process(es)..."
  
  # Kill the processes
  for pid in $PID; do
    echo "  Killing process $pid..."
    kill -9 $pid
  done
  
  echo "✓ Process(es) killed successfully."
fi

sleep 1
echo "Port $PORT should now be available." 