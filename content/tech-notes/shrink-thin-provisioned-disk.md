---
title: Shrink Thin Provisioned Disk
tags: 
- VMware
---

Here's a very quick overview over how to shirnk a bloated vmdk.

## Check Datastore

Get ID of Datastore:

```bash
esxcli storage core device list | grep -B1 '  Display Name:'
```

Check state of Datastore:

```bash
$ esxcli storage core device list -d naa.668a828100177dc6c624663100000006 | grep 'Thin Provisioning\|Attached Filter\|VAAI\|Revision'
   Revision: XXXX
   Thin Provisioning Status: yes
   Attached Filters:
   VAAI Status: supported

$ esxcli storage core device vaai status get -d naa.668a828100177dc6c624663100000006 | grep 'Delete Status'
   Delete Status: supported
```

## Clear File-System

### Windows

You can use SDelete by Sysinternals: https://docs.microsoft.com/en-us/sysinternals/downloads/sdelete

```cmd
sdelete.exe -z C:\
```

### Linux

Create a file containing zeros and fill disk with it:

```bash
dd if=/dev/zero of=/[mounted-volume]/zeroes && rm -f /[mounted-volume]/zeroes
```

### Shrink VMDK

Now you can ssh into the esx and "punsh" the zeros:

```bash
vmkfstools -K [disk].vmdk
```