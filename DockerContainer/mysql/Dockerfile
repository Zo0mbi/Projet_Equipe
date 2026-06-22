FROM mysql:8.0

# Copy the config files
COPY conf.d /etc/mysql/conf.d
COPY db /docker-entrypoint-initdb.d

# Set permissions for the config file so MySQL accepts it
RUN chmod 644 /etc/mysql/conf.d/my.cnf \
    && chown -R mysql:mysql /etc/mysql/conf.d