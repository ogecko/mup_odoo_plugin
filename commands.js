
nodemiral = require('nodemiral');

module.exports = {
  setup: {
    description: 'Setup Odoo on a remote server, copying required files',
    handler(api) {
      const args = api.getArgs();
      const config = api.getConfig();
      const sessions = api.getSessions(['app']);
      const list = nodemiral.taskList('Setup Odoo');

      // Perform initial setup
      list.executeScript('Setup Environment', {
        script: api.resolvePath(__dirname, 'assets/odoo-setup.sh'),
        vars: { name: config.app.name },
      });

      // Copy across the docker-stack
      list.copy('Copying docker-compose.yml', {
        src: api.resolvePath(__dirname, 'assets/docker-stack/docker-compose.yml'),
        dest: api.resolvePath('/opt', config.app.name, 'docker-compose.yml'),
        vars: { 
          name: config.app.name,
          domain: config.app.domain,
          dbUserUID: config.app.dbUserUID,
          odooUserUID: config.app.odooUserUID,
          portCmd: config.app.isProduction ? 'expose' : 'ports',
          portValODOO: config.app.isProduction ? config.app.odooVirtualPort : config.app.odooVirtualPort+':'+config.app.odooVirtualPort,
          portValDB: config.app.isProduction ? config.app.dbPort : config.app.dbPort+':'+config.app.dbPort,
          dbPort: config.app.dbPort,
          odooVirtualPort: config.app.odooVirtualPort,
          odooLongPollingPort: config.app.odooLongPollingPort,
        },
      });
      list.copy('Copying makefile', {
        src: api.resolvePath(__dirname, 'assets/docker-stack/makefile'),
        dest: api.resolvePath('/opt', config.app.name, 'makefile'),
        vars: { name: config.app.name },
      });

      // Copy across the docker-postgres-image
      list.copy('Copying docker-postgres-image/Dockerfile', {
        src: api.resolvePath(__dirname, 'assets/docker-postgres-image/Dockerfile'),
        dest: api.resolvePath('/opt', config.app.name, 'docker-postgres-image/Dockerfile'),
      });
      list.copy('Copying docker-postgres-image/postgresql.conf', {
        src: api.resolvePath(__dirname, 'assets/docker-postgres-image/postgresql.conf'),
        dest: api.resolvePath('/opt', config.app.name, 'docker-postgres-image/postgresql.conf'),
        vars: { dbPort: config.app.dbPort },
      });
      list.copy('Copying docker-postgres-image/init-user-db.sh', {
        src: api.resolvePath(__dirname, 'assets/docker-postgres-image/init-user-db.sh'),
        dest: api.resolvePath('/opt', config.app.name, 'docker-postgres-image/init-user-db.sh'),
      });

      // Download Odoo source
      if (config.app.isSource) {
        list.copy('Copying local-odoo-image/odoo.conf', {
          src: api.resolvePath(__dirname, 'assets/local-odoo-image/odoo.conf'),
          dest: api.resolvePath('/opt', config.app.name, 'local-odoo-image/odoo.conf'),
          vars: { name: config.app.name, dbPort: config.app.dbPort }, 
        });
        list.copy('Copying local-odoo-image/packages-apt.txt', {
          src: api.resolvePath(__dirname, 'assets/local-odoo-image/packages-apt.txt'),
          dest: api.resolvePath('/opt', config.app.name, 'local-odoo-image/packages-apt.txt'),
        });
        list.copy('Copying local-odoo-image/packages-pip.txt', {
          src: api.resolvePath(__dirname, 'assets/local-odoo-image/packages-pip.txt'),
          dest: api.resolvePath('/opt', config.app.name, 'local-odoo-image/packages-pip.txt'),
        });
        list.copy('Copying docker-odoo-image/oca_dependencies.txt', {
          src: api.resolvePath(__dirname, 'assets/docker-odoo-image/oca_dependencies.txt'),
          dest: api.resolvePath('/opt', config.app.name, 'local-odoo-image/oca_dependencies.txt'),
        });
        list.executeScript('Setup Source Environment', {
          script: api.resolvePath(__dirname, 'assets/local-odoo-image/init-odoo-source.sh'),
          vars: { name: config.app.name },
        });

      // Copy across the docker-odoo-image
      } else {
        list.copy('Copying docker-odoo-image/Dockerfile', {
          src: api.resolvePath(__dirname, 'assets/docker-odoo-image/Dockerfile'),
          dest: api.resolvePath('/opt', config.app.name, 'docker-odoo-image/Dockerfile'),
        });
        list.copy('Copying docker-odoo-image/boot', {
          src: api.resolvePath(__dirname, 'assets/docker-odoo-image/boot'),
          dest: api.resolvePath('/opt', config.app.name, 'docker-odoo-image/boot'),
        });
        list.copy('Copying docker-odoo-image/oca_dependencies.txt', {
          src: api.resolvePath(__dirname, 'assets/docker-odoo-image/oca_dependencies.txt'),
          dest: api.resolvePath('/opt', config.app.name, 'docker-odoo-image/oca_dependencies.txt'),
        });
      }

      // rebuild and startup postgres
      list.execute('Images Down, Rebuilt, and bring up Postgres', { 
        command: 'cd ' + api.resolvePath('/opt', config.app.name, '') + '; make setup'
      }, (err, std) => console.log(std));

      return api.runTaskList(list, sessions, { verbose: api.verbose });
    },
  },
  deploy: {
    description: 'Deploy odoo server',
    handler(api) {
      const args = api.getArgs();
      const config = api.getConfig();
      const sessions = api.getSessions(['app']);
      const list = nodemiral.taskList('Deploying Odoo');
      console.log('Deploying Odoo', sessions);
      return true;
    }
  },
  start: {
    description: 'Start odoo server',
    handler(api) {
      const args = api.getArgs();
      const config = api.getConfig();
      const sessions = api.getSessions(['app']);
      const list = nodemiral.taskList('Starting Odoo');
      list.execute('Starting Odoo', { 
        command: 'cd '+ api.resolvePath('/opt', config.app.name, '') + '; make start'
      }, (err, std) => console.log(std));
      return api.runTaskList(list, sessions, { verbose: api.verbose });
    }
  },
  stop: {
    description: 'Stop odoo server',
    handler(api) {
      const args = api.getArgs();
      const config = api.getConfig();
      const sessions = api.getSessions(['app']);
      const list = nodemiral.taskList('Stopping Odoo');
      list.execute('Stopping Odoo', { 
        command: 'cd '+ api.resolvePath('/opt', config.app.name, '') + '; make stop'
      }, (err, std) => console.log(std));
      return api.runTaskList(list, sessions, { verbose: api.verbose });
    }
  },
};
