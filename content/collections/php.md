---
title: 'PHP Snippets'---

## PHP Session Permission Fix (Remi)


```bash
echo "d /var/lib/php/session  0755 nginx nginx  -   -" > /etc/tmpfiles.d/php_fix.conf
systemd-tmpfiles --create
```
