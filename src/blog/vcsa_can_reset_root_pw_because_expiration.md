---
title: vCenter Reset Root Login Expired
tags: 
- tech
- kb
- vmware
---

If you can't reset the root password because of expiration, here is the solution:

Reboot vcsa with `init=/bin/bash rw`
```bash
mount -o remount,rw /
vi /etc/pam.d/system-account
############# comment this line
account	required	pam_unix.so
#############
chage -M -1 -E -1 root
vi /etc/pam.d/system-account
############# uncomment this line
account	required	pam_unix.so
#############
passwd
reboot -f
```

