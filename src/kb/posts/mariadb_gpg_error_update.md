---
title: MariaDB GPG error on update
date: 2023-07-17
tags: 
- kb
- linux
---

If you see this error during a `yum update`:

```
GPG key at file:///etc/pki/rpm-gpg/MariaDB-Server-GPG-KEY (0x1BB943DB) is already installed
The GPG keys listed for the "MariaDB Server" repository are already installed but they are not correct for this package.
Public key for MariaDB-server-10.7.8-1.el8.x86_64.rpm is not installed. Failing package is: MariaDB-server-10.7.8-1.el8.x86_64
GPG Keys are configured as: file:///etc/pki/rpm-gpg/MariaDB-Server-GPG-KEY
```

Try this:
```bash
rpm --import https://repo.mysql.com/RPM-GPG-KEY-mysql-2022
```

{{tag>mariadb linux}}