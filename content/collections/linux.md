---
title: 'Linux Snippets'
resources:
- name: template-:counter
  src: 'zabbix_templates/**.yaml'
---

## get script dir

```bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
```

## Certificates

### create self signed

```bash
openssl req -x509 -nodes -subj "/C=CH/ST=ZH/O=IT/CN=example.org" -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
```
