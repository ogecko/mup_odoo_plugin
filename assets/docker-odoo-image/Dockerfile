FROM elicocorp/odoo:10.0
RUN pip install pysftp
RUN pip install simplejson
ADD boot /usr/bin/boot
RUN chmod +x /usr/bin/boot
ADD oca_dependencies.txt /usr/bin/oca_dependencies.txt
