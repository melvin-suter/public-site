---
title: Kubernetes Setup - Storage
date: 2023-10-05
# permalink: false
tags: 
- linux
- kubernetes
---

## NFS Storage Provider

We are almost there. So now let's see if we can set it up.

First we're going to add 2 shares on the synology nas:
1. kubernetes_tier1 -> on SSD
2. kubernetes_tier2 -> on HDD

Those will have the NFS Rule:
* IP: 10.10.126.0/24
* Privilege: Read/Write
* Squash: no
* Security: sys
* Enable Async: yes
* Allow subfolder mount: yes

So let's add 2 storage classes to represent this:

> We need to use NFSv3 right now, because Synology and Linux don't like each other with 4.1

```
helm repo add nfs-subdir-external-provisioner https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/

helm install nfs-provisioner-tier1 nfs-subdir-external-provisioner/nfs-subdir-external-provisioner \
    --set nfs.server=10.10.121.20 \
    --set nfs.path=/volume1/kubernetes_tier1/k3s00 \
    --set nfs.mountOptions[0]=vers=3 \
    --set storageClass.name=nfs-tier1

helm install nfs-provisioner-tier2 nfs-suabdir-external-provisioner/nfs-subdir-external-provisioner \
    --set nfs.server=10.10.121.20 \
    --set nfs.path=/volume2/kubernetes_tier2/k3s00 \
    --set nfs.mountOptions[0]=vers=3 \
    --set storageClass.name=nfs-tier2
```
