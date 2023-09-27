---
title: MySQL Tuning
date: 2023-07-17
tags: 
- blog
- tech
---

Tuning a MySQL instance can be difficult. Happely there is a tool to help you out.

With Tuning Primer, you can see which settings in your `/etc/my.cnf` config can be optimized.

Try it out:

```bash
wget https://github.com/melvin-suter/scripts/raw/master/tuning-primer.sh
chmod +x tuning-primer.sh
./tuning-primer.sh
```