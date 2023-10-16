---
title: vCenter Error "solution user login failed"
tags: 
- blog
- vmware
---

## The Issue

I was batteling with a vCenter that showed a "HTTP Status 500 – Internal Server Error" error on the vCenter UI.
So I had a look inside the logfile `/var/log/vmware/vsphere-ui/logs/vsphere_client_virgo.log` and found this error:

```bash
[2023-10-09T08:59:22.824Z] [ERROR] http-nio-5090-exec-2         70000028 100006 ###### com.vmware.vise.vim.security.sso.impl.NgcSolutionUser             Solution user login into domain vsphere.local failed. com.vmware.vim.sso.client.exception.AuthenticationFailedException: Provided credentials are not valid.
```

The next thing I had a look at where the certificates:

```bash
for i in $(/usr/lib/vmware-vmafd/bin/vecs-cli store list); do echo STORE $i; sudo /usr/lib/vmware-vmafd/bin/vecs-cli entry list --store $i --text | egrep "Alias|Not After"; done
(...)
STORE vsphere-webclient
Alias : vsphere-webclient
            Not After : Oct  8 17:46:46 2023 GMT
(...)
```

## Fixing


> Don't be stupid and make a snapshot!
> {.danger}

Now we need to generate a new key-pair and add this to the solutions user.

```bash
cd ~

# Prepare certutil config
cp /var/lib/vmware/vmca_config/certool.cfg vsphere-webclient_custom.cfg
sed -i 's;Name\s*=.*;;' vsphere-webclient_custom.cfg
sed -i 's;Hostname\s*=.*;;' vsphere-webclient_custom.cfg
sed -i 's;Email\s*=.*;;' vsphere-webclient_custom.cfg

# Generate Certs
/usr/lib/vmware-vmca/bin/certool --genkey --privkey=vsphere-webclient-key.priv --pubkey=vsphere-webclient-key.pub
/usr/lib/vmware-vmca/bin/certool --gencert --cert=new-vsphere-webclient.crt --privkey=vsphere-webclient-key.priv --config vsphere-webclient_custom.cfg --Name=vsphere-webclient  --server=localhost # replace with PSC fqdn if not embedded

# Stop All Services and only load needed ones
service-control --stop --all
service-control --start vmafdd
service-control --start vmdird
service-control --start vmcad

# Update User entry
/usr/lib/vmware-vmafd/bin/dir-cli service update --name vsphere-webclient-cae487d0-4258-11e8-95cf-000c29c503c2 --cert new-vsphere-webclient.crt

# Update the vmdir
/usr/lib/vmware-vmafd/bin/vecs-cli entry delete --store vsphere-webclient --alias vsphere-webclient
/usr/lib/vmware-vmafd/bin/vecs-cli entry create --store vsphere-webclient --alias vsphere-webclient --cert new-vsphere-webclient.crt --key vsphere-webclient-key.priv

# Restart all services
service-control --start --all
```

Let's verify the certificate:


The next thing I had a look at where the certificates:

```bash
for i in $(/usr/lib/vmware-vmafd/bin/vecs-cli store list); do echo STORE $i; sudo /usr/lib/vmware-vmafd/bin/vecs-cli entry list --store $i --text | egrep "Alias|Not After"; done
(...)
STORE vsphere-webclient
Alias : vsphere-webclient
            Not After : Oct  8 09:26:09 2025 GMT
(...)
```