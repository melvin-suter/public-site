---
title: vCenter Change FQDN/URL for Login
date: 2023-07-17
tags: 
- kb
- vmware
---

Connect over SSH to vCenter

```bash
# Stop vCenter UI
service-control --stop vsphere-ui

# Backup Config
cp /etc/vmware/vsphere-ui/webclient.properties /root/webclient.proberties.BAK.$(date +%s)

# Edit File and uncomment settings + add domains
vi /etc/vmware/vsphere-ui/webclient.properties
##################
sso.serviceprovider.alias.whitelist=vcenter,vcenter.domain.local
##################

# Start vCenter UI
service-control --start vsphere-ui
```