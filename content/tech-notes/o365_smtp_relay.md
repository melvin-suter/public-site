---
title: Exchange Online SMTP Annonymous Relay
tags: 
- linux
- microsoft
---

Add Firewallrule:

```bash
ip saddr YOURIP/32 tcp dport 25 accept
```

Install:

```bash
dnf install -y postfix
 
echo "
myhostname = smtp.suter.dev
mydomain = noreply.suter.dev
mynetworks = 127.0.0.0/8 YOURIPHERE
myorigin = \$myhostname
relayhost =  [YOURSERVER.mail.protection.outlook.com]
disable_dns_lookups = yes
smtpd_client_restrictions = permit_mynetworks, reject
smtpd_relay_restrictions = permit_mynetworks, reject
" > /etc/postfix/main.cf

systemctl restart postfix
```

In O365 create a connector for anonymous releay from this ip.