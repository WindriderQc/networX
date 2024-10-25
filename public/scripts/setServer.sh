#!/bin/bash

# Quickly sets a nginx and node.js server.   (node version may need to be adjusted in time...)  
# don't forget to set executable 
# chmod +x setup.sh
# ./setup.sh



# Update and upgrade the system
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js v20
curl -sL https://deb.nodesource.com/setup_current.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt-get install -y nginx

# Install PM2 to keep Node.js processes running
sudo npm install -g pm2

# Create a simple Node.js app with the correct permissions
sudo mkdir -p /var/www/node-app
sudo bash -c 'echo "const http = require("http");
const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("Hello World\n");
});
server.listen(3000, () => {
    console.log("Server running at http://localhost:3000/");
});" > /var/www/node-app/app.js'

# Set up Nginx to proxy requests
sudo tee /etc/nginx/sites-available/default > /dev/null <<EOL
server {
    listen 80;
    server_name your_domain_or_IP;

    location / {
        proxy_pass http://localhost:3000;
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

# Restart Nginx and start the Node.js app
sudo systemctl restart nginx
pm2 start /var/www/node-app/app.js
pm2 save
