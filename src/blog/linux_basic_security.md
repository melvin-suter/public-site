---
title: Linux Basic Security
tags: 
- tech
- kb
- linux
---

## Block SSH Brute Force

### With IPTables

https://www.rackaid.com/blog/how-to-block-ssh-brute-force-attacks/

lock ssh access after 3 login attempts per minute.

```bash
/usr/sbin/iptables -I INPUT -p tcp --dport 22 -i eth0 -m state --state NEW -m recent --set
/usr/sbin/iptables -I INPUT -p tcp --dport 22 -i eth0 -m state --state NEW -m recent  --update --seconds 60 --hitcount 4 -j DROP
```

and with logging

```bash
iptables -N LOGDROP
iptables -A LOGDROP -j LOG
iptables -A LOGDROP -j DROP
iptables -I INPUT -p tcp --dport 22 -i eth0 -m state --state NEW -m recent --set
iptables -I INPUT -p tcp --dport 22 -i eth0 -m state --state NEW -m recent  --update --seconds 60 --hitcount 4 -j LOGDROP
```

### With PAM

Locks a user, if they have 3 failed login attempts (reset on successfull login) for 1200s.

```bash
# Auth Section
auth        required      pam_tally2.so  file=/var/log/tallylog deny=3 even_deny_root unlock_time=1200
# Account Section
account     required      pam_tally2.so
```

Parameters:

- `file=/var/log/tallylog` Path to default log file
- `deny=3` Deny access after 3 attempts and lock down user
- `even_deny_root` Policy is also apply to root user
- `unlock_time=1200` Account will be locked till 20 Min. (remove if lock down permanently till manually unlock.)

To check if a users is blocked and unlock it:

```bash
pam_tally2 --user=USER
pam_tally2 --user=USER --reset
```

## SSH Config

```bash
# Only Allow specific Users/Group
AllowUsers root admin webmaster
AllowGroup sshusers
    
# Disable Password Authentification
PasswordAuthentication no
PermitRootLogin without-password
    
# Increase Key-Strength
ServerKeyBits 2048
    
# Check Defaults
IgnoreRhosts yes
RhostsRSAAuthentication no
HostbasedAuthentication no
PermitEmptyPasswords no
UsePam yes
    
# Disable Protocol 1
Protocol 2
    
# If connection is fast enough, drop connection after 30s
LoginGraceTime 30
```
### If IP Addresses are known

```bash

# /etc/hosts.deny
sshd:  ALL
    
# /etc/hosts.allow
sshd: 192.168.1.1, 10.10.0.0/255.255.0.0

```
