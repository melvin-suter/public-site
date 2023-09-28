---
title: Apache2 and Nextcloud showing wrong Source IP behind Proxy
date: 2023-07-17
tags: 
- tech
- linux
---

You might notice in your logs or while using the brute-force app inside nextcloud, that your source IP shows only the proxy IP, not the client IP.

This can happen if apache isn't processing the x-forwarded headers correctely. You can fix it with these steps.

## Step 1 - Set Nextcloud Settings

Add these 2 lines to the nextcloud config.php:

```php
'trusted_proxies' => array(
    'YOUR-PROXY-IP'
),
'forwarded_for_headers' => array(
    0 => 'HTTP_X_FORWARDED_FOR'
),
```

## Step 2 - Configure Apache

Add these 2 lines to your apache2 config file (located at `/etc/apache2/sites-enables/nextcloud.conf`) inside your virutalhost:

```
RemoteIPInternalProxy YOUR-PROXY-IP
RemoteIPHeader X-Forwarded-For
```

## Step 3 - Enable Apache

```bash
a2enmod remoteip
systemctl restart apache2
```
