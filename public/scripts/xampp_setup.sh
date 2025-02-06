sudo apt-get install -y curl wget zip unzip software-properties-common ufw

# Install XAMPP
echo "Downloading and installing XAMPP..."
wget https://www.apachefriends.org/xampp-files/8.2.8/xampp-linux-x64-8.2.12-0-installer.run
sudo chmod +x xampp-linux-x64-8.2.12-0-installer.run
sudo ./xampp-linux-x64-8.2.12-0-installer.run

# Start XAMPP
echo "Starting XAMPP server..."
sudo /opt/lampp/lampp start

# Set XAMPP to start on boot (optional)
echo "Configuring XAMPP to start on boot..."
sudo ln -s /opt/lampp/lampp /etc/init.d/lampp
sudo update-rc.d lampp defaults

# Install Node.js (LTS version)
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installations
echo "Verifying installations..."
node -v
npm -v
/opt/lampp/lampp status

# Setup firewall
echo "Configuring UFW firewall to allow HTTP, HTTPS, and SSH traffic..."
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Install Certbot for Let's Encrypt SSL
echo "Installing Certbot..."
sudo apt-get install -y certbot python3-certbot-apache

# Obtain SSL certificate from Let's Encrypt
echo "Obtaining Let's Encrypt SSL certificate for your domain..."
# You should replace YOUR_DOMAIN with your actual domain in the command below.
sudo certbot --apache -d specialblend.ca -d www.specialblend.ca

# Set up automatic SSL certificate renewal
echo "Setting up automatic certificate renewal..."
sudo certbot renew --dry-run

echo "Setup complete. Your server is now ready with XAMPP, Node.js, and HTTPS support."