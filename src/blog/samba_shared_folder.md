---
title: Samba Shared Folder
tags: 
- tech
- kb
- linux
---


Example:

```bash
# Create Users and Groups
groupadd data-users
useradd user1 -G data-users
useradd user2 -G data-users

# Create Parent Direcotry and set owner
mkdir /var/data
chown :data-users /var/data
chmod 770 /var/data

# Every folder-group of newly created dirs gets replaced with the parent owner
chmod o+t /var/data

# User can only delete their own files
chmod g+s /var/data

# Set Default permissions
echo "umask 0027 /var/data" >> /etc/profile.d/local-umask.sh
```
