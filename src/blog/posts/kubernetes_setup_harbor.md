---
title: Kubernetes Setup - Harbor
date: 2023-10-05
# permalink: false
tags: 
- linux
- kubernetes
---

Deploy the helm chart:

```
helm repo add harbor https://helm.goharbor.io

helm install harbor harbor/harbor \
    --set expose.type=ingress \
    --set expose.ingress.hosts.core=harbor.apps.suter.dev \
    --set externalURL=https://harbor.apps.suter.dev \
    --set persistence.persistentVolumeClaim.registry.storageClass=nfs-tier1 \
    --set persistence.persistentVolumeClaim.chartmuseum.storageClass=nfs-tier1 \
    --set persistence.persistentVolumeClaim.jobservice.storageClass=nfs-tier1 
```

Now we can login as `admin` with the password `Harbor12345`. Let's finish up:

* Change the admin password
* Add Registry Endpoint for DockerHub
* Change Registry for K3S00 Hosts like this

## Changing Registry for k3s nodes:

Add this file and restart service:
```bash
echo "mirrors:
  harbor:
    endpoint:
      - \"https://harbor.apps.suter.dev\"" > /etc/rancher/k3s/registries.yaml
```