---
title: OpenSSL Convert
tags: 
- tech
- kb
- linux
---

PFX to Key
```
openssl pkcs12 -in filename.pfx -nocerts -out key_pw.pem
```

Remove password from key
```
openssl rsa -in key_pw.pem -out key.pem
```

PFX to Cert
```
openssl pkcs12 -in filename.pfx -clcerts -nokeys -out cert.pem
```
