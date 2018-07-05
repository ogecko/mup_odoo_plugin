#!/bin/bash
set -e

echo "Creating odoo user in postgres..."
echo -e "\
CREATE USER odoo WITH password '"$( cat /run/secrets/ODOO_DB_PASSWORD)"';\n\
ALTER USER odoo WITH createdb;" \
| psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER"  
