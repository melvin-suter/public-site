---
title: 'apt-get palo fix'
tags: 
- linux
- ubuntu
---

Does your debian/ubuntu show a 503 error while running `apt-get update` and you got a palo firewall?

Simple solution, run this command to act like you are curl and not apt, so it will go through.

```bash
echo 'Acquire { http::User-Agent "curl/7.68.0"; };' > /etc/apt/apt.conf.d/palofix
```