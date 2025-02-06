#!/bin/bash

sudo journalctl --vacuum-time=7d
sudo rm -rf /var/log/*.gz /var/log/*.old

sudo apt clean
sudo apt autoremove

sudo apt remove --purge locales
sudo apt install locales

