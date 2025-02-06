#!/bin/bash

# Quickly sets up NGINX and Node.js server
# Make executable: chmod +x setup.sh
# Run: ./setNginxNodejs.sh

set -e  # Exit on any error

# Ensure the script is run with root privileges
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

echo "Updating and upgrading system..."
sudo apt update && sudo apt upgrade -y

# Install Node.js v20
echo "Installing Node.js..."
curl -sL https://deb.nodesource.com/setup_current.x | sudo -E bash -
sudo apt install -y nodejs

# Install NGINX
echo "Installing NGINX..."
sudo apt install -y nginx

# Install PM2 globally
echo "Installing PM2..."
sudo npm install -g pm2

# Prompt for server domain, IP, and port
read -p "Enter server_name (your domain or IP, default: localhost): " server_name
server_name=${server_name:-localhost}
read -p "Enter port number (default: 3000): " port
port=${port:-3000}

# Create a simple Node.js app
echo "Creating sample Node.js app..."
sudo mkdir -p /var/www/node-app
sudo chown -R $USER:$USER /var/www/node-app
sudo tee /var/www/node-app/app.js > /dev/null <<EOF
const http = require("http");
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("Hello World\n");
});
server.listen($port, () => {
    console.log("Server running at http://localhost:$port/");
});
EOF

# Set up NGINX to proxy requests
echo "Configuring NGINX..."
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOL
server {
    listen 80;
    server_name $server_name;

    location / {
        proxy_pass http://localhost:$port;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL

# Restart NGINX and start the Node.js app
sudo nginx -t || { echo "NGINX config failed. Aborting."; exit 1; }
echo "Starting services..."
sudo systemctl restart nginx
pm2 start /var/www/node-app/app.js --name node-app

# Configure PM2 to start on boot
echo "Configuring PM2 to start on boot..."
pm2 startup systemd -u $(whoami) --hp /home/$(whoami)
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp /home/$(whoami) -y
pm2 save

# Open firewall rules if UFW is enabled
if sudo ufw status | grep -q "active"; then
    echo "Configuring firewall rules..."
    sudo ufw allow 'Nginx Full'
    sudo ufw allow $port
fi

echo "Setup complete. Visit http://$server_name to see your Node.js app on port $port."
