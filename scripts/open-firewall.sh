#!/bin/bash
# Script to open port 8080 in the firewall

echo "Opening port 8080 in the firewall..."

# Check if firewalld is running
if systemctl is-active --quiet firewalld; then
    # Open port 8080 for TCP
    firewall-cmd --permanent --add-port=8080/tcp
    
    # Reload firewall to apply changes
    firewall-cmd --reload
    
    echo "Port 8080 is now open in the firewall."
else
    echo "Firewalld is not running. No need to open ports."
fi 