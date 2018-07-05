#!/bin/bash

# Define build constants
GIT_BRANCH=10.0
PYTHON_BIN=python3
SERVICE_BIN=odoo-bin

mkdir -p /opt/<%= name %>/{sources/odoo,additional_addons,data}

# Install any OCA odoo addons
while read -r repo; do
    repoName="$(cut -d' ' -f1 <<< $repo)"
    repoPath="/opt/<%= name %>/additional_addons/$repoName"
    repoUrl="$(cut -d' ' -f2 <<< $repo)"
    repoBranch="$(cut -d' ' -f3 <<< $repo)"
    echo "Repo Path:" $repoPath ", Url:" $repoUrl ", Branch:" $repoBranch
    git clone -b $repoBranch --depth 1 -- $repoUrl $repoPath
done <<< "$(awk '! /^ *(#|$)/' /opt/<%= name %>/local-odoo-image/oca_dependencies.txt)"

# Install APT dependencies
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo /bin/bash -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ xenial-pgdg main" > /etc/apt/sources.list.d/postgresql.list'
#sudo /bin/bash -c "apt update && awk '! /^ *(#|$)/' /opt/<%= name %>/local-odoo-image/packages-apt.txt | xargs -r apt install -yq"
sudo /bin/bash -c "awk '! /^ *(#|$)/' /opt/<%= name %>/local-odoo-image/packages-apt.txt | xargs -r apt install -yq"

# Add Odoo sources and remove .git folder in order to reduce storage size
if [ ! -f /opt/<%= name %>/sources/odoo/COPYRIGHT ]; then
    git clone -b $GIT_BRANCH --depth 1 -- https://github.com/odoo/odoo.git /opt/<%= name %>/sources/odoo && rm -rf /opt/<%= name %>/sources/odoo/.git
fi

# Install PIP dependencies
sudo pip install -r /opt/<%= name %>/local-odoo-image/packages-pip.txt
sudo pip install -r /opt/<%= name %>/sources/odoo/requirements.txt

# Install wkhtmltopdf
wget https://github.com/wkhtmltopdf/wkhtmltopdf/releases/download/0.12.1/wkhtmltox-0.12.1_linux-trusty-amd64.deb -O wkhtmltox.deb
sudo dpkg -i wkhtmltox.deb && rm wkhtmltox.deb

# Install LESS
npm install -g less@2.7.3 less-plugin-clean-css@1.5.1

