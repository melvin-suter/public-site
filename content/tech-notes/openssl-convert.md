---
title: OpenSSL Convert
tags: 
- linux
---

PFX to Key

```bash
openssl pkcs12 -in filename.pfx -nocerts -out key_pw.pem
```

Remove password from key

```bash
openssl rsa -in key_pw.pem -out key.pem
```

PFX to Cert

```bash
openssl pkcs12 -in filename.pfx -clcerts -nokeys -out cert.pem
```