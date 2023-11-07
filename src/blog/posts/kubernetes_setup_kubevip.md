---
title: Kubernetes Setup - KubeVIP
date: 2023-10-05
# permalink: false
tags: 
- linux
- kubernetes
---

## KubeVIP

Before we can go any further, we need a VIP for our cluster.

```bash
# Dependencies
dnf install jq

# Install RBAC
kubectl apply -f https://kube-vip.io/manifests/rbac.yaml

# Config
export VIP=10.10.126.30
export INTERFACE=ens33
export KVVERSION=$(curl -sL https://api.github.com/repos/kube-vip/kube-vip/releases | jq -r ".[0].name")

alias kube-vip="ctr image pull ghcr.io/kube-vip/kube-vip:$KVVERSION; ctr run --rm --net-host ghcr.io/kube-vip/kube-vip:$KVVERSION vip /kube-vip"

kube-vip manifest daemonset \
    --interface $INTERFACE \
    --address $VIP \
    --inCluster \
    --taint \
    --controlplane \
    --services \
    --arp \
    --leaderElection > setup.yaml

kubectl apply -f setup.yaml
```

Let's check if everything works:

```bash
[root@k3s00-01 ~]# kubectl get pods -n kube-system 
NAME                                     READY   STATUS      RESTARTS   AGE
(...)
kube-vip-ds-mtrkp                        1/1     Running     0          34s
kube-vip-ds-vwz8g                        1/1     Running     0          34s
kube-vip-ds-xwnf2                        1/1     Running     0          34s
(...)
```