#!/bin/bash

echo "Launching TrueNas mount script"
echo "Current user: $(whoami)"

# Function to mount a network share as a network drive using gio mount
mount_network_drive() {
    local source="$1"
    local mount_point="$2"
    local credentials_file="$3"
    local log_file="$4"

    echo "Mounting network share as network drive: smb://$source to $mount_point"

    # Check if the share is already mounted as a network drive
    if gio mount -l | grep -q "smb://$source"; then
        echo "Network drive is already mounted: smb://$source to $mount_point"
    else
        # Mount the network share as a network drive using gio mount
        gio mount "smb://$source" > "$log_file" 2>&1

        # Check if the mount was successful
        if gio mount -l | grep -q "smb://$source"; then
            echo "Network share mounted as network drive successfully: smb://$source to $mount_point"
        else
            echo "Failed to mount the network share as network drive: smb://$source to $mount_point"
        fi
    fi
}

# Network share details
source1="truenas.local/media/"
source2="truenas.local/datalake/"
mount_point1="/mnt/media"
mount_point2="/mnt/datalake"

# Create the credentials file
echo -e "[Authentication]\nUsername=yb\nPassword=PASSWORD!!!!!!!!!!!" > "$HOME/.smbcredentials"
chmod 600 "$HOME/.smbcredentials"

# Mount the network shares as network drives and capture output in a log file
log_file="/home/yb/truenas_mount_log.txt"
mount_network_drive "$source1" "$mount_point1" "$HOME/.smbcredentials" "$log_file"
mount_network_drive "$source2" "$mount_point2" "$HOME/.smbcredentials" "$log_file"

echo "Script execution completed successfully"

