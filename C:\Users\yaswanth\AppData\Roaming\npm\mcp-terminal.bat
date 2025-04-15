@echo off
echo Starting MCP Terminal Server...

set SERVER_PATH=C:\Users\yaswanth\AppData\Roaming\npm\node_modules\smithery-mcp-server\dist\main.js

if not exist "%SERVER_PATH%" (
  echo Error: MCP Server not found at %SERVER_PATH%
  echo Please check the installation and update this batch file.
  exit /b 1
)

node "%SERVER_PATH%" %* 