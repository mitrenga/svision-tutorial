# tutorial.shipard.pro:34444 – the svision tutorial and demos (/home/libmit/sw/svision-tutorial) on a
# host of their own: the shell at /, every demo at /demos/<topic>/<platform>/ — two
# levels deeper than the projects of willy2.shipard.pro, whose rewrite knows only
# /<project>/.... Same certificate (*.shipard.pro), same port, same PHP-FPM.
#
#   https://tutorial.shipard.pro:34444/                    the shell (?demo=<name>)
#   https://tutorial.shipard.pro:34444/demos/helloworld/zx/   a demo on its own
#
# DNS: an A record tutorial.shipard.pro -> 178.20.137.88 (as willy2).
# Install:  sudo cp /home/libmit/sw/svision-tutorial/nginx/tutorial.shipard.pro /etc/nginx/sites-enabled/
#           sudo nginx -t && sudo systemctl reload nginx

server {
	listen 34444 ssl http2;

	server_name tutorial.shipard.pro;

	root /home/libmit/sw/svision-tutorial;
	index index.php;

	ssl_certificate /var/lib/certs/all.shipard.pro/chain.pem;
	ssl_certificate_key /var/lib/certs/all.shipard.pro/privkey.pem;
	ssl_trusted_certificate /var/lib/certs/all.shipard.pro/chain.pem;
	ssl_session_timeout 60m;
	ssl_session_cache shared:SSL:50m;
	ssl_protocols TLSv1.2 TLSv1.3;
	ssl_prefer_server_ciphers on;
	ssl_stapling on;
	ssl_stapling_verify on;
	add_header Strict-Transport-Security "max-age=63072000; includeSubdomains; preload" always;

	# ---------------------------------------------------------------
	# Never serve: git, scripts, docs, the demos' config/ and db/, dot files
	# ---------------------------------------------------------------
	location ~ /config\.json$ { deny all; }
	location ~ /\.(?:git|ht) { deny all; }
	location ~* \.(?:sh|sql|log|sample|md)$ { return 404; }
	location ~ ^/demos/[^/]+/[^/]+/(?:config|db)/ { return 404; }
	location ~ ^/nginx/ { return 404; }

	# ---------------------------------------------------------------
	# The shell at / and the demos at /demos/<topic>/<platform>/ are applications
	# (SPA: /demos/<t>/<p>/anything -> /demos/<t>/<p>/index.php?anything,
	# /anything -> /index.php?anything); assets may be cached by the browser
	# ---------------------------------------------------------------
	location / {
		try_files $uri $uri/ @rewrite;

		error_page 404 = @rewrite;
		location ~* \.(?:jpg|jpeg|png|gif|ico|svg|css|js|ttf|otf|woff2|mp3|ogg|wav)$ { expires 7d; }
	}
	location @rewrite {
		rewrite ^/demos/([^/]+)/([^/]+)/(.*)$ /demos/$1/$2/index.php?$3 last;
		rewrite ^/(.*)$ /index.php?$1 last;
	}

	location ~ \.php$ {
		try_files $uri =404;
		fastcgi_split_path_info ^(.+\.php)(/.+)$;
		fastcgi_pass unix:/run/php/php8.3-fpm.sock;
		fastcgi_index index.php;
		fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
		include fastcgi_params;
		fastcgi_read_timeout 300;
	}

	gzip on;
	gzip_proxied any;
	gzip_types text/plain text/xml text/css application/xml application/xml+rss text/javascript application/javascript image/svg+xml application/json;
	gzip_vary on;

	rewrite_log off;
	fastcgi_buffers 32 32k;
	fastcgi_buffer_size 128k;
}
