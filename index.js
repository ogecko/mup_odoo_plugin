commands = require('./commands');

module.exports = {
  name: 'odoo',
  description: 'Deploy Odoo OpenERP configuration to servers',
  commands: commands,
  validate: {
    // list of additional mup.js config entries and their validators that return an array of errors
    odoo: (config, util) => [], 
  },
  hooks: {
    'post.setup': api => api.runCommand('odoo.setup'),
    'post.deploy': api => api.runCommand('odoo.deploy'),
    'post.start': api => api.runCommand('odoo.start'),
    'post.stop': api => api.runCommand('odoo.stop'),
  },
};
