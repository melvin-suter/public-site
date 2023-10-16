---
title: WIP Kubernetes Setup
date: 2023-10-05
# permalink: false
tags: 
- blog
- linux
---

# THIS IS STILL WIP #

I've been on the journy of kubernetes for a while now. I tried K3S single- & multi-node, RKE2, vCenter provisioned, bare-metal.
Now I want to get it right. So I'll start from scratch.

What I want to achiev:
- "Single" Click setup of a new cluster (automatically applaying all needed manifests for storage, argo, etc.)
- K3S single & multi node
- Centralized Rancher & ArgoCD for all Clusters
- vCenter Provisioned
- No external services needed (except DNS and such)

How I'm gonna do it:
- Synology NAS
  - This whill be the NFS Datastore for all clusters
  - NFS Provisioner will be used
- Cluster k3s00
  - This is the kubernetes management cluster
  - 3-Node K3S
  - Rancher, ArgoCD, Rundeck, Gitlab (everything needed to manage kubernetes)
  - Will be manually setup, because of the hen-egg problem
  - embedded HA etcd database, so no external database is needed
- Cluster k3sXX
  - "App" Clusters
  - Can be Single or Multi Node
  - Auto Setup through k3s00
  - embedded HA etcd database, so no external database is needed
- Networking
  - DHCP with static kubevip, so no load-balancer is needed
  - DHCP reservations where needed (for firwalling)
  - Currently all kubernetes clusters will be in their own zone

So let's get to it.

# k3s00 - Management Cluster Setup

The first thing we need is some linux vms. This is easy, as I've already got a rockylinux template.
So let's spin up 3 VMs and get started on setting up k3s.

## k3s setup

On k3s00-01:

```bash
hostnamectl set-hostname k3s00-01.suter.dev

date | sha1sum # generate the k3s secret and copy to SECRET below
curl -sfL https://get.k3s.io | K3S_TOKEN=SECRET sh -s - server --cluster-init

# Install helm
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | sh -s - 

# Copy Config to be usable for helm too
cp /etc/rancher/k3s/k3s.yaml $HOME/.kube/config
```

On k3s00-02 & 03:

```bash
hostnamectl set-hostname k3s00-03.suter.dev
curl -sfL https://get.k3s.io | K3S_TOKEN=SECRET sh -s - server --server https://k3s00-01.suter.dev:6443
```

Let's check the nodes and pods:

```bash
[root@k3s00-03 ~]# kubectl get nodes
NAME                 STATUS   ROLES                       AGE     VERSION
k3s00-01.suter.dev   Ready    control-plane,etcd,master   173m    v1.27.6+k3s1
k3s00-02.suter.dev   Ready    control-plane,etcd,master   5m10s   v1.27.6+k3s1
k3s00-03.suter.dev   Ready    control-plane,etcd,master   53s     v1.27.6+k3s1
[root@k3s00-03 ~]# kubectl get pods -A
NAMESPACE     NAME                                     READY   STATUS      RESTARTS   AGE
kube-system   coredns-77ccd57875-p6tvc                 1/1     Running     0          172m
kube-system   helm-install-traefik-4kt8z               0/1     Completed   1          172m
kube-system   helm-install-traefik-crd-d5nz9           0/1     Completed   0          172m
kube-system   local-path-provisioner-957fdf8bc-cbspp   1/1     Running     0          172m
kube-system   metrics-server-648b5df564-sbsnr          1/1     Running     0          172m
kube-system   svclb-traefik-33e9b2f1-4g2zn             2/2     Running     0          172m
kube-system   svclb-traefik-33e9b2f1-6slkn             2/2     Running     0          5m11s
kube-system   svclb-traefik-33e9b2f1-7wvrk             2/2     Running     0          54s
kube-system   traefik-64f55bb67d-mlqp4                 1/1     Running     0          172m
```

Looks good.

## Rancher Setup

> Allthough I'll be showing stable here, I used alpha as the current stable version is not compatible with kubernetes 1.27

Lets begin installing rancher on our k3s00 cluster:

```bash
# Add Repository
helm repo add rancher-stable https://releases.rancher.com/server-charts/stable

# Create Namespace
kubectl create namespace cattle-system
```yubikey-setup-ssh.md (liquid)
[1] [11ty] Writing ../dist/blog/index.html from ./blog/index.md (liquid)

For rancher we need cert-manager, but I wan't to use let's encrypt for almost everything. So we definitely need cert-manager:

```bash
# If you have installed the CRDs manually instead of with the `--set installCRDs=true` option added to your Helm install command, you should upgrade your CRD resources before upgrading the Helm chart:
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.crds.yaml

# Add the Jetstack Helm repository
helm repo add jetstack https://charts.jetstack.io

# Update your local Helm chart repository cache
helm repo update

# Install the cert-manager Helm chart
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.0
```

And we can see the cert-manager working:

```bash
[root@k3s00-01 ~]# kubectl get pods --namespace cert-manager
NAME                                       READY   STATUS    RESTARTS   AGE
cert-manager-59b7f65948-mxt69              1/1     Running   0          39s
cert-manager-cainjector-7fd8f6bbbf-vmt4b   1/1     Running   0          39s
cert-manager-webhook-787cd749dc-msscl      1/1     Running   0          39s
```

> We are going to take a little shortcut here.
> Usually I would let let's encrypt sign the ingress certs. But because ranger will only be available from controlled jump-hosts, where I can easily add certs, we will use self-signed certificates. This has the advantage of beeing a lot simpler to setup, than Let's Encrypt DNS based issuers.

Let's install ranger:

```bash
# All Kubernetes apps will be available with the tld apps.suter.dev, except for some public facing stuff
helm install rancher rancher-stable/rancher \
  --namespace cattle-system \
  --set hostname=rancher.apps.suter.dev \
  --set bootstrapPassword=SuperAdmin1234
```

After the next chapter we can access it with the browser and change the admin password.

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

## Rundeck

We now need an automation platform. So let's get a rundeck up.
Use my github repo for that: https://github.com/melvin-suter/rundeck-kubernetes

> This will also deploy a pod for creating a inventory from a vcenter.

Things we need to get done:

- Add a SSH Key