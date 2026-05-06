## This setup is only for local development
# ! Auth will only authorized users if they are:
1. They are under the '.jolitravel.local' host
2. Frontend and Backend is in auth ALLOWED_ORIGINS
3. They have the access token stored in httpOnly cookie which is available only to '.jolitravel.local'

# SETUP
1.  Unify subdomains
- Visit C:\Windows\System32\drivers\etc\hosts
- Write the following:

```bash
# Travel and Tours
127.0.0.1 auth.jolitravel.local
127.0.0.1 landing.jolitravel.local
127.0.0.1 front.qrlog1.jolitravel.local
127.0.0.1 back.qrlog1.jolitravel.local
127.0.0.1 front.fleet.jolitravel.local
127.0.0.1 back.fleet.jolitravel.local

#add your local subdomain here, should end with .jolitravel.local domain
```

2. Bind Backends via XAMPP Virtual Hosts
- Find and open C:\xampp\apache\conf\extra\httpd-vhosts.conf
- Write the following

```bash
<VirtualHost *:80>
    ServerName auth.jolitravel.local
    DocumentRoot "C:/xampp/htdocs/TravelAndTours/auth/public"

    <Directory "C:/xampp/htdocs/TravelAndTours/auth/public">
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog "logs/auth-error.log"
    CustomLog "logs/auth-access.log" common
</VirtualHost>

<VirtualHost *:80>
    ServerName back.logisticsI.jolitravel.local
    DocumentRoot "C:/xampp/htdocs/TravelAndTours/logisticsI/public"

    <Directory "C:/xampp/htdocs/TravelAndTours/logisticsI/public">
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog "logs/auth-error.log"
    CustomLog "logs/auth-access.log" common
</VirtualHost>

<VirtualHost *:80>
    ServerName back.fleet.jolitravel.local
    DocumentRoot "C:/xampp/htdocs/TravelAndTours/logisticsII/backend/public"
    <Directory "C:/xampp/htdocs/TravelAndTours/logisticsII/backend/public">
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog "logs/back-error.log"
    CustomLog "logs/back-access.log" common
</VirtualHost>

# Add your backend here
<VirtualHost *:80>
    ServerName # your backend domain here written in hosts file.
    DocumentRoot "C:/xampp/htdocs/TravelAndTours/{YOUR BACKEND PATH}/public"

    <Directory "C:/xampp/htdocs/TravelAndTours/{YOUR BACKEND PATH}/public">
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog "logs/auth-error.log"
    CustomLog "logs/auth-access.log" common
</VirtualHost>

```

- Save the changes

3. Bind the frontend
- Open your frontend vite.config.js
- Define server host and port

```bash
return {
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
        "@": path.resolve(__dirname, "./src"),
        },
    },
    #START
    server: {
        host: env.VITE_APP_HOST,
        port: env.VITE_APP_PORT,
    },
    #END
    base: env.VITE_BASE_URL || '/'
    }
}
```

- Open .env.development and add the following

```bash
VITE_APP_HOST= #YOUR FRONTEND URL DEFINED IN HOSTS FILE
VITE_APP_PORT= #PORT ACCORDING TO YOU GROUP NUMBER  EX. 3008 = GROUP 138

VITE_LANDING_FRONTEND=http://landing.jolitravel.local:3000
VITE_AUTH_BACKEND=http://auth.jolitravel.local

#THEN MODIFY THIS LINE ACCORDING TO YOUR DEFINED HOSTS
# EX. 
VITE_LOGISTICSI_FRONTEND=http://front.qrlog1.jolitravel.local:3007
VITE_LOGISTICSI_BACKEND=http://back.qrlog1.jolitravel.local

```
