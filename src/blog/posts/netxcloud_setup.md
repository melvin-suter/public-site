---
title: Nextcloud Setup
tags: 
- blog
- linux
---

Let's setup a simple nextcloud environment with the following parameters:

- Docker Based
- Collabora
- RHEL9

## Setup Basis

```bash
# Some General Tools
dnf install -y vim wget tar unzip 

# Firewall
systemctl enable --now firewalld

# Docker per it's documentation (CentOS)
dnf remove docker \
        docker-client \
        docker-client-latest \
        docker-common \
        docker-latest \
        docker-latest-logrotate \
        docker-logrotate \
        docker-engine

dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
dnf install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
```

## Setup Nextcloud

Let's create a folder in /srv/nextcloud-project and add some files:

First we need a certificate:
```bash
mkdir -p /srv/nextcloud-project/ssl
cd /srv/nextcloud-project/ssl
openssl req -x509 -nodes -subj "/C=CH/ST=ZH/O=IT/CN=example.org" -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
```

docker-compose.yaml

```bash
version: '3'

services:
    db:
        image: mariadb:11.1
        restart: always
        command: --transaction-isolation=READ-COMMITTED --log-bin=binlog --binlog-format=ROW
        volumes:
        - /srv/nextcloud-project/nextcloud-db:/var/lib/mysql
        environment:
        - MYSQL_ROOT_PASSWORD=
        - MYSQL_PASSWORD=
        - MYSQL_DATABASE=nextcloud
        - MYSQL_USER=nextcloud

    app:
        image: nextcloud:27.1.2-fpm
        restart: always
        links:
        - db
        volumes:
        - /srv/nextcloud-project/nextcloud-data:/var/www/html
        environment:
        - MYSQL_PASSWORD=
        - MYSQL_DATABASE=nextcloud
        - MYSQL_USER=nextcloud
        - MYSQL_HOST=db
        - NEXTCLOUD_TRUSTED_DOMAINS=cloud.example.com

    collabora:
        image: collabora/code:23.05.4.2.1
        ports: []
        restart: always
        environment:
        - domain=srvnextcloud.kaiseraugst.ch.local/office
        - "extra_params=--o:ssl.enable=false --o:ssl.termination=true"
        cap_add: 
        - MKNOD

    web:
        image: nginx:1.25.2
        restart: always
        ports:
        - 80:80
        - 443:443
        links:
        - app
        - collabora
        volumes:
        - ./nginx.conf:/etc/nginx/nginx.conf:ro
        - ./ssl:/etc/nginx/ssl:ro
        volumes_from:
        - app
```

And the nginx.conf file:

```config
worker_processes auto;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;


events {
    worker_connections  1024;
}
http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    # Prevent nginx HTTP Server Detection
    server_tokens   off;

    keepalive_timeout  65;



    #gzip  on;

    upstream php-handler {
        server app:9000;
    }

    upstream collabora {
        server collabora:9980;
    }

    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name _;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl;
            
        ssl_certificate         /etc/nginx/ssl/cert.pem;
        ssl_certificate_key     /etc/nginx/ssl/key.pem;
        ssl_protocols           TLSv1 TLSv1.1 TLSv1.2;
        ssl_ciphers             HIGH:!aNULL:!MD5:!DES-CBC3-SHA:!EDH-RSA-DES-CBC3-SHA:!ECDHE-RSA-DES-CBC3-SHA;


        # HSTS settings
        # WARNING: Only add the preload option once you read about
        # the consequences in https://hstspreload.org/. This option
        # will add the domain to a hardcoded list that is shipped
        # in all major browsers and getting removed from this list
        # could take several months.
        #add_header Strict-Transport-Security "max-age=15768000; includeSubDomains; preload;" always;

        # set max upload size
        client_max_body_size 512M;
        fastcgi_buffers 64 4K;

        # Enable gzip but do not remove ETag headers
        gzip on;
        gzip_vary on;
        gzip_comp_level 4;
        gzip_min_length 256;
        gzip_proxied expired no-cache no-store private no_last_modified no_etag auth;
        gzip_types application/atom+xml application/javascript application/json application/ld+json application/manifest+json application/rss+xml application/vnd.geo+json application/vnd.ms-fontobject application/x-font-ttf application/x-web-app-manifest+json application/xhtml+xml application/xml font/opentype image/bmp image/svg+xml image/x-icon text/cache-manifest text/css text/plain text/vcard text/vnd.rim.location.xloc text/vtt text/x-component text/x-cross-domain-policy;

        # Pagespeed is not supported by Nextcloud, so if your server is built
        # with the `ngx_pagespeed` module, uncomment this line to disable it.
        #pagespeed off;

        # HTTP response headers borrowed from Nextcloud `.htaccess`
        add_header Referrer-Policy                      "no-referrer"       always;
        add_header X-Content-Type-Options               "nosniff"           always;
        add_header X-Download-Options                   "noopen"            always;
        add_header X-Frame-Options                      "SAMEORIGIN"        always;
        add_header X-Permitted-Cross-Domain-Policies    "none"              always;
        add_header X-Robots-Tag                         "noindex, nofollow" always;
        add_header X-XSS-Protection                     "1; mode=block"     always;

        # Remove X-Powered-By, which is an information leak
        fastcgi_hide_header X-Powered-By;

        # Path to the root of your installation
        root /var/www/html;

        # Specify how to handle directories -- specifying `/index.php$request_uri`
        # here as the fallback means that Nginx always exhibits the desired behaviour
        # when a client requests a path that corresponds to a directory that exists
        # on the server. In particular, if that directory contains an index.php file,
        # that file is correctly served; if it doesn't, then the request is passed to
        # the front-end controller. This consistent behaviour means that we don't need
        # to specify custom rules for certain paths (e.g. images and other assets,
        # `/updater`, `/ocm-provider`, `/ocs-provider`), and thus
        # `try_files $uri $uri/ /index.php$request_uri`
        # always provides the desired behaviour.
        index index.php index.html /index.php$request_uri;

        # Rule borrowed from `.htaccess` to handle Microsoft DAV clients
        location = / {
            if ( $http_user_agent ~ ^DavClnt ) {
                return 302 /remote.php/webdav/$is_args$args;
            }
        }

        location = /robots.txt {
            allow all;
            log_not_found off;
            access_log off;
        }

        # Make a regex exception for `/.well-known` so that clients can still
        # access it despite the existence of the regex rule
        # `location ~ /(\.|autotest|...)` which would otherwise handle requests
        # for `/.well-known`.
        location ^~ /.well-known {
            # The rules in this block are an adaptation of the rules
            # in `.htaccess` that concern `/.well-known`.

            location = /.well-known/carddav { return 301 /remote.php/dav/; }
            location = /.well-known/caldav  { return 301 /remote.php/dav/; }

            location /.well-known/acme-challenge    { try_files $uri $uri/ =404; }
            location /.well-known/pki-validation    { try_files $uri $uri/ =404; }

            # Let Nextcloud's API for `/.well-known` URIs handle all other
            # requests by passing them to the front-end controller.
            return 301 /index.php$request_uri;
        }

        # Rules borrowed from `.htaccess` to hide certain paths from clients
        location ~ ^/(?:build|tests|config|lib|3rdparty|templates|data)(?:$|/)  { return 404; }
        location ~ ^/(?:\.|autotest|occ|issue|indie|db_|console)                { return 404; }

        # Ensure this block, which passes PHP files to the PHP process, is above the blocks
        # which handle static assets (as seen below). If this block is not declared first,
        # then Nginx will encounter an infinite rewriting loop when it prepends `/index.php`
        # to the URI, resulting in a HTTP 500 error response.
        location ~ \.php(?:$|/) {
            # Required for legacy support
            rewrite ^/(?!index|remote|public|cron|core\/ajax\/update|status|ocs\/v[12]|updater\/.+|oc[ms]-provider\/.+|.+\/richdocumentscode\/proxy) /index.php$request_uri;

            fastcgi_split_path_info ^(.+?\.php)(/.*)$;
            set $path_info $fastcgi_path_info;

            try_files $fastcgi_script_name =404;

            include fastcgi_params;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            fastcgi_param PATH_INFO $path_info;
            #fastcgi_param HTTPS on;

            fastcgi_param modHeadersAvailable true;         # Avoid sending the security headers twice
            fastcgi_param front_controller_active true;     # Enable pretty urls
            fastcgi_pass php-handler;

            fastcgi_intercept_errors on;
            fastcgi_request_buffering off;
        }

        location ~ \.(?:css|js|svg|gif)$ {
            try_files $uri /index.php$request_uri;
            expires 6M;         # Cache-Control policy borrowed from `.htaccess`
            access_log off;     # Optional: Don't log access to assets
        }

        location ~ \.woff2?$ {
            try_files $uri /index.php$request_uri;
            expires 7d;         # Cache-Control policy borrowed from `.htaccess`
            access_log off;     # Optional: Don't log access to assets
        }

        # Rule borrowed from `.htaccess`
        location /remote {
            return 301 /remote.php$request_uri;
        }


        location ^~ /browser {
            proxy_pass http://collabora;
            proxy_set_header Host $http_host;
        }


        location ^~ /hosting {
            proxy_pass http://collabora;
            proxy_set_header Host $http_host;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }


        location ^~ /cool {
            proxy_pass http://collabora;
            proxy_set_header Host $http_host;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location ^~ /lool {
            proxy_pass http://collabora;
            proxy_set_header Host $http_host;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        location / {
            try_files $uri $uri/ /index.php$request_uri;
        }
    }
}
```

# Sources:

* https://docs.docker.com/engine/install/centos/
* https://github.com/nextcloud/docker#running-this-image-with-docker-compose