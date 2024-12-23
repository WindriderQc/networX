sudo apt update && sudo apt upgrade -y

#Install SSH
sudo apt install openssh-server -y
#  this insure service start at boot  (usually not necessary, done default at install.)
sudo systemctl enable ssh   
sudo systemctl start ssh


# Install node.js
curl -fsSL https://deb.nodesource.com/setup_current.x | sudo -E bash -
sudo apt install -y nodejs
node -v


# Install PM2
sudo npm install pm2@latest -g
pm2 startup systemd
echo "PM2 has been installed and configured. Remember to 'pm2 save' after adding your processes." 
# Example of adding a process 
# pm2 start your-application.js 
# Save the process list and environment 
pm2 save


# required for platformIO (VS Code) to install properly
sudo apt install python3-venv -y


# Add the Visual Studio Code repository 
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-archive-keyring.gpg] https://packages.microsoft.com/repos/vscode stable main" | sudo tee /etc/apt/sources.list.d/vscode.list > /dev/null 
# Update the package list and install Visual Studio Code sudo 
apt update sudo apt install code -y 
# Verify installation 
code --version
echo "VS Code has been installed successfully!"

#Improve Application Startup Speed With Preload in Ubuntu  
sudo apt install preload

sudo apt install git -y

sudo apt autoremove --purge libreoffice* thunderbird  -y

#sudo apt install nemo-preview nemo-terminal nemo-image-converter nemo-share nemo-media-columns nemo-audio-tab nemo-compare 
