#!/bin/bash

function generate_password {
    if [ ! -e $1 ]; then
        pwgen 64 1 > $1
    fi 
}

sudo adduser odoo
sudo usermod -aG docker $USER

sudo mkdir -p /opt/<%= name %>/{docker-postgres-image,docker-odoo-image,local-odoo-image,secrets,dbdata}
sudo chown $USER /opt/<%= name %> -R
sudo chown odoo:odoo /opt/<%= name %>/dbdata -R

sudo apt-get -y install make
sudo apt-get -y install pwgen
sudo apt-get -y install docker-compose

generate_password '/opt/<%= name %>/secrets/POSTGRES_PASSWORD'
generate_password  '/opt/<%= name %>/secrets/ODOO_ADMIN_PASSWD'
generate_password  '/opt/<%= name %>/secrets/ODOO_DB_PASSWORD'
