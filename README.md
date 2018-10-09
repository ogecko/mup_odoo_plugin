# mup_odoo_plugin
This is a plugin for MUP that will allow the deployment of Odoo to production, staging and development environments.
See http://meteor-up.com/docs.html. The plug-in will help create postgress and odoo containers configured with the necessary
secure passwords. In production it will also allow the use of a reverse proxy and the automatic generation of http certificates
using LetsEncrypt.

* For staging, odoo exposes its port on the docker host machine.
* For debugging, odoo is run directly from source code and postgress has its port exposed on the docker machine.
* For production, the plugin assumes that the mup-nginx-frontend container is used as a reverse proxy. 

## mup setup
* Creates directories and copies a bunch of files to the docker host machine under /opt/appname
* Creates passwords for Postgres Admin user, Postgress Odoo user, and Odoo Master Admin Password (storing in /opt/appname/secrets)
* Shuts down and removes any existing postgres and odoo docker image (doesnt delete any existing data in /opt/appname)
* Creates new docker images for both postgres and odoo
* Starts up the postgres image to initialise the database

## mup start
* The bulk of the starting/stopping of docker images is performed by the docker-compose.yml file under /opt/appname
* Starts up the postgress image (if it isnt already running)
* Starts up the odoo image and downloads any addins specified in oca_dependencies.txt

## mup stop
* Stops both the postgress and odoo containers

## Configuring the mup.js configuration file
You can create different mup.js files for each environment. For example
* mup-development.js - for development environment and debugging (isSource: true)
* mup-staging.js - for staging of the system on a local docker host
* mup-production.js - for production environment (isProduction: true)
Use the mup option --config to specify the specific configuration file.

Below is a sample mup-staging.js file for deployment

```
module.exports = {
  servers: {
    nuc01: {
      host: '192.168.1.21',
      "username": "xxx",
      "password": "xxxxxx",
    }
  },

  app: {
    name: 'tppweb',                 // Name of the application, used for docker hosts root directory /opt/<%= name %>
    type: 'odoo',                   // Required for mup-odoo-plugin
    domain: 'tppweb.ogecko.com',    // Used by nginx reverse proxy, creates https certificate & redirects traffic for this domain
    path: '..',
    dbUserUID: 1002,                // This must match the owner UID:GID of /opt/<%= name %>/dbdata on the docker host machine
    odooUserUID: 1000,              // This must match the UID:GID owner of /opt/<%= name %>/data on the docker host machine
    odooVirtualPort: 8059,          // Used between nginx and odoo container for http and xml
    odooLongPollingPort: 8061,      // Used between nginx and odoo container for longpolling http
    dbPort: 5431,                   // Postgres Port to use (normally default for Postgres is 5432), change when there is a conflict
    isProduction: false,            // When true, exposes Odoo port to docker only (for nginx reverse proxy container) 
    isSource: false,                // When true, use Odoo source (useful for dev debugging) instead of Odoo container
    servers: {
      nuc01: {}
    },
  },

  plugins: ['@ogecko/mup-odoo-plugin']

};
```

## Debugging development of odoo addins
With isSource: true, rather than using a container for odoo, setup will will clone the odoo github respository into /opt/appname/sources. 
This way you will have a full copy of the odoo source code and allow you to debug it in VSCode.
You will need to use a workspace in VSCode, pointing one folder to /opt/appname.
You will also need to add a new VSCode launch.json profile for Odoo.

```
        {
            "name": "Python: Odoo",
            "type": "python",
            "request": "launch",
            "stopOnEntry": false,
            "pythonPath": "${config:python.pythonPath}",
            "console": "externalTerminal",
            "program": "/opt/tppweb/sources/odoo/odoo-bin",
            "args": [
                "--config=/opt/tppweb/local-odoo-image/odoo.conf",
                // "--dev=all",
           ],
            "cwd": "${workspaceRoot}",
            "env": {},
            "envFile": "${workspaceRoot}/.env",
            "debugOptions": [
                "RedirectOutput"
            ]
        },
```

On the development machine you will need to make the following changes
* Update the file /opt/appname/local-odoo-image/oddo.conf to 
  * configure the docker host machine that postgress is running on
  * set the db_password and admin_password (based on /opt/appname/secrets from docker host machine)
  * manually add any local odoo addon paths
* Below is an example odoo.config file  
```
[options]

timezone = Etc/UTC

# Specific setup for Docker
db_host = nuc01
db_port = 5432
db_user = odoo
db_password = quiesh8Mipah2CiemoQuoo8iezeu5ooy8aig6ziel0Uu9wuucheezeiSahJ3Aey7
admin_passwd = quu8oeKoo3uXu1Vachahg8shieV4keingiuzee2eish0beingoozai8oelee0cuj
data_dir = /opt/tppweb/data
addons_path = /opt/tppweb/sources/odoo/addons,/opt/tppweb/additional_addons/web,./odoo_sale_addons
```

## Configuring Odoo
Once started you can navigate a browser to the odoo virtual port to start configuring odoo
On first startup you will be presented with a screen which hopefully states Odoo is up and running!
You can either restore a previously backed up database or create a new database.
Either way you will need to enter the Master Password (from /opt/secrets/ODOO_ADMIN_PASSWORD)

## Installing Base Addons
* install CRM
* install Project
* install Sales
* install Point of Sale
* install Timesheets
* install Accounting and Finance
* install Purchase Management
* install Employee Direcotry
* install Expense Tracker
* install Dashboard
* install Contacts Directory

## Installing OCA Addons
see /opt/odoo/additional_addons/oca_dependencies.txt

```

server-tools https://github.com/OCA/server-tools.git 10.0
# install Remove odoo.com Bindings
# install Database Auto-Backup (need to run $ pip install pysftp)
# install Manage model export profiles

bank-statement-import https://github.com/OCA/bank-statement-import.git 10.0
# install Import OFX Bank Statement

mis-builder https://github.com/OCA/mis-builder.git 10.0
# install MIS Builder
# install MIS Builder Budget

```

## Configuring Odoo
* Settings > Activate Developer Mode
* Settings > Load a Translation > Language > English AU
* Settings > Technical > Database Structure > Automated Backups > Create
* Settings > Users > Create > User Name
* User > Preferences > Language > English AU; Timezone > Australia/Sydney
* User > Access Rights > Technical Settings - Analytic Reporting, for Purchases, for Sales
* User > Change Password > New Password
* Accounting > Configuration > Settings > Analytic accounting, Asset Management, Analytic Accounting for Purchases
* Accounting > Configuration > MIS Reporting > MIS Report Styles > Import > mis.report.style.csv
* Accounting > Configuration > MIS Reporting > MIS Report Templates > Import > mis.report.data.csv
* Contacts > Grid > Import > contacts.data.csv
* Sales > Products > Grid > Import > product.data.csv


## Securely Setup Odoo System
From Emipro Technologies Pvt. Ltd

* Set private ssh key for your Odoo server.
* Start your Odoo in SSL mode.
* Install Nginx in your Ubuntu Server.
* Stop access of all unnecessary ports from firewall of your Ubuntu Server.
* Set proper data access rights & access rules into your Odoo instance.
* Set proper authentication method for your PostgreSQL database user.
* Set tricky password for PostgreSQL user.
* Apply encryption on Database and Odoo user passwords.
* Set Tricky password for Super Admin.
* Request all your ERP users to set difficult password.
* Give FTP access for your ERP users and don't allow them to create files out of their directory on your Ubuntu Server.
* Set proper access rights on your custom addons and default Odoo addons via chmod and chown commands.
* Have a look on /var/log/postgresql/postgresql-9.1-main.log file for malware attack on your database.
* Manage your Odoo log file properly.
* Transfer database & custom addons backup to remote place at frequent amount of time.
* Change and set tricky password for detault postgres user in your database server.
* Stop xmlrpc if you don't want your ERP to connect from 3rd party systems. ( set xmlrpc=False in your config file )
* Remove "Manage Database" link from home page of your live Odoo instance. ( it's suggestion only )
* Ignore installation of Odoo where multiple other websites are hosted.
* We highly recommend to ignore creation of any kind of demo database in Live Odoo instance. 
* Ignore to host your Odoo in Web hosting servers, always host Odoo in trusted VPS sites. ( Amazon, Raskspace, DigitalOcen, Myhosting etc..)
* Monitor Incoming and outgoing TCP/IP traffics in your Ubuntu Server.  Few of our customers for whom we have implemented Odoo for more then 150+ users, they hired their own server administrator to monitor incoming and outgoing TCP/IP traffics. ( Visit this link )
* Never give full access of your server to your Odoo service providers, always give them folder access of their own custom addons with their separate user. ( It's advisable to not share root user password to anyone. )
* If customer can afford healthy cost, we always suggest them to set up their own in-house hosting server instead of VPS.

## Troubleshooting
### Backups not working, creating a 2018_06_24_02_00_00.dump.zip of size 0
Likely cause is postgresql 9.6 on server, postgres 9.5.13 client on odoo. Use the following commands to upgrade the client to 9.6

```
apt install wget
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ xenial-pgdg main" >> /etc/apt/sources.list.d/postgresql.list'
apt update
apt install postgresql-client-9.6
```

### PageSpeed Insights recommends to enable compression
mup-nginx-proxy has gzip off by default. To turn it on.
```
docker exec -it mup-nginx-proxy bash
sed -i 's/#gzip/gzip/' /etc/nginx/nginx.conf
cat /etc/nginx/nginx.conf
nginx -s reload

```

### Unable to restore a large backup zip file
Likely cause is the nginx proxy limiting the client_max_body_size to 10M;
On the docker host, edit the file /opt/mup-nginx-proxy/config/nginx-default.conf

```
client_max_body_size to 100M;
```
On the EC2 server go into the mup-nginx-proxy container and run `nginx -s reload`
```
docker exec -it mup-nginx-proxy bash
nginx -s reload
```

### Unable to import large csv file (eg country.state.city.sydney.out.csv)
Google Chrome may raise an error in a Javascript function called set_file - Error 352: ERR_SPDY_PING_FAILED. The easiest way to workaround this issue is to use Microsoft Edge for uploading large files as this browser does not timeout large POST requests. 

```
client_max_body_size to 100M;
```
On the mup-nginx-proxy container run `nginx -s reload`
### Cannot see anything in VSCode TERMINAL
When VSCode is run inside of VMWare Workstation, you may encounter an issue in using its Terminal. All the text shown is black on black and unreadable. To solve this issue you need to change the rendering mode of the terminal in the VSCode Settings. Choose File>Preferences>Settings, then add this following line.

```
    "terminal.integrated.rendererType": "dom"
```

### ODOO wekzeug log does not show correct client IP addresses
When running ODOO in a Docker container behind an Nginx reverse proxy, you may encounter a problem with the logs not showing the correct client IP addresses. This can make it challenging to debug issues when there are many clients connected at once. To solve this problem you need to ensure the compose-makefile.yml includes ODOO_PROXY_MODE=True to set proxy_mode in the odoo.conf. 

Also you need to modify the file
/opt/odoo/sources/odoo/odoo/service/wsgi_server.py and change the last function at line 182 to the following. ie remove the check for HTTP_X_FORWARDED_HOST and add a line to set the address_string to x-real-ip (if it exists) or client_address[0] (if it doesnt). 

```
def application(environ, start_response):
    if config['proxy_mode']:
        werkzeug.serving.WSGIRequestHandler.address_string = lambda self: self.headers.get('x-real-ip', self.client_address[0])
        return werkzeug.contrib.fixers.ProxyFix(application_unproxied)(environ, start_response)
    else:
        return application_unproxied(environ, start_response)
```
If you need to alter this on a live docker image, the easiest way is from Windows, uploaded the modified file to the Amazon EC2 Server hosting docker, into the /opt/tppweb/logs directory. Then enter the following commands:

```
$ docker exec -it tppweb-odoo_1 bash
# cd /opt/odoo/sources/odoo/odoo/service
# cp /opt/odoo/data/logs/wsgi_server.py .
```
